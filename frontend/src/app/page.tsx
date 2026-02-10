'use client';

import { useEffect } from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import LoginIcon from '@mui/icons-material/Login';

export default function HomePage() {
  const { isAuthenticated, login, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
            NexusPulse
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
            Leave and Attendance Management System
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Streamline your organization's leave requests and attendance tracking with our
            comprehensive management system.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={login}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              borderRadius: 3,
            }}
          >
            Sign In with Keycloak
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
