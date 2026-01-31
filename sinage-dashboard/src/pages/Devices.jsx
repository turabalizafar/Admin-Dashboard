import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';
import DeviceCard from '../components/devices/DeviceCard';
import ClaimDeviceModal from '../components/devices/ClaimDeviceModal';

const Devices = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();

    const { data: devices, loading } = useSupabaseRealtime({
        table: 'devices',
        filter: user ? `assigned_user_id=eq.${user.id}` : null,
        orderBy: { column: 'created_at', ascending: false }
    });

    const handleDelete = async (device) => {
        const confirmMsg = `Are you sure you want to delete "${device.name}"? This will unregister the device and clear all its data. The TV app will need to be re-paired.`;

        if (confirm(confirmMsg)) {
            try {
                const { error } = await supabase
                    .from('devices')
                    .delete()
                    .eq('id', device.id);

                if (error) throw error;
            } catch (error) {
                console.error(error);
                alert("Failed to delete screen: " + error.message);
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Screens</h2>
                    <p className="text-zinc-400">Manage your paired digital signage screens.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Claim Device
                </Button>
            </div>

            {loading ? (
                <div className="text-zinc-500">Loading screens...</div>
            ) : devices.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                    <h3 className="text-lg font-medium">No screens found</h3>
                    <p className="text-zinc-500 mb-4">You haven't paired any devices yet.</p>
                    <Button onClick={() => setIsModalOpen(true)}>
                        Pair Your First Screen
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {devices.map((device) => (
                        <DeviceCard key={device.id} device={device} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            <ClaimDeviceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDeviceClaimed={() => {
                    // Success handled by live listener
                }}
            />
        </div>
    );
};

export default Devices;
