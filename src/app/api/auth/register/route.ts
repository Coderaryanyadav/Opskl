import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createToken, setAuthCookie } from '@/lib/auth';
import db from '@/db';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['TALENT', 'COMPANY']),
  
  // Talent specific fields
  aadhaarNumber: z.string().optional(),
  skills: z.array(z.string()).optional(),
  payExpectation: z.number().optional(),
  payType: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH', 'PROJECT']).optional(),
  
  // Company specific fields
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  industry: z.string().optional(),
  
  // Common fields
  phone: z.string().optional(),
  location: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate talent specific fields
  if (data.role === 'TALENT') {
    if (!data.aadhaarNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Aadhaar number is required for talents',
        path: ['aadhaarNumber']
      });
    }
    if (!data.skills || data.skills.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one skill is required',
        path: ['skills']
      });
    }
    if (data.payExpectation === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pay expectation is required',
        path: ['payExpectation']
      });
    }
    if (!data.payType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pay type is required',
        path: ['payType']
      });
    }
  }
  
  // Validate company specific fields
  if (data.role === 'COMPANY') {
    if (!data.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Company name is required',
        path: ['companyName']
      });
    }
    if (!data.gstNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GST number is required for companies',
        path: ['gstNumber']
      });
    }
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, password, fullName, role, ...rest } = validation.data;

    // Check if user already exists
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Start transaction
    const result = db.transaction(() => {
      // Insert user
      const stmt = db.prepare(`
        INSERT INTO users (
          email, 
          password_hash, 
          full_name, 
          role,
          phone,
          location,
          aadhaar_number,
          skills,
          pay_expectation,
          pay_type,
          company_name,
          gst_number,
          industry
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const skillsJson = rest.skills ? JSON.stringify(rest.skills) : null;
      
      const result = stmt.run(
        email,
        hashedPassword,
        fullName,
        role,
        rest.phone || null,
        rest.location || null,
        rest.aadhaarNumber || null,
        skillsJson,
        rest.payExpectation || null,
        rest.payType || null,
        rest.companyName || null,
        rest.gstNumber || null,
        rest.industry || null
      ) as { lastInsertRowid: number };

      // Get the newly created user
      const user = db
        .prepare('SELECT id, email, role, full_name FROM users WHERE id = ?')
        .get(result.lastInsertRowid);

      // Create and set auth token
      const token = createToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return { user, token };
    })();

    const response = NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        fullName: result.user.full_name,
        ...(role === 'COMPANY' && {
          companyName: rest.companyName,
          gstVerified: false,
        }),
        ...(role === 'TALENT' && {
          aadhaarVerified: false,
        }),
      },
    });

    setAuthCookie(result.token);
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
