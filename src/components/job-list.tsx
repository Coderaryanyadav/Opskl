'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatCurrency } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: number;
  salaryType: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'PROJECT';
  description: string;
  category: string;
  postedDate: string;
  isNew: boolean;
}

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, you would fetch this from your API
    const fetchJobs = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - in a real app, this would come from your API
        const mockJobs: Job[] = [
          {
            id: '1',
            title: 'Event Manager',
            company: 'Grand Events Co.',
            location: 'Mumbai, India',
            salary: 50000,
            salaryType: 'MONTH',
            description: 'We are looking for an experienced event manager to organize outstanding and unforgettable events.',
            category: 'Event Management',
            postedDate: '2023-04-15',
            isNew: true,
          },
          {
            id: '2',
            title: 'Head Chef',
            company: 'Foodie Catering',
            location: 'Delhi, India',
            salary: 35000,
            salaryType: 'MONTH',
            description: 'Looking for a skilled chef with experience in catering for large events.',
            category: 'Catering',
            postedDate: '2023-04-10',
            isNew: false,
          },
          {
            id: '3',
            title: 'Security Officer',
            company: 'SecurePlus',
            location: 'Bangalore, India',
            salary: 1500,
            salaryType: 'DAY',
            description: 'Looking for experienced security personnel for corporate events.',
            category: 'Security',
            postedDate: '2023-04-05',
            isNew: false,
          },
        ];
        
        setJobs(mockJobs);
        setLoading(false);
      } catch (err) {
        setError('Failed to load jobs. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const getSalaryDisplay = (job: Job) => {
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

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No jobs found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  {job.isNew && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
              </div>
              <Badge variant="outline" className="ml-2">
                {job.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {job.description}
            </p>
            <div className="mt-3 flex items-center text-sm text-muted-foreground">
              <Icons.calendar className="h-4 w-4 mr-1" />
              <span>Posted on {formatDate(job.postedDate)}</span>
              <span className="mx-2">•</span>
              <Icons.dollarSign className="h-4 w-4 mr-1" />
              <span>{getSalaryDisplay(job)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" size="sm">
              <Icons.eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button size="sm">
              <Icons.send className="h-4 w-4 mr-2" />
              Apply Now
            </Button>
          </CardFooter>
        </Card>
      ))}
      
      <div className="flex justify-center mt-6">
        <Button variant="outline">
          Load More Jobs
        </Button>
      </div>
    </div>
  );
}
