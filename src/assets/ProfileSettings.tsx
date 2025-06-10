import { useState } from 'react';
import {
  Box, Button, Typography, TextField, MenuItem, FormControlLabel,
  Switch, Snackbar, Alert, Grid, Divider, Paper, InputAdornment,
} from '@mui/material';
import { 
  AccountCircle, Public, Translate, Security, Star, Cake, Person, Phone,
  Language, AttachMoney, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon,
  MonetizationOn, Diamond
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const SectionHeader = styled(Typography)(({ theme }) => ({
  color: '#00b3ff',
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const DetailItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  maxWidth:600,
  '& .MuiTypography-caption': {
    color: '#999',
    display: 'block',
    marginBottom: theme.spacing(0.5)
  },
  '& .MuiTypography-body1': {
    color: '#fff'
  }
}));

const ProfileSetting = ({
  name: initialName,
  fullName: initialFullName,
  dateOfBirth: initialDateOfBirth,
  accountType: initialAccountType,
  country,
  language,
  currency,
  createdAt,
  phoneNumber,
  twoFactorEnabled,
  onUpdate
}) => {
  const [editMode, setEditMode] = useState(false);
  const [localData, setLocalData] = useState({
    name: initialName,
    fullName: initialFullName,
    dateOfBirth: initialDateOfBirth,
    accountType: initialAccountType,
    country,
    language,
    currency,
    phoneNumber,
    twoFactorEnabled
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleInputChange = (field) => (e) => {
    let value = e.target.value;

    if (field === 'phoneNumber') {
      value = value.replace(/[^\d]/g, '');
    }

    setLocalData({ ...localData, [field]: value });
  };

  const handleToggle2FA = (e) => {
    setLocalData({ ...localData, twoFactorEnabled: e.target.checked });
  };

  const handleSave = async () => {
    try {
      if (localData.name.trim().length < 3) {
        showSnackbar('The name must contain at least 3 characters!', 'error');
        return;
      }
      
      if (localData.fullName && localData.fullName.trim().length < 3) {
        showSnackbar('The full name must contain at least 3 characters!', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      const formattedDateOfBirth = localData.dateOfBirth
        ? new Date(localData.dateOfBirth).toISOString()
        : null;

      const payload = {
        name: localData.name,
        fullName: localData.fullName,
        dateOfBirth: formattedDateOfBirth,
        accountType: localData.accountType,
        country: localData.country,
        language: localData.language,
        currency: localData.currency,
        phoneNumber: localData.phoneNumber,
        twoFactorEnabled: localData.twoFactorEnabled
      };

      const response = await axios.put('/api/auth/update-profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocalData({
        ...localData,
        ...response.data
      });
      onUpdate(response.data);
      
      showSnackbar('Changes have been saved!', 'success');
      setEditMode(false);
    } catch (error) {
      console.error('Error saving:', error);
      showSnackbar(error.response?.data?.error || 'Error saving:', 'error');
    }
  };

  const showSnackbar = (message: string, severity: string) => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  return (
    <Paper sx={{ bgcolor: '#262626', borderRadius: 4, p: 4 }}>
      <Typography variant="h5" sx={{ color: 'white', mb: 4, fontWeight: 700 }}>
        <AccountCircle sx={{ color: '#00b3ff', mr: 1 }} />
        User Profile
      </Typography>

      <DetailItem>
        <SectionHeader variant="h6"><Public fontSize="small" /> Personal Information</SectionHeader>
        <Grid container spacing={3}>
          <Grid>
            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mb: 1 }}>
            Username
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                value={localData.name}
                onChange={handleInputChange('name')}
                inputProps={{ 
                  minLength: 3,
                  pattern: ".{3,}",
                  title: "The name must contain at least 3 characters!"
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle sx={{ color: '#00b3ff' }} />
                    </InputAdornment>
                  )
                }}
              />
            ) : (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: '#ffffff08',
                p: 2,
                borderRadius: 2
              }}>
                <AccountCircle sx={{ color: '#00b3ff' }} />
                <Typography>{localData.name}</Typography>
              </Box>
            )}
          </Grid>
          <Grid>
            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mb: 1 }}>
            Full Name
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                value={localData.fullName}
                onChange={handleInputChange('fullName')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#00b3ff' }} />
                    </InputAdornment>
                  )
                }}
              />
            ) : (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: '#ffffff08',
                p: 2,
                borderRadius: 2
              }}>
                <Person sx={{ color: '#00b3ff' }} />
                <Typography>{localData.fullName || 'Nespecificat'}</Typography>
              </Box>
            )}
          </Grid>
          <Grid>
            <Typography variant="caption">Account Type</Typography>
            {editMode ? (
              <TextField 
                select 
                fullWidth 
                value={localData.accountType} 
                onChange={handleInputChange('accountType')}
                sx={{ maxWidth: 300 }}
              >
                <MenuItem value="standard">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star sx={{ color: '#ccc' }} />
                    Standard
                  </Box>
                </MenuItem>
                <MenuItem value="premium">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star sx={{ color: 'gold' }} />
                    Premium
                  </Box>
                </MenuItem>
                <MenuItem value="vip">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Diamond sx={{ color: '#b967ff' }} />
                    VIP
                  </Box>
                </MenuItem>
              </TextField>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                {localData.accountType === 'premium' ? (
                  <>
                    <Star sx={{ color: 'gold', mt: 1.5 }} />
                    <Typography sx={{ mt: 1.5 }}>Premium</Typography>
                  </>
                ) : localData.accountType === 'vip' ? (
                  <>
                    <Diamond sx={{ color: '#b967ff', mt: 1.5 }} />
                    <Typography sx={{ mt: 1.5 }}>VIP</Typography>
                  </>
                ) : (
                  <>
                    <Star sx={{ color: '#ccc', mt: 1.5 }} />
                    <Typography sx={{ mt: 1.5 }}>Standard</Typography>
                  </>
                )}
              </Box>
            )}
          </Grid>
          <Grid>
            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mb: 1 }}>
            Date of Birth
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                type="date"
                value={localData.dateOfBirth}
                onChange={handleInputChange('dateOfBirth')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Cake sx={{ color: '#00b3ff' }} />
                    </InputAdornment>
                  )
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            ) : (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: '#ffffff08',
                p: 2,
                borderRadius: 2
              }}>
                <Cake sx={{ color: '#00b3ff' }} />
                <Typography>
                  {localData.dateOfBirth 
                    ? new Date(localData.dateOfBirth).toLocaleDateString('ro-RO') 
                    : 'Nespecificat'
                  }
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid>
            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mb: 1 }}>
            Country of Residence
            </Typography>
            {editMode ? (
              <TextField 
                select 
                fullWidth 
                value={localData.country} 
                onChange={handleInputChange('country')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Public sx={{ color: '#00b3ff' }} />
                    </InputAdornment>
                  )
                }}
              >
                <MenuItem value="MD">Republica Moldova</MenuItem>
                <MenuItem value="RO">România</MenuItem>
                <MenuItem value="US">United States</MenuItem>
              </TextField>
            ) : (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: '#ffffff08',
                p: 2,
                borderRadius: 2
              }}>
                <Public sx={{ color: '#00b3ff' }} />
                <Typography>
                  {{
                    MD: 'Republica Moldova', 
                    RO: 'România', 
                    US: 'United States'
                  }[localData.country]}
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid>
            <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mb: 1 }}>
            Member since
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: '#ffffff08',
              p: 2,
              borderRadius: 2
            }}>
              <Star sx={{ color: '#00b3ff' }} />
              <Typography>
                {new Date(createdAt).toLocaleDateString('ro-RO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DetailItem>

      <Divider sx={{ borderColor: '#333', my: 4 }} />
      <DetailItem>
        <SectionHeader variant="h6"><Translate fontSize="small" /> Regional Preferences</SectionHeader>
        <Grid container spacing={4}>
          <Grid>
            <Typography variant="caption">Language</Typography>
            {editMode ? (
              <TextField 
                select 
                fullWidth 
                value={localData.language} 
                onChange={handleInputChange('language')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Language sx={{ color: '#00b3ff' }} />
                    </InputAdornment>
                  )
                }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ro">Română</MenuItem>
                <MenuItem value="ru">Русский</MenuItem>
              </TextField>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Language sx={{ color: '#00b3ff' }} />
                <Typography>
                  {{ en: 'English', ro: 'Română', ru: 'Русский' }[localData.language]}
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid>
            <Typography variant="caption">Currency</Typography>
            {editMode ? (
              <TextField 
                select 
                fullWidth 
                value={localData.currency} 
                onChange={handleInputChange('currency')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney sx={{ color: '#00b3ff' }} />
                    </InputAdornment>
                  )
                }}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="MDL">MDL</MenuItem>
              </TextField>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <MonetizationOn sx={{ color: '#00b3ff' }} />
                <Typography>{localData.currency}</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DetailItem>

      <Divider sx={{ borderColor: '#333', my: 4 }} />
      <DetailItem>
        <SectionHeader variant="h6"><Security fontSize="small" /> Account Security</SectionHeader>
        <Grid container spacing={4}>
          <Grid>
            <Typography variant="caption">Phone</Typography>
            {editMode ? (
              <TextField
                fullWidth
                value={localData.phoneNumber}
                onChange={handleInputChange('phoneNumber')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: '#00b3ff', mr: 0.5 }} /> +
                    </InputAdornment>
                  )
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Phone sx={{ color: '#00b3ff' }} />
                <Typography>
                  {localData.phoneNumber 
                    ? (localData.phoneNumber.startsWith('+') 
                      ? localData.phoneNumber 
                      : `+${localData.phoneNumber}`) 
                    : 'Nespecificat'
                  }
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid>
            <Typography variant="caption">2FA</Typography>
            {editMode ? (
              <FormControlLabel
                control={<Switch checked={localData.twoFactorEnabled} onChange={handleToggle2FA} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Security sx={{ 
                      color: localData.twoFactorEnabled ? '#00b3ff' : '#666',
                      transition: 'color 0.3s ease'
                    }} />
                    {localData.twoFactorEnabled ? 'Activat' : 'Dezactivat'}
                  </Box>
                }
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Security sx={{ color: localData.twoFactorEnabled ? '#00b3ff' : '#666' }} />
                <Typography>{localData.twoFactorEnabled ? 'Activat' : 'Dezactivat'}</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DetailItem>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        {editMode ? (
          <>
            <Button 
              variant="outlined" 
              onClick={() => setEditMode(false)}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSave} 
              sx={{ bgcolor: '#00b3ff' }}
              startIcon={<SaveIcon />}
            >
              Save
            </Button>
          </>
        ) : (
          <Button 
            variant="contained" 
            onClick={() => setEditMode(true)} 
            sx={{ bgcolor: '#00b3ff' }}
            startIcon={<EditIcon />}
          >
            Edit Profile
          </Button>
        )}
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ProfileSetting;