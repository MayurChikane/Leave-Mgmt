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
    Chip,
} from '@mui/material';
import { managerApi } from '@/lib/api/manager';
import { User } from '@/types/user';
import { useSnackbar } from 'notistack';

export default function ManagerTeamPage() {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const response = await managerApi.getTeam();
            setTeamMembers(response.team_members);
        } catch (error) {
            enqueueSnackbar('Failed to fetch team members', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                My Team
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                View and manage your team members
            </Typography>

            <Card sx={{ mt: 3 }}>
                <CardContent>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : teamMembers.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No team members found
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Joined</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {teamMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {member.full_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{member.email}</TableCell>
                                            <TableCell>
                                                <Chip label={member.role.toUpperCase()} size="small" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={member.is_active ? 'Active' : 'Inactive'}
                                                    color={member.is_active ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(member.created_at).toLocaleDateString()}
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
