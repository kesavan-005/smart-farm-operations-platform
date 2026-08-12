-- Add profile fields to users table
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'USER';
ALTER TABLE users ADD COLUMN profile_photo_url TEXT;

-- Create an index on email for faster lookups if used for login in the future
CREATE INDEX idx_users_email ON users(email);
