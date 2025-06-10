import { useState, useEffect } from 'react';
import {
  Box, Button,  Grid, Paper, Typography,
  TextField,  MenuItem, FormControl, InputAdornment,
   Alert, Snackbar
} from '@mui/material';
import { 
  Edit, Person, Home, LocationCity, Map, Tag, Public, LocalShipping
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
  maxWidth: 600,
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

const StyledTextField = styled(TextField)(({}) => ({
  '& .MuiInputBase-root': {
    color: 'white',
    backgroundColor: '#333',
    borderRadius: '8px',
  },
  '& .MuiInputLabel-root': {
    color: '#888',
  },
  '& .Mui-focused .MuiInputLabel-root': {
    color: '#00b3ff',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#404040',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#666',
  },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#00b3ff',
    boxShadow: '0 0 0 2px rgba(0, 179, 255, 0.2)'
  }
}));

const BillingAddress = ({ address, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'MD'
  });
  
  const [formErrors, setFormErrors] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'MD'});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (address) {
      setFormData(address);
    } else {
      setFormData({
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'MD'
      });
    }
    setFormErrors({
      name: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'MD'
    });
  }, [address]);

  const validateForm = () => {
    let errors = {};
    const nameRegex = /^[A-Za-z\s]+$/;

    if (!formData.name.trim()) {
      errors.name = "The name is required";
    } else if (!nameRegex.test(formData.name)) {
      errors.name = "Only letters and spaces allowed";
    }

    if (!formData.street.trim()) {
      errors.street = "The street is required";
    } else if (formData.street.length < 3) {
      errors.street = "Minimum 3 characters";
    }

    if (!formData.city.trim()) {
      errors.city = "The city is required";
    } else if (!nameRegex.test(formData.city)) {
      errors.city = "Only letters and spaces allowed";
    }

    if (!formData.state.trim()) {
      errors.state = "The county is required";
    } else if (!nameRegex.test(formData.state)) {
      errors.state = "Only letters and spaces allowed";
    }

    if (!formData.zipCode.trim()) {
      errors.zipCode = "The postal code is required";
    } else if (!/^\d+$/.test(formData.zipCode)) {
      errors.zipCode = "Only digits allowed";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/auth/billing-address', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate(response.data);
      showSnackbar('Address updated successfully!', 'success');
      setIsEditing(false);
    } catch (error) {
      showSnackbar('Error updating address', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (['name', 'city', 'state'].includes(name)) {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, '');
    } else if (name === 'zipCode') {
      sanitizedValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Paper sx={{ bgcolor: 'transparent', p: 4, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" sx={{ 
        color: 'white', 
        mb: 4, 
        fontWeight: 700, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2 
      }}>
        <LocalShipping sx={{ color: '#00b3ff', mr: 1 }} />
        Billing Address
      </Typography>

      <DetailItem>
        <SectionHeader variant="h6">
          <Public fontSize="small" /> Address details
        </SectionHeader>

        {!isEditing ? (
          <>
            {address ? (
              <Grid container spacing={3}>
                <Grid>
                  <Typography variant="caption">Name</Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#ffffff08',
                    p: 2,
                    borderRadius: 2
                  }}>
                    <Person sx={{ color: '#00b3ff' }} />
                    <Typography>{address.name}</Typography>
                  </Box>
                </Grid>
                <Grid>
                  <Typography variant="caption">Street</Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#ffffff08',
                    p: 2,
                    borderRadius: 2
                  }}>
                    <Home sx={{ color: '#00b3ff' }} />
                    <Typography>{address.street}</Typography>
                  </Box>
                </Grid>
                <Grid>
                  <Typography variant="caption">City</Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#ffffff08',
                    p: 2,
                    borderRadius: 2
                  }}>
                    <LocationCity sx={{ color: '#00b3ff' }} />
                    <Typography>{address.city}</Typography>
                  </Box>
                </Grid>
                <Grid>
                  <Typography variant="caption">State</Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#ffffff08',
                    p: 2,
                    borderRadius: 2
                  }}>
                    <Map sx={{ color: '#00b3ff' }} />
                    <Typography>{address.state}</Typography>
                  </Box>
                </Grid>
                <Grid>
                  <Typography variant="caption">Postal Code</Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#ffffff08',
                    p: 2,
                    borderRadius: 2
                  }}>
                    <Tag sx={{ color: '#00b3ff' }} />
                    <Typography>{address.zipCode}</Typography>
                  </Box>
                </Grid>
                <Grid>
                  <Typography variant="caption">Country</Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#ffffff08',
                    p: 2,
                    borderRadius: 2
                  }}>
                    <Public sx={{ color: '#00b3ff' }} />
                    <Typography>
                      {address.country === 'MD' ? 'Moldova' : 
                       address.country === 'RO' ? 'România' : 'United States'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <AuthButton
                      onClick={() => setIsEditing(true)}
                      startIcon={<Edit />}
                      variant="contained"
                      sx={{ bgcolor: '#00b3ff', '&:hover': { bgcolor: '#0099cc' }, py: 1.5,flex: 1, minWidth: 150 }}
                    >
                      Edit Address
                    </AuthButton>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" sx={{ color: '#999', mb: 2 }}>
                You have not added a billing address.
                </Typography>
                <AuthButton
                  onClick={() => setIsEditing(true)}
                  startIcon={<LocalShipping />}
                  sx={{ bgcolor: '#00b3ff' }}
                >
                  Add Address
                </AuthButton>
              </Box>
            )}
          </>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="FullName"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#666' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="Street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  error={!!formErrors.street}
                  helperText={formErrors.street}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Home sx={{ color: '#666' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  error={!!formErrors.city}
                  helperText={formErrors.city}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCity sx={{ color: '#666' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  error={!!formErrors.state}
                  helperText={formErrors.state}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Map sx={{ color: '#666' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="Zip Code"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  error={!!formErrors.zipCode}
                  helperText={formErrors.zipCode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tag sx={{ color: '#666' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid>
                <FormControl fullWidth>
                  <StyledTextField
                    select
                    label="Country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Public sx={{ color: '#666' }} />
                        </InputAdornment>
                      )
                    }}
                  >
                    <MenuItem value="MD">Moldova</MenuItem>
                    <MenuItem value="RO">România</MenuItem>
                    <MenuItem value="US">United States</MenuItem>
                  </StyledTextField>
                </FormControl>
              </Grid>
              <Grid>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <AuthButton
                    variant="outlined"
                    onClick={() => setIsEditing(false)}
                    sx={{ borderColor: '#404040', color: 'white' }}
                  >
                    Cancel
                  </AuthButton>
                  <AuthButton type="submit" sx={{ bgcolor: '#00b3ff','&:hover': { bgcolor: '#0099cc' }, py: 1.5,flex: 1, minWidth: 150 }} variant="contained">
                  Save
                  </AuthButton>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </DetailItem>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert>{snackbar.message}</Alert>
      </Snackbar>
    </Paper>
  );
};

export default BillingAddress;