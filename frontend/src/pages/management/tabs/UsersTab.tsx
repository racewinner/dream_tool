import React, { useState, useContext, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  CircularProgress,
  Alert,
  Tooltip,
  Chip,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Refresh as RefreshIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { ManagementContext } from '../ManagementLanding';
import userService, { User } from '../../../services/userService';
import { ROLE_LABELS, UserRole } from '../../../types/auth';

// Helper function to check if a role is a valid UserRole
const isValidUserRole = (role: string): role is UserRole => {
  return ['admin', 'technical_expert', 'technical_junior', 'non_technical'].includes(role);
};

export const UsersTab = () => {
  const { refreshData, isRefreshing } = useContext(ManagementContext);
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Fetch users data
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // In development, use mock data
      // In production, uncomment the following code:
      /*
      if (token) {
        const fetchedUsers = await userService.getUsers(token);
        setUsers(fetchedUsers);
      } else {
        throw new Error('Authentication token is missing');
      }
      */
      
      // For now, use mock data
      const mockUsers = userService.getMockUsers();
      setUsers(mockUsers);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle user deletion
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    try {
      // In production, uncomment the following code:
      /*
      if (token) {
        await userService.deleteUser(token, userToDelete.id);
      } else {
        throw new Error('Authentication token is missing');
      }
      */
      
      // For now, just simulate deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      setError(`Failed to delete user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Connect to the ManagementContext refresh
  useEffect(() => {
    if (isRefreshing) {
      fetchUsers();
    }
  }, [isRefreshing, token]);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, [token]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading users: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">User Management</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchUsers} 
            disabled={loading} 
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Add User
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="user table">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow hover key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: user.status === 'Active' ? 'primary.main' : 'text.disabled',
                            mr: 1
                          }}
                        >
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={isValidUserRole(user.role) ? ROLE_LABELS[user.role] : user.role} 
                        size="small" 
                        color={user.role === 'admin' ? 'primary' : 'default'} 
                        variant={user.role === 'admin' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {user.status === 'Active' ? (
                          <Tooltip title="Active">
                            <ActiveIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Inactive">
                            <InactiveIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                          </Tooltip>
                        )}
                        {user.status}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {user.isVerified ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<EditIcon />} sx={{ mr: 1 }}>
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteClick(user)}
                        disabled={user.role === 'admin'} // Prevent deleting admin users
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user {userToDelete?.firstName} {userToDelete?.lastName} ({userToDelete?.email})? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersTab;
