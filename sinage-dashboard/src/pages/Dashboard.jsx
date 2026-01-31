import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Activity, Monitor, PlaySquare, HardDrive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';

const StatCard = ({ title, value, icon: Icon, description }) => (
    <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
            <Icon className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-white">{value}</div>
            <p className="text-xs text-zinc-500 mt-1">{description}</p>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const { user } = useAuth();

    // 1. Devices Live Data
    const { data: devices, loading: devicesLoading } = useSupabaseRealtime({
        table: 'devices',
        filter: user ? `assigned_user_id=eq.${user.id}` : null,
        enabled: !!user // Only fetch if user is available
    });

    // 2. Media Live Data
    const { data: media, loading: mediaLoading } = useSupabaseRealtime({
        table: 'media',
        filter: user ? `uploaded_by=eq.${user.id}` : null,
        orderBy: { column: 'created_at', ascending: false },
        enabled: !!user // Only fetch if user is available
    });

    // 3. Playlists Live Data
    const { data: playlists, loading: playlistsLoading } = useSupabaseRealtime({
        table: 'playlists',
        filter: user ? `created_by=eq.${user.id}` : null,
        enabled: !!user // Only fetch if user is available
    });

    // Ensure data arrays are initialized to empty if null/undefined
    const safeDevices = devices || [];
    const safeMedia = media || [];
    const safePlaylists = playlists || [];

    const loading = devicesLoading || mediaLoading || playlistsLoading;

    // Calculate Stats
    const stats = {
        totalScreens: safeDevices.length,
        onlineScreens: safeDevices.filter(d => {
            const lastPing = d.last_ping ? new Date(d.last_ping) : null;
            const isTimedOut = lastPing ? (Date.now() - lastPing.getTime() > 5 * 60 * 1000) : true;
            return d.status === 'online' && !isTimedOut;
        }).length,
        totalMedia: safeMedia.length,
        totalPlaylists: safePlaylists.length
    };

    // Calculate Recent Activity (latest 5 uploads)
    const recentActivity = safeMedia.slice(0, 5).map(m => ({
        id: m.id,
        type: 'upload',
        message: `Uploaded "${m.name}"`,
        time: new Date(m.created_at)
    }));

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-zinc-400">Overview of your digital signage network.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Your Screens"
                    value={stats.totalScreens}
                    icon={Monitor}
                    description={`${stats.onlineScreens} currently online`}
                />
                <StatCard
                    title="Active Playlists"
                    value={stats.totalPlaylists}
                    icon={PlaySquare}
                    description="Campaigns running"
                />
                <StatCard
                    title="Media Assets"
                    value={stats.totalMedia}
                    icon={HardDrive}
                    description="Images & Videos stored"
                />
                <StatCard
                    title="System Status"
                    value="Healthy"
                    icon={Activity}
                    description="All services operational"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-sm text-zinc-500">Loading activity...</div>
                        ) : recentActivity.length === 0 ? (
                            <div className="text-sm text-zinc-500">No recent activity.</div>
                        ) : (
                            <div className="space-y-8">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center">
                                        <span className="relative flex h-2 w-2 mr-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none text-white">{activity.message}</p>
                                            <p className="text-xs text-zinc-500">
                                                {activity.time?.toLocaleString() !== '1/1/1970, 5:00:00 AM' ? activity.time?.toLocaleString() : 'Just now'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="p-3 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 cursor-pointer transition-colors" onClick={() => window.location.href = '/devices'}>
                            Pair a new Screen
                        </div>
                        <div className="p-3 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 cursor-pointer transition-colors" onClick={() => window.location.href = '/media'}>
                            Upload Media Content
                        </div>
                        <div className="p-3 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 cursor-pointer transition-colors" onClick={() => window.location.href = '/playlists'}>
                            Create New Campaign
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
