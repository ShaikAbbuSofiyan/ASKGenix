/*
  # ASKGenix Campus Recruitment Platform Schema

  ## Overview
  Complete database schema for campus recruitment placement test platform with admin and student portals.

  ## 1. New Tables

  ### `users`
  - `id` (uuid, primary key) - Auto-generated user ID
  - `email` (text, unique, not null) - User email address
  - `password_hash` (text, not null) - Hashed password
  - `full_name` (text, not null) - Student full name
  - `role` (text, not null, default 'student') - User role: 'admin' or 'student'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `tests`
  - `id` (uuid, primary key) - Test ID
  - `title` (text, not null) - Test title
  - `description` (text) - Test description
  - `duration_minutes` (integer, not null) - Test duration in minutes
  - `total_marks` (integer, not null) - Total marks for the test
  - `is_active` (boolean, default false) - Whether test is active/visible to students
  - `created_by` (uuid, foreign key to users) - Admin who created the test
  - `created_at` (timestamptz) - Test creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `questions`
  - `id` (uuid, primary key) - Question ID
  - `test_id` (uuid, foreign key to tests) - Associated test
  - `question_text` (text, not null) - The question
  - `question_type` (text, not null) - Type: 'mcq' or 'multiple_correct'
  - `options` (jsonb, not null) - Array of options [{id, text}]
  - `correct_answers` (jsonb, not null) - Array of correct option IDs
  - `marks` (integer, not null) - Marks for this question
  - `order_index` (integer, not null) - Display order
  - `created_at` (timestamptz) - Creation timestamp

  ### `test_attempts`
  - `id` (uuid, primary key) - Attempt ID
  - `test_id` (uuid, foreign key to tests) - Test being attempted
  - `user_id` (uuid, foreign key to users) - Student attempting
  - `started_at` (timestamptz) - When attempt started
  - `submitted_at` (timestamptz) - When submitted (null if in progress)
  - `time_taken_seconds` (integer) - Actual time taken
  - `score` (integer) - Score obtained
  - `total_marks` (integer) - Total marks of test
  - `status` (text, not null, default 'in_progress') - Status: 'in_progress', 'submitted', 'auto_submitted'
  - `created_at` (timestamptz) - Creation timestamp

  ### `attempt_answers`
  - `id` (uuid, primary key) - Answer ID
  - `attempt_id` (uuid, foreign key to test_attempts) - Associated attempt
  - `question_id` (uuid, foreign key to questions) - Question being answered
  - `selected_answers` (jsonb) - Array of selected option IDs
  - `is_correct` (boolean) - Whether answer is correct
  - `marks_obtained` (integer, default 0) - Marks obtained for this question
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Admin policies for full access to tests, questions, and results
  - Student policies for viewing active tests and their own attempts
  - Public access for authentication (login/signup)

  ## 3. Important Notes
  - Admin credentials will be seeded: askgenix.jntuhuces@gmail.com
  - All timestamps use UTC
  - Cascading deletes for test-question and attempt-answer relationships
  - Comprehensive indexes for performance optimization
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  total_marks integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('mcq', 'multiple_correct')),
  options jsonb NOT NULL,
  correct_answers jsonb NOT NULL,
  marks integer NOT NULL CHECK (marks >= 0),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create test_attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  time_taken_seconds integer,
  score integer DEFAULT 0,
  total_marks integer NOT NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted')),
  created_at timestamptz DEFAULT now()
);

-- Create attempt_answers table
CREATE TABLE IF NOT EXISTS attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answers jsonb,
  is_correct boolean DEFAULT false,
  marks_obtained integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON tests(created_by);
CREATE INDEX IF NOT EXISTS idx_tests_is_active ON tests(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for tests table
CREATE POLICY "Admins can manage all tests"
  ON tests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Students can view active tests"
  ON tests FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'student'
    )
  );

-- RLS Policies for questions table
CREATE POLICY "Admins can manage all questions"
  ON questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Students can view questions of active tests"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tests 
      WHERE tests.id = questions.test_id AND tests.is_active = true
    ) AND
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'student'
    )
  );

-- RLS Policies for test_attempts table
CREATE POLICY "Admins can view all attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Students can view own attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Students can create own attempts"
  ON test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own attempts"
  ON test_attempts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for attempt_answers table
CREATE POLICY "Admins can view all answers"
  ON attempt_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Students can view own answers"
  ON attempt_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM test_attempts 
      WHERE test_attempts.id = attempt_answers.attempt_id 
      AND test_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own answers"
  ON attempt_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_attempts 
      WHERE test_attempts.id = attempt_answers.attempt_id 
      AND test_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own answers"
  ON attempt_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM test_attempts 
      WHERE test_attempts.id = attempt_answers.attempt_id 
      AND test_attempts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_attempts 
      WHERE test_attempts.id = attempt_answers.attempt_id 
      AND test_attempts.user_id = auth.uid()
    )
  );

-- Seed admin user
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'askgenix.jntuhuces@gmail.com',
  'Vishwanathsofiyankrupa',
  'Admin User',
  'admin'
)
ON CONFLICT (email) DO NOTHING;