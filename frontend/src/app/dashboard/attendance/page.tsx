'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { employeeApi } from '@/lib/api/employee';
import { AttendanceRecord } from '@/types/attendance';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

export default function AttendancePage() {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
    const [summary, setSummary] = useState<any>(null);

    const fetchTodayAttendance = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await employeeApi.getAttendanceHistory({
                start_date: today,
                end_date: today,
            });

            if (response.records && response.records.length > 0) {
                setTodayRecord(response.records[0]);
            }

            const summaryData = await employeeApi.getAttendanceSummary();
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to fetch attendance', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayAttendance();
    }, []);

    const handleCheckIn = async () => {
        try {
            const record = await employeeApi.checkIn();
            setTodayRecord(record);
            enqueueSnackbar('Checked in successfully!', { variant: 'success' });
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Failed to check in',
                { variant: 'error' }
            );
        }
    };

    const handleCheckOut = async () => {
        try {
            const record = await employeeApi.checkOut();
            setTodayRecord(record);
            enqueueSnackbar('Checked out successfully!', { variant: 'success' });
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Failed to check out',
                { variant: 'error' }
            );
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Attendance
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 1 }}>
                {/* Today's Attendance */}
                <Box>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Today's Attendance
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {format(new Date(), 'EEEE, MMMM dd, yyyy')}
                            </Typography>

                            {todayRecord ? (
                                <Box sx={{ mt: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Check-in Time
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {todayRecord.check_in_time
                                                ? format(new Date(todayRecord.check_in_time), 'hh:mm a')
                                                : '-'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Check-out Time
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {todayRecord.check_out_time
                                                ? format(new Date(todayRecord.check_out_time), 'hh:mm a')
                                                : '-'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Work Hours
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {todayRecord.work_hours ? `${todayRecord.work_hours} hrs` : '-'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Chip
                                            label={todayRecord.status.toUpperCase()}
                                            color={todayRecord.status === 'present' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        {!todayRecord.check_in_time && (
                                            <Button
                                                variant="contained"
                                                startIcon={<CheckCircleIcon />}
                                                onClick={handleCheckIn}
                                                fullWidth
                                            >
                                                Check In
                                            </Button>
                                        )}
                                        {todayRecord.check_in_time && !todayRecord.check_out_time && (
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                startIcon={<LogoutIcon />}
                                                onClick={handleCheckOut}
                                                fullWidth
                                            >
                                                Check Out
                                            </Button>
                                        )}
                                        {todayRecord.check_out_time && (
                                            <Alert severity="success" sx={{ width: '100%' }}>
                                                You have completed your attendance for today!
                                            </Alert>
                                        )}
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ mt: 3 }}>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        You haven't checked in yet today
                                    </Alert>
                                    <Button
                                        variant="contained"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={handleCheckIn}
                                        fullWidth
                                    >
                                        Check In
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>

                {/* Monthly Summary */}
                <Box>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                This Month's Summary
                            </Typography>
                            {summary && (
                                <Box sx={{ mt: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Days
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {summary.total_days}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="success.main">
                                            Present
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium" color="success.main">
                                            {summary.present}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="error.main">
                                            Absent
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium" color="error.main">
                                            {summary.absent}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="warning.main">
                                            Half Day
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium" color="warning.main">
                                            {summary.half_day}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            On Leave
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {summary.on_leave}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                        <Typography variant="body1" fontWeight="medium">
                                            Total Work Hours
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            {summary.total_work_hours.toFixed(1)} hrs
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
}
