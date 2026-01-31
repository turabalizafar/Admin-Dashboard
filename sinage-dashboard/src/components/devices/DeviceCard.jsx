import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Tv, Activity, Clock, Edit2, Check, X, Trash2, FileText, PlayCircle, Image as ImageIcon } from 'lucide-react';
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

const DeviceCard = ({ device, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(device.name);
    const [saving, setSaving] = useState(false);
    const [showContentDetails, setShowContentDetails] = useState(false);
    const [contentInfo, setContentInfo] = useState(null);
    const [loadingContent, setLoadingContent] = useState(false);

    // Fetch content info when device has assigned content
    useEffect(() => {
        const fetchContentInfo = async () => {
            if (!device.current_playlist_id && !device.current_media_id) {
                setContentInfo(null);
                return;
            }

            setLoadingContent(true);
            try {
                if (device.current_playlist_id) {
                    // Fetch playlist details
                    const { data, error } = await supabase
                        .from('playlists')
                        .select('name, items')
                        .eq('id', device.current_playlist_id)
                        .single();

                    if (data && !error) {
                        const items = typeof data.items === 'string'
                            ? JSON.parse(data.items)
                            : (data.items || []);
                        setContentInfo({
                            type: 'playlist',
                            name: data.name,
                            itemCount: items.length,
                            items: items.slice(0, 5) // First 5 items for preview
                        });
                    }
                } else if (device.current_media_id) {
                    // Fetch media details
                    const { data, error } = await supabase
                        .from('media')
                        .select('name, type, url')
                        .eq('id', device.current_media_id)
                        .single();

                    if (data && !error) {
                        setContentInfo({
                            type: 'media',
                            name: data.name,
                            mediaType: data.type,
                            url: data.url
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch content info:', err);
            } finally {
                setLoadingContent(false);
            }
        };

        fetchContentInfo();
    }, [device.current_playlist_id, device.current_media_id]);

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

        // Format CST time
        const cstTime = date.toLocaleTimeString('en-US', {
            timeZone: 'America/Chicago',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }) + ' CST';

        if (diff < 60) return `Just now (${cstTime})`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago (${cstTime})`;
        return cstTime;
    };

    const hasContent = device.current_playlist_id || device.current_media_id;

    return (
        <Card className="hover:border-zinc-600 transition-colors group relative">
            <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <button
                        onClick={() => hasContent && setShowContentDetails(!showContentDetails)}
                        className={`p-3 rounded-xl transition-colors ${hasContent
                            ? 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 cursor-pointer'
                            : 'bg-zinc-800 text-zinc-500 cursor-default'
                            }`}
                        title={hasContent ? 'Click to view content details' : 'No content assigned'}
                    >
                        <Tv size={24} />
                    </button>
                    <DeviceStatus status={device.status} last_ping={device.last_ping} />
                </div>

                {/* Content Details Popover */}
                {showContentDetails && contentInfo && (
                    <div className="absolute top-16 left-4 right-4 z-10 bg-zinc-900 border border-blue-500/30 rounded-xl p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-blue-400">
                                {contentInfo.type === 'playlist' ? (
                                    <FileText size={16} />
                                ) : contentInfo.mediaType === 'video' ? (
                                    <PlayCircle size={16} />
                                ) : (
                                    <ImageIcon size={16} />
                                )}
                                <span className="text-xs font-medium uppercase">
                                    {contentInfo.type === 'playlist' ? 'Playlist' : contentInfo.mediaType}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowContentDetails(false)}
                                className="text-zinc-500 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <h4 className="font-semibold text-white mb-2 truncate">{contentInfo.name}</h4>

                        {contentInfo.type === 'playlist' && (
                            <div className="space-y-1">
                                <p className="text-xs text-zinc-400">{contentInfo.itemCount} items in playlist:</p>
                                <ul className="text-xs text-zinc-500 space-y-1 max-h-24 overflow-y-auto">
                                    {contentInfo.items?.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-1 truncate">
                                            <span className="text-zinc-600">{idx + 1}.</span>
                                            {item.name || `Media ${idx + 1}`}
                                        </li>
                                    ))}
                                    {contentInfo.itemCount > 5 && (
                                        <li className="text-blue-400">+{contentInfo.itemCount - 5} more...</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {contentInfo.type === 'media' && contentInfo.url && (
                            <div className="mt-2">
                                {contentInfo.mediaType === 'image' ? (
                                    <img
                                        src={contentInfo.url}
                                        alt={contentInfo.name}
                                        className="w-full h-20 object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="w-full h-20 bg-black/50 rounded-lg flex items-center justify-center">
                                        <PlayCircle size={32} className="text-blue-400" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

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
                        <span className={`max-w-[150px] truncate text-right ${contentInfo ? 'text-blue-400 font-medium' : 'text-zinc-400'}`}>
                            {loadingContent ? '...' : (contentInfo?.name || (hasContent ? 'Loading...' : 'Idle'))}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500 flex items-center gap-2">
                            <Clock size={14} /> Last Seen
                        </span>
                        <span className="text-zinc-300">{formatLastSeen(device.last_ping)}</span>
                    </div>

                    {onDelete && (
                        <button
                            onClick={() => onDelete(device)}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                        >
                            <Trash2 size={16} />
                            Delete Screen
                        </button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default DeviceCard;

