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
        INSERT INTO contests (title, description, location, department, registration_deadline, submission_deadline, is_team_based, max_team_size, image_url, external_reg_link, submission_link, mode, industry, participation_type, featured, created_by, mentor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        'Hybrid',       // mode
        'Technology',   // industry
        'Team',         // participation_type
        1,              // featured
        1, // Created by Admin
        1  // Mentor
    ]);

    // Add prizes for first contest
    db.run(`INSERT INTO contest_prizes (contest_id, title, amount, prize_type, winner_count, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 'Winner', '₹ 50,000', 'Cash Prize', 1, 1]);
    db.run(`INSERT INTO contest_prizes (contest_id, title, amount, prize_type, winner_count, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 'Runners Up', '₹ 25,000', 'Cash Prize', 1, 2]);
    db.run(`INSERT INTO contest_prizes (contest_id, title, amount, prize_type, winner_count, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, '2nd Runner Up', '₹ 10,000', 'Cash Prize', 1, 3]);
    db.run(`INSERT INTO contest_prizes (contest_id, title, amount, prize_type, description, winner_count, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [1, 'Best Innovation Award', null, 'Certificate', 'Certificate of Excellence for the most innovative solution', 1, 4]);

    // Add schedule for first contest
    db.run(`INSERT INTO contest_schedule (contest_id, title, description, round_type, mode, start_date, end_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'Registration', 'Register your team and submit your initial idea proposal.', 'Preliminary', 'Online', nextWeek.toISOString(), new Date(nextWeek.getTime() + 7 * 86400000).toISOString(), 1]);
    db.run(`INSERT INTO contest_schedule (contest_id, title, description, round_type, mode, start_date, end_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'Hackathon Kickoff', 'Teams will begin working on their solutions. Mentors will be available for guidance.', 'Main Round', 'Offline', new Date(nextWeek.getTime() + 14 * 86400000).toISOString(), new Date(nextWeek.getTime() + 15 * 86400000).toISOString(), 2]);
    db.run(`INSERT INTO contest_schedule (contest_id, title, description, round_type, mode, start_date, end_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'Final Presentation', 'Present your solution to the judges panel.', 'Final Round', 'Offline', new Date(nextWeek.getTime() + 15 * 86400000).toISOString(), new Date(nextWeek.getTime() + 15 * 86400000).toISOString(), 3]);

    // Add themes for first contest
    db.run(`INSERT INTO contest_themes (contest_id, title, description, sort_order) VALUES (?, ?, ?, ?)`,
        [1, 'Smart Campus Solutions', 'Build applications that improve campus life — from smart attendance to resource optimization.', 1]);
    db.run(`INSERT INTO contest_themes (contest_id, title, description, sort_order) VALUES (?, ?, ?, ?)`,
        [1, 'Healthcare Innovation', 'Create tech solutions addressing healthcare challenges — telemedicine, diagnostics, patient management.', 2]);
    db.run(`INSERT INTO contest_themes (contest_id, title, description, sort_order) VALUES (?, ?, ?, ?)`,
        [1, 'Sustainable Technology', 'Develop solutions focused on environmental sustainability and green technology.', 3]);

    // Add FAQs for first contest
    db.run(`INSERT INTO contest_faqs (contest_id, question, answer, sort_order) VALUES (?, ?, ?, ?)`,
        [1, 'What is the team size requirement?', 'Each team must have 2-4 members. All members must be currently enrolled students.', 1]);
    db.run(`INSERT INTO contest_faqs (contest_id, question, answer, sort_order) VALUES (?, ?, ?, ?)`,
        [1, 'Can we use pre-existing code or templates?', 'You may use open-source libraries and frameworks, but the core solution must be built during the hackathon.', 2]);
    db.run(`INSERT INTO contest_faqs (contest_id, question, answer, sort_order) VALUES (?, ?, ?, ?)`,
        [1, 'What should we bring?', 'Bring your own laptop, charger, and any hardware you plan to use. Food and refreshments will be provided.', 3]);
    db.run(`INSERT INTO contest_faqs (contest_id, question, answer, sort_order) VALUES (?, ?, ?, ?)`,
        [1, 'How will the winners be selected?', 'Projects will be judged on innovation, technical complexity, design, and real-world applicability.', 4]);

    db.run(`
        INSERT INTO contests (title, description, location, department, registration_deadline, submission_deadline, is_team_based, max_team_size, image_url, external_reg_link, submission_link, mode, industry, participation_type, featured, created_by, mentor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        'Offline',       // mode
        'Technology',    // industry
        'Individual',    // participation_type
        0,               // not featured
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
