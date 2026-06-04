-- Use your database
CREATE DATABASE IF NOT EXISTS college CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

/* ----- use your DB ----- */
USE college;

-- ===== Schema =====

/* ----- drop everything safely ----- */
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS fees;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

/* ===== recreate schema (InnoDB with cascades) ===== */

/* roles: ADMIN / TEACHER / STUDENT */
CREATE TABLE roles (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name      VARCHAR(32)  NOT NULL UNIQUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

/* users: all people; role via role_id */
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  role_id       INT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

/* courses: CS301 etc. */
CREATE TABLE courses (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code    VARCHAR(16)  NOT NULL UNIQUE,
  title   VARCHAR(200) NOT NULL,
  credits TINYINT UNSIGNED NOT NULL DEFAULT 4,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

/* sections: offering of a course taught by a teacher (users.id) */
CREATE TABLE sections (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id  INT UNSIGNED NOT NULL,
  teacher_id INT UNSIGNED NOT NULL,
  term       VARCHAR(32)  NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_section_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_section_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

/* enrollments: students in sections */
CREATE TABLE enrollments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  section_id INT UNSIGNED NOT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enroll (student_id, section_id),
  CONSTRAINT fk_enroll_student
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_enroll_section
    FOREIGN KEY (section_id) REFERENCES sections(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

/* exams: attached to a section */
CREATE TABLE exams (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id  INT UNSIGNED NOT NULL,
  name        VARCHAR(120) NOT NULL,
  max_marks   INT UNSIGNED NOT NULL DEFAULT 100,
  exam_date   DATE NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_exams_section
    FOREIGN KEY (section_id) REFERENCES sections(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

/* results: one row per student per exam */
CREATE TABLE results (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_id         INT UNSIGNED NOT NULL,
  student_id      INT UNSIGNED NOT NULL,
  marks_obtained  DECIMAL(6,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_result (exam_id, student_id),
  CONSTRAINT fk_results_exam
    FOREIGN KEY (exam_id) REFERENCES exams(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_results_student
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

/* fees: per student & term */
CREATE TABLE fees (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  term       VARCHAR(32)  NOT NULL,
  amount     DECIMAL(10,2) NOT NULL,
  status     ENUM('DUE','PAID') NOT NULL DEFAULT 'DUE',
  due_date   DATE NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_fees_student
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

/* attendance: (section, student, date) */
CREATE TABLE attendance (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id  INT UNSIGNED NOT NULL,
  student_id  INT UNSIGNED NOT NULL,
  class_date  DATE NOT NULL,
  attended    TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_att (section_id, student_id, class_date),
  CONSTRAINT fk_att_section_cascade
    FOREIGN KEY (section_id) REFERENCES sections(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_att_student
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

/* ===== seed minimal data ===== */

/* roles */
INSERT INTO roles (name) VALUES ('ADMIN'), ('TEACHER'), ('STUDENT');

/* users (emails used in your UI) 
   NOTE: password_hash can be filled with bcrypt later; kept NULL for now. */
INSERT INTO users (full_name, email, role_id) VALUES
('System Admin', 'admin@erp.test',   (SELECT id FROM roles WHERE name='ADMIN')),
('Dr. Meera Iyer', 'teacher@erp.test', (SELECT id FROM roles WHERE name='TEACHER')),
('Arjun Patel', 'student@erp.test', (SELECT id FROM roles WHERE name='STUDENT'));

/* courses */
INSERT INTO courses (code, title, credits) VALUES
('CS301','Data Structures',4),
('CS302','Operating Systems',4);

/* section taught by Dr. Meera Iyer */
INSERT INTO sections (course_id, teacher_id, term)
VALUES (
  (SELECT id FROM courses WHERE code='CS301'),
  (SELECT id FROM users WHERE email='teacher@erp.test'),
  '2025-Fall'
);

/* enroll Arjun into that section */
INSERT INTO enrollments (student_id, section_id)
VALUES (
  (SELECT id FROM users WHERE email='student@erp.test'),
  (SELECT id FROM sections ORDER BY id DESC LIMIT 1)
);

/* one fee due for the student */
INSERT INTO fees (student_id, term, amount, status, due_date)
VALUES (
  (SELECT id FROM users WHERE email='student@erp.test'),
  '2025-Fall', 25000.00, 'DUE', DATE_ADD(CURDATE(), INTERVAL 30 DAY)
);
