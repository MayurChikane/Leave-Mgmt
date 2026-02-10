'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '@/lib/auth/auth-context';
import { authApi } from '@/lib/api/auth';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const { setAuth } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the authorization code from URL
                const code = searchParams.get('code');

                if (!code) {
                    setError('No authorization code received');
                    return;
                }

                // Exchange code for JWT token
                const redirectUri = `${window.location.origin}/auth/callback`;
                const response = await authApi.exchangeToken(code, redirectUri);

                // Store token and user info via context
                setAuth(response.user, response.token);

                // Redirect to dashboard
                router.push('/dashboard');
            } catch (err: any) {
                console.error('Authentication error:', err);
                setError(err.response?.data?.error || 'Authentication failed');

                // Redirect to home after 3 seconds
                setTimeout(() => {
                    router.push('/');
                }, 3000);
            }
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                gap: 2,
            }}
        >
            {error ? (
                <>
                    <Typography variant="h6" color="error">
                        {error}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Redirecting to login...
                    </Typography>
                </>
            ) : (
                <>
                    <CircularProgress size={60} />
                    <Typography variant="h6" color="text.secondary">
                        Completing authentication...
                    </Typography>
                </>
            )}
        </Box>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    gap: 2,
                }}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    Loading...
                </Typography>
            </Box>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
