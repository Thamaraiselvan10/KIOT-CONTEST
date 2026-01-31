import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Email, password, and role are required' });
        }

        let user;
        let userId;

        switch (role) {
            case 'student':
                user = db.prepare('SELECT * FROM students WHERE email = ?').get(email);
                userId = user?.student_id;
                break;
            case 'coordinator':
                user = db.prepare('SELECT * FROM coordinators WHERE email = ?').get(email);
                userId = user?.coordinator_id;
                break;
            case 'mentor':
                user = db.prepare('SELECT * FROM mentors WHERE email = ?').get(email);
                userId = user?.mentor_id;
                break;
            default:
                return res.status(400).json({ error: 'Invalid role' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = bcrypt.compareSync(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({
            id: userId,
            email: user.email,
            name: user.name,
            role: role
        });

        // Remove password_hash from response
        delete user.password_hash;

        res.json({
            message: 'Login successful',
            token,
            user: { ...user, role }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/register (Student registration)
router.post('/register', (req, res) => {
    try {
        const { name, email, password, department, year, section, register_no, phone_no } = req.body;

        if (!name || !email || !password || !department || !year || !section || !register_no) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if email or register_no exists
        const existing = db.prepare(
            'SELECT email FROM students WHERE email = ? OR register_no = ?'
        ).get(email, register_no);

        if (existing) {
            return res.status(409).json({ error: 'Email or Register Number already exists' });
        }

        const password_hash = bcrypt.hashSync(password, 10);

        const result = db.prepare(`
            INSERT INTO students (name, email, password_hash, department, year, section, register_no, phone_no)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(name, email, password_hash, department, year, section, register_no, phone_no || null);

        const token = generateToken({
            id: result.lastInsertRowid,
            email,
            name,
            role: 'student'
        });

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                student_id: result.lastInsertRowid,
                name,
                email,
                department,
                year,
                section,
                register_no,
                role: 'student'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, (req, res) => {
    try {
        let user;
        const { id, role } = req.user;

        switch (role) {
            case 'student':
                user = db.prepare('SELECT * FROM students WHERE student_id = ?').get(id);
                break;
            case 'coordinator':
                user = db.prepare('SELECT * FROM coordinators WHERE coordinator_id = ?').get(id);
                break;
            case 'mentor':
                user = db.prepare('SELECT * FROM mentors WHERE mentor_id = ?').get(id);
                break;
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        delete user.password_hash;
        res.json({ ...user, role });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

export default router;
