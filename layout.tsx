import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { GlobalModals } from '@/components/layout/GlobalModals';
import { ToastContainer } from '@/components/ui/Toast';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#141313',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://shivproperties.com'),
  title: 'Shiv Properties | Luxury Real Estate & Bespoke Custom Home Construction',
  description:
    'Shiv Properties presents an exclusive collection of luxury penthouses, waterfront villas, gated plots, and turnkey custom architectural home construction on clients’ own land in Mumbai, Pune, Alibaug, and Goa.',
  keywords: [
    'luxury real estate',
    'Shiv Properties',
    'penthouses Mumbai',
    'villas Alibaug',
    'build on your land',
    'custom home construction',
    'luxury architecture',
    'Koregaon Park villas',
    'MahaRERA verified',
  ],
  authors: [{ name: 'Shiv Properties' }],
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
  openGraph: {
    title: 'Shiv Properties | Luxury Real Estate & Custom Home Construction',
    description:
      'Explore luxury residences and bespoke turnkey construction on your private land.',
    type: 'website',
    images: ['/images/hero-preview.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#121414] text-[#e5e2e1] min-h-screen flex flex-col font-sans selection:bg-tertiary selection:text-on-tertiary-fixed">
        <StoreProvider>
          <Navbar />
          <main className="flex-1 pt-20">{children}</main>
          <Footer />
          <MobileBottomNav />
          <GlobalModals />
          <ToastContainer />
        </StoreProvider>
      </body>
    </html>
  );
}
