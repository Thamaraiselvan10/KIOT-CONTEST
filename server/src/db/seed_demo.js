import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../data/kiot_contest.db');

async function seedDemoData() {
    console.log('🌱 Injecting demo data...');

    const SQL = await initSqlJs();

    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ Database file not found. Run npm run db:init first.');
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(fileBuffer);

    // Save helper
    const saveDatabase = () => {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    };

    const studentPassword = bcrypt.hashSync('student123', 10);

    // 1. Add Students
    const students = [
        ['Alice Johnson', 'CSE', 3, 'A', '21CSE002', 'alice@kiot.edu', '9876543212', studentPassword],
        ['Bob Smith', 'IT', 3, 'B', '21IT001', 'bob@kiot.edu', '9876543213', studentPassword],
        ['Charlie Brown', 'ECE', 2, 'A', '22ECE001', 'charlie@kiot.edu', '9876543214', studentPassword],
        ['Diana Prince', 'EEE', 4, 'A', '20EEE001', 'diana@kiot.edu', '9876543215', studentPassword],
        ['Evan Wright', 'MECH', 3, 'C', '21MECH001', 'evan@kiot.edu', '9876543216', studentPassword]
    ];

    console.log('  - Adding students...');
    students.forEach(s => {
        db.run(`
            INSERT OR IGNORE INTO students (name, department, year, section, register_no, email, phone_no, password_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, s);
    });

    // 2. Add Contests
    console.log('  - Adding contests...');
    const now = new Date();
    const future = (days) => new Date(now.getTime() + days * 86400000).toISOString();
    const past = (days) => new Date(now.getTime() - days * 86400000).toISOString();

    const contests = [
        ['AI Innovation Challenge', 'Build AI models for social good.', 'Online', 'AI&DS', future(14), future(30), 1, 3, 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1350&q=80', null, 'http://example.com', 1, 1],
        ['Web Design War', 'Create the best landing page.', 'CSE Lab 2', 'CSE', future(5), future(10), 0, 1, 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1350&q=80', null, 'http://example.com', 1, 1],
        ['Circuit Debugging', 'Fix the broken circuits.', 'ECE Hardware Lab', 'ECE', past(2), past(1), 0, 1, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1350&q=80', null, 'http://example.com', 1, 1] // Ended
    ];

    contests.forEach(c => {
        // Check if exists to avoid duplicates (simplified check by title)
        const exists = db.exec(`SELECT 1 FROM contests WHERE title = '${c[0]}'`);
        if (exists.length === 0) {
            db.run(`
                INSERT INTO contests (title, description, location, department, registration_deadline, submission_deadline, is_team_based, max_team_size, image_url, external_reg_link, submission_link, created_by, mentor_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, c);
        }
    });

    // 3. Add Registrations
    console.log('  - Adding registrations...');
    // Get proper IDs
    const studentIds = [];
    const stmt = db.prepare("SELECT student_id FROM students");
    while (stmt.step()) studentIds.push(stmt.getAsObject().student_id);
    stmt.free();

    const contestIds = [];
    const cStmt = db.prepare("SELECT contest_id FROM contests");
    while (cStmt.step()) contestIds.push(cStmt.getAsObject().contest_id);
    cStmt.free();

    if (studentIds.length > 0 && contestIds.length > 0) {
        // Register first 3 students to first contest
        const cid1 = contestIds[0];
        db.run(`INSERT OR IGNORE INTO contest_registrations (contest_id, student_id) VALUES (?, ?)`, [cid1, studentIds[0]]);
        db.run(`INSERT OR IGNORE INTO contest_registrations (contest_id, student_id) VALUES (?, ?)`, [cid1, studentIds[1]]);

        // Register next student to second contest
        if (contestIds.length > 1) {
            const cid2 = contestIds[1];
            db.run(`INSERT OR IGNORE INTO contest_registrations (contest_id, student_id) VALUES (?, ?)`, [cid2, studentIds[2]]);
        }
    }

    // 4. Create Chat for Contests
    console.log('  - Init chats...');
    contestIds.forEach(cid => {
        db.run(`INSERT OR IGNORE INTO contest_chats (contest_id) VALUES (?)`, [cid]);
    });

    // 5. Add Messages
    console.log('  - Adding messages...');
    const chatIds = [];
    const chatStmt = db.prepare("SELECT chat_id, contest_id FROM contest_chats");
    while (chatStmt.step()) chatIds.push(chatStmt.getAsObject());
    chatStmt.free();

    if (chatIds.length > 0) {
        const chat = chatIds[0];
        const msgs = [
            `Welcome to the ${chat.contest_id} chat!`,
            'Is this team based?',
            'Yes, max 4 members.',
            'Looking for teammates!'
        ];

        db.run(`INSERT INTO messages (chat_id, sender_coordinator_id, message_text) VALUES (?, ?, ?)`, [chat.chat_id, 1, msgs[0]]);
        if (studentIds.length > 0)
            db.run(`INSERT INTO messages (chat_id, sender_student_id, message_text) VALUES (?, ?, ?)`, [chat.chat_id, studentIds[0], msgs[1]]);
        db.run(`INSERT INTO messages (chat_id, sender_coordinator_id, message_text) VALUES (?, ?, ?)`, [chat.chat_id, 1, msgs[2]]);
        if (studentIds.length > 1)
            db.run(`INSERT INTO messages (chat_id, sender_student_id, message_text) VALUES (?, ?, ?)`, [chat.chat_id, studentIds[1], msgs[3]]);
    }


    saveDatabase();
    console.log('✅ Demo data injected successfully!');
    db.close();
}

seedDemoData().catch(console.error);
