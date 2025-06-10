import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Chip,
  Container,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
  Alert
} from '@mui/material';
import {
  AccountCircle,
  Security,
  Payment,
  Inventory,
  People,
  CameraAlt,
  ExitToApp,
  Person,
  Delete
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import ProfileSetting from '../assets/ProfileSettings';
import SecurityPage from '../assets/Security';
import PaymentSetting from '../assets/PaymentSettings';
import InventoryPage from '../assets/Inventory';
import Friends from '../assets/Friends';
import NavBar from '../assets/NavBar';
import UserTrades from '../assets/UserTrades';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import axios from 'axios';

interface UserData {
  name: string;
  fullName: string;
  accountType: string;
  dateOfBirth: string;
  country: string;
  language: string;
  currency: string;
  createdAt: string;
  phoneNumber: string;
  twoFactorEnabled: boolean;
  email: string;
  avatar?: string;
  profileColor?: string;
  paymentMethods: any[];
  billingAddress: any;
  transactions: any[];
  purchasedCharacters: any[];
  inventory: any[];
  friends: any[];
  friendRequestsSent: any[];
  friendRequestsReceived: any[];
}

const ProfileAvatarUpload = ({ currentAvatar, onAvatarChange }) => {
  const [preview, setPreview] = useState(currentAvatar || '');
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            setPreview(reader.result);
            onAvatarChange(reader.result);
          };
        }, 'image/jpeg', 0.7);
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box textAlign="center" sx={{ mb: 3 }}>
      <Box position="relative" display="inline-block">
        <Avatar
          src={preview || currentAvatar}
          alt="Profil"
          sx={{
            width: 100,
            height: 100,
            border: '3px solid #00b3ff',
            mb: 1
          }}
        />
        <input
          accept="image/*"
          id="upload-avatar"
          type="file"
          hidden
          onChange={handleImageChange}
        />
        <label htmlFor="upload-avatar">
          <IconButton
            component="span"
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              bgcolor: '#00b3ff',
              color: 'white',
              '&:hover': { bgcolor: '#0099cc' }
            }}
          >
            <CameraAlt fontSize="small" />
          </IconButton>
        </label>
      </Box>
    </Box>
  );
};

