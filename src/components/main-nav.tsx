import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MainNavProps {
  role?: 'TALENT' | 'COMPANY' | 'ADMIN';
  className?: string;
}

export function MainNav({ role, className, ...props }: MainNavProps) {
  const items = [
    {
      href: '/',
      label: 'Home',
      show: true,
    },
    {
      href: '/jobs',
      label: 'Jobs',
      show: role === 'TALENT',
    },
    {
      href: '/talent',
      label: 'Talent',
      show: role === 'COMPANY',
    },
    {
      href: '/company/jobs',
      label: 'My Jobs',
      show: role === 'COMPANY',
    },
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      show: role === 'ADMIN',
    },
    {
      href: '/admin/users',
      label: 'Users',
      show: role === 'ADMIN',
    },
  ];

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      <Link href="/" className="font-bold">
        OpSkill
      </Link>
      {items.map(
        (item) =>
          item.show && (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          )
      )}
    </nav>
  );
}
