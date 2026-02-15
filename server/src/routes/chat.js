import express from 'express';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/chat/my-groups - Get contests where user has sent messages
router.get('/my-groups', authenticate, (req, res) => {
    try {
        const { id, role } = req.user;

        let senderColumn;
        switch (role) {
            case 'student': senderColumn = 'sender_student_id'; break;
            case 'mentor': senderColumn = 'sender_mentor_id'; break;
            case 'coordinator': senderColumn = 'sender_coordinator_id'; break;
            default: return res.json([]);
        }

        const groups = db.prepare(`
            SELECT cc.contest_id, c.title
            FROM messages m
            JOIN contest_chats cc ON m.chat_id = cc.chat_id
            JOIN contests c ON cc.contest_id = c.contest_id
            WHERE m.${senderColumn} = ?
            GROUP BY cc.contest_id, c.title
            ORDER BY MAX(m.sent_at) DESC
        `).all(id);

        res.json(groups);
    } catch (error) {
        console.error('Get my chat groups error:', error);
        res.status(500).json({ error: 'Failed to fetch chat groups' });
    }
});

// GET /api/chat/:contestId - Get messages for a contest
router.get('/:contestId', authenticate, (req, res) => {
    try {
        const { contestId } = req.params;
        const { limit = 50, before } = req.query;

        // Get or create chat for contest
        let chat = db.prepare('SELECT * FROM contest_chats WHERE contest_id = ?').get(contestId);

        if (!chat) {
            // Create chat if it doesn't exist
            const result = db.prepare('INSERT INTO contest_chats (contest_id) VALUES (?)').run(contestId);
            chat = { chat_id: result.lastInsertRowid, contest_id: contestId };
        }

        // Build query based on parameters
        let query = `
            SELECT 
                m.*,
                CASE 
                    WHEN m.sender_student_id IS NOT NULL THEN 'student'
                    WHEN m.sender_mentor_id IS NOT NULL THEN 'mentor'
                    WHEN m.sender_coordinator_id IS NOT NULL THEN 'coordinator'
                END as sender_role,
                COALESCE(s.name, me.name, c.name) as sender_name
            FROM messages m
            LEFT JOIN students s ON m.sender_student_id = s.student_id
            LEFT JOIN mentors me ON m.sender_mentor_id = me.mentor_id
            LEFT JOIN coordinators c ON m.sender_coordinator_id = c.coordinator_id
            WHERE m.chat_id = ?
        `;

        const params = [chat.chat_id];

        if (before) {
            query += ' AND m.message_id < ?';
            params.push(before);
        }

        query += ' ORDER BY m.sent_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const messages = db.prepare(query).all(...params);

        // Return in chronological order
        res.json({
            chat_id: chat.chat_id,
            contest_id: contestId,
            messages: messages.reverse()
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST /api/chat/:contestId - Send a message
router.post('/:contestId', authenticate, (req, res) => {
    try {
        const { contestId } = req.params;
        const { message_text } = req.body;
        const { id, role } = req.user;

        if (!message_text || !message_text.trim()) {
            return res.status(400).json({ error: 'Message text is required' });
        }

        // Get or create chat
        let chat = db.prepare('SELECT * FROM contest_chats WHERE contest_id = ?').get(contestId);

        if (!chat) {
            const result = db.prepare('INSERT INTO contest_chats (contest_id) VALUES (?)').run(contestId);
            chat = { chat_id: result.lastInsertRowid };
        }

        // Determine sender column based on role
        let senderColumn;
        switch (role) {
            case 'student':
                senderColumn = 'sender_student_id';
                break;
            case 'mentor':
                senderColumn = 'sender_mentor_id';
                break;
            case 'coordinator':
                senderColumn = 'sender_coordinator_id';
                break;
            default:
                return res.status(400).json({ error: 'Invalid sender role' });
        }

        const result = db.prepare(`
            INSERT INTO messages (chat_id, ${senderColumn}, message_text)
            VALUES (?, ?, ?)
        `).run(chat.chat_id, id, message_text.trim());

        const message = db.prepare(`
            SELECT 
                m.*,
                ? as sender_role,
                ? as sender_name
            FROM messages m
            WHERE m.message_id = ?
        `).get(role, req.user.name, result.lastInsertRowid);

        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// DELETE /api/chat/message/:messageId - Delete a message (own messages only)
router.delete('/message/:messageId', authenticate, (req, res) => {
    try {
        const { messageId } = req.params;
        const { id, role } = req.user;

        const message = db.prepare('SELECT * FROM messages WHERE message_id = ?').get(messageId);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check ownership
        let isSender = false;
        switch (role) {
            case 'student':
                isSender = message.sender_student_id === id;
                break;
            case 'mentor':
                isSender = message.sender_mentor_id === id;
                break;
            case 'coordinator':
                isSender = message.sender_coordinator_id === id;
                break;
        }

        if (!isSender) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        db.prepare('DELETE FROM messages WHERE message_id = ?').run(messageId);

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

export default router;
