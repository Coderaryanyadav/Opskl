import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Redirect to appropriate dashboard based on role
  if (user.role === 'ADMIN' && !window.location.pathname.startsWith('/admin')) {
    redirect('/admin');
  } else if (user.role === 'COMPANY' && !window.location.pathname.startsWith('/company')) {
    redirect('/company');
  } else if (user.role === 'TALENT' && !window.location.pathname.startsWith('/talent')) {
    redirect('/talent');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <MainNav role={user.role} />
          <UserNav user={user} />
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <div className="container h-full py-6">{children}</div>
      </main>
    </div>
  );
}
