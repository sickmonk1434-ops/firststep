
-- Users Table for Authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'principal', 'teacher', 'parent')),
    name TEXT NOT NULL,
    staff_id INTEGER, -- Links to staff table if applicable
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Staff Table (Includes Non-Teaching)
CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    designation TEXT NOT NULL, -- 'principal', 'teacher', 'non-teaching'
    is_teaching BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Table (Staff and Students)
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('staff', 'student')),
    target_id INTEGER NOT NULL, -- staff.id or applications.id (as student)
    clock_in DATETIME,
    clock_out DATETIME,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    remarks TEXT,
    marked_by INTEGER, -- user.id of the person who marked it
    date DATE DEFAULT (CURRENT_DATE),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Student-Teacher Tagging
CREATE TABLE IF NOT EXISTS student_teacher_tags (
    teacher_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    PRIMARY KEY (teacher_id, student_id),
    FOREIGN KEY (teacher_id) REFERENCES staff(id),
    FOREIGN KEY (student_id) REFERENCES applications(id)
);

-- Modified Applications Table (with bit more status)
-- We keep 'status' for overall state, but add flags for the two-step process
ALTER TABLE applications ADD COLUMN principal_recommendation TEXT CHECK(principal_recommendation IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';
ALTER TABLE applications ADD COLUMN admin_confirmation TEXT CHECK(admin_confirmation IN ('pending', 'confirmed', 'declined')) DEFAULT 'pending';

-- Initial Admin Account (Password: admin123 - for demo)
INSERT OR IGNORE INTO users (email, password, role, name) 
VALUES ('admin@thefirststep.com', 'admin123', 'admin', 'Super Admin');
