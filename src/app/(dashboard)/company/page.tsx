import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { JobPostings } from '@/components/company/job-postings';

export default async function CompanyDashboard() {
  const user = await getCurrentUser();
  
  // Redirect if not authenticated or not a company
  if (!user) {
    redirect('/login');
  }
  
  if (user.role !== 'COMPANY') {
    redirect(`/${user.role.toLowerCase()}`);
  }

  // Mock data - in a real app, this would come from your API
  const stats = [
    { name: 'Total Jobs Posted', value: '24', change: '+2.5%', changeType: 'positive' },
    { name: 'Active Applications', value: '18', change: '+5.2%', changeType: 'positive' },
    { name: 'Hired Talents', value: '12', change: '+0%', changeType: 'neutral' },
    { name: 'Avg. Rating', value: '4.8', change: '+0.3', changeType: 'positive' },
  ];

  const recentActivity = [
    { id: 1, type: 'application', title: 'New application for Event Manager', time: '2h ago', candidate: 'Rahul Sharma' },
    { id: 2, type: 'message', title: 'New message from Priya Patel', time: '5h ago', preview: 'Hi, I have a question about the job...' },
    { id: 3, type: 'application', title: 'Application reviewed - Event Manager', time: '1d ago', candidate: 'Amit Singh' },
    { id: 4, type: 'payment', title: 'Payment received for Project #1234', time: '2d ago', amount: '₹25,000' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.companyName}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your jobs and applications
          </p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Icons.plus className="mr-2 h-4 w-4" />
          Post a New Job
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
              {stat.changeType === 'positive' ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  {stat.change}
                </span>
              ) : stat.changeType === 'negative' ? (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  {stat.change}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                  {stat.change}
                </span>
              )}
            </div>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    {activity.type === 'application' && (
                      <Icons.fileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    {activity.type === 'message' && (
                      <Icons.mail className="h-4 w-4 text-muted-foreground" />
                    )}
                    {activity.type === 'payment' && (
                      <Icons.dollarSign className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.candidate && `From ${activity.candidate} • `}
                      {activity.time}
                    </p>
                    {activity.preview && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {activity.preview}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-4 w-full">
              View all activity
            </Button>
          </div>
        </div>
        
        {/* Job Postings */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Job Postings</h2>
              <Button variant="outline" size="sm">
                <Icons.plus className="mr-2 h-4 w-4" />
                New Job
              </Button>
            </div>
            <JobPostings />
          </div>
        </div>
      </div>
    </div>
  );
}
