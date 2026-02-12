import express from 'express';
import db from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/registrations - Register for a contest (Individual)
router.post('/', authenticate, authorize('student'), (req, res) => {
    try {
        const { contest_id } = req.body;
        const student_id = req.user.id;

        if (!contest_id) {
            return res.status(400).json({ error: 'Contest ID is required' });
        }

        // Check if contest exists
        const contest = db.prepare('SELECT * FROM contests WHERE contest_id = ?').get(contest_id);
        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        // Check registration deadline
        const now = new Date();
        const deadline = new Date(contest.registration_deadline);
        if (now > deadline) {
            return res.status(400).json({ error: 'Registration deadline has passed' });
        }

        // Check if team-based (should use team registration instead)
        if (contest.is_team_based) {
            return res.status(400).json({
                error: 'This is a team-based contest. Please create or join a team.'
            });
        }

        // Check for duplicate registration
        const existing = db.prepare(
            'SELECT * FROM contest_registrations WHERE contest_id = ? AND student_id = ?'
        ).get(contest_id, student_id);

        if (existing) {
            return res.status(409).json({ error: 'Already registered for this contest' });
        }

        const result = db.prepare(
            'INSERT INTO contest_registrations (contest_id, student_id) VALUES (?, ?)'
        ).run(contest_id, student_id);

        res.status(201).json({
            message: 'Registration successful',
            registration_id: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// GET /api/registrations/my - Get current student's registrations
router.get('/my', authenticate, authorize('student'), (req, res) => {
    try {
        const registrations = db.prepare(`
            SELECT 
                cr.*,
                c.title,
                c.description,
                c.organizer,
                c.platform,
                c.location,
                c.image_url,
                c.external_reg_link,
                c.submission_link,
                c.registration_deadline,
                c.submission_deadline,
                c.is_team_based
            FROM contest_registrations cr
            JOIN contests c ON cr.contest_id = c.contest_id
            WHERE cr.student_id = ?
            ORDER BY cr.registered_at DESC
        `).all(req.user.id);

        res.json(registrations);
    } catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

// GET /api/registrations/contest/:id - Get all registrations for a contest (Coordinator/Mentor)
router.get('/contest/:id', authenticate, authorize('coordinator', 'mentor'), (req, res) => {
    try {
        const { id } = req.params;

        const registrations = db.prepare(`
            SELECT 
                cr.*,
                s.name as student_name,
                s.email as student_email,
                s.department,
                s.year,
                s.section,
                s.register_no
            FROM contest_registrations cr
            JOIN students s ON cr.student_id = s.student_id
            WHERE cr.contest_id = ?
            ORDER BY cr.registered_at DESC
        `).all(id);

        res.json(registrations);
    } catch (error) {
        console.error('Get contest registrations error:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

// DELETE /api/registrations/:id - Cancel registration
router.delete('/:id', authenticate, authorize('student'), (req, res) => {
    try {
        const { id } = req.params;

        const registration = db.prepare(
            'SELECT * FROM contest_registrations WHERE registration_id = ?'
        ).get(id);

        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        if (registration.student_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only cancel your own registration' });
        }

        // Check if deadline has passed
        const contest = db.prepare('SELECT * FROM contests WHERE contest_id = ?').get(registration.contest_id);
        const now = new Date();
        const deadline = new Date(contest.registration_deadline);

        if (now > deadline) {
            return res.status(400).json({ error: 'Cannot cancel after registration deadline' });
        }

        db.prepare('DELETE FROM contest_registrations WHERE registration_id = ?').run(id);

        res.json({ message: 'Registration cancelled successfully' });
    } catch (error) {
        console.error('Cancel registration error:', error);
        res.status(500).json({ error: 'Failed to cancel registration' });
    }
});

export default router;
