import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/db';

// GET /api/applications/[applicationId] - Get application details
export async function GET(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const application = await db.application.findUnique({
      where: { id: params.applicationId },
      include: {
        job: {
          include: {
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
            phone: true,
            profilePhoto: true,
            resumeUrl: true,
            skills: true,
            experience: true,
            education: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      user.role === 'TALENT' && 
      application.userId !== user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (
      user.role === 'COMPANY' && 
      application.job.companyId !== user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse JSON fields
    const parsedApplication = {
      ...application,
      job: {
        ...application.job,
        requirements: application.job.requirements ? JSON.parse(application.job.requirements) : [],
        responsibilities: application.job.responsibilities ? JSON.parse(application.job.responsibilities) : [],
      },
      user: {
        ...application.user,
        skills: application.user.skills ? JSON.parse(application.user.skills) : [],
        experience: application.user.experience ? JSON.parse(application.user.experience) : [],
        education: application.user.education ? JSON.parse(application.user.education) : [],
      },
    };

    return NextResponse.json(parsedApplication);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// PATCH /api/applications/[applicationId] - Update application status
export async function PATCH(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only companies and admins can update application status
    if (user.role === 'TALENT') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { status, notes } = data;

    // Validate status
    if (!['PENDING', 'REVIEWING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get the application with job details
    const existingApplication = await db.application.findUnique({
      where: { id: params.applicationId },
      include: {
        job: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this application
    if (
      user.role === 'COMPANY' && 
      existingApplication.job.companyId !== user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the application
    const updatedApplication = await db.application.update({
      where: { id: params.applicationId },
      data: {
        status,
        notes: notes !== undefined ? notes : existingApplication.notes,
        statusUpdatedAt: new Date(),
      },
      include: {
        job: {
          select: {
            title: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    // TODO: Send notification to the talent about status update

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
