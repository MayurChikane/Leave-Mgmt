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
    CircularProgress,
} from '@mui/material';
import { adminApi } from '@/lib/api/admin';
import { Holiday } from '@/types/holiday';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

export default function HolidaysPage() {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [holidays, setHolidays] = useState<Holiday[]>([]);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const response = await adminApi.getHolidays(new Date().getFullYear());
            setHolidays(response.holidays);
        } catch (error) {
            enqueueSnackbar('Failed to fetch holidays', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Holidays
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                View holidays for your location
            </Typography>

            <Card sx={{ mt: 3 }}>
                <CardContent>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : holidays.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No holidays found
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Holiday Name</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Day</TableCell>
                                        <TableCell>Description</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {holidays.map((holiday) => (
                                        <TableRow key={holiday.id}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {holiday.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{format(new Date(holiday.date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{format(new Date(holiday.date), 'EEEE')}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {holiday.description || '-'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
