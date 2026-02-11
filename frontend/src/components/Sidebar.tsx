'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    IconButton,
    Divider,
    Avatar,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HistoryIcon from '@mui/icons-material/History';
import ApprovalIcon from '@mui/icons-material/Approval';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/lib/auth/auth-context';

const SIDEBAR_WIDTH = 260;

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    roles?: string[];
}

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Apply Leave', path: '/dashboard/leave/apply', icon: <AddCircleIcon /> },
    { label: 'Leave History', path: '/dashboard/leave/history', icon: <HistoryIcon /> },
    { label: 'Approvals', path: '/dashboard/manager/approvals', icon: <ApprovalIcon />, roles: ['manager', 'admin'] },
    { label: 'Team', path: '/dashboard/manager/team', icon: <PeopleIcon />, roles: ['manager', 'admin'] },
    { label: 'User Management', path: '/dashboard/admin', icon: <AdminPanelSettingsIcon />, roles: ['admin'] },
    { label: 'Holidays', path: '/dashboard/holidays', icon: <EventIcon /> },
    { label: 'Attendance', path: '/dashboard/attendance', icon: <AccessTimeIcon /> },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNavigation = (path: string) => {
        router.push(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true;
        return user?.role && item.roles.includes(user.role);
    });

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#1a1a1a',
                color: '#ffffff',
            }}
        >
            {/* Logo/Brand Section */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#00897b' }}>
                        LMS
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                        Leave Management
                    </Typography>
                </Box>
                {isMobile && (
                    <IconButton onClick={handleDrawerToggle} sx={{ color: '#fff' }}>
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            <Divider sx={{ borderColor: '#333' }} />

            {/* Navigation Menu */}
            <List sx={{ flex: 1, px: 2, py: 2 }}>
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => handleNavigation(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    color: isActive ? '#fff' : '#999',
                                    bgcolor: isActive ? '#00897b' : 'transparent',
                                    '&:hover': {
                                        bgcolor: isActive ? '#00796b' : '#2a2a2a',
                                        color: '#fff',
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: '0.9rem',
                                        fontWeight: isActive ? 600 : 400,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider sx={{ borderColor: '#333' }} />

            {/* User Profile Section */}
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, px: 1 }}>
                    <Avatar sx={{ bgcolor: '#00897b', width: 36, height: 36, mr: 1.5 }}>
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                            {user?.first_name} {user?.last_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#999' }} noWrap>
                            {user?.role}
                        </Typography>
                    </Box>
                </Box>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 2,
                        color: '#999',
                        '&:hover': {
                            bgcolor: '#2a2a2a',
                            color: '#fff',
                        },
                    }}
                >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            {isMobile && (
                <IconButton
                    onClick={handleDrawerToggle}
                    sx={{
                        position: 'fixed',
                        top: 16,
                        left: 16,
                        zIndex: 1200,
                        bgcolor: '#1a1a1a',
                        color: '#fff',
                        '&:hover': { bgcolor: '#2a2a2a' },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            )}

            {/* Desktop Drawer */}
            {!isMobile && (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: SIDEBAR_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: SIDEBAR_WIDTH,
                            boxSizing: 'border-box',
                            border: 'none',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Mobile Drawer */}
            {isMobile && (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: SIDEBAR_WIDTH,
                            boxSizing: 'border-box',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}
        </>
    );
}

export { SIDEBAR_WIDTH };
