import { useState, useEffect } from 'react';
import {
  Box, Button, Chip, Grid, Paper, Typography,
  TextField, FormControlLabel, Switch, Snackbar, Alert, CircularProgress,
  IconButton
} from '@mui/material';
import { 
  CreditCard, Edit, Delete, CheckCircle,
  CalendarToday, Person, Lock, Email, 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const DetailItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  maxWidth: 600,
  '& .MuiTypography-caption': {
    color: '#999',
    display: 'block',
    marginBottom: theme.spacing(0.5)
  },
  '& .MuiTypography-body1': {
    color: '#fff'
  }
}));

const AuthButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  padding: theme.spacing(1.5, 3),
  borderRadius: '8px',
  color:'white',
  transition: 'all 0.3s ease',
  fontSize: '0.95rem',
  '&:hover': {
    transform: 'translateY(-2px)',
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


const PaymentMethods = ({ paymentMethods, onUpdate }) => {
  const [editingMethodId, setEditingMethodId] = useState(null);
  const [addingMethodType, setAddingMethodType] = useState(null);
  const [localMethods, setLocalMethods] = useState(paymentMethods);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    setLocalMethods(paymentMethods);
  }, [paymentMethods]);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleUpdate = async (updatedMethods) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/auth/payment-methods', updatedMethods, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate(response.data);
      showSnackbar('Updated payment methods!', 'success');
    } catch (error) {
      showSnackbar('Error updating', 'error');
    } finally {
      setLoading(false);
    }
  };

  const EditPaymentForm = ({ method, onSave, onCancel }) => {
    const isCreditCard = method.type === 'creditCard';
    const [formData, setFormData] = useState({
      isPrimary: method.isPrimary || false,
      ...(isCreditCard ? {
        expiry: method.details.expiry || '',
        cardHolderName: method.cardHolderName || ''
      } : {
        email: method.details.paypalEmail || ''
      })
    });
    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
      let errors = {};
      const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      const nameRegex = /^[a-zA-Z\s]+$/;

      if (isCreditCard) {
        if (!expiryRegex.test(formData.expiry)) {
          errors.expiry = "Invalid expiration date (MM/YY)";
        }
        if (!nameRegex.test(formData.cardHolderName)) {
          errors.cardHolderName = "Only letters and spaces allowed";
        }
      } else {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = "Invalid email address";
        }
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      const updatedMethod = isCreditCard ? {
        ...method,
        details: { ...method.details, expiry: formData.expiry },
        cardHolderName: formData.cardHolderName,
        isPrimary: formData.isPrimary
      } : {
        ...method,
        details: { paypalEmail: formData.email },
        isPrimary: formData.isPrimary
      };

      onSave(updatedMethod);
    };

    const formatExpiry = (value) => {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
      return cleaned;
    };

    return (
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {isCreditCard ? (
            <>
              <Grid>
                <Typography variant="body2" sx={{ color: '#00b3ff' }}>
                  <CreditCard sx={{ mr: 1, fontSize: 20 }} />
                  •••• {method.details.cardNumber.slice(-4)}
                </Typography>
              </Grid>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="Expiration date"
                  value={formData.expiry}
                  onChange={(e) => setFormData({ ...formData, expiry: formatExpiry(e.target.value) })}
                  error={!!formErrors.expiry}
                  helperText={formErrors.expiry}
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ color: '#666', mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="Titular card"
                  value={formData.cardHolderName}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    cardHolderName: e.target.value.replace(/[^a-zA-Z\s]/g, '') 
                  })}
                  error={!!formErrors.cardHolderName}
                  helperText={formErrors.cardHolderName}
                  InputProps={{
                    startAdornment: <Person sx={{ color: '#666', mr: 1 }} />
                  }}
                />
              </Grid>
            </>
          ) : (
            <Grid>
              <StyledTextField
                fullWidth
                label="Email PayPal"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: <Email sx={{ color: '#666', mr: 1 }} />
                }}
              />
            </Grid>
          )}
          <Grid>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  sx={{
                    color: '#00b3ff',
                    '&.Mui-checked': { color: '#00b3ff' }
                  }}
                />
              }
              label="Set as primary"
              sx={{ color: 'white' }}
            />
          </Grid>
          <Grid>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <AuthButton
                variant="outlined"
                onClick={onCancel}
                sx={{ borderColor: '#404040', color: 'white' }}
              >
                Cancel
              </AuthButton>
              <AuthButton type="submit" sx={{ bgcolor: '#00b3ff' }}>
                Save
              </AuthButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const AddPaymentForm = ({ type, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardHolderName: '',
      email: '',
      isPrimary: false
    });
    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
      let errors = {};
      const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      const nameRegex = /^[a-zA-Z\s]+$/;

      if (type === 'creditCard') {
        if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
          errors.cardNumber = "Invalid card number";
        }
        if (!expiryRegex.test(formData.expiry)) {
          errors.expiry = "Invalid expiration date";
        }
        if (!/^\d{3}$/.test(formData.cvv)) {
          errors.cvv = "Invalid CVV ";
        }
        if (!nameRegex.test(formData.cardHolderName)) {
          errors.cardHolderName = "Only letters and spaces";
        }
      } else {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = "Invalid email";
        }
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      const newMethod = type === 'creditCard' ? {
        type: 'creditCard',
        details: {
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          expiry: formData.expiry,
          cvv: formData.cvv
        },
        cardHolderName: formData.cardHolderName,
        isPrimary: formData.isPrimary
      } : {
        type: 'paypal',
        details: { paypalEmail: formData.email },
        isPrimary: formData.isPrimary
      };

      onSave(newMethod);
    };

    const formatCardNumber = (value) => {
      return value.replace(/\D/g, '').slice(0, 16).match(/.{1,4}/g)?.join(' ') || '';
    };

    const formatExpiry = (value) => {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
      return cleaned;
    };

    return (
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {type === 'creditCard' ? (
            <>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="Card number"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                  error={!!formErrors.cardNumber}
                  helperText={formErrors.cardNumber}
                  InputProps={{
                    startAdornment: <CreditCard sx={{ color: '#666', mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="Expiration date"
                  value={formData.expiry}
                  onChange={(e) => setFormData({ ...formData, expiry: formatExpiry(e.target.value) })}
                  error={!!formErrors.expiry}
                  helperText={formErrors.expiry}
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ color: '#666', mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="CVV"
                  value={formData.cvv}
                  onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  error={!!formErrors.cvv}
                  helperText={formErrors.cvv}
                  InputProps={{
                    startAdornment: <Lock sx={{ color: '#666', mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid>
                <StyledTextField
                  fullWidth
                  label="Cardholder"
                  value={formData.cardHolderName}
                  onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                  error={!!formErrors.cardHolderName}
                  helperText={formErrors.cardHolderName}
                  InputProps={{
                    startAdornment: <Person sx={{ color: '#666', mr: 1 }} />
                  }}
                />
              </Grid>
            </>
          ) : (
            <Grid>
              <StyledTextField
                fullWidth
                label="Email PayPal"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: <Email sx={{ color: '#666', mr: 1 }} />
                }}
              />
            </Grid>
          )}
          <Grid>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  sx={{
                    color: '#00b3ff',
                    '&.Mui-checked': { color: '#00b3ff' }
                  }}
                />
              }
              label="Set as primary"
              sx={{ color: 'white' }}
            />
          </Grid>
          <Grid>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <AuthButton
                variant="outlined"
                onClick={onCancel}
                sx={{ borderColor: '#404040', color: 'white' }}
              >
                Cancel
              </AuthButton>
              <AuthButton type="submit" sx={{ bgcolor: '#00b3ff' }}>
                {type === 'creditCard' ? 'Add Card' : 'Connect PayPal'}
              </AuthButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Paper sx={{ bgcolor: 'transparent',borderRadius:10, p: 4, maxWidth: 500, mx: 'auto'}}>
      <Typography variant="h5" sx={{ color: 'white', mb: 4, fontWeight: 700 }}>
        <CreditCard sx={{ color: '#00b3ff', mr: 1 }} />
        Payment Methods
      </Typography>

      {localMethods.map((method) => (
        <DetailItem key={method._id}>
          <Grid container spacing={2} alignItems="center">
            <Grid>
              <Typography variant="caption">Method type</Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: '#ffffff08',
                p: 2,
                borderRadius: 2
              }}>
                <CreditCard sx={{ color: '#00b3ff' }} />
                <Typography>{method.type === 'creditCard' ? 'Card de credit' : 'PayPal'}</Typography>
              </Box>
            </Grid>
            <Grid>
              <Typography variant="caption">Details</Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: '#ffffff08',
                p: 2,
                borderRadius: 2
              }}>
                {method.type === 'creditCard' ? (
                  <>
                    <CalendarToday sx={{ color: '#00b3ff' }} />
                    <Typography>Expires: {method.details.expiry}</Typography>
                  </>
                ) : (
                  <>
                    <Email sx={{ color: '#00b3ff' }} />
                    <Typography>{method.details.paypalEmail}</Typography>
                  </>
                )}
              </Box>
            </Grid>
            <Grid>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  icon={<CheckCircle />}
                  label={method.isPrimary ? 'Primary' : 'Secondary'}
                  color={method.isPrimary ? 'success' : 'default'}
                  sx={{ fontWeight: 500 }}
                />
                <Box>
                  <IconButton onClick={() => setEditingMethodId(method._id)}>
                    <Edit sx={{ color: '#00b3ff' }} />
                  </IconButton>
                  <IconButton onClick={() => handleUpdate(localMethods.filter(m => m._id !== method._id))}>
                    <Delete sx={{ color: '#ff4444' }} />
                  </IconButton>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {editingMethodId === method._id && (
            <EditPaymentForm
              method={method}
              onSave={(updated) => {
                handleUpdate(localMethods.map(m =>
                  m._id === updated._id ? updated :
                  updated.isPrimary ? { ...m, isPrimary: false } : m
                ));
                setEditingMethodId(null);
              }}
              onCancel={() => setEditingMethodId(null)}
            />
          )}
        </DetailItem>
      ))}

      {!addingMethodType ? (
        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <AuthButton
            onClick={() => setAddingMethodType('creditCard')}
            startIcon={<CreditCard />}
            variant="contained"
            sx={{ bgcolor: '#00b3ff', '&:hover': { bgcolor: '#0099cc' }, py: 1.5,flex: 1, minWidth: 150 }}
          >
            Add Card
          </AuthButton>
          <AuthButton
            onClick={() => setAddingMethodType('paypal')}
            startIcon={<CreditCard />}
            variant="contained"
            sx={{ bgcolor: '#003087', '&:hover': { bgcolor: '#003080' }, py: 1.5 ,flex: 1, minWidth: 150}}
          >
            Connect PayPal
          </AuthButton>
        </Box>
      ) : (
        <AddPaymentForm
          type={addingMethodType}
          onSave={(newMethod) => {
            const updated = newMethod.isPrimary
              ? localMethods.map(m => ({ ...m, isPrimary: false })).concat(newMethod)
              : [...localMethods, newMethod];
            handleUpdate(updated);
            setAddingMethodType(null);
          }}
          onCancel={() => setAddingMethodType(null)}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert>{snackbar.message}</Alert>
      </Snackbar>

      {loading && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          bgcolor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <CircularProgress sx={{ color: '#00b3ff' }} />
        </Box>
      )}
    </Paper>
  );
};

export default PaymentMethods;