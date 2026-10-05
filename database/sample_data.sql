USE attendance_db;

INSERT INTO students (student_id, student_name, department, year, section)
VALUES
(101, 'Ananya', 'CSE', 2, 'A'),
(102, 'Rahul', 'CSE', 2, 'A'),
(103, 'Priya', 'CSE', 2, 'A');

INSERT INTO subjects (subject_id, subject_name)
VALUES
(1, 'Java'),
(2, 'DBMS'),
(3, 'Operating Systems');

INSERT INTO attendance (student_id, subject_id, date, status)
VALUES
(101, 1, '2026-10-01', 'Present'),
(101, 2, '2026-10-01', 'Present'),
(101, 3, '2026-10-01', 'Absent'),
(102, 1, '2026-10-01', 'Present'),
(102, 2, '2026-10-01', 'Absent'),
(102, 3, '2026-10-01', 'Present'),
(103, 1, '2026-10-01', 'Present'),
(103, 2, '2026-10-01', 'Present'),
(103, 3, '2026-10-01', 'Present');
