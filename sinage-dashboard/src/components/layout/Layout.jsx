import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Tv, FileImage, ListVideo, LogOut, Menu, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose();
    }, [location.pathname]);

    const links = [
        { to: "/", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/devices", icon: Tv, label: "Screens" },
        { to: "/media", icon: FileImage, label: "Media" },
        { to: "/playlists", icon: ListVideo, label: "Playlists" },
    ];

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed left-0 top-0 z-50
                transition-transform duration-300 ease-in-out
                lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        SignageOS
                    </h1>
                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-zinc-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                ${isActive
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}
                            `}
                        >
                            <link.icon size={20} />
                            <span className="font-medium">{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-3 w-full px-4 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
};

// Mobile header with hamburger menu
const MobileHeader = ({ onMenuClick }) => {
    return (
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 z-30 flex items-center px-4">
            <button
                onClick={onMenuClick}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
                <Menu size={24} />
            </button>
            <h1 className="ml-4 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                SignageOS
            </h1>
        </div>
    );
};

export const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content - adjusted padding for mobile/desktop */}
            <main className="pt-20 px-4 pb-8 lg:pt-8 lg:pl-72 lg:pr-8">
                <Outlet />
            </main>
        </div>
    );
};
