'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { managerApi } from '@/lib/api/manager';
import { LeaveRequest } from '@/types/leave';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

export default function ManagerApprovalsPage() {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchPendingRequests = async () => {
        setLoading(true);
        try {
            const response = await managerApi.getPendingLeaves();
            setRequests(response.requests);
        } catch (error) {
            enqueueSnackbar('Failed to fetch pending requests', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const handleApprove = async (leaveId: string) => {
        if (!confirm('Are you sure you want to approve this leave request?')) return;

        try {
            await managerApi.approveLeave(leaveId);
            enqueueSnackbar('Leave request approved successfully', { variant: 'success' });
            fetchPendingRequests();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Failed to approve leave request',
                { variant: 'error' }
            );
        }
    };

    const handleRejectClick = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setRejectDialogOpen(true);
    };

    const handleRejectSubmit = async () => {
        if (!selectedRequest || !rejectionReason.trim()) {
            enqueueSnackbar('Please provide a rejection reason', { variant: 'error' });
            return;
        }

        try {
            await managerApi.rejectLeave(selectedRequest.id, rejectionReason);
            enqueueSnackbar('Leave request rejected', { variant: 'success' });
            setRejectDialogOpen(false);
            fetchPendingRequests();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Failed to reject leave request',
                { variant: 'error' }
            );
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Pending Leave Approvals
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Review and approve/reject leave requests from your team
            </Typography>

            <Card sx={{ mt: 3 }}>
                <CardContent>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : requests.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No pending leave requests
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Employee</TableCell>
                                        <TableCell>Leave Type</TableCell>
                                        <TableCell>Start Date</TableCell>
                                        <TableCell>End Date</TableCell>
                                        <TableCell>Days</TableCell>
                                        <TableCell>Reason</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {requests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {request.employee?.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {request.employee?.email}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{request.leave_type.name}</TableCell>
                                            <TableCell>{format(new Date(request.start_date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{format(new Date(request.end_date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{request.total_days}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                                                    {request.reason}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={<CheckCircleIcon />}
                                                        onClick={() => handleApprove(request.id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        startIcon={<CancelIcon />}
                                                        onClick={() => handleRejectClick(request)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Rejection Dialog */}
            <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject Leave Request</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Please provide a reason for rejecting this leave request
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Rejection Reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        sx={{ mt: 2 }}
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRejectSubmit} variant="contained" color="error">
                        Reject Leave
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
