import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { JobList } from '@/components/job-list';

export default async function TalentDashboard() {
  const user = await getCurrentUser();
  
  // Redirect if not authenticated or not a talent
  if (!user) {
    redirect('/login');
  }
  
  if (user.role !== 'TALENT') {
    redirect(`/${user.role.toLowerCase()}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user.fullName}!</h1>
        <p className="text-muted-foreground">
          Find your next opportunity or manage your applications
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Recommended Jobs</h2>
            <JobList />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-medium mb-4">Your Applications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Applied</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Interviewing</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Offers</span>
                <span className="font-medium">1</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-medium mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors text-sm">
                Update your profile
              </button>
              <button className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors text-sm">
                View your applications
              </button>
              <button className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors text-sm">
                Search for jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
