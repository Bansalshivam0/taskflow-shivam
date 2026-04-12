import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();

    React.useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    React.useEffect(() => {
        document.body.style.overflow = isMobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMobileOpen]);

    return (
        <>
            {createPortal(
                <>
                    <Sidebar
                        isMobileOpen={isMobileOpen}
                        setIsMobileOpen={setIsMobileOpen}
                    />
                    <div
                        className={`sidebar-overlay ${isMobileOpen ? 'mobile-open' : ''}`}
                        onClick={() => setIsMobileOpen(false)}
                    />
                </>,
                document.body
            )}

            <div className="dashboard-layout">
                <div className="mobile-header">
                    <button
                        className="mobile-header-btn"
                        onClick={() => setIsMobileOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>TaskFlow</span>
                </div>

                <div className="main-content">
                    <Outlet />
                </div>
            </div>
        </>
    );
};

export default DashboardLayout;

