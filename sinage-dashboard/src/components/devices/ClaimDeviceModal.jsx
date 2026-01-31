import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Loader2 } from 'lucide-react';

const ClaimDeviceModal = ({ isOpen, onClose, onDeviceClaimed }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();

    if (!isOpen) return null;

    const handleClaim = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Find device with this pairing code
            const { data: devices, error: fetchError } = await supabase
                .from('devices')
                .select('*')
                .eq('pairing_code', code.trim().toUpperCase());

            if (fetchError) throw fetchError;

            if (!devices || devices.length === 0) {
                throw new Error("Invalid pairing code. Please check the TV screen.");
            }

            const device = devices[0];

            // 2. Check if already claimed
            if (device.assigned_user_id) {
                throw new Error("This device is already claimed by another user.");
            }

            // 3. Update device with current user ID
            const { error: updateError } = await supabase
                .from('devices')
                .update({
                    assigned_user_id: user.id,
                    name: `Display ${code.trim().toUpperCase()}` // Default name
                })
                .eq('id', device.id);

            if (updateError) throw updateError;

            setCode('');
            onDeviceClaimed();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-md relative bg-zinc-900 border-zinc-700">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <CardHeader>
                    <CardTitle className="text-2xl">Claim New Device</CardTitle>
                    <p className="text-zinc-400 text-sm">Enter the 6-character code displayed on your TV.</p>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleClaim} className="space-y-4">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="e.g. X7Y2Z9"
                            maxLength={6}
                            className="w-full text-center text-3xl tracking-[1em] font-mono h-16 rounded-xl bg-black border border-zinc-700 focus:border-blue-500 focus:outline-none transition-colors uppercase placeholder:tracking-normal placeholder:text-zinc-700"
                            autoFocus
                        />

                        <Button disabled={loading || code.length < 6} className="w-full h-12 text-lg">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : 'Connect Device'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ClaimDeviceModal;
