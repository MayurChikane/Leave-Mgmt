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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Pagination,
    CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { employeeApi } from '@/lib/api/employee';
import { LeaveRequest } from '@/types/leave';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

export default function LeaveHistoryPage() {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        status: '',
        year: new Date().getFullYear(),
    });
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const fetchLeaveHistory = async () => {
        setLoading(true);
        try {
            const response = await employeeApi.getLeaveHistory({
                status: filters.status || undefined,
                year: filters.year,
                page,
                per_page: 10,
            });
            setRequests(response.requests);
            setTotal(response.total);
        } catch (error) {
            enqueueSnackbar('Failed to fetch leave history', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveHistory();
    }, [page, filters]);

    const handleCancelLeave = async (leaveId: string) => {
        if (!confirm('Are you sure you want to cancel this leave request?')) return;

        try {
            await employeeApi.cancelLeave(leaveId);
            enqueueSnackbar('Leave request cancelled successfully', { variant: 'success' });
            fetchLeaveHistory();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Failed to cancel leave request',
                { variant: 'error' }
            );
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'default';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Leave History
            </Typography>

            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField
                            select
                            label="Status"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Year"
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
                            sx={{ minWidth: 120 }}
                        >
                            {[2024, 2025, 2026].map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Leave Type</TableCell>
                                            <TableCell>Start Date</TableCell>
                                            <TableCell>End Date</TableCell>
                                            <TableCell>Days</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Applied On</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {requests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell>{request.leave_type.name}</TableCell>
                                                <TableCell>{format(new Date(request.start_date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell>{format(new Date(request.end_date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell>{request.total_days}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={request.status.toUpperCase()}
                                                        color={getStatusColor(request.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>{format(new Date(request.created_at), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setDetailsOpen(true);
                                                        }}
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                    {request.status === 'pending' && (
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleCancelLeave(request.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {total > 10 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Pagination
                                        count={Math.ceil(total / 10)}
                                        page={page}
                                        onChange={(_, value) => setPage(value)}
                                        color="primary"
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Leave Request Details</DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Leave Type
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {selectedRequest.leave_type.name}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Duration
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {format(new Date(selectedRequest.start_date), 'MMM dd, yyyy')} -{' '}
                                {format(new Date(selectedRequest.end_date), 'MMM dd, yyyy')} ({selectedRequest.total_days} days)
                            </Typography>

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Reason
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {selectedRequest.reason}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Status
                            </Typography>
                            <Chip
                                label={selectedRequest.status.toUpperCase()}
                                color={getStatusColor(selectedRequest.status)}
                                sx={{ mb: 2 }}
                            />

                            {selectedRequest.rejection_reason && (
                                <>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Rejection Reason
                                    </Typography>
                                    <Typography variant="body1" color="error">
                                        {selectedRequest.rejection_reason}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
