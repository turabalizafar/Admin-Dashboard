import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Plus, ListVideo, Trash2, Monitor, Edit2 } from 'lucide-react';
import PlaylistEditor from '../components/playlists/PlaylistEditor';
import { Card, CardContent } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';
import AssignContentModal from '../components/devices/AssignContentModal';

const Playlists = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const { user } = useAuth();

    // Fetch devices to show assignment info
    const { data: devices } = useSupabaseRealtime({
        table: 'devices',
        filter: user ? `assigned_user_id=eq.${user.id}` : null,
    });

    const { data: playlists, loading } = useSupabaseRealtime({
        table: 'playlists',
        filter: user ? `created_by=eq.${user.id}` : null,
        orderBy: { column: 'created_at', ascending: false }
    });

    // Get screens that have a specific playlist assigned
    const getAssignedScreens = (playlistId) => {
        return devices.filter(d => d.current_playlist_id === playlistId);
    };

    const handleSave = async (playlistData, isEditing = false) => {
        try {
            if (isEditing && playlistData.id) {
                // Update existing playlist
                const { error } = await supabase
                    .from('playlists')
                    .update({
                        name: playlistData.name,
                        items: playlistData.items,
                        total_duration: playlistData.total_duration,
                    })
                    .eq('id', playlistData.id);

                if (error) throw error;
            } else {
                // Create new playlist
                const { error } = await supabase
                    .from('playlists')
                    .insert([{
                        ...playlistData,
                        created_by: user.id,
                        status: 'active'
                    }]);

                if (error) throw error;
            }
            setIsCreating(false);
            setEditingPlaylist(null);
        } catch (error) {
            console.error("Error saving playlist:", error);
            throw error;
        }
    };

    const handleDelete = async (id) => {
        const assignedScreens = getAssignedScreens(id);
        const warningMsg = assignedScreens.length > 0
            ? `This playlist is assigned to ${assignedScreens.length} screen(s): ${assignedScreens.map(s => s.name).join(', ')}. Delete anyway?`
            : "Delete this playlist? This will stop playback on any screens using it.";

        if (confirm(warningMsg)) {
            try {
                const { error } = await supabase
                    .from('playlists')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            } catch (error) {
                alert("Failed to delete: " + error.message);
            }
        }
    };

    // Show editor when creating or editing
    if (isCreating || editingPlaylist) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">
                    {editingPlaylist ? 'Edit Playlist' : 'New Playlist'}
                </h2>
                <PlaylistEditor
                    onSave={handleSave}
                    onCancel={() => { setIsCreating(false); setEditingPlaylist(null); }}
                    playlist={editingPlaylist}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Playlists</h2>
                    <p className="text-zinc-400 text-sm sm:text-base">Create sequences of content for your screens.</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Create Playlist
                </Button>
            </div>

            {loading ? (
                <div className="text-zinc-500">Loading playlists...</div>
            ) : playlists.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500">No playlists yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {playlists.map((playlist) => (
                        <Card key={playlist.id} className="bg-zinc-900/50 hover:border-blue-500/50 transition-colors cursor-pointer group">
                            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <ListVideo size={24} />
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{playlist.name}</h3>
                                    <p className="text-sm text-zinc-500">
                                        {playlist.items ? playlist.items.length : 0} clips • {playlist.total_duration}s loop
                                    </p>
                                    {getAssignedScreens(playlist.id).length > 0 && (
                                        <p className="text-xs text-blue-400 mt-1">
                                            Assigned to {getAssignedScreens(playlist.id).length} screen(s)
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingPlaylist(playlist); }}
                                        className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors bg-zinc-800/50 rounded-lg"
                                        title="Edit Playlist"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedPlaylist(playlist); }}
                                        className="p-2 text-zinc-500 hover:text-blue-500 transition-colors bg-zinc-800/50 rounded-lg"
                                        title="Display on Screen"
                                    >
                                        <Monitor size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(playlist.id); }}
                                        className="p-2 text-zinc-500 hover:text-red-500 transition-colors bg-zinc-800/50 rounded-lg"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${playlist.status === 'active'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                        }`}>
                                        {playlist.status}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AssignContentModal
                isOpen={!!selectedPlaylist}
                onClose={() => setSelectedPlaylist(null)}
                contentItem={selectedPlaylist}
                contentType="playlist"
            />
        </div>
    );
};

export default Playlists;
