import { Job, JobApplication, JobStatus, ApplicationStatus } from '@/types';

const API_URL = '/api';

// Types for API responses
interface ListResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

// Fetch jobs with filters
// Get job applications with filters
export async function getJobApplications({
  companyId,
  status,
  jobId,
  search,
  page = 1,
  limit = 20,
}: {
  companyId: string;
  status?: ApplicationStatus;
  jobId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ListResponse<JobApplication>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    companyId,
    ...(status && { status }),
    ...(jobId && { jobId }),
    ...(search && { search }),
  });

  console.log(`Fetching applications with params:`, Object.fromEntries(params.entries()));
  
  try {
    const response = await fetch(`${API_URL}/applications?${params}`, {
      credentials: 'include', // Include cookies for authentication
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch applications:', response.status, errorData);
      throw new Error(errorData.message || 'Failed to fetch job applications');
    }
    
    const data = await response.json();
    console.log('Applications data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
}

export async function fetchJobs({
  page = 1,
  limit = 10,
  status,
  category,
  search,
  companyId,
}: {
  page?: number;
  limit?: number;
  status?: JobStatus;
  category?: string;
  search?: string;
  companyId?: string;
} = {}): Promise<ListResponse<Job>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(category && { category }),
    ...(search && { search }),
    ...(companyId && { companyId }),
  });

  const response = await fetch(`${API_URL}/jobs?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }
  
  return response.json();
}

// Fetch a single job by ID
export async function fetchJobById(id: string): Promise<Job> {
  const response = await fetch(`${API_URL}/jobs/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch job');
  }
  
  return response.json();
}

// Create a new job
export async function createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
  const response = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create job');
  }
  
  return response.json();
}

// Update a job
export async function updateJob(
  id: string, 
  jobData: Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Job> {
  const response = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update job');
  }
  
  return response.json();
}

// Delete a job
export async function deleteJob(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete job');
  }
}

// Submit a job application
export async function submitApplication(
  jobId: string, 
  applicationData: Omit<JobApplication, 'id' | 'jobId' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<JobApplication> {
  const response = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...applicationData,
      jobId,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit application');
  }
  
  return response.json();
}

// Fetch applications
export async function fetchApplications({
  page = 1,
  limit = 10,
  status,
  jobId,
  userId,
}: {
  page?: number;
  limit?: number;
  status?: string;
  jobId?: string;
  userId?: string;
} = {}): Promise<ListResponse<JobApplication>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(jobId && { jobId }),
    ...(userId && { userId }),
  });

  const response = await fetch(`${API_URL}/applications?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch applications');
  }
  
  return response.json();
}

// Update application status
export async function updateApplicationStatus(
  applicationId: string, 
  status: JobApplication['status'],
  notes?: string
): Promise<JobApplication> {
  const response = await fetch(`${API_URL}/applications/${applicationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update application');
  }
  
  return response.json();
}
