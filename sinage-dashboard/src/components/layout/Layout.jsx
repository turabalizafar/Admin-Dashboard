import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Tv, FileImage, ListVideo, LogOut } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();

    const links = [
        { to: "/", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/devices", icon: Tv, label: "Screens" },
        { to: "/media", icon: FileImage, label: "Media" },
        { to: "/playlists", icon: ListVideo, label: "Playlists" },
    ];

    return (
        <div className="h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed left-0 top-0">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    SignageOS
                </h1>
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
    );
};

export const Layout = () => {
    return (
        <div className="min-h-screen bg-zinc-950 text-white pl-64">
            <Sidebar />
            <main className="p-8">
                <Outlet />
            </main>
        </div>
    );
};
