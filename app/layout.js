import { Manrope } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'Sportify — Sports for Every Passion',
  description:
    'Track stats, set goals, and manage tournaments across multiple sports in one place.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
