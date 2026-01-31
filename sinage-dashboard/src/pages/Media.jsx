import React, { useState, useEffect } from 'react';
import UploadZone from '../components/media/UploadZone';
import MediaGrid from '../components/media/MediaGrid';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';
import AssignContentModal from '../components/devices/AssignContentModal';

const Media = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const { user } = useAuth();

    const { data: items, loading } = useSupabaseRealtime({
        table: 'media',
        filter: user ? `uploaded_by=eq.${user.id}` : null,
        orderBy: { column: 'created_at', ascending: false }
    });

    const handleUpload = (newItem) => {
        // Real-time listener handles the update
        console.log("Uploaded:", newItem);
    };

    const handleDelete = async (item) => {
        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
            try {
                // 1. Delete from Supabase Storage
                if (item.storage_path) {
                    const { error: storageError } = await supabase.storage
                        .from('Singnage OS')
                        .remove([item.storage_path]);

                    if (storageError) {
                        console.error("Failed to delete from storage:", storageError);
                    }
                }

                // 2. Delete from Database
                const { error: dbError } = await supabase
                    .from('media')
                    .delete()
                    .eq('id', item.id);

                if (dbError) throw dbError;

            } catch (err) {
                console.error(err);
                alert("Failed to delete: " + err.message);
            }
        }
    };

    const filteredItems = activeTab === 'all'
        ? items
        : items.filter(item => item.type === activeTab);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Media Library</h2>
                <p className="text-zinc-400">Upload images and videos for your signage content.</p>
            </div>

            <UploadZone onUploadComplete={handleUpload} />

            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-1">
                    {['all', 'image', 'video'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab
                                ? 'text-white border-b-2 border-blue-500'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}s
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-zinc-500">Loading media...</div>
                ) : (
                    <MediaGrid
                        items={filteredItems}
                        onDelete={handleDelete}
                        onAssign={(item) => setSelectedItem(item)}
                    />
                )}
            </div>

            <AssignContentModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                contentItem={selectedItem}
                contentType="media"
            />
        </div >
    );
};

export default Media;
