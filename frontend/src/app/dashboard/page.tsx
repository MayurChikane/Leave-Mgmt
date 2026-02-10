'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Chip,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import { employeeApi } from '@/lib/api/employee';
import { useAuth } from '@/lib/auth/auth-context';

export default function DashboardOverview() {
    const { user } = useAuth();
    const [leaveBalance, setLeaveBalance] = useState<any>(null);
    const [attendanceSummary, setAttendanceSummary] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const balanceData = await employeeApi.getLeaveBalance();
                setLeaveBalance(balanceData);

                const summaryData = await employeeApi.getAttendanceSummary();
                setAttendanceSummary(summaryData);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            }
        };

        fetchData();
    }, []);

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Welcome, {user?.first_name}!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Here's your overview for today
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3, mt: 2 }}>
                {/* Leave Balance Cards */}
                {leaveBalance?.balances?.map((balance: any) => (
                    <Box key={balance.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <EventNoteIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6">{balance.leave_type.name}</Typography>
                                </Box>
                                <Typography variant="h3" color="primary" gutterBottom>
                                    {balance.available}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    days available
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={(balance.available / balance.total_allocated) * 100}
                                    sx={{ mt: 2, mb: 1 }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Used: {balance.used}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Total: {balance.total_allocated}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                ))}

                {/* Attendance Summary */}
                {attendanceSummary && (
                    <Box>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6">This Month</Typography>
                                </Box>
                                <Typography variant="h3" color="primary" gutterBottom>
                                    {attendanceSummary.present}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    days present
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="caption">Absent:</Typography>
                                        <Chip label={attendanceSummary.absent} size="small" color="error" />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="caption">Half Day:</Typography>
                                        <Chip label={attendanceSummary.half_day} size="small" color="warning" />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption">On Leave:</Typography>
                                        <Chip label={attendanceSummary.on_leave} size="small" />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Role-specific card */}
                {user?.role === 'manager' && (
                    <Box>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <PeopleIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6">Team</Typography>
                                </Box>
                                <Typography variant="body1" color="text.secondary">
                                    Manage your team's leave requests and attendance
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
