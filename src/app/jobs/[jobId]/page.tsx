import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { fetchJobById } from '@/lib/api/jobs';
import { JobApplicationForm } from '@/components/job-application-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default async function JobDetailsPage({
  params,
}: {
  params: { jobId: string };
}) {
  const user = await getCurrentUser();
  let job;
  
  try {
    job = await fetchJobById(params.jobId);
  } catch (error) {
    console.error('Error fetching job:', error);
    notFound();
  }

  // Check if user has already applied
  const hasApplied = user?.role === 'TALENT' && 
    job.applications?.some(app => app.userId === user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Job Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold">{job.title}</h1>
                  <Badge variant={job.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {job.status}
                  </Badge>
                </div>
                
                <div className="flex items-center text-muted-foreground mb-4">
                  <Icons.building className="h-4 w-4 mr-2" />
                  <span>{job.company.name}</span>
                  <span className="mx-2">•</span>
                  <Icons.mapPin className="h-4 w-4 mr-2" />
                  <span>{job.location}</span>
                  {job.isRemote && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-green-600">Remote</span>
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="bg-blue-50">
                    {job.jobType.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50">
                    {job.category}
                  </Badge>
                  <Badge variant="outline" className="bg-amber-50">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(job.salary)}
                    {job.salaryType !== 'PROJECT' && ` per ${job.salaryType.toLowerCase()}`}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                {user?.role === 'COMPANY' && user.id === job.companyId ? (
                  <Button asChild variant="outline">
                    <Link href={`/company/jobs/${job.id}/edit`}>
                      <Icons.edit className="h-4 w-4 mr-2" />
                      Edit Job
                    </Link>
                  </Button>
                ) : user?.role === 'TALENT' ? (
                  hasApplied ? (
                    <Button disabled>
                      <Icons.check className="h-4 w-4 mr-2" />
                      Applied
                    </Button>
                  ) : (
                    <JobApplicationForm jobId={job.id} />
                  )
                ) : (
                  <Button asChild>
                    <Link href="/auth/signin?callbackUrl=/jobs">
                      Sign in to apply
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Job Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                {/* Job Description */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">Job Description</h2>
                  <div className="prose max-w-none">
                    <p>{job.description}</p>
                  </div>
                </section>
                
                {/* Responsibilities */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">Responsibilities</h2>
                  <ul className="space-y-2 pl-5 list-disc">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index}>{responsibility}</li>
                    ))}
                  </ul>
                </section>
                
                {/* Requirements */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                  <ul className="space-y-2 pl-5 list-disc">
                    {job.requirements.map((requirement, index) => (
                      <li key={index}>{requirement}</li>
                    ))}
                  </ul>
                </section>
                
                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4">Benefits</h2>
                    <ul className="space-y-2 pl-5 list-disc">
                      {job.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* Company Card */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                      {job.company.logo ? (
                        <img 
                          src={job.company.logo} 
                          alt={job.company.name}
                          className="h-12 w-12 object-contain"
                        />
                      ) : (
                        <Icons.building className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{job.company.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {job.company.industry || 'Event Management'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {job.company.description || 'A leading company in the event management industry.'}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    View Company
                  </Button>
                </div>
                
                {/* Job Overview */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium">Job Overview</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Icons.calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Posted</div>
                        <div>{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Icons.clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Job Type</div>
                        <div>{job.jobType.replace('_', ' ')}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Icons.dollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Salary</div>
                        <div>
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                          }).format(job.salary)}
                          {job.salaryType !== 'PROJECT' && ` per ${job.salaryType.toLowerCase()}`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Icons.mapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Location</div>
                        <div>{job.location} {job.isRemote && '(Remote)'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Icons.calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Application Deadline</div>
                        <div>{new Date(job.applicationDeadline).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Share Job */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Share this job</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon">
                      <Icons.twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Icons.linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Icons.link className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Similar Jobs */}
          {job.similarJobs && job.similarJobs.length > 0 && (
            <div className="p-6 border-t">
              <h2 className="text-xl font-semibold mb-6">Similar Jobs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {job.similarJobs.map((similarJob) => (
                  <div key={similarJob.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium">
                      <Link href={`/jobs/${similarJob.id}`} className="hover:underline">
                        {similarJob.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{similarJob.company.name}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {similarJob.jobType.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {similarJob.location}
                      </Badge>
                    </div>
                    <p className="text-sm line-clamp-2 mb-3">{similarJob.description}</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/jobs/${similarJob.id}`}>View Details</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
