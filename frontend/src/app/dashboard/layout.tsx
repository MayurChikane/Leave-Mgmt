'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useAuth } from '@/lib/auth/auth-context';
import Sidebar, { SIDEBAR_WIDTH } from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, loading, router]);

    if (loading || !isAuthenticated) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Sidebar />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3, md: 4 },
                    ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
                    mt: isMobile ? 7 : 0,
                    width: isMobile ? '100%' : `calc(100% - ${SIDEBAR_WIDTH}px)`,
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
