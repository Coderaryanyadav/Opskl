import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/db';

// GET /api/jobs/[jobId] - Get a single job by ID
export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await db.job.findUnique({
      where: { id: params.jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            description: true,
            website: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const parsedJob = {
      ...job,
      requirements: job.requirements ? JSON.parse(job.requirements) : [],
      responsibilities: job.responsibilities ? JSON.parse(job.responsibilities) : [],
      benefits: job.benefits ? JSON.parse(job.benefits) : [],
      skills: job.skills ? JSON.parse(job.skills) : [],
    };

    return NextResponse.json(parsedJob);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/[jobId] - Update a job
export async function PATCH(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if job exists and user is the owner or admin
    const existingJob = await db.job.findUnique({
      where: { id: params.jobId },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'ADMIN' && existingJob.companyId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Update the job
    const updatedJob = await db.job.update({
      where: { id: params.jobId },
      data: {
        ...data,
        requirements: data.requirements ? JSON.stringify(data.requirements) : undefined,
        responsibilities: data.responsibilities ? JSON.stringify(data.responsibilities) : undefined,
        benefits: data.benefits ? JSON.stringify(data.benefits) : undefined,
        skills: data.skills ? JSON.stringify(data.skills) : undefined,
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[jobId] - Delete a job
export async function DELETE(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if job exists and user is the owner or admin
    const existingJob = await db.job.findUnique({
      where: { id: params.jobId },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'ADMIN' && existingJob.companyId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete the job
    await db.job.delete({
      where: { id: params.jobId },
    });

    return NextResponse.json(
      { message: 'Job deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
