import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  useMediaQuery,
  useTheme,
  Box,
  Button,
  Divider,
  Typography,
  Avatar,
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Favorite, AccountCircle, Home, Storefront, Info, ContactMail } from "@mui/icons-material";
import { useUser} from '../contexts/UserContext';
import { Link } from 'react-router-dom';

const NavBar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  const navItems = [
    { name: 'Home', path: '/', icon: <Home sx={{ fontSize: 24 }} /> },
    { name: 'Catalog', path: '/catalog', icon: <Storefront sx={{ fontSize: 24 }} /> },
    { name: 'Market', path: '/market', icon: <ShoppingCartIcon sx={{ fontSize: 24 }} /> },
    { name: 'About', path: '/about', icon: <Info sx={{ fontSize: 24 }} /> },
    { name: 'Contact', path: '/contactUs', icon: <ContactMail sx={{ fontSize: 24 }} /> },
  ];

  const mobileExtraItems = [
    { name: 'Favorites', path: '/wishlist', icon: <Favorite sx={{ fontSize: 24 }} /> },
    { name: 'Cart', path: '/cart', icon: <ShoppingCartIcon sx={{ fontSize: 24 }} /> },
  ];

  const drawer = (
    <Box
      sx={{
        width: 280,
        height: '100%',
        backgroundColor: '#202020',
        color: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: 2 }}>
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <CloseIcon sx={{ fontSize: 30 }} />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <List sx={{ px: 2 }}>
          {navItems.map((item) => (
            <ListItem key={item.name} disablePadding>
              <Button
                fullWidth
                component={Link}
                to={item.path}
                onClick={handleDrawerToggle}
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: 'white',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  py: 1.5,
                  borderRadius: 0,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    pl: 1
                  }
                }}
                startIcon={item.icon}
              >
                <Box>{item.name}</Box>
                <ChevronRightIcon sx={{ color: '#00C8FF' }} />
              </Button>
            </ListItem>
          ))}

          {mobileExtraItems.map((item) => (
            <ListItem key={item.name} disablePadding>
              <Button
                fullWidth
                component={Link}
                to={item.path}
                onClick={handleDrawerToggle}
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: 'white',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  py: 1.5,
                  borderRadius: 0,
                  gap: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    pl: 1
                  }
                }}
                startIcon={item.icon}
              >
                {item.name}
                <ChevronRightIcon sx={{ color: '#00C8FF' }} />
              </Button>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ p: 2 }}>
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <IconButton component={Link} to="/user"
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <Avatar src={user.avatar} sx={{ width: 40, height: 40, border: '2px solid #00b3ff' }}>
                  {!user.avatar && <AccountCircle sx={{ fontSize: 40 }} />}
                </Avatar>
              </IconButton>

              <Box
                component={Link}
                to="/user"
                sx={{
                  color: 'white',
                  textDecoration: 'none',
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  userSelect: 'none',
                  minWidth: 0,
                }}
                onClick={handleDrawerToggle}
              >
                <Typography variant="body1" noWrap sx={{ fontWeight: 'bold' }}>{user.name}</Typography>
                <Typography
  variant="body2"
  sx={{ color: '#00b3ff', display: 'flex', alignItems: 'center', gap: 1 }}
  noWrap
>
  {(user.coins).toFixed(2)}
</Typography>

              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': { borderColor: 'white' }
                }}
                component={Link}
                to="/login"
              >
                Sign In
              </Button>
              <Button
                component={Link}
                to="/login"
                fullWidth
                variant="contained"
                sx={{
                  bgcolor: '#00C8FF',
                  '&:hover': { bgcolor: '#00CFFF' }
                }}
              >
                Register
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      </Box>
    </Box>
  );

  return (
    <AppBar position="static" sx={{ backgroundColor: '#202020' }}>
      <Container>
        <Toolbar sx={{
          px: { xs: 2, sm: 3 },
          minHeight: '64px !important',
          justifyContent: 'space-between',
          gap: 2
        }}>
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleDrawerToggle}
              sx={{
                transition: 'all 0.3s ease',
                transform: mobileOpen ? 'rotate(90deg)' : 'none',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <MenuIcon sx={{ fontSize: 30 }} />
            </IconButton>
          )}

          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              position: isMobile ? 'absolute' : 'static',
              left: '50%',
              transform: isMobile ? 'translateX(-50%)' : 'none'
            }}
          >
            <img
              src="/public/Logo-small.png"
              alt="Nexus Logo"
              style={{ height: 50 }}
            />
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 3, mx: 'auto', alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  component={Link}
                  to={item.path}
                  sx={{
                    color: 'white',
                    textTransform: 'none',
                    fontSize: 16,
                    fontWeight: 500,
                    px: 2,
                    ml: -2,
                    py: 1,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {item.icon}
                  {item.name}
                </Button>
              ))}
            </Box>
          )}

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton color="inherit" component={Link} to="/user" sx={{ p: 1.5, ml: -5 }}>
                <Avatar
                  src={user?.avatar}
                  sx={{
                    width: 50,
                    height: 50,
                    border: '2px solid grey',
                    bgcolor: '#1a1a1a',
                  }}
                >
                  {!user?.avatar && <AccountCircle sx={{ fontSize: 40 }} />}
                </Avatar>
              </IconButton>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  component={Link}
                  to={user ? "/user" : "/login"}
                  sx={{
                    ml: -4,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 16px'
                  }}
                >
                  {user ? (
                    <>
                      <Box>{user.name}</Box>
                      <Box sx={{ color: '#00b3ff' }}>{(user.coins).toFixed(2)}</Box>
                    </>
                  ) : (
                    <>
                      <Box>Register</Box>
                      <Box>Login</Box>
                    </>
                  )}
                </Button>
              </Box>

              <IconButton color="inherit" component={Link} to="/wishlist"
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  ml: -2,
                }}
              >
                <Favorite sx={{ fontSize: 28 }} />
              </IconButton>
              <IconButton color="inherit" component={Link} to="/cart"
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <ShoppingCartIcon sx={{ fontSize: 28 }} />
              </IconButton>
            </Box>
          )}

          <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: 280,
              },
            }}
          >
            {drawer}
          </Drawer>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default NavBar;
