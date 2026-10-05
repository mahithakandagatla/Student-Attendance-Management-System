CREATE DATABASE attendance_db;
USE attendance_db;

CREATE TABLE students (
    student_id INT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    section VARCHAR(10) NOT NULL
);

CREATE TABLE subjects (
    subject_id INT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL
);

CREATE TABLE attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(10) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
);M
