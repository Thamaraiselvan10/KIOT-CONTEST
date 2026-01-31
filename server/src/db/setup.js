import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../data/kiot_contest.db');

async function setup() {
    console.log('🔧 Initializing database...');

    const SQL = await initSqlJs();

    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create new database
    const db = new SQL.Database();

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.run(schema);

    console.log('✅ Database schema initialized successfully!');

    // Seed initial data
    const coordinatorPassword = bcrypt.hashSync('admin123', 10);
    db.run(`
        INSERT INTO coordinators (name, email, password_hash)
        VALUES (?, ?, ?)
    `, ['Admin Coordinator', 'admin@kiot.edu', coordinatorPassword]);

    const mentorPassword = bcrypt.hashSync('mentor123', 10);
    db.run(`
        INSERT INTO mentors (name, email, department, phone_no, password_hash)
        VALUES (?, ?, ?, ?, ?)
    `, ['Dr. Sample Mentor', 'mentor@kiot.edu', 'CSE', '9876543210', mentorPassword]);

    const studentPassword = bcrypt.hashSync('student123', 10);
    db.run(`
        INSERT INTO students (name, department, year, section, register_no, email, phone_no, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['Test Student', 'CSE', 3, 'A', '21CSE001', 'student@kiot.edu', '9876543211', studentPassword]);

    // Seed Contests
    console.log('🌱 Seeding contests...');
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    db.run(`
        INSERT INTO contests (title, description, location, department, registration_deadline, submission_deadline, is_team_based, max_team_size, image_url, external_reg_link, submission_link, created_by, mentor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        'KIOT Hackathon 2026',
        '24-hour non-stop coding competition to solve real-world problems. Join us for innovation and fun!',
        'Main Auditorium',
        'CSE',
        nextWeek.toISOString(),
        nextMonth.toISOString(),
        1, // Team based
        4, // Max size 4
        'https://images.unsplash.com/photo-1504384308090-c54be3855833?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        'https://forms.gle/sample-reg',
        'https://github.com/kiot/hackathon-submissions',
        1, // Created by Admin
        1  // Mentor
    ]);

    db.run(`
        INSERT INTO contests (title, description, location, department, registration_deadline, submission_deadline, is_team_based, max_team_size, image_url, external_reg_link, submission_link, created_by, mentor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        'Code Debugging Challenge',
        'Find and fix bugs in the given codebase. Individual participation only.',
        'Lab 3, CSE Block',
        'IT',
        nextWeek.toISOString(),
        nextWeek.toISOString(),
        0, // Individual
        1,
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        null,
        'https://forms.gle/debug-submit',
        1,
        1
    ]);

    // Save database to file
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    console.log('✅ Seed data inserted successfully!');
    console.log('');
    console.log('📋 Test Credentials:');
    console.log('   Coordinator: admin@kiot.edu / admin123');
    console.log('   Mentor: mentor@kiot.edu / mentor123');
    console.log('   Student: student@kiot.edu / student123');

    db.close();
}

setup().catch(console.error);
