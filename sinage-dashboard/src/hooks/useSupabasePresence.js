import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to track online devices using Supabase Presence.
 * Returns an array of device IDs that are currently connected.
 */
export const useSupabasePresence = () => {
    const [onlineDeviceIds, setOnlineDeviceIds] = useState(new Set());

    useEffect(() => {
        const channel = supabase.channel('device-status', {
            config: {
                presence: {
                    key: 'online',
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const ids = new Set();

                // newState structure: { online: [ { deviceId: '...' }, { deviceId: '...' } ] }
                Object.values(newState).forEach(presences => {
                    presences.forEach(p => {
                        if (p.deviceId) ids.add(p.deviceId);
                    });
                });

                console.log('[Presence] Online devices:', Array.from(ids));
                setOnlineDeviceIds(ids);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('[Presence] Join:', newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('[Presence] Leave:', leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Presence] Subscribed to device-status');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return onlineDeviceIds;
};