const UserPage = () => {
  const { setUser } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
    setMobileMenuOpen(true);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuOpen(false);
  };

  const handleUpdateUserData = (updatedFields) => {
    setUserData((prev) => ({ ...prev, ...updatedFields }));
  };

  const verifyAuthentication = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userWithFullAvatar = {
        ...response.data,
        avatar: response.data.avatar ? `http://localhost:5000${response.data.avatar}` : null,
        paymentMethods: response.data.paymentMethods || [],
        billingAddress: response.data.billingAddress || null,
        transactions: response.data.transactions || [],
        purchasedCharacters: response.data.purchasedCharacters || [],
        inventory: response.data.inventory || [],
        friends: response.data.friends || [],
        friendRequestsSent: response.data.friendRequestsSent || [],
        friendRequestsReceived: response.data.friendRequestsReceived || []
      };
      setUserData(userWithFullAvatar);
      setInventory(userWithFullAvatar.inventory);
    } catch (error) {
      console.error('Authentication verification error', error);
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAuthentication();
  }, [navigate]);

  const handleInventoryUpdate = (newInventory) => {
    setInventory(newInventory);
    setUserData((prev) => ({ ...prev, inventory: newInventory }));
  };

  const handleAvatarChange = async (base64Image) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        '/api/auth/update-avatar',
        { avatar: base64Image },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const newAvatar = `http://localhost:5000${res.data.avatar}`;
      setUserData((prev) => ({
        ...prev,
        avatar: newAvatar
      }));
      setUser((prev) => ({
        ...prev,
        avatar: newAvatar
      }));
    } catch (err) {
      console.error('Error updating avatars:', err);
      alert('Could not update avatar');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.dispatchEvent(new Event('storage'));
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    const password = prompt('Please enter your current password to confirm deletion:');
    if (!password) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete('/api/auth/delete-account', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { password }
      });

      if (response.status === 200) {
        alert('Your account has been successfully deleted.');
        localStorage.removeItem('token');
        setUser(null);
        window.dispatchEvent(new Event('storage'));
        navigate('/');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'An error occurred while deleting your account.';
      alert(`Failed to delete account: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: '#1a1a1a'
        }}
      >
        <CircularProgress size={80} sx={{ color: '#00b3ff' }} />
      </Box>
    );
  }

  if (!userData) {
    navigate('/login');
    return null;
  }

  const menuItems = [
    { icon: <AccountCircle />, text: 'Profile' },
    { icon: <Security />, text: 'Security' },
    { icon: <Payment />, text: 'Payments' },
    { icon: <People />, text: 'Friends' },
    { icon: <SwapHoriz />, text: 'Trades' },
    { icon: <Inventory />, text: 'Inventory' },
    { icon: <ExitToApp />, text: 'Logout', isLogout: true },
    { icon: <Delete />, text: 'Delete', isDelete: true }
  ];

  const tabComponents = [
    <Box key="profile" sx={{ mt: 2 }}>
      <ProfileAvatarUpload currentAvatar={userData.avatar} onAvatarChange={handleAvatarChange} />
      <ProfileSetting
        name={userData.name}
        fullName={userData.fullName}
        accountType={userData.accountType}
        dateOfBirth={userData.dateOfBirth}
        country={userData.country}
        language={userData.language}
        currency={userData.currency}
        createdAt={userData.createdAt}
        phoneNumber={userData.phoneNumber}
        twoFactorEnabled={userData.twoFactorEnabled}
        onUpdate={(updatedFields) => handleUpdateUserData(updatedFields)}
      />
    </Box>,
    <SecurityPage
      key="security"
      email={userData.email}
      phoneNumber={userData.phoneNumber}
      twoFactorEnabled={userData.twoFactorEnabled}
      onUpdateUserData={handleUpdateUserData}
    />,
    <PaymentSetting
      key="payments"
      paymentMethods={userData.paymentMethods}
      billingAddress={userData.billingAddress}
      transactions={userData.transactions}
      onUpdateUserData={handleUpdateUserData}
    />,
    <Friends
      key="friends"
      friendsList={userData.friends}
      friendRequestsSent={userData.friendRequestsSent}
      friendRequestsReceived={userData.friendRequestsReceived}
    />,
    <UserTrades key="trades" />,
    <InventoryPage
      key="inventory"
      inventory={inventory}
      purchasedCharacters={userData.purchasedCharacters}
      onInventoryUpdate={handleInventoryUpdate}
    />
  ];

  return (
    <>
      <NavBar user={userData} />
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#1a1a1a', minHeight: '100vh' }}>
        {isMobile && (
          <Box sx={{ mb: 2 }}>
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
              <Person />
            </IconButton>
          </Box>
        )}
        <Grid container spacing={4}>
          <Grid sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper sx={{ bgcolor: '#262626', borderRadius: 2, position: 'sticky', top: 20 }}>
              <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid #333' }}>
                <Avatar
                  src={userData.avatar}
                  alt={userData.name}
                  sx={{
                    width: 96,
                    height: 96,
                    margin:"auto",
                    bgcolor: userData.profileColor || '#404040',
                    mb: 2,
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  {!userData.avatar && <AccountCircle sx={{ fontSize: 64, color: '#00b3ff' }} />}
                </Avatar>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  {userData.name}
                </Typography>
                <Chip
                  label={userData.accountType}
                  sx={{
                    bgcolor:
                      userData.accountType === 'vip'
                        ? '#00b3ff20'
                        : '#66666620',
                    color:
                      userData.accountType === 'vip'
                        ? '#00b3ff'
                        : '#666',
                    mt: 1
                  }}
                />
              </Box>
              <List disablePadding>
                {menuItems.map((item, index) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      selected={index === activeTab}
                      onClick={() => {
                        if (item.isLogout) {
                          handleLogout();
                        } else if (item.isDelete) {
                          handleDeleteAccount();
                        } else {
                          setActiveTab(index);
                        }
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: item.isLogout || item.isDelete ? '#ff444420' : 'inherit'
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: item.isLogout || item.isDelete ? '#ff4444' : '#00b3ff'
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          sx: {
                            color: item.isLogout || item.isDelete ? '#ff4444' : 'white',
                            fontWeight: item.isLogout || item.isDelete ? 600 : 'normal'
                          }
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          <Menu
            anchorEl={anchorEl}
            open={mobileMenuOpen}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: '#262626',
                color: 'white',
                width: '80%',
                maxWidth: 200
              }
            }}
          >
            <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid #333' }}>
              <Avatar
                src={userData.avatar}
                alt={userData.name}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: userData.profileColor || '#404040',
                  mb: 2,
                  mx: 'auto'
                }}
              >
                {!userData.avatar && <AccountCircle sx={{ fontSize: 64, color: '#00b3ff' }} />}
              </Avatar>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                {userData.name}
              </Typography>
              <Chip
                label={userData.accountType}
                sx={{
                  bgcolor:
                    userData.accountType === 'vip'
                      ? '#00b3ff20'
                      : '#66666620',
                  color:
                    userData.accountType === 'vip'
                      ? '#00b3ff'
                      : '#666',
                  mt: 1
                }}
              />
            </Box>
            {menuItems.map((item, index) => (
              <MenuItem
                key={item.text}
                onClick={() => {
                  handleMenuClose();
                  if (item.isLogout) {
                    handleLogout();
                  } else if (item.isDelete) {
                    handleDeleteAccount();
                  } else {
                    setActiveTab(index);
                  }
                }}
                sx={{
                  borderBottom: '1px solid #333',
                  '&:hover': {
                    backgroundColor: item.isLogout || item.isDelete
                      ? '#ff444420'
                      : 'rgba(0, 179, 255, 0.1)'
                  }
                }}
              >
                <ListItemIcon sx={{ color: item.isLogout || item.isDelete ? '#ff4444' : '#00b3ff' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      color: item.isLogout || item.isDelete ? '#ff4444' : 'white',
                      fontWeight: item.isLogout || item.isDelete ? 600 : 'normal'
                    }
                  }}
                />
              </MenuItem>
            ))}
          </Menu>
          <Grid>
            {tabComponents[activeTab]}
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default UserPage;