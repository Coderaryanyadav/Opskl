-- Enable WAL mode for better concurrency
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- Users table (stores both talents and companies)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('TALENT', 'COMPANY', 'ADMIN')),
    full_name TEXT NOT NULL,
    phone TEXT,
    bio TEXT,
    profile_photo TEXT,
    location TEXT,
    
    -- Talent specific fields
    aadhaar_number TEXT,
    aadhaar_verified BOOLEAN DEFAULT 0,
    skills TEXT, -- JSON array of skills
    pay_expectation INTEGER, -- in paise
    pay_type TEXT CHECK (pay_type IN ('HOUR', 'DAY', 'WEEK', 'MONTH', 'PROJECT')),
    
    -- Company specific fields
    company_name TEXT,
    gst_number TEXT,
    gst_verified BOOLEAN DEFAULT 0,
    industry TEXT,
    
    -- Common fields
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_role_specific_fields CHECK (
        (role = 'TALENT' AND company_name IS NULL AND gst_number IS NULL) OR
        (role = 'COMPANY' AND (aadhaar_number IS NULL AND skills IS NULL AND pay_expectation IS NULL AND pay_type IS NULL)) OR
        (role = 'ADMIN')
    )
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN (
        'Event Management',
        'Hospitality',
        'Photography',
        'Catering',
        'Security',
        'Cleaning',
        'Technical Support',
        'Customer Service'
    )) NOT NULL,
    location TEXT NOT NULL,
    pay_amount INTEGER NOT NULL, -- in paise
    pay_type TEXT NOT NULL CHECK (pay_type IN ('HOUR', 'DAY', 'WEEK', 'MONTH', 'PROJECT')),
    is_active BOOLEAN DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    talent_id INTEGER NOT NULL,
    cover_letter TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SHORTLISTED', 'REJECTED', 'HIRED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (talent_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(job_id, talent_id)
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    talent_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    total_amount INTEGER NOT NULL, -- in paise
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'TERMINATED')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIALLY_PAID', 'PAID')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (talent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    reviewee_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (reviewer_id != reviewee_id)
);

-- Support tickets
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_talent_id ON applications(talent_id);
CREATE INDEX IF NOT EXISTS idx_contracts_talent_id ON contracts(talent_id);
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);

-- Create views for common queries
CREATE VIEW IF NOT EXISTS job_cards AS
SELECT 
    j.*,
    u.company_name,
    u.profile_photo AS company_logo,
    COUNT(a.id) AS application_count,
    u.gst_verified
FROM jobs j
JOIN users u ON j.company_id = u.id
LEFT JOIN applications a ON j.id = a.job_id
WHERE j.is_active = 1 AND j.status = 'OPEN'
GROUP BY j.id;

CREATE VIEW IF NOT EXISTS talent_cards AS
SELECT 
    u.id,
    u.full_name,
    u.profile_photo,
    u.location,
    u.skills,
    u.pay_expectation,
    u.pay_type,
    u.aadhaar_verified,
    COALESCE(AVG(r.rating), 0) AS rating,
    COUNT(r.id) AS review_count
FROM users u
LEFT JOIN contracts c ON u.id = c.talent_id
LEFT JOIN reviews r ON c.id = r.contract_id AND r.reviewee_id = u.id
WHERE u.role = 'TALENT' AND u.is_active = 1
GROUP BY u.id;

-- Create triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_jobs_updated_at
AFTER UPDATE ON jobs
BEGIN
    UPDATE jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_applications_updated_at
AFTER UPDATE ON applications
BEGIN
    UPDATE applications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_contracts_updated_at
AFTER UPDATE ON contracts
BEGIN
    UPDATE contracts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tickets_updated_at
AFTER UPDATE ON tickets
BEGIN
    UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create trigger to prevent job deletion if there are active contracts
CREATE TRIGGER IF NOT EXISTS prevent_job_deletion_with_active_contracts
BEFORE DELETE ON jobs
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN (SELECT COUNT(*) FROM contracts WHERE job_id = OLD.id AND status = 'ACTIVE') > 0
        THEN RAISE(ABORT, 'Cannot delete job with active contracts')
    END;
END;
