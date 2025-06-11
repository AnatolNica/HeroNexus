import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  TextField,
  Select,
  MenuItem,
  Switch,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Typography,
  InputAdornment,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Password as PasswordIcon,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  country: string;
  language: string;
  currency: string;
  phoneNumber: string;
  twoFactorEnabled: boolean;
  blockUntil?: string | Date; 
  avatar?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockDuration, setBlockDuration] = useState(1);
  const [timeUnit, setTimeUnit] = useState<'hours' | 'days' | 'weeks'>('hours');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/users?page=${currentPage}&limit=30&search=${searchTerm}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (!response.ok) throw new Error('Error fetching data');
        const data = await response.json();
        setUsers(data.users.map((u: User) => ({
          ...u,
          blockUntil: u.blockUntil ? new Date(u.blockUntil) : undefined
        })));
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage, searchTerm]);

  const getRemainingTime = (blockUntil?: string | Date) => {
    if (!blockUntil) return 'Active';

    let blockDate: Date;

    if (typeof blockUntil === 'string') {
      blockDate = new Date(blockUntil);
    } else {
      blockDate = blockUntil;
    }

    if (isNaN(blockDate.getTime())) return 'Active';

    const now = new Date();
    const diff = blockDate.getTime() - now.getTime();

    if (diff <= 0) return 'Active';

    const hours = Math.ceil(diff / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);

    return days > 0 ? `${days} days left` : `${hours} hours left`;
  };

  const handleBlockUser = async (duration: number, unit: 'hours' | 'days' | 'weeks') => {
    if (!selectedUser) return;
    try {
      let blockUntil: Date | null = null;
      if (duration > 0) {
        const milliseconds = duration * (
          unit === 'hours' ? 3600000 :
          unit === 'days' ? 86400000 :
          604800000
        );
        blockUntil = new Date(Date.now() + milliseconds);
      }

      const response = await fetch(`/api/admin/users/${selectedUser._id}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ blockUntil })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Operation failed');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u =>
        u._id === selectedUser._id ? {
          ...u,
          blockUntil: updatedUser.blockUntil ? new Date(updatedUser.blockUntil) : undefined
        } : u
      ));
      setShowBlockModal(false);
      setError(blockUntil ? 'User blocked successfully!' : 'User unblocked successfully!');
      setTimeout(() => setError(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handleUserUpdate = async (userId: string, field: string, value: any) => {
    try {
      if (field === 'phoneNumber') {
        value = value.replace(/[^0-9+\s\-()]/g, '');
        if (!/^\+?[0-9\s\-()]{7,}$/.test(value)) {
          throw new Error('Phone number invalid. Example: +40 722 123 456 or 0722-123-456');
        }
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ [field]: value })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u._id === userId ? updatedUser : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handlePasswordReset = async () => {
    try {
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match!');
      if (newPassword.length < 6) throw new Error('Password must be at least 6 characters!');

      const response = await fetch(`/api/admin/users/${selectedUserId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Password reset failed');
      }

      setShowResetPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedUserId(null);
      setError('Password reset successfully!');
      setTimeout(() => setError(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setError(''), 5000);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <Box sx={{  minHeight: '100vh', color: 'white',maxWidth:{xl:1200,lg:900,md:600} }}>
      <Dialog open={showBlockModal} onClose={() => setShowBlockModal(false)} TransitionComponent={Fade}>
  <DialogTitle sx={{ bgcolor: "#1a1a1a", color: 'white' }}>
    {selectedUser?.blockUntil ? 'Unblock User' : 'Block User'}
  </DialogTitle>
  <DialogContent sx={{ bgcolor: "#1a1a1a" }}>
    {!selectedUser?.blockUntil ? (
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
        <TextField
          type="number"
          label="Duration"
          variant="outlined"
          value={blockDuration}
          onChange={(e) => setBlockDuration(Math.max(1, Number(e.target.value)))}
          sx={{ width: 100 }}
          InputLabelProps={{ sx: { color: '#00C8FF' } }}
          InputProps={{
            sx: {
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00C8FF',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00C8FF',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00C8FF',
              },
            },
          }}
        />
        <Select
          value={timeUnit}
          onChange={(e) => setTimeUnit(e.target.value as any)}
          sx={{
            minWidth: 120,
            color: 'white',
            fieldset: { borderColor: '#00C8FF' },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00C8FF',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00C8FF',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00C8FF',
            },
            '& .MuiSvgIcon-root': { color: '#00C8FF' },
          }}
          MenuProps={{
            PaperProps: { sx: { bgcolor: '#1a1a1a' } },
            MenuListProps: { sx: { bgcolor: '#1a1a1a' } }
          }}
        >
          <MenuItem value="hours" sx={{ color: 'white' }}>Hours</MenuItem>
          <MenuItem value="days" sx={{ color: 'white' }}>Days</MenuItem>
          <MenuItem value="weeks" sx={{ color: 'white' }}>Weeks</MenuItem>
        </Select>
      </Box>
    ) : (
      <Typography variant="body1" sx={{ mt: 2, color: 'white' }}>
        Blocked until: {selectedUser.blockUntil ? new Date(selectedUser.blockUntil).toLocaleString() : ''}
      </Typography>
    )}
  </DialogContent>
  <DialogActions sx={{ bgcolor: "#1a1a1a" }}>
    <Button onClick={() => setShowBlockModal(false)} sx={{ color: 'white' }}>
      Cancel
    </Button>
    <Button
      onClick={() => handleBlockUser(selectedUser?.blockUntil ? 0 : blockDuration, timeUnit)}
      color={selectedUser?.blockUntil ? 'success' : 'warning'}
      variant="contained"
      sx={{ bgcolor: '#00C8FF' }}
    >
      {selectedUser?.blockUntil ? 'Unblock' : 'Block'}
    </Button>
  </DialogActions>
</Dialog>
      <Dialog open={showResetPasswordModal} TransitionComponent={Fade}>
  <DialogTitle sx={{ bgcolor: "#1a1a1a", color: 'white' }}>Reset Password</DialogTitle>
  <DialogContent sx={{ bgcolor: "#1a1a1a" }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      <TextField
        type="password"
        label="New Password"
        variant="outlined"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        fullWidth
        InputLabelProps={{ sx: { color: '#00C8FF' } }}
        InputProps={{
          sx: {
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00C8FF',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00C8FF',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00C8FF',
            },
          },
        }}
      />
      <TextField
        type="password"
        label="Confirm Password"
        variant="outlined"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        fullWidth
        InputLabelProps={{ sx: { color: '#00C8FF' } }}
        InputProps={{
          sx: {
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00C8FF',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00C8FF',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00C8FF',
            },
          },
        }}
      />
    </Box>
  </DialogContent>
  <DialogActions sx={{ bgcolor: "#1a1a1a" }}>
    <Button onClick={() => setShowResetPasswordModal(false)} sx={{ color: 'white' }}>
      Cancel
    </Button>
    <Button onClick={handlePasswordReset} color="primary" variant="contained" sx={{ bgcolor: '#00C8FF' }}>
      Save
    </Button>
  </DialogActions>
</Dialog>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          variant="outlined"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#00C8FF' }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 400, input: { color: 'white' }, label: { color: 'white' }, color: '#00C8FF' }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            sx={{ color: '#00C8FF' }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="body1">
            Page {currentPage} of {totalPages}
          </Typography>
          <IconButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            sx={{ color: '#00C8FF' }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, color: 'white', bgcolor: 'rgba(211, 47, 47, 0.9)' }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} sx={{ color: '#00C8FF' }} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto', bgcolor: '#1a1a1a' }}>
          <Table sx={{ minWidth: 1500, color: 'white' }}>
            <TableHead sx={{ backgroundColor: '#00C8FF' }}>
              <TableRow>
                <TableCell sx={{ color: 'white' }}>Avatar</TableCell>
                <TableCell sx={{ color: 'white', width: '150px' }}>Name / Phone</TableCell>
                <TableCell sx={{ color: 'white' }}>Email</TableCell>
                <TableCell sx={{ color: 'white' }}>Role / Country</TableCell>
                <TableCell sx={{ color: 'white' }}>Billing Address</TableCell>
                <TableCell sx={{ color: 'white' }} align="center">2FA</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user._id}
                  hover
                  sx={{
                    '&:nth-of-type(even)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                    transition: 'background-color 0.2s',
                    color: 'white'
                  }}
                >
                  <TableCell>
                    <Avatar
                      src={user.avatar || '/default-avatar.jpg'}
                      sx={{ width: 56, height: 56 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={user.name}
                      onChange={(e) => handleUserUpdate(user._id, 'name', e.target.value)}
                      variant="standard"
                      fullWidth
                      InputProps={{ sx: { color: 'white' } }}
                    />
                    <TextField
                      value={user.phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9+\s\-()]/g, '');
                        handleUserUpdate(user._id, 'phoneNumber', val);
                      }}
                      variant="standard"
                      fullWidth
                      sx={{ mt: 1 }}
                      inputProps={{
                        pattern: "^\+?[0-9\\s\\-()]{7,}$",
                        title: "Example: +40 722 123 456 or 0722-123-456"
                      }}
                      InputProps={{ sx: { color: 'white' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={user.email}
                      onChange={(e) => handleUserUpdate(user._id, 'email', e.target.value)}
                      variant="standard"
                      fullWidth
                      InputProps={{ sx: { color: 'white' } }}
                    />
                  </TableCell>
                  <TableCell>
  <Select
    value={user.role}
    onChange={(e) => handleUserUpdate(user._id, 'role', e.target.value)}
    variant="outlined"
    fullWidth
    sx={{
      color: 'white',
      fieldset: { borderColor: '#00C8FF' },
      height:40,
      '& .MuiSvgIcon-root': { color: '#00C8FF' }
    }}
    MenuProps={{
      PaperProps: { sx: { bgcolor: '#1a1a1a' } },
      MenuListProps: { sx: { bgcolor: '#1a1a1a' } }
    }}
  >
    <MenuItem value="user" sx={{ color: 'white' }}>User</MenuItem>
    <MenuItem value="admin" sx={{ color: 'white' }}>Admin</MenuItem>
  </Select>

  <Select
    value={user.country}
    onChange={(e) => handleUserUpdate(user._id, 'country', e.target.value)}
    variant="outlined"
    fullWidth
    sx={{
      mt: 1,
      color: 'white',
      height:40,
      fieldset: { borderColor: '#00C8FF' },
      '& .MuiSvgIcon-root': { color: '#00C8FF' }
    }}
    MenuProps={{
      PaperProps: { sx: { bgcolor: '#1a1a1a' } },
      MenuListProps: { sx: { bgcolor: '#1a1a1a' } }
    }}
  >
    <MenuItem value="MD" sx={{ color: 'white' }}>Moldova</MenuItem>
    <MenuItem value="RO" sx={{ color: 'white' }}>Romania</MenuItem>
    <MenuItem value="US" sx={{ color: 'white' }}>USA</MenuItem>
  </Select>
</TableCell>

                  <TableCell>
                    {user.billingAddress ? (
                      <Box sx={{ lineHeight: 1.4, color: 'white' }}>
                        <Typography variant="body2"><strong>Street:</strong> {user.billingAddress.street}</Typography>
                        <Typography variant="body2"><strong>City:</strong> {user.billingAddress.city}</Typography>
                        <Typography variant="body2"><strong>ZIP:</strong> {user.billingAddress.zipCode}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="white">Not specified</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={user.twoFactorEnabled}
                      onChange={(e) => handleUserUpdate(user._id, 'twoFactorEnabled', e.target.checked)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getRemainingTime(user.blockUntil)}
                      color={user.blockUntil && new Date(user.blockUntil).getTime() > Date.now() ? 'error' : 'success'}
                      variant="outlined"
                      sx={{
                        borderColor: user.blockUntil ? '#f44336' : '#4caf50',
                        color: user.blockUntil ? 'white' : 'white',
                        bgcolor: user.blockUntil ? '#f4433633' : '#4caf5033'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Reset password">
                        <IconButton
                          onClick={() => {
                            setSelectedUserId(user._id);
                            setShowResetPasswordModal(true);
                          }}
                          color="warning"
                          sx={{ color: '#00C8FF' }}
                        >
                          <PasswordIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.blockUntil ? 'Unblock' : 'Block'}>
                        <IconButton
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBlockModal(true);
                          }}
                          color={user.blockUntil ? 'success' : 'error'}
                          sx={{ color: user.blockUntil ? '#4caf50' : '#f44336' }}
                        >
                          {user.blockUntil ? <LockOpenIcon /> : <LockIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => deleteUser(user._id)}
                          color="error"
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Users;