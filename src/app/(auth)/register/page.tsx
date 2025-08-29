import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { RegisterForm } from './register-form';

export default async function RegisterPage() {
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
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to create your account
          </p>
        </div>
        <RegisterForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="hover:text-brand underline underline-offset-4"
          >
            Already have an account? Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
