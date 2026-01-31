import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Tv, Activity, Clock, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DeviceStatus = ({ status, last_ping }) => {
    // Basic offline detection: if last_ping > 5 mins ago, consider it offline
    const [isTimedOut, setIsTimedOut] = useState(false);

    useEffect(() => {
        const checkStatus = () => {
            const lastPingDate = last_ping ? new Date(last_ping) : null;
            if (lastPingDate) {
                const diff = (Date.now() - lastPingDate.getTime()) / 1000 / 60;
                setIsTimedOut(diff > 5);
            } else {
                setIsTimedOut(true);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [last_ping]);

    const isOnline = status === 'online' && !isTimedOut;

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${isOnline
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
            {isOnline ? 'Online' : 'Offline'}
        </div>
    );
};

const DeviceCard = ({ device }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(device.name);
    const [saving, setSaving] = useState(false);

    const handleRename = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('devices')
                .update({ name: newName.trim() })
                .eq('id', device.id);

            if (error) throw error;
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert("Failed to rename screen");
        } finally {
            setSaving(false);
        }
    };

    const formatLastSeen = (last_ping) => {
        const date = last_ping ? new Date(last_ping) : null;
        if (!date) return 'Never';
        const diff = (Date.now() - date.getTime()) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return date.toLocaleTimeString();
    };

    return (
        <Card className="hover:border-zinc-600 transition-colors group">
            <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="p-3 bg-zinc-800 rounded-xl group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-colors">
                        <Tv size={24} />
                    </div>
                    <DeviceStatus status={device.status} last_ping={device.last_ping} />
                </div>

                <div className="space-y-1">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="flex-1 bg-black border border-blue-500 rounded px-2 py-1 text-white focus:outline-none"
                                autoFocus
                            />
                            <button onClick={handleRename} disabled={saving} className="text-emerald-500 hover:text-emerald-400 p-1">
                                <Check size={18} />
                            </button>
                            <button onClick={() => { setIsEditing(false); setNewName(device.name); }} className="text-zinc-500 hover:text-white p-1">
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between group/name">
                            <h3 className="font-semibold text-lg text-white truncate pr-2">{device.name}</h3>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="opacity-0 group-hover/name:opacity-100 text-zinc-500 hover:text-white transition-all"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                    )}
                    <p className="text-sm text-zinc-500 font-mono">Pairing Code: <span className="text-zinc-300 font-bold">{device.pairing_code}</span></p>
                </div>

                <div className="pt-4 border-t border-zinc-800/50 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500 flex items-center gap-2">
                            <Activity size={14} /> {device.current_media_id ? 'Direct Play' : 'Playlist'}
                        </span>
                        <span className="text-zinc-300 max-w-[120px] truncate text-right">
                            {device.current_media_id
                                ? 'Single Media'
                                : (device.current_playlist_id ? 'Playing' : 'Idle')}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500 flex items-center gap-2">
                            <Clock size={14} /> Last Seen
                        </span>
                        <span className="text-zinc-300">{formatLastSeen(device.last_ping)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DeviceCard;
