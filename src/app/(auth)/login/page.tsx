import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const user = await getCurrentUser();
  
  // Redirect if already logged in
  if (user) {
    if (user.role === 'ADMIN') {
      redirect('/admin');
    } else if (user.role === 'COMPANY') {
      redirect('/company');
    } else {
      redirect('/talent');
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to sign in to your account
          </p>
        </div>
        <LoginForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/register"
            className="hover:text-brand underline underline-offset-4"
          >
            Don&apos;t have an account? Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
