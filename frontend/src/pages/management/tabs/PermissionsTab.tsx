import React, { useState } from 'react';
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
  Checkbox,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const permissionsData = [
  { 
    resource: 'Users', 
    actions: [
      { name: 'users:read', description: 'View users', roles: ['admin', 'manager'] },
      { name: 'users:create', description: 'Create new users', roles: ['admin'] },
      { name: 'users:edit', description: 'Edit users', roles: ['admin'] },
      { name: 'users:delete', description: 'Delete users', roles: ['admin'] },
    ]
  },
  { 
    resource: 'Roles', 
    actions: [
      { name: 'roles:read', description: 'View roles', roles: ['admin', 'manager'] },
      { name: 'roles:manage', description: 'Manage roles and permissions', roles: ['admin'] },
    ]
  },
  { 
    resource: 'Dashboard', 
    actions: [
      { name: 'dashboard:view', description: 'View dashboard', roles: ['admin', 'manager', 'user'] },
    ]
  },
  { 
    resource: 'Reports', 
    actions: [
      { name: 'reports:view', description: 'View reports', roles: ['admin', 'manager', 'user'] },
      { name: 'reports:generate', description: 'Generate reports', roles: ['admin', 'manager'] },
    ]
  },
  { 
    resource: 'System', 
    actions: [
      { name: 'system:settings', description: 'Modify system settings', roles: ['admin'] },
      { name: 'system:maintenance', description: 'Perform maintenance', roles: ['admin'] },
    ]
  },
];

export const PermissionsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['admin', 'manager']);
  const availableRoles = ['admin', 'manager', 'user'];

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const filteredPermissions = permissionsData.map(section => ({
    ...section,
    actions: section.actions.filter(action => 
      action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.actions.length > 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Permission Management</Typography>
        <Box>
          <Button startIcon={<RefreshIcon />} sx={{ mr: 1 }}>
            Refresh
          </Button>
          <Button variant="contained">
            Save Changes
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <TextField
            placeholder="Search permissions..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400, mr: 2 }}
          />
          <Tooltip title="Filter roles">
            <IconButton>
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {availableRoles.map(role => (
            <Chip
              key={role}
              label={role.charAt(0).toUpperCase() + role.slice(1)}
              onClick={() => toggleRole(role)}
              color={selectedRoles.includes(role) ? 'primary' : 'default'}
              variant={selectedRoles.includes(role) ? 'filled' : 'outlined'}
              icon={selectedRoles.includes(role) ? <CheckIcon fontSize="small" /> : undefined}
            />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Resource</TableCell>
                <TableCell>Permission</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Role Access</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPermissions.map((section, sectionIndex) => (
                <React.Fragment key={sectionIndex}>
                  {section.actions.map((action, actionIndex) => (
                    <TableRow 
                      key={`${sectionIndex}-${actionIndex}`}
                      hover
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>{actionIndex === 0 ? section.resource : ''}</TableCell>
                      <TableCell>
                        <code>{action.name}</code>
                      </TableCell>
                      <TableCell>{action.description}</TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          {availableRoles.map(role => (
                            <Tooltip key={role} title={`${action.roles.includes(role) ? 'Remove from' : 'Add to'} ${role}`}>
                              <Checkbox 
                                checked={action.roles.includes(role)} 
                                size="small"
                                color="primary"
                                icon={<CloseIcon fontSize="small" />}
                                checkedIcon={<CheckIcon fontSize="small" />}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default PermissionsTab;
