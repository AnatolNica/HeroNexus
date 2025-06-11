import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  styled,
  CircularProgress
} from '@mui/material';
import { ChevronLeft, ChevronRight, Height } from '@mui/icons-material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import type SwiperCore from 'swiper';
import { useNavigate } from 'react-router-dom';
import AddToCartButton from './AddToCartButton';
import Coin from './Coin';

const StyledSwiper = styled(Swiper)({
  padding: '0 64px!important',
  '.swiper-slide': {
    display: 'flex',
    justifyContent: 'center',
  },
});

const ProductCard = styled(Box)({
  width: '440px',
  height: '500px',
  backgroundColor: '#1C1C1C',
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  cursor: 'pointer',
  transition: 'transform 0.3s',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'scale(1.03)',
  },
});

const ImageBox = styled(Box)({
  width: '100%',
  height: '380px',
  overflow: 'hidden',
  position: 'relative',
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

const CartButton = styled(IconButton)({
  position: 'absolute',
  bottom: 16,
  right: 16,
  backgroundColor: '#00C8FF!important',
  color: '#fff!important',
  padding: '10px!important',
  transition: 'all 0.3s!important',
  '&:hover': {
    backgroundColor: '#00B0E0!important',
    transform: 'scale(1.1)',
  },
}

);

const NavigationButton = styled(IconButton)({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: '#333!important',
  color: '#FFF!important',
  width: '48px!important',
  height: '48px!important',
  zIndex: 10,
  '&:hover': {
    backgroundColor: '#555!important',
  },
  '&.Mui-disabled': {
    opacity: '0.3!important',
  },
});

const RarityLabel = styled(Typography)({
  position: 'absolute',
  top: 16,
  left: 16,
  backgroundColor: '#00C8FF',
  color: 'white',
  fontWeight: '700',
  fontSize: '12px',
  padding: '4px 8px',
  borderRadius: '8px',
  textTransform: 'uppercase',
  userSelect: 'none',
});

const TrendingSwiper: React.FC = () => {
  const navigate = useNavigate();
  const [swiperInstance, setSwiperInstance] = useState<SwiperCore | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [characterDetails, setCharacterDetails] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchAllCharacters = async () => {
      setIsLoadingDetails(true);
      try {
        const response = await fetch('/api/marvel/batch-full-data');
        if (!response.ok) throw new Error('Failed to fetch full batch data');
        const data = await response.json();

        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 30);
        setCharacterDetails(shuffled);
      } catch (error) {
        console.error('Error fetching batch full data:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchAllCharacters();
  }, []);

  useEffect(() => {
    if (swiperInstance && characterDetails.length > 0) {
      swiperInstance.update();
      swiperInstance.navigation.init();
      swiperInstance.navigation.update();
    }
  }, [swiperInstance, characterDetails]);

  const handleCardClick = (character: any) => {
    navigate(`/product/${character.id}`, { state: { character } });
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Box sx={{ py: 8, mb:15}}>
      <Typography
        variant="h3"
        sx={{
          textAlign: 'center',
          mb: 6,
          fontWeight: 900,
          color: '#FFF',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}
      >
        MARVEL CHARACTERS
      </Typography>

      <Box sx={{ position: 'relative', mx: 'auto', minHeight: '500px' }}>
        {!(isLoadingDetails || showLoading) && (
          <>
            <NavigationButton
              ref={prevRef}
              sx={{ left: 32 }}
              disabled={isBeginning}
            >
              <ChevronLeft fontSize="large" />
            </NavigationButton>

            <NavigationButton
              ref={nextRef}
              sx={{ right: 32 }}
              disabled={isEnd}
            >
              <ChevronRight fontSize="large" />
            </NavigationButton>
          </>
        )}

        {(isLoadingDetails || showLoading) ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            position: 'absolute',
            width: '100%'
          }}>
            <CircularProgress
              sx={{
                color: '#00C8FF',
                animationDuration: '850ms',
              }}
              size={60}
              thickness={4}
            />
          </Box>
        ) : (
          <StyledSwiper
            modules={[Navigation]}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onSwiper={(swiper) => {
              swiper.navigation.init();
              swiper.navigation.update();
              setSwiperInstance(swiper);
            }}
            onInit={(swiper) => {
              swiper.navigation.init();
              swiper.navigation.update();
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            spaceBetween={32}
            breakpoints={{
              0: {
                slidesPerView: 1,
              },
              600: {
                slidesPerView: 2,
              },
              900: {
                slidesPerView: 2,
              },
              1200: {
                slidesPerView: 3,
              },
              1600: {
                slidesPerView: 4,
              }
            }}
          >
            {characterDetails.map((character) => (
              <SwiperSlide key={character.id} >
                <ProductCard onClick={() => handleCardClick(character)} marginTop={1} marginBottom={2}>
                  <ImageBox>
                    <img
                      src={`${character.thumbnail.path}.${character.thumbnail.extension}`}
                      alt={character.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/380x380';
                      }}
                    />
                    {character.rarity && (
                      <RarityLabel>{character.rarity}</RarityLabel>
                    )}
                  </ImageBox>
                  
                  <Box sx={{ p: 2, flexGrow: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#00C8FF',
                        fontWeight: 700,
                        fontSize: '14px',
                        display: 'block',
                        mb: 1,
                      }}
                    >
                      {character.comics?.available} Comics
                    </Typography>
                    <Typography
  variant="body2"
  sx={{
    color: 'white',
    fontWeight: 800,
    fontSize: '24px',
    mt: 3,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  }}
>
  <Coin size={32} />
  {character.price?.toFixed(2) ?? '9.99'}
</Typography>

                  </Box>
                  <CartButton onClick={handleAddToCartClick}>
                    <AddToCartButton width='20' productId={character.id} iconOnly />
                  </CartButton>
                </ProductCard>
              </SwiperSlide>
            ))}
          </StyledSwiper>
        )}
      </Box>
    </Box>
  );
};

export default TrendingSwiper;
