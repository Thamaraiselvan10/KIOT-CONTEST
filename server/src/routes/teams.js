import express from 'express';
import db from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/teams - Create a team
router.post('/', authenticate, authorize('student'), (req, res) => {
    try {
        const { contest_id, team_name } = req.body;
        const team_leader_id = req.user.id;

        if (!contest_id || !team_name) {
            return res.status(400).json({ error: 'Contest ID and team name are required' });
        }

        // Check contest exists and is team-based
        const contest = db.prepare('SELECT * FROM contests WHERE contest_id = ?').get(contest_id);
        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        if (!contest.is_team_based) {
            return res.status(400).json({ error: 'This contest does not support teams' });
        }

        // Check registration deadline
        const now = new Date();
        const deadline = new Date(contest.registration_deadline);
        if (now > deadline) {
            return res.status(400).json({ error: 'Registration deadline has passed' });
        }

        // Check if student is already in a team for this contest
        const existingMembership = db.prepare(`
            SELECT t.* FROM teams t
            JOIN team_members tm ON t.team_id = tm.team_id
            WHERE t.contest_id = ? AND tm.student_id = ?
        `).get(contest_id, team_leader_id);

        if (existingMembership) {
            return res.status(409).json({ error: 'You are already in a team for this contest' });
        }

        // Create team
        const result = db.prepare(`
            INSERT INTO teams (contest_id, team_name, team_leader_id)
            VALUES (?, ?, ?)
        `).run(contest_id, team_name, team_leader_id);

        // Add leader as team member
        db.prepare('INSERT INTO team_members (team_id, student_id) VALUES (?, ?)').run(
            result.lastInsertRowid,
            team_leader_id
        );

        // Also register the student for the contest
        const existingReg = db.prepare(
            'SELECT * FROM contest_registrations WHERE contest_id = ? AND student_id = ?'
        ).get(contest_id, team_leader_id);

        if (!existingReg) {
            db.prepare(
                'INSERT INTO contest_registrations (contest_id, student_id) VALUES (?, ?)'
            ).run(contest_id, team_leader_id);
        }

        res.status(201).json({
            message: 'Team created successfully',
            team_id: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// POST /api/teams/:id/join - Join a team
router.post('/:id/join', authenticate, authorize('student'), (req, res) => {
    try {
        const { id } = req.params;
        const student_id = req.user.id;

        const team = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const contest = db.prepare('SELECT * FROM contests WHERE contest_id = ?').get(team.contest_id);

        // Check deadline
        const now = new Date();
        const deadline = new Date(contest.registration_deadline);
        if (now > deadline) {
            return res.status(400).json({ error: 'Registration deadline has passed' });
        }

        // Check if already in a team for this contest
        const existingMembership = db.prepare(`
            SELECT t.* FROM teams t
            JOIN team_members tm ON t.team_id = tm.team_id
            WHERE t.contest_id = ? AND tm.student_id = ?
        `).get(team.contest_id, student_id);

        if (existingMembership) {
            return res.status(409).json({ error: 'You are already in a team for this contest' });
        }

        // Check team size limit
        const memberCount = db.prepare(
            'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?'
        ).get(id);

        if (memberCount.count >= contest.max_team_size) {
            return res.status(400).json({ error: 'Team is full' });
        }

        // Join team
        db.prepare('INSERT INTO team_members (team_id, student_id) VALUES (?, ?)').run(id, student_id);

        // Also register for contest
        const existingReg = db.prepare(
            'SELECT * FROM contest_registrations WHERE contest_id = ? AND student_id = ?'
        ).get(team.contest_id, student_id);

        if (!existingReg) {
            db.prepare(
                'INSERT INTO contest_registrations (contest_id, student_id) VALUES (?, ?)'
            ).run(team.contest_id, student_id);
        }

        res.json({ message: 'Joined team successfully' });
    } catch (error) {
        console.error('Join team error:', error);
        res.status(500).json({ error: 'Failed to join team' });
    }
});

// GET /api/teams/contest/:contestId - Get all teams for a contest
router.get('/contest/:contestId', (req, res) => {
    try {
        const { contestId } = req.params;

        const teams = db.prepare(`
            SELECT 
                t.*,
                s.name as leader_name,
                s.email as leader_email,
                m.name as mentor_name,
                (SELECT COUNT(*) FROM team_members WHERE team_id = t.team_id) as member_count
            FROM teams t
            LEFT JOIN students s ON t.team_leader_id = s.student_id
            LEFT JOIN mentors m ON t.mentor_id = m.mentor_id
            WHERE t.contest_id = ?
        `).all(contestId);

        res.json(teams);
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// GET /api/teams/:id - Get team details with members
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;

        const team = db.prepare(`
            SELECT 
                t.*,
                s.name as leader_name,
                s.email as leader_email,
                m.name as mentor_name,
                c.title as contest_title
            FROM teams t
            LEFT JOIN students s ON t.team_leader_id = s.student_id
            LEFT JOIN mentors m ON t.mentor_id = m.mentor_id
            LEFT JOIN contests c ON t.contest_id = c.contest_id
            WHERE t.team_id = ?
        `).get(id);

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const members = db.prepare(`
            SELECT 
                s.student_id,
                s.name,
                s.email,
                s.department,
                s.year,
                s.section,
                tm.joined_at
            FROM team_members tm
            JOIN students s ON tm.student_id = s.student_id
            WHERE tm.team_id = ?
        `).all(id);

        res.json({ ...team, members });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// GET /api/teams/my - Get current student's teams
router.get('/my/all', authenticate, authorize('student'), (req, res) => {
    try {
        const teams = db.prepare(`
            SELECT 
                t.*,
                c.title as contest_title,
                c.submission_deadline,
                (SELECT COUNT(*) FROM team_members WHERE team_id = t.team_id) as member_count
            FROM teams t
            JOIN team_members tm ON t.team_id = tm.team_id
            JOIN contests c ON t.contest_id = c.contest_id
            WHERE tm.student_id = ?
        `).all(req.user.id);

        res.json(teams);
    } catch (error) {
        console.error('Get my teams error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// DELETE /api/teams/:id/leave - Leave a team
router.delete('/:id/leave', authenticate, authorize('student'), (req, res) => {
    try {
        const { id } = req.params;
        const student_id = req.user.id;

        const team = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check if leader trying to leave
        if (team.team_leader_id === student_id) {
            return res.status(400).json({
                error: 'Team leader cannot leave. Transfer leadership or delete the team.'
            });
        }

        const membership = db.prepare(
            'SELECT * FROM team_members WHERE team_id = ? AND student_id = ?'
        ).get(id, student_id);

        if (!membership) {
            return res.status(404).json({ error: 'You are not a member of this team' });
        }

        db.prepare('DELETE FROM team_members WHERE team_id = ? AND student_id = ?').run(id, student_id);

        res.json({ message: 'Left team successfully' });
    } catch (error) {
        console.error('Leave team error:', error);
        res.status(500).json({ error: 'Failed to leave team' });
    }
});

export default router;
