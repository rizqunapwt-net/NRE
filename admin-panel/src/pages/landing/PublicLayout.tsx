import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './LandingPage_Bokify.css';

const PublicLayout: React.FC = () => {
    return (
        <div className="landing-page">
            <Navbar />
            <Outlet />
            <Footer />
        </div>
    );
};

export default PublicLayout;
