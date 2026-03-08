
import express from 'express';
import db from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the directory exists
        const uploadDir = 'public/uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

const router = express.Router();

// GET /api/contests - List all contests
router.get('/', (req, res) => {
    try {
        const contests = db.prepare(`
SELECT
c.*,
    co.name as coordinator_name,
    m.name as mentor_name,
    (SELECT COUNT(*) FROM contest_registrations WHERE contest_id = c.contest_id) as registration_count
            FROM contests c
            LEFT JOIN coordinators co ON c.created_by = co.coordinator_id
            LEFT JOIN mentors m ON c.mentor_id = m.mentor_id
            ORDER BY c.registration_deadline DESC
    `).all();

        res.json(contests);
    } catch (error) {
        console.error('Get contests error:', error);
        res.status(500).json({ error: 'Failed to fetch contests' });
    }
});

// GET /api/contests/:id - Get single contest details
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;

        const contest = db.prepare(`
SELECT
c.*,
    co.name as coordinator_name,
    co.email as coordinator_email,
    m.name as mentor_name,
    m.email as mentor_email
            FROM contests c
            LEFT JOIN coordinators co ON c.created_by = co.coordinator_id
            LEFT JOIN mentors m ON c.mentor_id = m.mentor_id
            WHERE c.contest_id = ?
    `).get(id);

        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        // Increment views count
        try {
            db.prepare('UPDATE contests SET views_count = views_count + 1 WHERE contest_id = ?').run(id);
        } catch (e) { /* ignore if column doesn't exist yet */ }

        // Get registrations count
        const registrationCount = db.prepare(
            'SELECT COUNT(*) as count FROM contest_registrations WHERE contest_id = ?'
        ).get(id);

        // Get teams if team-based
        let teams = [];
        if (contest.is_team_based) {
            teams = db.prepare(`
                SELECT
t.*,
    s.name as leader_name,
    m.name as team_mentor_name,
    (SELECT COUNT(*) FROM team_members WHERE team_id = t.team_id) as member_count
                FROM teams t
                LEFT JOIN students s ON t.team_leader_id = s.student_id
                LEFT JOIN mentors m ON t.mentor_id = m.mentor_id
                WHERE t.contest_id = ?
    `).all(id);
        }

        // Get prizes
        let prizes = [];
        try {
            prizes = db.prepare('SELECT * FROM contest_prizes WHERE contest_id = ? ORDER BY sort_order').all(id);
        } catch (e) { /* table may not exist yet */ }

        // Get schedule
        let schedule = [];
        try {
            schedule = db.prepare('SELECT * FROM contest_schedule WHERE contest_id = ? ORDER BY sort_order').all(id);
        } catch (e) { /* table may not exist yet */ }

        // Get themes
        let themes = [];
        try {
            themes = db.prepare('SELECT * FROM contest_themes WHERE contest_id = ? ORDER BY sort_order').all(id);
        } catch (e) { /* table may not exist yet */ }

        // Get FAQs
        let faqs = [];
        try {
            faqs = db.prepare('SELECT * FROM contest_faqs WHERE contest_id = ? ORDER BY sort_order').all(id);
        } catch (e) { /* table may not exist yet */ }

        res.json({
            ...contest,
            registration_count: registrationCount.count,
            teams,
            prizes,
            schedule,
            themes,
            faqs
        });
    } catch (error) {
        console.error('Get contest error:', error);
        res.status(500).json({ error: 'Failed to fetch contest' });
    }
});

