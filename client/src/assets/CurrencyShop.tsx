import  { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import AddToCartOffer from './AddToCartOffer';
import Coin from './Coin';

const StyledSwiper = styled(Swiper)({
  padding: '0 64px!important',
  '.swiper-slide': {
    display: 'flex',
    justifyContent: 'center',
  },
});
const ImageBox = styled(Box)({
  width: '100%',
  height: '350px',
  overflow: 'hidden',
  position: 'relative',
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});
const NavigationButton = styled('button')({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: '#333',
  color: '#FFF',
  width: '48px',
  height: '48px',
  zIndex: 10,
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  transition: 'all 0.3s',
  '&:hover': {
    backgroundColor: '#555',
  },
  '&.Mui-disabled': {
    opacity: 0.3,
  },
});
const PrevButton = styled(NavigationButton)({
  left: 32,
  fontSize:30,
});
const NextButton = styled(NavigationButton)({
  right: 32,
  fontSize:30,
});

const CurrencyShop = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch('/api/offers');
        if (!response.ok) throw new Error('Failed to fetch offers');
        const data = await response.json();
        if (Array.isArray(data)) {
          setOffers(data);
        } else if (data && Array.isArray(data.offers)) {
          setOffers(data.offers);
        } else {
          console.error('Unexpected data format:', data);
          setOffers([]);
        }
      } catch (err: any) {
        console.error('Error fetching offers:', err);
        setError(err.message || 'Unknown error');
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: 6, minHeight: '90vh', mb: 10 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" fontWeight="bold" gutterBottom color="white">
          Virtual Currency Shop
        </Typography>
        <Typography variant="subtitle1" color="gray">
          Choose the right package and get special bonuses!
        </Typography>
      </Box>
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
          }}
        >
          <Typography>Loading offers...</Typography>
        </Box>
      ) : offers.length === 0 ? (
        <Typography>No offers available.</Typography>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <PrevButton id="prevRef">&#8249;</PrevButton>
          <NextButton id="nextRef">&#8250;</NextButton>
          <StyledSwiper
            modules={[Navigation]}
            navigation={{
              prevEl: '#prevRef',
              nextEl: '#nextRef',
            }}
            spaceBetween={32}
            breakpoints={{
              0: { slidesPerView: 1 },
              600: { slidesPerView: 2 },
              900: { slidesPerView: 2 },
              1200: { slidesPerView: 3 },
              1600: { slidesPerView: 4 },
            }}
          >
            {offers.map((pkg, index) => {
              const totalCoins = pkg.coins + pkg.bonus;
              return (
                <SwiperSlide key={pkg._id || index}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <Card
                      sx={{
                        mt:1,
                        mb:2,
                        bgcolor: '#1a1a1a',
                        width: '100%',
                        height: 510,
                        borderRadius: '20px',
                        transition: 'transform 0.3s ease',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                        },
                      }}
                    >
                      {pkg.bestValue && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: '#facc15',
                            color: '#0f172a',
                            fontWeight: 'bold',
                            px: 2,
                            py: 0.5,
                            borderRadius: '12px',
                            zIndex: 10,
                            boxShadow: 3,
                            fontSize: '0.8rem',
                          }}
                        >
                           Best Offer
                        </Box>
                      )}
                      {pkg.limited && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: '#ef4444',
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                          }}
                        >
                          Limited offer
                        </Box>
                      )}
                      <CardContent sx={{ padding: 0 }}>
                        <Box
                          sx={{
                            height: 250,
                            mb: 2,
                            overflow: 'hidden',
                            position: 'relative',
                            borderRadius: '20px 20px 0 0',
                          }}
                        >
                          <ImageBox>
                            <img
                              src={`${pkg.image}`}
                              alt={`Offer ${pkg.coins}`}
                            />
                            {pkg.bonus > 0 && (
                              <Chip
                                label={`+${pkg.bonus} bonus`}
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  backgroundColor: '#00C8FF',
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                            )}
                          </ImageBox>
                        </Box>
                        <Box p={1}>
                          <Box display="flex" alignItems="center" gap={1} mb={1} ml={-0.5}>
                            <Coin size={50} fontSize="large" sx={{ color: pkg.color }} />
                            <Typography variant="h5" fontWeight="bold" color={'white'}>
                              {totalCoins.toLocaleString()} Coins
                            </Typography>
                          </Box>
                          {pkg.heroesCount && (
                            <Typography variant="body2" color="lightgray" mb={1}>
                              Includes {pkg.heroesCount} hero{pkg.heroesCount > 1 ? 'es' : ''}
                            </Typography>
                          )}
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" fontWeight="bold" color="white" sx={{ mt: 2 }}>
                              ${pkg.price.toFixed(2)}
                            </Typography>
                            {pkg.includedCharacters?.length > 0 && (
                              <Typography
                                variant="caption"
                                sx={{ mt: 2, textAlign: 'right',
                                  borderRadius:5,
                                  padding:0.5,
                                  backgroundColor: 'rgb(52, 47, 189)',
                                  color: 'white',
                                 }}
                              >
                                {pkg.includedCharacters.length} character{pkg.includedCharacters.length !== 1 ? 's' : ''}
                              </Typography>
                            )}
                          </Box>
                          <Box mt={2} bgcolor={'#121212'} p={1} borderRadius={2} textAlign="center">
                            <Typography variant="caption" color="white">
                              {pkg.type === 'bundle' ? 'Special bundle' : 'Currency for buying Heroes'}
                            </Typography>
                          </Box>
                          <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <AddToCartOffer offerId={pkg._id} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </SwiperSlide>
              );
            })}
          </StyledSwiper>
        </Box>
      )}
      <Box mt={6} textAlign="center" color="gray">
        <Typography variant="body2">All prices are in USD. Currency can be used in your favorite games.</Typography>
        <Typography variant="body2" mt={1}>
          Questions? Contact us at{' '}
          <span style={{ color: '#00C8FF', textDecoration: 'underline', cursor: 'pointer' }}>
            support@yourgames.com
          </span>
        </Typography>
      </Box>
    </Box>
  );
};

export default CurrencyShop;