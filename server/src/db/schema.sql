-- KIOT Contest Management Portal - Database Schema
-- SQLite Database Initialization

-- Drop tables if they exist (for clean initialization)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS contest_chats;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS contest_registrations;
DROP TABLE IF EXISTS contests;
DROP TABLE IF EXISTS mentors;
DROP TABLE IF EXISTS coordinators;
DROP TABLE IF EXISTS students;

-- Students Table
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    year INTEGER NOT NULL,
    section TEXT NOT NULL,
    register_no TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_no TEXT,
    password_hash TEXT NOT NULL
);

-- Coordinators Table
CREATE TABLE coordinators (
    coordinator_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

-- Mentors Table
CREATE TABLE mentors (
    mentor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    phone_no TEXT,
    password_hash TEXT NOT NULL
);

-- Contests Table
CREATE TABLE contests (
    contest_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    department TEXT,
    registration_deadline DATETIME NOT NULL,
    submission_deadline DATETIME NOT NULL,
    is_team_based INTEGER DEFAULT 0,
    max_team_size INTEGER DEFAULT 1,
    image_url TEXT,
    external_reg_link TEXT,
    submission_link TEXT,
    created_by INTEGER NOT NULL,
    mentor_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES coordinators(coordinator_id),
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id)
);

-- Contest Registrations Table
CREATE TABLE contest_registrations (
    registration_id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(contest_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    UNIQUE(contest_id, student_id)
);

-- Teams Table
CREATE TABLE teams (
    team_id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER NOT NULL,
    team_name TEXT NOT NULL,
    team_leader_id INTEGER NOT NULL,
    mentor_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(contest_id),
    FOREIGN KEY (team_leader_id) REFERENCES students(student_id),
    FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id)
);

-- Team Members Table (Junction Table)
CREATE TABLE team_members (
    team_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, student_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Contest Chats Table
CREATE TABLE contest_chats (
    chat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    contest_id INTEGER UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(contest_id)
);

-- Messages Table
CREATE TABLE messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    sender_student_id INTEGER,
    sender_mentor_id INTEGER,
    sender_coordinator_id INTEGER,
    message_text TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES contest_chats(chat_id),
    FOREIGN KEY (sender_student_id) REFERENCES students(student_id),
    FOREIGN KEY (sender_mentor_id) REFERENCES mentors(mentor_id),
    FOREIGN KEY (sender_coordinator_id) REFERENCES coordinators(coordinator_id)
);

-- Indexes for performance
CREATE INDEX idx_contests_deadline ON contests(registration_deadline);
CREATE INDEX idx_registrations_contest ON contest_registrations(contest_id);
CREATE INDEX idx_registrations_student ON contest_registrations(student_id);
CREATE INDEX idx_teams_contest ON teams(contest_id);
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_sent ON messages(sent_at);
