import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync } from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = join(process.cwd(), 'opskill.db');
const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDb() {
  try {
    // Read and execute schema
    const schema = readFileSync(join(process.cwd(), 'db/schema.sql'), 'utf-8');
    db.exec(schema);
    
    console.log('Database schema initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Seed initial data
async function seedDatabase() {
  try {
    // Check if admin already exists
    const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@opskill.com');
    if (adminExists) {
      console.log('Database already seeded');
      return;
    }

    // Start transaction
    const transaction = db.transaction(() => {
      // Create admin user
      const hashedPassword = bcrypt.hashSync('Admin@123', 10);
      const adminStmt = db.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, is_active)
        VALUES (?, ?, 'ADMIN', 'Admin User', 1)
      `);
      adminStmt.run('admin@opskill.com', hashedPassword);

      // Create sample companies
      const company1Stmt = db.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, company_name, gst_number, gst_verified, industry, location, is_active)
        VALUES (?, ?, 'COMPANY', 'Event Masters', 'Event Masters', '22AAAAA0000A1Z5', 1, 'Event Management', 'Mumbai', 1)
      `);
      const company2Stmt = db.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, company_name, gst_number, gst_verified, industry, location, is_active)
        VALUES (?, ?, 'COMPANY', 'Foodie Catering', 'Foodie Catering', '33BBBBB0000B1Z5', 1, 'Catering', 'Delhi', 1)
      `);
      
      const company1Id = company1Stmt.run('events@example.com', bcrypt.hashSync('company123', 10)).lastInsertRowid;
      const company2Id = company2Stmt.run('catering@example.com', bcrypt.hashSync('company123', 10)).lastInsertRowid;

      // Create sample talents
      const talent1Stmt = db.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, aadhaar_number, aadhaar_verified, skills, pay_expectation, pay_type, location, is_active)
        VALUES (?, ?, 'TALENT', 'Rahul Sharma', '123412341234', 1, '["Event Planning", "Vendor Management"]', 300000, 'MONTH', 'Mumbai', 1)
      `);
      const talent2Stmt = db.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, aadhaar_number, aadhaar_verified, skills, pay_expectation, pay_type, location, is_active)
        VALUES (?, ?, 'TALENT', 'Priya Patel', '234523452345', 1, '["Cooking", "Food Presentation"]', 2000, 'DAY', 'Delhi', 1)
      `);
      const talent3Stmt = db.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, aadhaar_number, aadhaar_verified, skills, pay_expectation, pay_type, location, is_active)
        VALUES (?, ?, 'TALENT', 'Amit Singh', '345634563456', 1, '["Cleaning", "Sanitization"]', 15000, 'WEEK', 'Bangalore', 1)
      `);
      
      const talent1Id = talent1Stmt.run('rahul@example.com', bcrypt.hashSync('talent123', 10)).lastInsertRowid;
      const talent2Id = talent2Stmt.run('priya@example.com', bcrypt.hashSync('talent123', 10)).lastInsertRowid;
      const talent3Id = talent3Stmt.run('amit@example.com', bcrypt.hashSync('talent123', 10)).lastInsertRowid;

      // Create sample jobs
      const job1Stmt = db.prepare(`
        INSERT INTO jobs (company_id, title, description, category, location, pay_amount, pay_type, is_active, status)
        VALUES (?, 'Event Manager Needed', 'Looking for an experienced event manager for a corporate event', 'Event Management', 'Mumbai', 500000, 'PROJECT', 1, 'OPEN')
      `);
      const job2Stmt = db.prepare(`
        INSERT INTO jobs (company_id, title, description, category, location, pay_amount, pay_type, is_active, status)
        VALUES (?, 'Catering Staff Required', 'Need experienced catering staff for a wedding', 'Catering', 'Delhi', 2000, 'DAY', 1, 'OPEN')
      `);
      const job3Stmt = db.prepare(`
        INSERT INTO jobs (company_id, title, description, category, location, pay_amount, pay_type, is_active, status)
        VALUES (?, 'Hospital Cleaner', 'Looking for professional cleaners for hospital', 'Cleaning', 'Bangalore', 15000, 'WEEK', 1, 'OPEN')
      `);
      
      const job1Id = job1Stmt.run(company1Id).lastInsertRowid;
      const job2Id = job2Stmt.run(company2Id).lastInsertRowid;
      const job3Id = job3Stmt.run(company2Id).lastInsertRowid;

      // Create sample applications
      const app1Stmt = db.prepare(`
        INSERT INTO applications (job_id, talent_id, cover_letter, status)
        VALUES (?, ?, 'I have 5+ years of experience in event management', 'PENDING')
      `);
      const app2Stmt = db.prepare(`
        INSERT INTO applications (job_id, talent_id, cover_letter, status)
        VALUES (?, ?, 'I have worked in catering for 3 years', 'SHORTLISTED')
      `);
      const app3Stmt = db.prepare(`
        INSERT INTO applications (job_id, talent_id, cover_letter, status)
        VALUES (?, ?, 'I have experience in hospital cleaning', 'PENDING')
      `);
      
      app1Stmt.run(job1Id, talent1Id);
      app2Stmt.run(job2Id, talent2Id);
      app3Stmt.run(job3Id, talent3Id);

      // Create a contract
      const contractStmt = db.prepare(`
        INSERT INTO contracts (job_id, talent_id, company_id, start_date, end_date, total_amount, status, payment_status)
        VALUES (?, ?, ?, '2025-09-01', '2025-09-30', 500000, 'ACTIVE', 'PENDING')
      `);
      const contractId = contractStmt.run(job1Id, talent1Id, company1Id).lastInsertRowid;

      // Create reviews
      const review1Stmt = db.prepare(`
        INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment)
        VALUES (?, ?, ?, 5, 'Excellent work! Highly recommended.')
      `);
      const review2Stmt = db.prepare(`
        INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment)
        VALUES (?, ?, ?, 4, 'Good work, would hire again.')
      `);
      
      review1Stmt.run(contractId, company1Id, talent1Id);
      review2Stmt.run(contractId, talent1Id, company1Id);
    });

    transaction();
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Initialize and seed the database
initDb();
seedDatabase().catch(console.error);

export default db;
