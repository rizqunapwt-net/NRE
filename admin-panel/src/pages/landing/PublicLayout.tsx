import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './LandingPage_Bokify.css';

const PublicLayout: React.FC = () => {
    return (
        <div className="landing-page">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:border-2 focus:border-[#008B94] focus:text-[#008B94] focus:font-bold">
                Skip to main content
            </a>
            <Navbar />
            <Outlet />
            <Footer />
        </div>
    );
};

export default PublicLayout;
