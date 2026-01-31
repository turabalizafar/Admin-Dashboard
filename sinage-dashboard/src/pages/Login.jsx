import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Failed to sign in. Check your email/password.');
            console.error(err);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-zinc-800">
                <CardHeader className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-blue-500">SignageOS</h1>
                    <CardTitle>Admin Access</CardTitle>
                    <p className="text-sm text-zinc-500">Enter your credentials to manage your screens</p>
                </CardHeader>
                <CardContent className="pt-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-11 rounded-lg bg-zinc-900 border border-zinc-700 px-3 text-white focus:border-blue-500 focus:outline-none transition-colors placeholder:text-zinc-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full h-11 rounded-lg bg-zinc-900 border border-zinc-700 px-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <Button disabled={loading} className="w-full">
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
