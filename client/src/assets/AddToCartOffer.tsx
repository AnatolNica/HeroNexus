import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useUser } from '../contexts/UserContext';

const AddToCartOffer = ({ offerId, quantity = 1 }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post(
        '/api/cart/add',
        {
          type: 'offer',
          itemId: offerId, 
          quantity: Math.max(1, Math.min(quantity, 100))
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        enqueueSnackbar('Offer added!', { variant: 'success' });
        window.dispatchEvent(new Event('cart-updated'));
      }
  
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Unknown error';
      enqueueSnackbar(`Error: ${errorMessage}`, { variant: 'error' });
      
    } finally {
      setLoading(false);
    }
  };

  return (
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
          sx={{ 
            color: 'grey.600',
            animationDuration: '800ms' 
          }} 
        />
      ) : (
        'Add Offer'
      )}
    </Button>
  );
};

export default AddToCartOffer;
