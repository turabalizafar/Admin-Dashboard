import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Plus, ListVideo, Trash2, Monitor } from 'lucide-react';
import PlaylistEditor from '../components/playlists/PlaylistEditor';
import { Card, CardContent } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';
import AssignContentModal from '../components/devices/AssignContentModal';

const Playlists = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const { user } = useAuth();

    const { data: playlists, loading } = useSupabaseRealtime({
        table: 'playlists',
        filter: user ? `created_by=eq.${user.id}` : null,
        orderBy: { column: 'created_at', ascending: false }
    });

    const handleSave = async (playlistData) => {
        try {
            const { error } = await supabase
                .from('playlists')
                .insert([{
                    ...playlistData,
                    created_by: user.id,
                    status: 'active'
                }]);

            if (error) throw error;
            setIsCreating(false);
        } catch (error) {
            console.error("Error saving playlist:", error);
            throw error;
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this playlist? This will stop playback on any screens using it.")) {
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

    if (isCreating) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">New Playlist</h2>
                <PlaylistEditor onSave={handleSave} onCancel={() => setIsCreating(false)} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Playlists</h2>
                    <p className="text-zinc-400">Create sequences of content for your screens.</p>
                </div>
                <Button onClick={() => setIsCreating(true)}>
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
                            <CardContent className="p-6 flex items-center gap-6">
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <ListVideo size={24} />
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{playlist.name}</h3>
                                    <p className="text-sm text-zinc-500">
                                        {playlist.items ? playlist.items.length : 0} clips • {playlist.total_duration}s loop
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
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
