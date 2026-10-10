USE attendance_db;

-- The users table ships empty, so nobody can log in until accounts exist.
-- Run this once. It is safe to run again (existing usernames are skipped).

-- 1) One faculty account
INSERT IGNORE INTO users (username, password, role)
VALUES ('faculty1', 'faculty123', 'faculty');

-- 2) One student account for every row in the students table.
--    Rule: a student's username is their student ID (e.g. 101).
INSERT IGNORE INTO users (username, password, role)
SELECT CAST(student_id AS CHAR), 'student123', 'student'
FROM students;

-- Check:
-- SELECT username, role FROM users ORDER BY role, username;
