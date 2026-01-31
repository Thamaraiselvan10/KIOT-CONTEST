import express from 'express';
import db from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/mentors - List all mentors
router.get('/', authenticate, authorize('coordinator'), (req, res) => {
    try {
        const mentors = db.prepare(`
            SELECT mentor_id, name, email, department, phone_no
            FROM mentors
        `).all();

        res.json(mentors);
    } catch (error) {
        console.error('Get mentors error:', error);
        res.status(500).json({ error: 'Failed to fetch mentors' });
    }
});

// GET /api/mentors/my/contests - Get contests assigned to current mentor
router.get('/my/contests', authenticate, authorize('mentor'), (req, res) => {
    try {
        const contests = db.prepare(`
            SELECT c.*
            FROM contests c
            WHERE c.mentor_id = ?
            ORDER BY c.registration_deadline DESC
        `).all(req.user.id);

        res.json(contests);
    } catch (error) {
        console.error('Get mentor contests error:', error);
        res.status(500).json({ error: 'Failed to fetch contests' });
    }
});

// GET /api/mentors/my/teams - Get teams assigned to current mentor
router.get('/my/teams', authenticate, authorize('mentor'), (req, res) => {
    try {
        const teams = db.prepare(`
            SELECT 
                t.*,
                c.title as contest_title,
                s.name as leader_name,
                (SELECT COUNT(*) FROM team_members WHERE team_id = t.team_id) as member_count
            FROM teams t
            JOIN contests c ON t.contest_id = c.contest_id
            LEFT JOIN students s ON t.team_leader_id = s.student_id
            WHERE t.mentor_id = ?
        `).all(req.user.id);

        res.json(teams);
    } catch (error) {
        console.error('Get mentor teams error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// POST /api/mentors/assign/contest - Assign mentor to contest
router.post('/assign/contest', authenticate, authorize('coordinator'), (req, res) => {
    try {
        const { contest_id, mentor_id } = req.body;

        if (!contest_id || !mentor_id) {
            return res.status(400).json({ error: 'Contest ID and Mentor ID are required' });
        }

        // Verify contest exists
        const contest = db.prepare('SELECT * FROM contests WHERE contest_id = ?').get(contest_id);
        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        // Verify mentor exists
        const mentor = db.prepare('SELECT * FROM mentors WHERE mentor_id = ?').get(mentor_id);
        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' });
        }

        db.prepare('UPDATE contests SET mentor_id = ? WHERE contest_id = ?').run(mentor_id, contest_id);

        res.json({ message: 'Mentor assigned to contest successfully' });
    } catch (error) {
        console.error('Assign mentor to contest error:', error);
        res.status(500).json({ error: 'Failed to assign mentor' });
    }
});

// POST /api/mentors/assign/team - Assign mentor to team
router.post('/assign/team', authenticate, authorize('coordinator'), (req, res) => {
    try {
        const { team_id, mentor_id } = req.body;

        if (!team_id || !mentor_id) {
            return res.status(400).json({ error: 'Team ID and Mentor ID are required' });
        }

        // Verify team exists
        const team = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(team_id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Verify mentor exists
        const mentor = db.prepare('SELECT * FROM mentors WHERE mentor_id = ?').get(mentor_id);
        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' });
        }

        db.prepare('UPDATE teams SET mentor_id = ? WHERE team_id = ?').run(mentor_id, team_id);

        res.json({ message: 'Mentor assigned to team successfully' });
    } catch (error) {
        console.error('Assign mentor to team error:', error);
        res.status(500).json({ error: 'Failed to assign mentor' });
    }
});

export default router;
