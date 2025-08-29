'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatCurrency } from '@/lib/utils';

interface JobPosting {
  id: string;
  title: string;
  location: string;
  salary: number;
  salaryType: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'PROJECT';
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  applications: number;
  datePosted: string;
  category: string;
}

export function JobPostings() {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, you would fetch this from your API
    const fetchJobPostings = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const mockJobPostings: JobPosting[] = [
          {
            id: '1',
            title: 'Senior Event Manager',
            location: 'Mumbai, India',
            salary: 75000,
            salaryType: 'MONTH',
            status: 'PUBLISHED',
            applications: 12,
            datePosted: '2023-04-10',
            category: 'Event Management'
          },
          {
            id: '2',
            title: 'Wedding Planner',
            location: 'Delhi, India',
            salary: 50000,
            salaryType: 'MONTH',
            status: 'PUBLISHED',
            applications: 8,
            datePosted: '2023-04-05',
            category: 'Wedding Planning'
          },
          {
            id: '3',
            title: 'Corporate Event Coordinator',
            location: 'Bangalore, India',
            salary: 60000,
            salaryType: 'MONTH',
            status: 'DRAFT',
            applications: 0,
            datePosted: '2023-04-15',
            category: 'Corporate Events'
          },
          {
            id: '4',
            title: 'Catering Staff Required',
            location: 'Mumbai, India',
            salary: 20000,
            salaryType: 'MONTH',
            status: 'CLOSED',
            applications: 24,
            datePosted: '2023-03-20',
            category: 'Catering'
          },
        ];
        
        setJobPostings(mockJobPostings);
        setLoading(false);
      } catch (err) {
        setError('Failed to load job postings. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobPostings();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'default';
      case 'DRAFT':
        return 'outline';
      case 'CLOSED':
        return 'secondary';
      case 'ARCHIVED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSalaryDisplay = (job: JobPosting) => {
    switch (job.salaryType) {
      case 'HOUR':
        return `${formatCurrency(job.salary)}/hr`;
      case 'DAY':
        return `${formatCurrency(job.salary)}/day`;
      case 'WEEK':
        return `${formatCurrency(job.salary)}/week`;
      case 'MONTH':
        return `${formatCurrency(job.salary)}/month`;
      case 'PROJECT':
        return `Up to ${formatCurrency(job.salary)}`;
      default:
        return formatCurrency(job.salary);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (jobPostings.length === 0) {
    return (
      <div className="py-12 text-center">
        <Icons.briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium">No job postings</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating a new job posting.
        </p>
        <div className="mt-6">
          <Button>
            <Icons.plus className="mr-2 h-4 w-4" />
            New Job Posting
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden
">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Job Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Applications
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Posted
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {jobPostings.map((job) => (
              <tr key={job.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium">{job.title}</div>
                      <div className="text-sm text-muted-foreground">{job.location}</div>
                      <div className="text-xs text-muted-foreground mt-1">{getSalaryDisplay(job)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getStatusBadgeVariant(job.status)}>
                    {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Icons.users className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm">{job.applications}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(job.datePosted)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2 justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/company/jobs/${job.id}`}>
                        <Icons.eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/company/jobs/${job.id}/edit`}>
                        <Icons.edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Icons.trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between border-t px-6 py-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{jobPostings.length}</span> of{' '}
          <span className="font-medium">{jobPostings.length}</span> jobs
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
