import { useState } from 'react';
import { Button, CircularProgress, IconButton, Box } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useUser } from '../contexts/UserContext';

const AddToCartButton = ({ productId, quantity = 1, iconOnly = false, width = '160px', align = 'left' }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user, checkAuth } = useUser();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      enqueueSnackbar('Please log in to add products', {
        variant: 'warning',
        autoHideDuration: 3000
      });
      return;
    }

    try {
      setLoading(true);
      const numericProductId = Number(productId);

      if (isNaN(numericProductId)) {
        throw new Error('Invalid product ID');
      }

      const safeQuantity = Math.max(1, Math.min(Number(quantity), 100));

      const response = await axios.post(
        '/api/cart/add',
        {
          type: 'character',
          itemId: numericProductId,
          quantity: safeQuantity
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await checkAuth();

      window.dispatchEvent(new CustomEvent('cart-updated', {
        detail: response.data.cart
      }));

      enqueueSnackbar(' Product added to cart!', {
        variant: 'success',
        autoHideDuration: 2000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right'
        }
      });

    } catch (error) {
      console.error('Error adding to cart:', error);

      let errorMessage = 'Unknown error';
      if (error.response) {
        errorMessage = error.response.data?.error || `Error ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'The server did not respond';
      } else {
        errorMessage = error.message;
      }

      enqueueSnackbar(`Error: ${errorMessage}`, {
        variant: 'error',
        autoHideDuration: 4000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right'
        }
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Box
      sx={{
        width: width,
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : 'flex-start'
      }}
    >
      {iconOnly ? (
        <IconButton
          onClick={handleAddToCart}
          disabled={loading || !user}
          sx={{
            color: 'white',
            transition: 'transform 0.2s ease',
            '&:hover:not(:disabled)': {
              transform: 'scale(1.1)'
            },
            '&.Mui-disabled': {
              color: 'grey.400'
            }
          }}
        >
          {loading ? (
            <CircularProgress 
              size={24} 
              thickness={4}
              sx={{ color: 'grey.600', animationDuration: '800ms' }} 
            />
          ) : (
            <ShoppingCart fontSize="medium" />
          )}
        </IconButton>
      ) : (
        <Button
          variant="contained"
          onClick={handleAddToCart}
          disabled={loading || !user}
          sx={{
            width: '100%',    
            py: 1.5,
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            backgroundColor: '#00C8FF',
            '&:hover:not(:disabled)': {
              transform: 'translateY(-2px)',
              boxShadow: 3
            },
            '&.Mui-disabled': {
              backgroundColor: 'grey.300',
              color: 'grey.600'
            }
          }}
        >
          {loading ? (
            <CircularProgress 
              size={24} 
              thickness={4}
              sx={{ color: 'grey.600', animationDuration: '800ms' }} 
            />
          ) : (
            'Add To Cart'
          )}
        </Button>
      )}
    </Box>
  );
};

export default AddToCartButton;
