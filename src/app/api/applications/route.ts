import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/db';
import { z } from 'zod';

// Schema for application creation/update validation
const applicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters'),
  expectedSalary: z.number().min(0, 'Expected salary must be a positive number'),
  availability: z.string().min(1, 'Availability is required'),
  resumeUrl: z.string().url('Invalid resume URL').optional(),
  status: z.enum(['PENDING', 'REVIEWING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED']).default('PENDING'),
});

// POST /api/applications - Submit a new job application
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    // Only authenticated users can apply for jobs
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only talents can apply for jobs
    if (user.role !== 'TALENT') {
      return NextResponse.json(
        { error: 'Only talents can apply for jobs' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate request body
    const validation = applicationSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { jobId, ...applicationData } = validation.data;

    // Check if job exists and is published
    const job = await db.job.findUnique({
      where: { 
        id: jobId,
        status: 'PUBLISHED',
        applicationDeadline: { gte: new Date() },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found, not published, or application deadline has passed' },
        { status: 404 }
      );
    }

    // Check if user has already applied to this job
    const existingApplication = await db.application.findFirst({
      where: {
        jobId,
        userId: user.id,
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      );
    }

    // Create the application
    const application = await db.application.create({
      data: {
        ...applicationData,
        job: { connect: { id: jobId } },
        user: { connect: { id: user.id } },
        status: 'PENDING',
      },
      include: {
        job: {
          select: {
            title: true,
            company: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
      },
    });

    // TODO: Send notification to company about new application

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

// GET /api/applications - Get applications with filters
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const jobId = searchParams.get('jobId');
    const userId = searchParams.get('userId');

    // Build the where clause
    const where: any = {};
    
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    if (userId) where.userId = userId;

    // Users can only see their own applications unless they're a company or admin
    if (user.role === 'TALENT') {
      where.userId = user.id;
    } else if (user.role === 'COMPANY') {
      // Companies can only see applications for their jobs
      where.job = { companyId: user.id };
    }
    // Admins can see all applications

    // Get total count for pagination
    const total = await db.application.count({ where });
    
    // Get paginated applications
    const applications = await db.application.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: applications,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
