import { useState } from 'react';
import { Outlet } from "react-router-dom";
import Header from './components/Header';
import MobileMenu from './components/MobileMenu';
import Footer from './components/Footer';

const MainLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex flex-col bg-gray-50 dark:bg-gray-900 min-h-screen font-sans transition-colors duration-300">
            <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
            <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-16 py-8">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
};

export default MainLayout;
