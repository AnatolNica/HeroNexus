import { useEffect, useState } from 'react';
import { 
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  useMediaQuery
} from '@mui/material';
import { 
  Email, 
  Lock, 
  Person, 
  Google, 
  Facebook,
  GitHub,
  Visibility, 
  VisibilityOff
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NavBar from '../assets/NavBar';
import Footer from '../assets/Footer';
import { useUser } from '../contexts/UserContext';

const AuthForm = () => {
  const { checkAuth } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState('next');
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setSuccess('Login successful!');
        await checkAuth();
        setTimeout(() => navigate('/'), 1500);
      } else {
        throw new Error(data.message || data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleRegister = async () => {
    if (formData.name.trim().length < 3) {
      throw new Error('Name must be at least 3 characters');
    }
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match');
    }
  
    const response = await fetch(`/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
    });
  
    const data = await response.json();
  
    if (response.ok) {
      setSuccess('Registration successful! Please log in.');
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setDirection('prev');
      setActiveTab(0);      
    } else {
      throw new Error(data.message || data.error || 'Registration failed');
    }
  };
  const handleTabChange = (newValue) => {
    setDirection(newValue > activeTab ? 'next' : 'prev');
    setActiveTab(newValue);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (activeTab === 0) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);
  
  const tabVariants = {
    initial: (direction) => ({
      opacity: 0,
      x: direction === 'next' ? 50 : -50,
      scale: 0.95,
      rotateX: 5
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 0.5
      }
    },
    exit: (direction) => ({
      opacity: 0,
      x: direction === 'next' ? -50 : 50,
      scale: 0.95,
      rotateX: -5,
      transition: {
        duration: 0.2
      }
    })
  };

  return (
    <Box sx={{ 
      background: '#121212', 
      display: 'flex',
      flexDirection: 'column',
      height: '150vh',
    }}>
      <NavBar />
      <Container maxWidth="lg" sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}>
        <Paper elevation={24} sx={{
          width: isMobile ? '100%' : '600px',
          borderRadius: 4,
          overflow: 'hidden',
          background: '#1a1a1a',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Box sx={{
            p: { xs: 3, md: 6 },
            color: 'white'
          }}>
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
              {activeTab === 0 ? 'Sign In' : 'Sign Up'}
            </Typography>
  
            <Tabs 
              value={activeTab} 
              TabIndicatorProps={{ style: { backgroundColor: "#00C8FF" } }}
              onChange={(_, newValue) => handleTabChange(newValue)}
              variant="fullWidth"
              sx={{
                mb: 3,
                ".Mui-selected": {
                  color: "#00C8FF",
                },
                ".MuiTab-root": {
                  color: "white",
                }
              }}
            >
              <Tab label="Sign In" sx={{ fontSize: '1.1rem', fontWeight: 500 }} />
              <Tab label="Sign Up" sx={{ fontSize: '1.1rem', fontWeight: 500 }}/>
            </Tabs>
  
            <Box component="form" onSubmit={handleSubmit}>
            <AnimatePresence>
  {error && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
    </motion.div>
  )}
  {success && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>
    </motion.div>
  )}
</AnimatePresence>

  
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeTab}
                  custom={direction}
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {activeTab === 1 && (
                    <TextField
                      fullWidth
                      label="Full Name"
                      margin="normal"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: 'white' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 2,
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: 2,
                            borderColor: '#00C8FF',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#00C8FF',
                          }
                        }
                      }}
                      InputLabelProps={{
                        sx: {
                          fontWeight: 500,
                          color: 'white'
                        }
                      }}
                    />
                  )}
  
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    margin="normal"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: 'white' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: 2,
                          borderColor: '#00C8FF',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#00C8FF',
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        fontWeight: 500,
                        color: 'white'
                      }
                    }}
                  />
  
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    margin="normal"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'white' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff sx={{ color: 'white' }} /> : <Visibility sx={{ color: 'white' }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: 2,
                          borderColor: '#00C8FF',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#00C8FF',
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        fontWeight: 500,
                        color: 'white'
                      }
                    }}
                  />
  
                  {activeTab === 1 && (
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      margin="normal"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: 'white' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                              {showConfirmPassword ? <VisibilityOff sx={{ color: 'white' }} /> : <Visibility sx={{ color: 'white' }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 2,
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: 2,
                            borderColor: '#00C8FF',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#00C8FF',
                          }
                        }
                      }}
                      InputLabelProps={{
                        sx: {
                          fontWeight: 500,
                          color: 'white'
                        }
                      }}
                    />
                  )}
  
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mt: 3
                  }}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={loading}
                      sx={{
                        borderRadius: 2,
                        px: 5,
                        py: 1.5,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        background: `linear-gradient(45deg, #00C8FF 30%, #00C8FF 90%)`,
                        color: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      {activeTab === 0 ? 'Sign In' : 'Sign Up'}
                    </Button>
                  </Box>
                </motion.div>
              </AnimatePresence>
  
              <Divider sx={{ my: 3, p:1, bgcolor: 'rgba(255,255,255,0.2)' }}>OR CONTINUE WITH</Divider>
  
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <IconButton>
                  <Google sx={{ color: 'white' }} />
                </IconButton>
                <IconButton>
                  <Facebook sx={{ color: 'white' }} />
                </IconButton>
                <IconButton>
                  <GitHub sx={{ color: 'white' }} />
                </IconButton>
              </Box>
  
              <Typography sx={{ mt: 3, textAlign: 'center', color: 'white' }}>
                {activeTab === 0 ? "Don't have an account?" : "Already have an account?"}{' '}
                <Button
                  onClick={() => handleTabChange(activeTab === 0 ? 1 : 0)}
                  sx={{
                    color: '#00C8FF',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  {activeTab === 0 ? 'Sign Up' : 'Sign In'}
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
  
  
  
};

export default AuthForm;