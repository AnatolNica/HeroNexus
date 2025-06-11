import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse,
  Alert,
} from '@mui/material';
import { Phone, LocationOn, Schedule, Send } from '@mui/icons-material';
import { useState } from 'react';
import NavBar from '../assets/NavBar';
import Footer from '../assets/Footer';
import FAQ from '../assets/FAQ';
import axios from 'axios';

const ContactPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    try {
      const response = await axios.post('/api/contact', {
        name: formData.name,
        email: formData.email,
        message: formData.message,
      });

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          message: '',
        });
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.errors) {
        const messages = err.response.data.errors.map((e: any) => e.msg).join(' ');
        setError(messages);
      } else {
        setError('An error occurred. Please try again later.');
      }
    }
  };

  return (
    <>
      <NavBar />
      <Container>
        <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: isMobile ? 'column' : 'row', bgcolor: '#121212' }}>
          <Box
            sx={{
              flex: 1,
              p: 6,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Let’s build an awesome project together!
            </Typography>

            <Box sx={{ mt: 4 }}>
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Phone sx={{ mr: 1, color: '#00C8FF' }} />
                  <Typography variant="subtitle1" fontWeight={600}>Call us</Typography>
                </Box>
                <Typography sx={{ ml: 4 }}>
                  +1 (234) 999 888 7<br />
                  +1 (987) 111 222 3
                </Typography>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, color: '#00C8FF' }} />
                  <Typography variant="subtitle1" fontWeight={600}>Find us</Typography>
                </Box>
                <Typography sx={{ ml: 4 }}>
                  4140 Parker Rd. New York,<br />
                  New York 31134
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Schedule sx={{ mr: 1, color: '#00C8FF' }} />
                  <Typography variant="subtitle1" fontWeight={600}>Visit us</Typography>
                </Box>
                <Typography sx={{ ml: 4 }}>
                  Monday – Friday<br />
                  9AM – 5PM
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              flex: 1,
              bgcolor: '#121212',
              p: { xs: 3, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderRadius: 4,
              boxShadow: 3,
              height: 500,
              mt: 25,
              position: 'relative',
              overflow: 'hidden',
              color: 'white',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                mb: 4,
                fontWeight: 800,
                background: `linear-gradient(45deg, #00C8FF 30%, #00C8FF 90%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              Get in Touch
            </Typography>

            <Grid spacing={3}>
              <Grid>
                <TextField
                  fullWidth
                  label="Your Name"
                  variant="outlined"
                  required
                  InputProps={{
                    sx: {
                      mb: 1,
                      borderRadius: 2,
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                        borderColor: '#00C8FF',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00C8FF',
                      },
                    }
                  }}
                  InputLabelProps={{
                    sx: {
                      fontWeight: 500,
                      color: 'white'
                    }
                  }}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>

              <Grid>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  required
                  InputProps={{
                    sx: {
                      mb: 1,
                      borderRadius: 2,
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                        borderColor: '#00C8FF',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00C8FF',
                      },
                    }
                  }}
                  InputLabelProps={{
                    sx: {
                      fontWeight: 500,
                      color: 'white'
                    }
                  }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>

              <Grid>
                <TextField
                  fullWidth
                  label="Your Message"
                  variant="outlined"
                  multiline
                  rows={6}
                  InputProps={{
                    sx: {
                      borderRadius: 2,
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                        borderColor: '#00C8FF',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00C8FF',
                      },
                    }
                  }}
                  InputLabelProps={{
                    sx: {
                      fontWeight: 500,
                      color: 'white'
                    }
                  }}
                  inputProps={{
                    maxLength: 500,
                    style: { resize: 'vertical' }
                  }}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  helperText={
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mt: 1,
                      color: 'white'
                    }}>
                      <span>Max 500 characters</span>
                      <span>{formData.message.length}/500</span>
                    </Box>
                  }
                />
              </Grid>

              <Grid>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    endIcon={<Send sx={{
                      transition: 'transform 0.3s',
                      transform: 'translateX(0)',
                      color: 'white'
                    }} />}
                    sx={{
                      borderRadius: 2,
                      px: 5,
                      py: 1.5,
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      background: `linear-gradient(45deg, #00C8FF 30%, #00C8FF 90%)`,
                      transition: 'all 0.3s ease',
                      color: 'white',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                        '& .MuiSvgIcon-root': {
                          transform: 'translateX(3px)'
                        }
                      }
                    }}
                  >
                    Send Message
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <Collapse in={success} sx={{ mt: 2 }}>
              <Alert
                severity="success"
                sx={{
                  borderRadius: 2,
                  boxShadow: 1,
                  '& .MuiAlert-icon': { alignItems: 'center' }
                }}
              >
                Message sent successfully! We'll respond within 24 hours.
              </Alert>
            </Collapse>

            <Collapse in={!!error} sx={{ mt: 2 }}>
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2,
                  boxShadow: 1,
                  '& .MuiAlert-icon': { alignItems: 'center' }
                }}
              >
                {error}
              </Alert>
            </Collapse>
          </Box>
        </Box>
      </Container>
      <FAQ />
      <Footer />
    </>
  );
};

export default ContactPage;
