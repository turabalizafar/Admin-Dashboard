import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Plus, X, MoveUp, MoveDown, Save, PlayCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const PlaylistEditor = ({ onSave, onCancel, playlist }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [playlistItems, setPlaylistItems] = useState([]);
    const [availableMedia, setAvailableMedia] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(true);
    const [saving, setSaving] = useState(false);

    const isEditing = !!playlist;

    // Pre-populate data when editing
    useEffect(() => {
        if (playlist) {
            setName(playlist.name || '');
            // Convert playlist items to editor format
            const existingItems = (playlist.items || []).map((item, idx) => ({
                ...item,
                id: item.mediaId || item.id,
                playlistItemId: Date.now() + idx, // Unique ID for each instance
                duration: item.duration || 10
            }));
            setPlaylistItems(existingItems);
        }
    }, [playlist]);

    // Fetch Available Media from Supabase
    useEffect(() => {
        if (!user) return;

        const fetchMedia = async () => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .select('*')
                    .eq('uploaded_by', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setAvailableMedia(data);
            } catch (error) {
                console.error("Error fetching media:", error);
            } finally {
                setLoadingMedia(false);
            }
        };
        fetchMedia();
    }, [user]);

    const addToPlaylist = (media) => {
        setPlaylistItems(prev => [
            ...prev,
            {
                ...media,
                playlistItemId: Date.now(), // Unique ID for this instance in the playlist
                duration: media.type === 'video' ? 15 : 10
            }
        ]);
    };

    const removeFromPlaylist = (index) => {
        setPlaylistItems(prev => prev.filter((_, i) => i !== index));
    };

    const moveItem = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === playlistItems.length - 1)) return;

        const newItems = [...playlistItems];
        const item = newItems[index];
        newItems.splice(index, 1);
        newItems.splice(index + direction, 0, item);
        setPlaylistItems(newItems);
    };

    const updateDuration = (index, seconds) => {
        const newItems = [...playlistItems];
        newItems[index].duration = parseInt(seconds) || 10;
        setPlaylistItems(newItems);
    };

    const handleSave = async () => {
        if (!name.trim()) return alert('Please enter a playlist name');
        if (playlistItems.length === 0) return alert('Playlist cannot be empty');

        setSaving(true);
        try {
            const playlistData = {
                name,
                items: playlistItems.map(item => ({
                    mediaId: item.id || item.mediaId,
                    name: item.name,
                    type: item.type,
                    url: item.url,
                    duration: item.duration,
                    storage_path: item.storage_path || ''
                })),
                total_duration: playlistItems.reduce((acc, curr) => acc + curr.duration, 0),
            };

            // Include id if editing
            if (isEditing && playlist.id) {
                playlistData.id = playlist.id;
            }

            await onSave(playlistData, isEditing);
        } catch (error) {
            alert("Failed to save: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 min-h-[calc(100vh-180px)] lg:h-[calc(100vh-140px)]">
            {/* LEFT: Available Media */}
            <Card className="flex flex-col h-[300px] lg:h-full bg-zinc-900/50">
                <div className="p-4 border-b border-zinc-800">
                    <h3 className="font-semibold text-lg">Media Library</h3>
                    <p className="text-xs text-zinc-400">Click + to add to timeline</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMedia ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>
                    ) : availableMedia.length === 0 ? (
                        <div className="text-zinc-500 text-center p-4">No media found. Upload some files first.</div>
                    ) : (
                        availableMedia.map(media => (
                            <div key={media.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors group">
                                <div className="w-12 h-12 bg-black rounded-md overflow-hidden flex-shrink-0 relative">
                                    {media.type === 'image' ? (
                                        <img src={media.url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-900">
                                            <PlayCircle size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">{media.name}</p>
                                    <span className="text-xs text-zinc-500 capitalize">{media.type}</span>
                                </div>
                                <Button size="sm" onClick={() => addToPlaylist(media)} className="h-8 px-2">
                                    <Plus size={16} />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* RIGHT: Playlist Timeline */}
            <Card className="flex flex-col h-[400px] lg:h-full bg-zinc-900/50 border-blue-500/20">
                <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Playlist Name (e.g. Morning Loop)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-transparent text-lg font-bold placeholder:text-zinc-600 focus:outline-none"
                        />
                    </div>
                    <Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || playlistItems.length === 0}>
                        {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                        Save
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {playlistItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
                            <p>Playlist is empty</p>
                            <p className="text-xs">Add items from the library</p>
                        </div>
                    ) : (
                        playlistItems.map((item, index) => (
                            <div key={item.playlistItemId} className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700 animate-in fade-in slide-in-from-left-2">
                                <div className="font-mono text-zinc-500 text-sm">#{index + 1}</div>

                                <div className="w-10 h-10 bg-black rounded overflow-hidden flex-shrink-0">
                                    {item.type === 'image' ? (
                                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full"><PlayCircle size={16} /></div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <label className="text-xs text-zinc-400">Duration (s):</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.duration}
                                            onChange={(e) => updateDuration(index, e.target.value)}
                                            className="w-16 bg-black border border-zinc-600 rounded px-2 py-1 text-xs text-center focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    <button onClick={() => moveItem(index, -1)} disabled={index === 0} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors">
                                        <MoveUp size={16} />
                                    </button>
                                    <button onClick={() => moveItem(index, 1)} disabled={index === playlistItems.length - 1} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors">
                                        <MoveDown size={16} />
                                    </button>
                                    <button onClick={() => removeFromPlaylist(index)} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};

export default PlaylistEditor;
