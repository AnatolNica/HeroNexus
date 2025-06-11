import { 
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Divider,
  Grid,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  CircularProgress
} from '@mui/material';
import { useEffect, useState, useCallback } from 'react';
import { Close, Add, Remove } from '@mui/icons-material';
import NavBar from '../assets/NavBar';
import Footer from '../assets/Footer';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { useSnackbar } from 'notistack';
import Coin from '../assets/Coin';

interface CartItem {
  type: 'character' | 'offer';
  id: string;
  quantity: number;
  details?: any;
}
const PremiumButton = ({ ...props }) => (
  <Button
    {...props}
    sx={{
      borderRadius: '28px',
      py: 2,
      px: 4,
      fontSize: '1rem',
      fontWeight: 700,
      textTransform: 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: '#00C8FF',
      color: '#000',
      '&:hover': {
        background: '#00B8E8',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(0,200,255,0.2)'
      },
      ...props.sx
    }}
  />
);

const CartPage = () => {
  const { user, checkAuth } = useUser();
  const { enqueueSnackbar } = useSnackbar();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCartItems = useCallback(async () => {
    try {
      let items: CartItem[] = [];
  
      if (user) {
        const response = await axios.get('/api/cart', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const cartData = response.data?.cart || { items: [] };
  
        items = cartData.items.map((item: any) => ({
          type: item.type,
          id: item.id,
          quantity: item.quantity,
          details: item.details
        }));
      } else {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        items = localCart;
      }
  
      const detailedItems = await Promise.all(items.map(async (item) => {
        try {
          if (item.details) return item;
  
          if (item.type === 'character') {
            const res = await axios.get(`/api/marvel/fulldatacharacter/${item.id}`);
            return { ...item, details: res.data };
          } else if (item.type === 'offer') {
            const res = await axios.get(`/api/offers/${item.id}`);
            return { ...item, details: res.data };
          }
        } catch (error) {
          console.error('Error fetching item details:', error);
          return { ...item, details: null };
        }
      }));
  
      setCartItems(detailedItems.filter(item => item.details !== null));
  
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('The cart cannot be accessed right now');
      enqueueSnackbar('Error loading cart', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user, enqueueSnackbar, checkAuth]);
  
  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      
      if (!user) {
        enqueueSnackbar('You need to be logged in to make a payment', { variant: 'error' });
        return;
      }

      const offerItems = cartItems.filter(i => i.type === 'offer');
      const characterItems = cartItems.filter(i => i.type === 'character');
      
      let coinsFromOffers = 0;
      let characterCost = 0;
      
      for (const item of offerItems) {
        coinsFromOffers += (item.details?.coins || 0) * item.quantity;
        if (item.details?.bonus) {
          coinsFromOffers += item.details.bonus * item.quantity;
        }
      }
      
      for (const item of characterItems) {
        characterCost += (item.details?.price || 0) * item.quantity;
      }
      
      const expectedCoins = (user.coins || 0) + coinsFromOffers;
      
      if (expectedCoins < characterCost) {
        enqueueSnackbar(
          `You don't have enough coins even after purchasing the offers (${expectedCoins}/${characterCost})`, 
          { variant: 'error' }
        );
        return;
      }
      
      if (offerItems.length > 0) {
        await axios.post(
          '/api/cart/checkout/offers',
          {},
          { 
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('token')}` 
            } 
          }
        );
        await checkAuth(); 
      }
      
      if (characterItems.length > 0) {
        await axios.post(
          '/api/cart/checkout/characters',
          {},
          { 
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('token')}` 
            } 
          }
        );
      }
      
      const totalCharacters = characterItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalOffers = offerItems.reduce((sum, item) => sum + item.quantity, 0);
      
      enqueueSnackbar(
        `Purchase completed! ${totalCharacters} Characters and ${totalOffers} offers`, 
        { 
          variant: 'success',
          autoHideDuration: 4000,
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        }
      );
      
      await fetchCartItems();
      await checkAuth();
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      let errorMessage = 'Error processing payment';
      if (error.response) {
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `Error ${error.response.status}`;
      }
  
      enqueueSnackbar(errorMessage, { 
        variant: 'error',
        autoHideDuration: 4000,
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleUpdateQuantity = async (
    itemId: string,
    type: 'character' | 'offer',
    newQuantity: number
  ) => {
    try {
      if (newQuantity <= 0) {
        handleRemoveItem(itemId, type);
        return;
      }
  
      const safeQuantity = Math.max(1, Math.min(newQuantity, 100));
  
      if (user) {
        await axios.put(
          `/api/cart/update/${type}/${itemId}`,
          { quantity: safeQuantity },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      } else {
        const updatedCart = cartItems.map((item) => {
          if (item.id === itemId && item.type === type) {
            return { ...item, quantity: safeQuantity };
          }
          return item;
        });
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
  
      fetchCartItems();
    } catch (error) {
      enqueueSnackbar('Error updating quantity', { variant: 'error' });
    }
  };
  
  const handleRemoveItem = async (
    itemId: string,
    type: 'character' | 'offer'
  ) => {
    try {
      if (user) {
        await axios.delete(
          `/api/cart/remove/${type}/${itemId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      } else {
        const updatedCart = cartItems.filter(
          (item) => !(item.id === itemId && item.type === type)
        );
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
  
      enqueueSnackbar('Product removed from cart', { variant: 'success' });
      fetchCartItems();
    } catch (error) {
      enqueueSnackbar('Error deleting product', { variant: 'error' });
    }
  };
  

  const calculateOffersTotal = () => {
    return cartItems
      .filter(item => item.type === 'offer')
      .reduce((total, item) => total + (item.details?.price || 0) * item.quantity, 0);
  };

  const calculateCharactersTotal = () => {
    return cartItems
      .filter(item => item.type === 'character')
      .reduce((total, item) => total + (item.details?.price || 0) * item.quantity, 0);
  };


  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  if (loading) {
    return (
      <Box sx={{ 
        background: '#121212', 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <CircularProgress size={60} sx={{ color: '#00C8FF' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        background: '#121212', 
        minHeight: '100vh',
        textAlign: 'center', 
        py: 10
      }}>
        <Typography variant="h4" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ background: '#121212', minHeight: '100vh' }}>
      <NavBar />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid>
            <Box sx={{ 
              bgcolor: '#1a1a1a',
              p: 3,
              mb: 4,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
              maxWidth:560,
            }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 800,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: 'white'
              }}>
                Offers
                <Chip 
                  label={`${cartItems.filter(i => i.type === 'offer').length} Products`} 
                  sx={{ 
                    borderRadius: '12px', 
                    fontSize: '0.875rem', 
                    height: '32px',
                    background: '#00C8FF',
                    color: '#000'
                  }} 
                />
              </Typography>
  
              {cartItems.filter(i => i.type === 'offer').map((item) => (
                <Card key={`${item.type}-${item.id}`} sx={{ 
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderRadius: 3,
                  overflow: 'visible',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  mb: 3,
                  background: '#1a1a1a',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }
                }}>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      right: -12,
                      top: -12,
                      bgcolor: '#00C8FF',
                      color: '#000',
                      '&:hover': { bgcolor: '#00B8E8' }
                    }}
                    onClick={() => handleRemoveItem(item.id, item.type)}
                  >
                    <Close />
                  </IconButton>
  
                  <Grid container spacing={2}>
                    <Grid>
                    <CardMedia
                        component="img"
                        sx={{ 
                          height: 220,
                          width:300,
                          objectFit: 'cover',
                          borderRadius: '16px 0 0 16px'
                        }}
                        image={item.details?.image ?? 'https://via.placeholder.com/150'}
                        alt={item.details?.title ?? 'Offer'}
                      />
                    </Grid>
                    
                    <Grid>
                      <CardContent sx={{ pt: 3 }}>
                      <Typography  sx={{ 
                          fontWeight: 700, 
                          mb: 1, 
                          fontSize: '20px',
                          color: 'white',
                          width:200,
                        }}>
                          {item.details?.title ?? 'Name unavailable'}
                        </Typography>
                        
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <TextField
                            variant="outlined"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              handleUpdateQuantity(item.id, item.type, value);
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleUpdateQuantity(item.id, item.type, item.quantity - 1)}
                                    sx={{ color: '#00C8FF' }}
                                  >
                                    <Remove fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleUpdateQuantity(item.id, item.type, item.quantity + 1)}
                                    disabled={item.quantity >= 100}
                                    sx={{ color: '#00C8FF' }}
                                  >
                                    <Add fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              ),
                              sx: { 
                                width: '120px',
                                'input': { 
                                  textAlign: 'center', 
                                  py: 0.5,
                                  color: 'white'
                                },
                                background: 'rgba(255,255,255,0.1)',
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: 'white'
                              }
                            }}
                          />
                          <Chip 
                            label={`${item.details?.coins ?? 0} Coins`}
                            size="small"
                            sx={{ 
                              borderRadius: '8px',
                              background: '#00C8FF',
                              color: '#000'
                            }}
                          />
                        </Stack>
  
                        <Stack direction="row" spacing={4} >
                          <Box>
                            <Typography variant="caption" sx={{ color: '#b0b0b0' }}>PRICE</Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                              ${((item.details?.price ?? 0) * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#b0b0b0' }}>CHARACTERS</Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                              {item.details?.includedCharacters?.length ?? 0}
                            </Typography>
                          </Box>
                        </Stack>
  
                        {item.details?.bonus > 0 && (
                          <Typography variant="body2" sx={{ mb: 2, color: '#00C8FF' }}>
                            +{item.details.bonus} Bonus Coins
                          </Typography>
                        )}
                      </CardContent>
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Box>
            <Box sx={{ 
              bgcolor: '#1a1a1a',
              p: 3,
              mb: 4,
              borderRadius: 3,
              maxWidth:550,
              boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
            }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 700,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: 'white'
              }}>
                Characters
                <Chip 
                  label={`${cartItems.filter(i => i.type === 'character').length} Produse`} 
                  sx={{ 
                    borderRadius: '12px', 
                    fontSize: '0.875rem', 
                    height: '32px',
                    background: '#00C8FF',
                    color: '#000'
                  }} 
                />
              </Typography>
  
              {cartItems.filter(i => i.type === 'character').map((item) => (
                <Card key={`${item.type}-${item.id}`} sx={{ 
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderRadius: 3,
                  overflow: 'visible',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  mb: 3,
                  background: '#1a1a1a',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }
                }}>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      right: -12,
                      top: -12,
                      bgcolor: '#00C8FF',
                      color: '#000',
                      '&:hover': { bgcolor: '#00B8E8' }
                    }}
                    onClick={() => handleRemoveItem(item.id, item.type)}
                  >
                    <Close />
                  </IconButton>
  
                  <Grid container spacing={2}>
                    <Grid>
                      <CardMedia
                        component="img"
                        sx={{ 
                          height: 220,
                          width:280,
                          objectFit: 'cover',
                          borderRadius: '16px 0 0 16px'
                        }}
                        image={`${item.details?.thumbnail?.path}.${item.details?.thumbnail?.extension}`}
                        alt={item.details?.name ?? 'Character'}
                      />
                    </Grid>
                    
                    <Grid>
                      <CardContent sx={{ pt: 3 }}>
                        <Typography  sx={{ 
                          fontWeight: 700, 
                          mb: 1, 
                          fontSize: '20px',
                          color: 'white',
                          width:200,
                        }}>
                          {item.details?.name ?? 'Personaj necunoscut'}
                        </Typography>
                        
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <Chip 
                            label={(item.details?.rarity ?? 'commun').toUpperCase()} 
                            size="small" 
                            sx={{ 
                              borderRadius: '8px',
                              background: '#00C8FF',
                              color: '#000'
                            }} 
                          />
                          <TextField
                            variant="outlined"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              handleUpdateQuantity(item.id, item.type, value);
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleUpdateQuantity(item.id, item.type, item.quantity - 1)}
                                    sx={{ color: '#00C8FF' }}
                                  >
                                    <Remove fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleUpdateQuantity(item.id, item.type, item.quantity + 1)}
                                    disabled={item.quantity >= 100}
                                    sx={{ color: '#00C8FF' }}
                                  >
                                    <Add fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              ),
                              sx: { 
                                width: '120px',
                                'input': { 
                                  textAlign: 'center', 
                                  py: 0.5,
                                  color: 'white'
                                },
                                background: 'rgba(255,255,255,0.1)',
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: 'white'
                              }
                            }}
                          />
                        </Stack>
                        <Stack direction="row" spacing={4} >
                          <Box>
                            <Typography variant="caption" sx={{ color: '#b0b0b0' }}>PRICE</Typography>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Coin size={30}/>
                              {((item.details?.price ?? 0) * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Comics</Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                              {item.details?.comics?.available ?? 0}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Box>
          </Grid>
          <Grid>
            <Box sx={{ 
              position: 'sticky',
              top: 24,
              maxWidth:450,
              bgcolor: '#1a1a1a',
              p: 3,
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(0,0,0,0.08)'
            }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 800,
                mb: 3,
                color: 'white'
              }}>
                Order summary
              </Typography>
  
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Cod promoțional"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <PremiumButton sx={{ 
                        py: 1,
                        px: 3,
                        fontSize: '0.875rem'
                      }}>
                        Apply
                      </PremiumButton>
                    </InputAdornment>
                  ),
                  sx: { 
                    borderRadius: '28px',
                    background: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '& input': {
                      color: 'white'
                    }
                  }
                }}
                sx={{ mb: 3 }}
              />
  
              <Stack spacing={2} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h4" fontWeight={800} sx={{ color: 'white' }}> Offers</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color: 'white' }}>
                    $ {calculateOffersTotal().toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h4" fontWeight={800} sx={{ color: 'white' }}>Characters</Typography>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Coin size={40}/>
                    {calculateCharactersTotal().toFixed(2)}
                  </Typography>
                </Box>
              </Stack>  
              <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />                    
              <PremiumButton 
                fullWidth 
                sx={{ mb: 2 }}
                onClick={handleCheckout}
                disabled={checkoutLoading || cartItems.length === 0}
              >
                {checkoutLoading ? (
                  <CircularProgress size={24} sx={{ color: '#000' }} />
                ) : (
                  'Complete Everything'
                )}
              </PremiumButton>
  
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  borderRadius: '28px',
                  py: 2,
                  px: 4,
                  fontSize: '1rem',
                  fontWeight: 700,
                  border: '2px solid #00C8FF',
                  color: '#00C8FF',
                  '&:hover': { 
                    border: '2px solid #00C8FF',
                    background: 'rgba(0,200,255,0.1)'
                  }
                }}
              >
                Payment with PayPal
              </Button>
  
              <Typography variant="body2" sx={{ 
                mt: 3,
                textAlign: 'center',
                color: '#b0b0b0'
              }}>
                🛡️ 256-bit SSL Securit
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
};

export default CartPage;