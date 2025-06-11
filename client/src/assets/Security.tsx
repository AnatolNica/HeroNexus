import { useState, useEffect } from 'react';
import {
  Box, Button, Chip, Divider, Grid, Paper, Typography,
  TextField, InputAdornment, IconButton, Alert,
  Snackbar
} from '@mui/material';
import { 
  VpnKey, Security, LockClock, Email, Phone, 
  Visibility, VisibilityOff, CheckCircle,
  Edit
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const SecurityPage = ({ 
  email: propEmail, 
  phoneNumber: propPhoneNumber, 
  twoFactorEnabled: propTwoFactorEnabled,
  onUpdateUserData 
}) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailData, setEmailData] = useState({
    newEmail: propEmail,
    currentPassword: ''
  });
  const [errors, setErrors] = useState({
    password: '',
    email: ''
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [localState, setLocalState] = useState({
    email: propEmail,
    phoneNumber: propPhoneNumber,
    twoFactorEnabled: propTwoFactorEnabled
  });

  useEffect(() => {
    setLocalState({
      email: propEmail,
      phoneNumber: propPhoneNumber,
      twoFactorEnabled: propTwoFactorEnabled
    });
  }, [propEmail, propPhoneNumber, propTwoFactorEnabled]);

  const handlePasswordChange = async () => {
    setErrors({ ...errors, password: '' });
    if (passwordData.newPassword.length < 6) {
      setErrors({ ...errors, password: 'The password must be at least 6 characters long' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ ...errors, password: 'Passwords do not match' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        '/api/auth/update-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleSuccess('Password successfully updated!');
    } catch (error) {
      handleError(error, 'password');
    }
  };

  const handleEmailChange = async () => {
    setErrors({ ...errors, email: '' });
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(emailData.newEmail)) {
      setErrors({ ...errors, email: 'Invalid email!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        '/api/auth/update-email',
        {
          newEmail: emailData.newEmail,
          currentPassword: emailData.currentPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedData = {
        email: response.data.email,
        ...(response.data.token && { token: response.data.token })
      };
      setLocalState(prev => ({ ...prev, email: response.data.email }));
      if (onUpdateUserData) {
        onUpdateUserData(updatedData);
      }
      handleSuccess('Email successfully updated!');
    } catch (error) {
      handleError(error, 'email');
    }
  };

  const handleSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setEmailData({ newEmail: localState.email, currentPassword: '' });
    setShowPasswordForm(false);
    setShowEmailForm(false);
  };

  const handleError = (error, type) => {
    const message = error.response?.data?.message || `Error changing ${type === 'password' ? 'password' : 'email'}`;
    setErrors({ ...errors, [type]: message });
  };

  const formatPhoneNumber = (number) => {
    if (!number) return 'Unspecified';
    const cleaned = number.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `+1 ${match[1]}-${match[2]}-${match[3]}` : number;
  };

  return (
    <Paper sx={{ 
      bgcolor: '#262626', 
      borderRadius: 4, 
      p: 4,
      maxWidth: 400, 
      width: '100%',
      mx: 'auto'
    }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          sx={{ 
            bgcolor: snackbar.severity === 'error' ? '#2d0000' : '#002d00',
            color: snackbar.severity === 'error' ? '#ff4444' : '#44ff44',
            '& .MuiAlert-icon': { color: snackbar.severity === 'error' ? '#ff4444' : '#44ff44' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Typography variant="h5" sx={{ 
        color: 'white', 
        mb: 4, 
        fontWeight: 700, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2 
      }}>
        <Security sx={{ color: '#00b3ff', fontSize: 32 }} />
        Security
      </Typography>
      <DetailItem>
        <SectionHeader variant="h6">
          <Email fontSize="small" />
          Email Address
        </SectionHeader>
        <Grid container spacing={4} alignItems="center">
          <Grid>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={localState.email}
                sx={{ 
                  bgcolor: '#00b3ff20', 
                  color: '#00b3ff',
                  maxWidth: 300,
                  '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' }
                }} 
              />
            </Box>
          </Grid>
          <Grid>
            <AuthButton 
              variant="outlined"
              fullWidth 
              onClick={() => setShowEmailForm(!showEmailForm)}
              sx={{ borderColor: '#404040', color: 'white', '&:hover': { borderColor: '#666' } }}
            >
              <Edit sx={{ mr: 1, fontSize: 20 }} /> {showEmailForm ? "Hide" : "Change Email"}
            </AuthButton>
          </Grid>
        </Grid>

        {showEmailForm && (
          <Box sx={{ mt: 3 }}>
            {errors.email && <Alert severity="error" sx={{ mb: 2 }}>{errors.email}</Alert>}
            <TextField
              fullWidth
              label="New Email Address"
              value={emailData.newEmail}
              onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Current Password"
              type={showPassword.current ? 'text' : 'password'}
              value={emailData.currentPassword}
              onChange={(e) => setEmailData({ ...emailData, currentPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))}>
                      {showPassword.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />
            <Button 
              onClick={handleEmailChange} 
              sx={{ bgcolor: '#00b3ff', '&:hover': { bgcolor: '#0099cc' }, py: 1.5 }}
              variant="contained"
              fullWidth
            >
              Save
            </Button>
          </Box>
        )}
      </DetailItem>

      <Divider sx={{ borderColor: '#333', my: 4 }} />
      <DetailItem>
        <SectionHeader variant="h6">
          <VpnKey fontSize="small" />
          Password
        </SectionHeader>
        <Grid container spacing={4} alignItems="center">
          <Grid>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label="Recently updated" 
                color="success" 
                icon={<CheckCircle />} 
                sx={{ fontWeight: 500 }} 
              />
            </Box>
          </Grid>
          <Grid>
            <AuthButton 
              fullWidth 
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              variant="contained"
              sx={{ bgcolor: '#00b3ff', '&:hover': { bgcolor: '#0099cc' }, py: 1.5 }}
            >
              {showPasswordForm ? "Hide" : "Change Password"}
            </AuthButton>
          </Grid>
        </Grid>

        {showPasswordForm && (
          <Box sx={{ mt: 3 }}>
            {errors.password && <Alert severity="error" sx={{ mb: 2 }}>{errors.password}</Alert>}
            <TextField
              fullWidth
              label="Current Password"
              type={showPassword.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))}>
                      {showPassword.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="New Password"
              type={showPassword.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))}>
                      {showPassword.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPassword.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))}>
                      {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />
            <Button 
              onClick={handlePasswordChange} 
              sx={{ bgcolor: '#00b3ff', '&:hover': { bgcolor: '#0099cc' }, py: 1.5 }}
              variant="contained"
              fullWidth
            >
              Save
            </Button>
          </Box>
        )}
      </DetailItem>

      <Divider sx={{ borderColor: '#333', my: 4 }} />
      <DetailItem>
        <SectionHeader variant="h6">
          <LockClock fontSize="small" />
          Two-Factor Authentication (2FA)
        </SectionHeader>
        <Grid container spacing={4} alignItems="center">
          <Grid>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<Email />}
                label="Verificare prin Email"
                color={localState.twoFactorEnabled ? 'success' : 'default'}
                sx={{ 
                  bgcolor: localState.twoFactorEnabled ? '#00b3ff40' : '#ffffff10',
                  color: localState.twoFactorEnabled ? '#00b3ff' : 'white'
                }}
              />
              <Chip
                icon={<Phone />}
                label="Verificare prin SMS"
                color={localState.phoneNumber && localState.twoFactorEnabled ? 'success' : 'default'}
                sx={{ 
                  bgcolor: localState.phoneNumber && localState.twoFactorEnabled ? '#00b3ff40' : '#ffffff10',
                  color: localState.phoneNumber && localState.twoFactorEnabled ? '#00b3ff' : 'white'
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
              {localState.twoFactorEnabled ? (
                localState.phoneNumber ? 
                  `Active verification via: ${formatPhoneNumber(localState.phoneNumber)}` : 
                  'Active verification via email'
              ) : 'Two-factor authentication is disabled'}
            </Typography>
          </Grid>
        </Grid>
      </DetailItem>
    </Paper>
  );
};

const SectionHeader = styled(Typography)(({ theme }) => ({
  color: '#00b3ff',
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontSize: '1.1rem'
}));

const DetailItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  maxWidth: 500, 
  width: '100%',
  '& .MuiTypography-caption': {
    color: '#999',
    display: 'block',
    marginBottom: theme.spacing(0.5),
    fontSize: '0.85rem'
  },
  '& .MuiTypography-body1': {
    color: '#fff',
    fontSize: '1rem'
  }
}));

const AuthButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  padding: theme.spacing(1.5, 3),
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  fontSize: '0.95rem',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 2px 8px rgba(0, 179, 255, 0.3)'
  }
}));

export default SecurityPage;