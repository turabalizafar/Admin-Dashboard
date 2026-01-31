import React, { useState, useRef } from 'react';
import { UploadCloud, FileType, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const UploadZone = ({ onUploadComplete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const { user } = useAuth();

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };
    const handleFiles = async (files) => {
        setUploading(true);

        try {
            const file = files[0];
            const isVideo = file.type.startsWith('video');
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${fileName}`;

            // 1. Upload File to Supabase Storage
            const { data, error } = await supabase.storage
                .from('media')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            // 3. Save Metadata to Supabase Database
            const newDoc = {
                name: file.name,
                type: isVideo ? 'video' : 'image',
                url: publicUrl,
                storage_path: data.path,
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                uploaded_by: user.id
            };

            const { data: dbData, error: dbError } = await supabase
                .from('media')
                .insert([newDoc])
                .select()
                .single();

            if (dbError) throw dbError;

            // 4. Notify Parent
            onUploadComplete(dbData);

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload Failed: " + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div
            className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer",
                isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,video/*"
                onChange={handleChange}
            />

            <div className="flex flex-col items-center gap-4">
                <div className={cn(
                    "p-4 rounded-full transition-colors",
                    uploading ? "bg-blue-500/20 text-blue-400 animate-bounce" : "bg-zinc-800 text-zinc-400"
                )}>
                    <UploadCloud size={32} />
                </div>

                <div className="space-y-1">
                    <h3 className="font-medium text-lg">
                        {uploading ? "Uploading to Cloud..." : "Click or drag files to upload"}
                    </h3>
                    <p className="text-sm text-zinc-500">
                        JPG, PNG, or MP4. (Max 20MB recommended)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UploadZone;
