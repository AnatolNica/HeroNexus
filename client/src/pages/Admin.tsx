import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import Users from '../Admin/Users';
import Characters from '../Admin/Characters';
import Offers from '../Admin/Offers';
import RoulettesAdmin from '../Admin/RoulettesAdmin';
import {
  Box,
  Container,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Avatar,
  Slide,
  Alert,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  People as PeopleIcon,
  TheaterComedy as CharactersIcon,
  AttachMoney as OffersIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Casino as CasinoIcon,
  Security
} from '@mui/icons-material';
import NavBar from '../assets/NavBar';
import Footer from '../assets/Footer';

const Admin: React.FC = () => {
  const { user: currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<'users' | 'characters' | 'offers' | 'roulettes'>('users');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Slide in direction="down" timeout={500}>
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <Alert
            severity="error"
            icon={<WarningIcon fontSize="large" />}
            sx={{
              width: '100%',
              maxWidth: 600,
              '& .MuiAlert-message': { fontSize: '1.1rem' }
            }}
          >
            <Typography variant="h5" component="div">
            Restricted access
            </Typography>
            <Typography variant="body1">
            Only administrators have access to this page
            </Typography>
          </Alert>
        </Box>
      </Slide>
    );
  }

  const menuItems = [
    {
      icon: <PeopleIcon />,
      text: 'Users',
      value: 'users'
    },
    {
      icon: <CharactersIcon />,
      text: 'Characters',
      value: 'characters'
    },
    {
      icon: <OffersIcon />,
      text: 'Offers',
      value: 'offers'
    },
    {
      icon: <CasinoIcon />,
      text: 'Roulettes',
      value: 'roulettes'
    }
  ];

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <NavBar />

      <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#1a1a1a', minHeight: '100vh' }}>
        {isMobile && (
          <IconButton
  color="inherit"
  aria-label="open menu"
  onClick={handleMenuClick}
  sx={{ 
    position: 'fixed',
    top: 10,
    right: 16,
    zIndex: 10,
    color: '#00b3ff',
    bgcolor: '#262626',
    borderRadius: 20,
    p: 1.5,
    '&:hover': {
      bgcolor: '#333'
    }
  }}
>
            <Security />
          </IconButton>
        )}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              bgcolor: '#262626',
              color: 'white',
              width: '80%',
              maxWidth: 200,
            }
          }}
        >
          <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid #333' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: '#00b3ff20',
                mb: 2,
                mx:'auto'
              }}
            >
              <SecurityIcon sx={{ fontSize: 48, color: '#00b3ff' }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              Admin
            </Typography>
            <Chip
              label="Admin"
              sx={{
                bgcolor: '#00b3ff20',
                color: '#00b3ff',
                mt: 1
              }}
            />
          </Box>

          {menuItems.map((item) => (
            <MenuItem
              key={item.value}
              onClick={() => {
                setActiveTab(item.value as any);
                handleMenuClose();
              }}
              sx={{
                borderBottom: '1px solid #333',
                '&:hover': {
                  backgroundColor: 'rgba(0, 179, 255, 0.1)'
                }
              }}
            >
              <ListItemIcon sx={{ color: '#00b3ff' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  sx: { color: 'white', fontWeight: 600 }
                }}
              />
            </MenuItem>
          ))}
        </Menu>

        <Grid container spacing={4}>
          {!isMobile && (
            <Grid>
              <Paper
                sx={{
                  bgcolor: '#262626',
                  borderRadius: 2,
                  position: 'sticky',
                  top: 20,
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    borderBottom: '1px solid #333',
                    bgcolor: '#1a1a1a',
                    borderRadius: '8px 8px 0 0'
                  }}
                >
                  <Avatar
                    sx={{
                      width: 96,
                      height: 96,
                      bgcolor: '#00b3ff20',
                      mb: 2,
                      ml:2.5,
                      transition: 'transform 0.3s ease',
                      '&:hover': { transform: 'scale(1.05)' }
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 48, color: '#00b3ff' }} />
                  </Avatar>

                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                    Admin
                  </Typography>

                  <Chip
                    label="Admin"
                    sx={{
                      bgcolor: '#00b3ff20',
                      color: '#00b3ff',
                      mt: 1,
                      fontWeight: 600
                    }}
                  />
                </Box>

                <List disablePadding sx={{ p: 2 }}>
                  {menuItems.map((item) => (
                    <ListItem key={item.value} disablePadding>
                      <ListItemButton
                        selected={activeTab === item.value}
                        onClick={() => setActiveTab(item.value as any)}
                        sx={{
                          mb: 1,
                          '&.Mui-selected': {
                            bgcolor: '#00b3ff20',
                          },
                          '&:hover': {
                            bgcolor: '#ffffff10'
                          }
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color: activeTab === item.value ? '#00b3ff' : '#ffffff80'
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            sx: {
                              color: activeTab === item.value ? '#00b3ff' : 'white',
                              fontWeight: 600
                            }
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          <Grid>
            <Paper
              sx={{
                bgcolor: '#262626',
                borderRadius: 2,
                p: 4,
                minHeight: '70vh',
                boxShadow: '0px 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              {activeTab === 'users' ? (
                <Users />
              ) : activeTab === 'characters' ? (
                <Characters />
              ) : activeTab === 'offers' ? (
                <Offers />
              ) : (
                <RoulettesAdmin />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </>
  );
};

export default Admin;