// POST /api/contests - Create new contest (Coordinator only)
router.post('/', authenticate, authorize('coordinator'), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const {
                title,
                description,
                organizer,
                platform,
                location,
                department,
                registration_deadline,
                submission_deadline,
                is_team_based,
                max_team_size,
                external_reg_link,
                submission_link,
                mentor_id,
                mode,
                industry,
                participation_type,
                featured,
                prizes,
                schedule,
                themes,
                faqs
            } = req.body;

            // Get image URL from uploaded file or from body
            const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

            if (!title || !registration_deadline || !submission_deadline) {
                return res.status(400).json({
                    error: 'Title, registration deadline, and submission deadline are required'
                });
            }

            // Validate dates
            const regDeadline = new Date(registration_deadline);
            const subDeadline = new Date(submission_deadline);

            if (regDeadline >= subDeadline) {
                return res.status(400).json({
                    error: 'Registration deadline must be before submission deadline'
                });
            }

            const result = db.prepare(`
                INSERT INTO contests
                (title, description, organizer, platform, location, department, registration_deadline, submission_deadline,
                 is_team_based, max_team_size, image_url, external_reg_link, submission_link, mode, industry, participation_type, featured, created_by, mentor_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                title,
                description || null,
                organizer || null,
                platform || null,
                location || null,
                department || null,
                registration_deadline,
                submission_deadline,
                is_team_based === 'true' || is_team_based === true ? 1 : 0,
                max_team_size || 1,
                image_url,
                external_reg_link || null,
                submission_link || null,
                mode || 'Offline',
                industry || 'Technology',
                participation_type || 'Team',
                featured === 'true' || featured === true ? 1 : 0,
                req.user.id,
                mentor_id || null
            );

            const contestId = result.lastInsertRowid;

            // Insert prizes if provided
            if (prizes) {
                const prizesArr = typeof prizes === 'string' ? JSON.parse(prizes) : prizes;
                prizesArr.forEach((p, i) => {
                    db.prepare('INSERT INTO contest_prizes (contest_id, title, amount, prize_type, description, winner_count, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                        contestId, p.title, p.amount || null, p.prize_type || 'Cash Prize', p.description || null, p.winner_count || 1, i + 1
                    );
                });
            }

            // Insert schedule if provided
            if (schedule) {
                const scheduleArr = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
                scheduleArr.forEach((s, i) => {
                    db.prepare('INSERT INTO contest_schedule (contest_id, title, description, round_type, mode, start_date, end_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
                        contestId, s.title, s.description || null, s.round_type || null, s.mode || null, s.start_date || null, s.end_date || null, i + 1
                    );
                });
            }

            // Insert themes if provided
            if (themes) {
                const themesArr = typeof themes === 'string' ? JSON.parse(themes) : themes;
                themesArr.forEach((t, i) => {
                    db.prepare('INSERT INTO contest_themes (contest_id, title, description, sort_order) VALUES (?, ?, ?, ?)').run(
                        contestId, t.title, t.description || null, i + 1
                    );
                });
            }

            // Insert FAQs if provided
            if (faqs) {
                const faqsArr = typeof faqs === 'string' ? JSON.parse(faqs) : faqs;
                faqsArr.forEach((f, i) => {
                    db.prepare('INSERT INTO contest_faqs (contest_id, question, answer, sort_order) VALUES (?, ?, ?, ?)').run(
                        contestId, f.question, f.answer, i + 1
                    );
                });
            }

            // Create contest chat automatically
            db.prepare('INSERT INTO contest_chats (contest_id) VALUES (?)').run(result.lastInsertRowid);

            res.status(201).json({
                message: 'Contest created successfully',
                contest_id: contestId
            });
        } catch (error) {
            console.error('Create contest error:', error);
            res.status(500).json({ error: 'Failed to create contest' });
        }
    });
});

// PUT /api/contests/:id - Update contest (Coordinator only)
router.put('/:id', authenticate, authorize('coordinator'), (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            location,
            department,
            registration_deadline,
            submission_deadline,
            is_team_based,
            max_team_size,
            image_url,
            external_reg_link,
            submission_link,
            mentor_id,
            mode,
            industry,
            participation_type,
            featured
        } = req.body;

        // Check if contest exists and belongs to this coordinator
        const contest = db.prepare(
            'SELECT * FROM contests WHERE contest_id = ?'
        ).get(id);

        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        if (contest.created_by !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own contests' });
        }

        db.prepare(`
            UPDATE contests SET
title = COALESCE(?, title),
    description = COALESCE(?, description),
    location = COALESCE(?, location),
    department = COALESCE(?, department),
    registration_deadline = COALESCE(?, registration_deadline),
    submission_deadline = COALESCE(?, submission_deadline),
    is_team_based = COALESCE(?, is_team_based),
    max_team_size = COALESCE(?, max_team_size),
    image_url = COALESCE(?, image_url),
    external_reg_link = COALESCE(?, external_reg_link),
    submission_link = COALESCE(?, submission_link),
    mentor_id = ?,
    mode = COALESCE(?, mode),
    industry = COALESCE(?, industry),
    participation_type = COALESCE(?, participation_type),
    featured = COALESCE(?, featured)
        WHERE contest_id = ?
            `).run(
            title,
            description,
            location,
            department,
            registration_deadline,
            submission_deadline,
            is_team_based !== undefined ? (is_team_based ? 1 : 0) : undefined,
            max_team_size,
            image_url,
            external_reg_link,
            submission_link,
            mentor_id,
            mode,
            industry,
            participation_type,
            featured !== undefined ? (featured ? 1 : 0) : undefined,
            id
        );

        res.json({ message: 'Contest updated successfully' });
    } catch (error) {
        console.error('Update contest error:', error);
        res.status(500).json({ error: 'Failed to update contest' });
    }
});

// DELETE /api/contests/:id - Delete contest (Coordinator only)
router.delete('/:id', authenticate, authorize('coordinator'), (req, res) => {
    try {
        const { id } = req.params;

        const contest = db.prepare(
            'SELECT * FROM contests WHERE contest_id = ?'
        ).get(id);

        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        if (contest.created_by !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own contests' });
        }

        // Delete related data (cascading manually for SQLite)
        const chatId = db.prepare('SELECT chat_id FROM contest_chats WHERE contest_id = ?').get(id);
        if (chatId) {
            db.prepare('DELETE FROM messages WHERE chat_id = ?').run(chatId.chat_id);
            db.prepare('DELETE FROM contest_chats WHERE contest_id = ?').run(id);
        }

        const teams = db.prepare('SELECT team_id FROM teams WHERE contest_id = ?').all(id);
        for (const team of teams) {
            db.prepare('DELETE FROM team_members WHERE team_id = ?').run(team.team_id);
        }
        db.prepare('DELETE FROM teams WHERE contest_id = ?').run(id);
        db.prepare('DELETE FROM contest_registrations WHERE contest_id = ?').run(id);
        // Delete new sub-tables
        try {
            db.prepare('DELETE FROM contest_prizes WHERE contest_id = ?').run(id);
            db.prepare('DELETE FROM contest_schedule WHERE contest_id = ?').run(id);
            db.prepare('DELETE FROM contest_themes WHERE contest_id = ?').run(id);
            db.prepare('DELETE FROM contest_faqs WHERE contest_id = ?').run(id);
        } catch (e) { /* tables may not exist yet */ }
        db.prepare('DELETE FROM contests WHERE contest_id = ?').run(id);

        res.json({ message: 'Contest deleted successfully' });
    } catch (error) {
        console.error('Delete contest error:', error);
        res.status(500).json({ error: 'Failed to delete contest' });
    }
});

export default router;
