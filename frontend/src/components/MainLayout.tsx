import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './home/Footer';
import { GovGuideSaathiWidget } from './ai/GovGuideSaathiWidget';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <GovGuideSaathiWidget />
    </div>
  );
}
