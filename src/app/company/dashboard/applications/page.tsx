import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ApplicationsList } from '@/components/company/applications-list';

export const metadata: Metadata = {
  title: 'Job Applications | OpSkill',
  description: 'View and manage job applications',
};

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  
  // Redirect to login if not authenticated or not a company
  if (!user) {
    redirect('/auth/signin?callbackUrl=/company/dashboard/applications');
  }
  
  if (user.role !== 'company') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Job Applications</h1>
        <p className="text-muted-foreground">
          Manage and review all job applications
        </p>
      </div>
      
      <div className="space-y-6">
        <ApplicationsList companyId={user.id} />
      </div>
    </div>
  );
}
