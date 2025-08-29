import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import Database from 'better-sqlite3';
import { join } from 'path';

// Types
type TalentDetails = {
  aadhaar_verified: number;
  skills: string;
  pay_expectation: number;
  pay_type: string;
};

type CompanyDetails = {
  company_name: string;
  gst_verified: number;
  industry: string;
};

const dbPath = join(process.cwd(), 'opskill.db');
const db = new Database(dbPath);

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { user: null, error: 'Not authenticated' },
        { status: 200 } // Return 200 with null user instead of 401
      );
    }

    try {
      // Get additional user details based on role
      let userDetails: any = { ...user };
      
      if (user.role === 'TALENT') {
        const talent = db
          .prepare('SELECT aadhaar_verified, skills, pay_expectation, pay_type FROM users WHERE id = ?')
          .get(user.id) as TalentDetails;
        
        if (talent) {
          userDetails = {
            ...userDetails,
            aadhaarVerified: talent.aadhaar_verified,
            skills: talent.skills ? JSON.parse(talent.skills) : [],
            payExpectation: talent.pay_expectation,
            payType: talent.pay_type,
          };
        }
} else if (user.role === 'COMPANY') {
  const company = db
    .prepare('SELECT company_name, gst_verified, industry FROM users WHERE id = ?')
    .get(user.id) as CompanyDetails;
  
  if (company) {
    userDetails = {
      ...userDetails,
      companyName: company.company_name,
      gstVerified: company.gst_verified,
      industry: company.industry,
    };
  }
      }

      return NextResponse.json({ user: userDetails });
    } catch (error) {
      console.error('Error fetching user details:', error);
      return NextResponse.json(
        { user: null, error: 'Error fetching user details' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { user: null, error: 'Authentication error' },
      { status: 500 }
    );
  }
}
