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
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    IconButton,
    Chip,
    CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import { adminApi } from '@/lib/api/admin';
import { User } from '@/types/user';
import { useSnackbar } from 'notistack';

export default function AdminUsersPage() {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [formData, setFormData] = useState<{
        email: string;
        first_name: string;
        last_name: string;
        role: 'employee' | 'manager' | 'admin';
        location_id: string;
    }>({
        email: '',
        first_name: '',
        last_name: '',
        role: 'employee',
        location_id: '',
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await adminApi.getUsers();
            setUsers(response.users);
        } catch (error) {
            enqueueSnackbar('Failed to fetch users', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async () => {
        try {
            await adminApi.createUser(formData);
            enqueueSnackbar('User created successfully', { variant: 'success' });
            setDialogOpen(false);
            fetchUsers();
            resetForm();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Failed to create user',
                { variant: 'error' }
            );
        }
    };

    const handleDeactivateUser = async (userId: string) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return;

        try {
            await adminApi.deactivateUser(userId);
            enqueueSnackbar('User deactivated successfully', { variant: 'success' });
            fetchUsers();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Failed to deactivate user',
                { variant: 'error' }
            );
        }
    };

    const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            await adminApi.bulkUploadUsers(file);
            enqueueSnackbar('Users uploaded successfully', { variant: 'success' });
            setUploadDialogOpen(false);
            fetchUsers();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Failed to upload users',
                { variant: 'error' }
            );
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            first_name: '',
            last_name: '',
            role: 'employee',
            location_id: '',
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    User Management
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => setUploadDialogOpen(true)}
                    >
                        Bulk Upload
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            resetForm();
                            setDialogOpen(true);
                        }}
                    >
                        Add User
                    </Button>
                </Box>
            </Box>

            <Card>
                <CardContent>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
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
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.full_name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Chip label={user.role.toUpperCase()} size="small" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.is_active ? 'Active' : 'Inactive'}
                                                    color={user.is_active ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" color="error" onClick={() => handleDeactivateUser(user.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New User</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <TextField
                            fullWidth
                            label="First Name"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Last Name"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            required
                        />
                        <TextField
                            select
                            fullWidth
                            label="Role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'employee' | 'manager' | 'admin' })}
                        >
                            <MenuItem value="employee">Employee</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateUser} variant="contained">
                        Create User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Upload Dialog */}
            <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Bulk Upload Users</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Upload a CSV or Excel file with user data
                    </Typography>
                    <Button variant="outlined" component="label" fullWidth>
                        Choose File
                        <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleBulkUpload} />
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
