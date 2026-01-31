import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Loader2, Monitor, CheckCircle2 } from 'lucide-react';

const AssignContentModal = ({ isOpen, onClose, contentItem, contentType }) => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen && user) {
            fetchDevices();
        }
    }, [isOpen, user]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('devices')
                .select('*')
                .eq('assigned_user_id', user.id)
                .order('name');

            if (error) throw error;
            setDevices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (device) => {
        setProcessingId(device.id);
        try {
            const updateData = {};
            if (contentType === 'playlist') {
                updateData.current_playlist_id = contentItem.id;
                updateData.current_media_id = null; // Clear direct media if assigning playlist
            } else {
                updateData.current_media_id = contentItem.id;
                updateData.current_playlist_id = null; // Clear playlist if assigning direct media
            }

            const { error } = await supabase
                .from('devices')
                .update(updateData)
                .eq('id', device.id);

            if (error) throw error;

            // Optimistic update
            setDevices(prev => prev.map(d =>
                d.id === device.id ? { ...d, ...updateData } : d
            ));
        } catch (err) {
            alert("Failed to assign: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleUnassign = async (device) => {
        setProcessingId(device.id);
        try {
            const updateData = {};
            if (contentType === 'playlist') {
                updateData.current_playlist_id = null;
            } else {
                updateData.current_media_id = null;
            }

            const { error } = await supabase
                .from('devices')
                .update(updateData)
                .eq('id', device.id);

            if (error) throw error;

            // Optimistic update
            setDevices(prev => prev.map(d =>
                d.id === device.id ? { ...d, ...updateData } : d
            ));
        } catch (err) {
            alert("Failed to unassign: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-lg relative bg-zinc-900 border-zinc-700 max-h-[80vh] flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        Display on Screen
                    </CardTitle>
                    <p className="text-zinc-400 text-sm">
                        Select a screen to show "{contentItem.name}"
                    </p>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto space-y-2 pb-6">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-500" /></div>
                    ) : devices.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">No screens found. Pair a device first.</div>
                    ) : (
                        devices.map((device) => {
                            const isAssigned = contentType === 'playlist'
                                ? device.current_playlist_id === contentItem.id
                                : device.current_media_id === contentItem.id;

                            return (
                                <div
                                    key={device.id}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isAssigned
                                        ? 'bg-blue-500/10 border-blue-500/50'
                                        : 'bg-zinc-800/50 border-zinc-800 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isAssigned ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                            <Monitor size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-zinc-200">{device.name}</p>
                                            <p className="text-xs text-zinc-500">{device.status} • {device.pairing_code}</p>
                                        </div>
                                    </div>

                                    {processingId === device.id ? (
                                        <Loader2 className="animate-spin text-blue-500" size={20} />
                                    ) : isAssigned ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-blue-400 text-sm font-medium">
                                                <CheckCircle2 size={16} />
                                                Active
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleUnassign(device)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                                Unassign
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleAssign(device)}
                                        >
                                            Assign
                                        </Button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AssignContentModal;
