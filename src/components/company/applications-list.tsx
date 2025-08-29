'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { getJobApplications } from '@/lib/api/jobs';
import { ApplicationStatus, JobApplication } from '@/types';
import { showErrorToast } from '@/lib/error-handler';

interface ApplicationsListProps {
  companyId: string;
}

export function ApplicationsList({ companyId }: ApplicationsListProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  
  // Handle status filter change from Select component
  const handleStatusFilterChange = (value: string) => {
    // Cast the string value to ApplicationStatus | 'all' since we know the possible values
    setStatusFilter(value as ApplicationStatus | 'all');
  };
  const [jobFilter, setJobFilter] = useState<string>('all');

  useEffect(() => {
    console.log('useEffect triggered with:', { companyId, statusFilter, jobFilter, searchTerm });
    
    async function fetchApplications() {
      console.log('fetchApplications called');
      try {
        setLoading(true);
        console.log('Calling getJobApplications with:', { 
          companyId, 
          status: statusFilter === 'all' ? undefined : statusFilter, 
          jobId: jobFilter === 'all' ? undefined : jobFilter,
          search: searchTerm || undefined
        });
        
        const result = await getJobApplications({
          companyId,
          status: statusFilter === 'all' ? undefined : statusFilter,
          jobId: jobFilter === 'all' ? undefined : jobFilter,
          search: searchTerm || undefined,
        });
        
        console.log('API Response:', result);
        setApplications(result.data || []);
      } catch (error) {
        console.error('Error in fetchApplications:', error);
        showErrorToast(error, 'Failed to load applications');
      } finally {
        console.log('Loading complete');
        setLoading(false);
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchApplications();
    }, 300);

    return () => {
      console.log('Cleaning up...');
      clearTimeout(debounceTimer);
    };
  }, [companyId, statusFilter, jobFilter, searchTerm]);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      // TODO: Implement status update
      // await updateApplicationStatus(applicationId, newStatus);
      
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus, updatedAt: new Date().toISOString() } 
            : app
        )
      );
      
      // Show success toast
      // toast({
      //   title: 'Status updated',
      //   description: 'Application status has been updated successfully.',
      // });
    } catch (error) {
      showErrorToast(error, 'Failed to update application status');
    }
  };

  const getStatusBadgeVariant = (status: ApplicationStatus) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'REVIEWING':
        return 'outline';
      case 'INTERVIEW':
        return 'default';
      case 'OFFERED':
        return 'default';
      case 'HIRED':
        return 'success';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select 
            value={statusFilter} 
            onValueChange={(value: string) => setStatusFilter(value as ApplicationStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVIEWING">Reviewing</SelectItem>
              <SelectItem value="INTERVIEW">Interview</SelectItem>
              <SelectItem value="OFFERED">Offered</SelectItem>
              <SelectItem value="HIRED">Hired</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {/* TODO: Fetch and populate job list */}
              {/* {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))} */}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length > 0 ? (
              applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {application.user?.fullName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{application.user?.fullName || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">
                          {application.user?.email || 'No email provided'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{application.job?.title || 'N/A'}</p>
                      {application.job?.company && (
                        <p className="text-sm text-muted-foreground">
                          {application.job.company.name}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(application.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(application.status)}>
                      {application.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/company/dashboard/applications/${application.id}`)}
                      >
                        View
                      </Button>
                      <Select
                        value={application.status}
                        onValueChange={(value: ApplicationStatus) => handleStatusChange(application.id, value)}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="REVIEWING">Reviewing</SelectItem>
                          <SelectItem value="INTERVIEW">Interview</SelectItem>
                          <SelectItem value="OFFERED">Offered</SelectItem>
                          <SelectItem value="HIRED">Hired</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No applications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
