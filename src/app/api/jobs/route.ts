import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/db';
import { z } from 'zod';

// Schema for job creation/update validation
const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
  responsibilities: z.array(z.string()).min(1, 'At least one responsibility is required'),
  location: z.string().min(1, 'Location is required'),
  salary: z.number().min(0, 'Salary must be a positive number'),
  salaryType: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH', 'PROJECT']),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP']),
  category: z.enum([
    'Event Management',
    'Wedding Planning',
    'Catering',
    'Photography',
    'Videography',
    'Decor',
    'Entertainment',
    'Security',
    'Other'
  ]),
  isRemote: z.boolean().default(false),
  applicationDeadline: z.string().datetime(),
  benefits: z.array(z.string()).optional(),
  experienceRequired: z.string().optional(),
  skills: z.array(z.string()).optional(),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).default('DRAFT'),
});

// GET /api/jobs - Get all jobs (with optional query params for filtering)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const companyId = searchParams.get('companyId');

    // Build the where clause
    const where: any = {};
    
    if (status) where.status = status;
    if (category) where.category = category;
    if (companyId) where.companyId = companyId;
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count for pagination
    const total = await db.job.count({ where });
    
    // Get paginated jobs
    const jobs = await db.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: jobs,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    // Only companies can create jobs
    if (!user || user.role !== 'COMPANY') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validate request body
    const validation = jobSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Create the job
    const job = await db.job.create({
      data: {
        ...validation.data,
        companyId: user.id,
        requirements: JSON.stringify(validation.data.requirements),
        responsibilities: JSON.stringify(validation.data.responsibilities),
        benefits: validation.data.benefits ? JSON.stringify(validation.data.benefits) : null,
        skills: validation.data.skills ? JSON.stringify(validation.data.skills) : null,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
