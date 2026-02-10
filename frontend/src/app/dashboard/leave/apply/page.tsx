'use client';

import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    MenuItem,
    Alert,
    CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useRouter } from 'next/navigation';
import { employeeApi } from '@/lib/api/employee';
import { useSnackbar } from 'notistack';

const leaveTypes = [
    { id: '1', name: 'Planned Leave', code: 'PLANNED' },
    { id: '2', name: 'Emergency Leave', code: 'EMERGENCY' },
];

export default function ApplyLeavePage() {
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: null as Date | null,
        end_date: null as Date | null,
        reason: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.leave_type_id || !formData.start_date || !formData.end_date || !formData.reason) {
            enqueueSnackbar('Please fill all required fields', { variant: 'error' });
            return;
        }

        if (formData.start_date > formData.end_date) {
            enqueueSnackbar('End date must be after start date', { variant: 'error' });
            return;
        }

        setLoading(true);
        try {
            await employeeApi.applyLeave({
                leave_type_id: formData.leave_type_id,
                start_date: formData.start_date.toISOString().split('T')[0],
                end_date: formData.end_date.toISOString().split('T')[0],
                reason: formData.reason,
            });

            enqueueSnackbar('Leave application submitted successfully!', { variant: 'success' });
            router.push('/dashboard/leave/history');
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Failed to submit leave application',
                { variant: 'error' }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Apply for Leave
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Submit a new leave request
            </Typography>

            <Card sx={{ maxWidth: 800, mt: 3 }}>
                <CardContent sx={{ p: 4 }}>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <TextField
                                    select
                                    fullWidth
                                    label="Leave Type"
                                    value={formData.leave_type_id}
                                    onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                                    required
                                >
                                    {leaveTypes.map((type) => (
                                        <MenuItem key={type.id} value={type.id}>
                                            {type.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                                <Box>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="Start Date"
                                            value={formData.start_date}
                                            onChange={(date) => setFormData({ ...formData, start_date: date })}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    required: true,
                                                },
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Box>

                                <Box>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="End Date"
                                            value={formData.end_date}
                                            onChange={(date) => setFormData({ ...formData, end_date: date })}
                                            minDate={formData.start_date || undefined}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    required: true,
                                                },
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Box>
                            </Box>

                            <Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Reason"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                    placeholder="Please provide a reason for your leave request..."
                                />
                            </Box>

                            <Box>
                                <Alert severity="info">
                                    Your leave request will be sent to your manager for approval. You will be notified
                                    once it's processed.
                                </Alert>
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} /> : null}
                                    >
                                        {loading ? 'Submitting...' : 'Submit Leave Request'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => router.push('/dashboard')}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
}
