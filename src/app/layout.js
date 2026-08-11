import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Providers } from '@/components/Providers';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LandingPage from '@/components/LandingPage';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata = {
  title: 'DropX AI | Ultimate Dropshipping Platform',
  description: 'AI-powered dropshipping automation and analysis.',
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="dropmagic-grid"></div>
        <Providers>
          {session ? (
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                <Topbar />
                <div className="page-content animate-fade-in">
                  {children}
                </div>
              </main>
            </div>
          ) : (
            <LanguageProvider>
              <div className="public-content" style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
                {children}
              </div>
            </LanguageProvider>
          )}
        </Providers>
      </body>
    </html>
  );
}
