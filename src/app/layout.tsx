import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import AuthLoading from '@/components/auth/loading';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OpSkill - Find Talent & Jobs',
  description: 'Connect Aadhaar-verified Talent with GST-verified Companies for short-term side jobs',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* This helps prevent extensions from modifying the DOM before hydration */}
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense fallback={<AuthLoading />}>
              {children}
              <Toaster />
            </Suspense>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
