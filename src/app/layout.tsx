import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { QueryProvider, ThemeProvider, AuthProvider } from '@/providers';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EMS — Employee Management System',
  description: 'Manage your workforce with confidence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-canvas text-fg">
        <ThemeProvider>
          <QueryProvider>
            <TooltipProvider>
              <AuthProvider>{children}</AuthProvider>
            </TooltipProvider>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
