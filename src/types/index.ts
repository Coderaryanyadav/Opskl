export type UserRole = 'TALENT' | 'COMPANY' | 'ADMIN';
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERNSHIP';
export type SalaryType = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'PROJECT';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  profilePhoto?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  createdAt: string;
  updatedAt: string;
}

export interface Company extends Omit<User, 'role' | 'skills' | 'experience' | 'education'> {
  role: 'COMPANY';
  companyName: string;
  industry?: string;
  website?: string;
  logo?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  gstNumber?: string;
}

export interface Talent extends Omit<User, 'role'> {
  role: 'TALENT';
  resumeUrl?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  availability?: string;
  expectedSalary?: number;
  preferredJobTypes?: JobType[];
  preferredLocation?: string;
  isRemoteOk?: boolean;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location: string;
  isRemote: boolean;
  salary: number;
  salaryType: SalaryType;
  jobType: JobType;
  category: string;
  status: JobStatus;
  applicationDeadline: string;
  benefits?: string[];
  experienceRequired?: string;
  skills?: string[];
  contactEmail: string;
  contactPhone: string;
  companyId: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    description?: string;
  };
  applications?: JobApplication[];
  similarJobs?: Omit<Job, 'applications' | 'similarJobs'>[];
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  coverLetter: string;
  expectedSalary: number;
  availability: string;
  resumeUrl: string;
  status: ApplicationStatus;
  notes?: string;
  additionalInfo?: string;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
      logo?: string;
    };
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
    profilePhoto?: string;
    resumeUrl?: string;
    skills?: string[];
    experience?: Experience[];
    education?: Education[];
  };
}
