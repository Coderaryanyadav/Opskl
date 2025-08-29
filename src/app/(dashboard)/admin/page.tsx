import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  
  // Redirect if not authenticated or not an admin
  if (!user) {
    redirect('/login');
  }
  
  if (user.role !== 'ADMIN') {
    redirect(`/${user.role.toLowerCase()}`);
  }

  // Mock data - in a real app, this would come from your API
  const stats = [
    { name: 'Total Users', value: '1,234', change: '+12.5%', changeType: 'positive' },
    { name: 'Active Jobs', value: '89', change: '+5.2%', changeType: 'positive' },
    { name: 'New Signups', value: '42', change: '-2.3%', changeType: 'negative' },
    { name: 'Revenue', value: '₹1,24,567', change: '+18.7%', changeType: 'positive' },
  ];

  const recentUsers = [
    { id: 1, name: 'Aarav Patel', email: 'aarav@example.com', role: 'TALENT', status: 'active', joined: '2h ago' },
    { id: 2, name: 'Priya Sharma', email: 'priya@example.com', role: 'COMPANY', status: 'pending', joined: '5h ago' },
    { id: 3, name: 'Rahul Kumar', email: 'rahul@example.com', role: 'TALENT', status: 'active', joined: '1d ago' },
    { id: 4, name: 'Neha Gupta', email: 'neha@example.com', role: 'COMPANY', status: 'suspended', joined: '2d ago' },
  ];

  const recentJobs = [
    { id: 1, title: 'Event Manager', company: 'Grand Events', status: 'pending', posted: '1h ago', category: 'Event Management' },
    { id: 2, title: 'Wedding Planner', company: 'Dream Weddings', status: 'approved', posted: '3h ago', category: 'Wedding Planning' },
    { id: 3, title: 'Catering Staff', company: 'Tasty Bites', status: 'rejected', posted: '5h ago', category: 'Catering' },
    { id: 4, title: 'Security Personnel', company: 'SafeGuard', status: 'approved', posted: '1d ago', category: 'Security' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.fullName}. Here's what's happening with your platform.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-lg border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
            <div className="mt-1 flex items-baseline">
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.changeType === 'positive' ? (
                <span className="ml-2 inline-flex items-baseline rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  <Icons.arrowUp className="h-3 w-3 flex-shrink-0 self-center" />
                  <span className="ml-1">{stat.change}</span>
                </span>
              ) : stat.changeType === 'negative' ? (
                <span className="ml-2 inline-flex items-baseline rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  <Icons.arrowDown className="h-3 w-3 flex-shrink-0 self-center" />
                  <span className="ml-1">{stat.change}</span>
                </span>
              ) : (
                <span className="ml-2 inline-flex items-baseline rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                  <span className="ml-1">{stat.change}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Users</h2>
            <Button variant="ghost" size="sm">
              View All
              <Icons.chevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <span className="text-sm font-medium">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      user.role === 'ADMIN'
                        ? 'default'
                        : user.role === 'COMPANY'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {user.role}
                  </Badge>
                  <Badge
                    variant={
                      user.status === 'active'
                        ? 'default'
                        : user.status === 'pending'
                        ? 'outline'
                        : 'destructive'
                    }
                  >
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Jobs */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Job Postings</h2>
            <Button variant="ghost" size="sm">
              View All
              <Icons.chevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.company} • {job.category}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      job.status === 'approved'
                        ? 'default'
                        : job.status === 'pending'
                        ? 'outline'
                        : 'destructive'
                    }
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Icons.moreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto flex-col items-start p-4">
            <Icons.users className="mb-2 h-6 w-6" />
            <span>Manage Users</span>
            <span className="mt-1 text-xs font-normal text-muted-foreground">
              View and manage all users
            </span>
          </Button>
          <Button variant="outline" className="h-auto flex-col items-start p-4">
            <Icons.briefcase className="mb-2 h-6 w-6" />
            <span>Moderate Jobs</span>
            <span className="mt-1 text-xs font-normal text-muted-foreground">
              Review pending job postings
            </span>
          </Button>
          <Button variant="outline" className="h-auto flex-col items-start p-4">
            <Icons.settings className="mb-2 h-6 w-6" />
            <span>System Settings</span>
            <span className="mt-1 text-xs font-normal text-muted-foreground">
              Configure platform settings
            </span>
          </Button>
          <Button variant="outline" className="h-auto flex-col items-start p-4">
            <Icons.fileText className="mb-2 h-6 w-6" />
            <span>Reports</span>
            <span className="mt-1 text-xs font-normal text-muted-foreground">
              Generate and view reports
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
