import React from 'react';
import { PlayCircle, Image as ImageIcon, Trash2, Monitor } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

const MediaItem = ({ item, onDelete, onAssign, assignedCount }) => {
    return (
        <Card className="group overflow-hidden border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all">
            <div className="aspect-video relative bg-black/40 flex items-center justify-center overflow-hidden">
                {/* Thumbnail / Preview */}
                {item.type === 'image' ? (
                    <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="relative w-full h-full">
                        <video
                            src={item.url}
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <PlayCircle size={48} className="text-white/80" />
                        </div>
                    </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                        onClick={() => onAssign(item)}
                        className="p-2 bg-blue-500/20 text-blue-500 rounded-full hover:bg-blue-500 hover:text-white transition-colors"
                        title="Assign to Screen"
                    >
                        <Monitor size={20} />
                    </button>
                    <button
                        onClick={() => onDelete(item)}
                        className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                {/* Type Badge */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-medium text-white flex items-center gap-1">
                    {item.type === 'video' ? <PlayCircle size={12} /> : <ImageIcon size={12} />}
                    <span className="capitalize">{item.type}</span>
                </div>

                {/* Assigned Badge */}
                {assignedCount > 0 && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500/80 backdrop-blur-md rounded-md text-xs font-medium text-white flex items-center gap-1">
                        <Monitor size={12} />
                        <span>{assignedCount} screen{assignedCount > 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            <CardContent className="p-4">
                <h3 className="font-medium truncate text-zinc-200" title={item.name}>{item.name}</h3>
                <p className="text-xs text-zinc-500 mt-1 flex justify-between">
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    <span>{item.size || '2 MB'}</span>
                </p>
            </CardContent>
        </Card>
    );
};

const MediaGrid = ({ items, onDelete, onAssign, devices = [] }) => {
    // Get count of screens that have this media assigned
    const getAssignedCount = (mediaId) => {
        return devices.filter(d => d.current_media_id === mediaId).length;
    };

    if (items.length === 0) {
        return (
            <div className="text-center py-10 text-zinc-500">
                No media files uploaded yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
                <MediaItem
                    key={item.id}
                    item={item}
                    onDelete={onDelete}
                    onAssign={onAssign}
                    assignedCount={getAssignedCount(item.id)}
                />
            ))}
        </div>
    );
};

export default MediaGrid;
