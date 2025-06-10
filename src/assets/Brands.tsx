import { Box, Typography,  styled, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import {  useRef } from 'react';

const brands = [
  { name: 'MARVEL', image: 'https://cdn.displate.com/artwork/380x270/2023-02-20/8b72d6683a9e691f64df0a7928ce27f0_2efd0733c7ccef2c9d4435ca5c068501.jpg'},
  { name: 'STAR WARS', image: 'https://retrododo.com/content/images/size/w1600/wp-content/uploads/2023/12/upcoming-star-wars-games-logo.jpg'},
  { name: 'TRANSFORMERS', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7aFPfrQnp3BNLCdv--P9VSZDxm3_z93N83Q&s' },
  { name: 'Disney', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3ePi1xsAEUiXYCNJgY0GP8kslsN_c6Bul8g&s' },
  { name: 'DC', image: 'https://platform.theverge.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/15820440/DC_Logo_Blue_Final_573b356bd056a9.41641801.0.0.1463512068.jpg?quality=90&strip=all&crop=0,5.5555555555556,100,88.888888888889' },
  { name: 'Warner Bros', image: 'https://logowik.com/content/uploads/images/warner-bros-pictures-2023-alternative-logo48605.logowik.com.webp' }
];

const CarouselContainer = styled(Box)({
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  padding: '40px 0'
});

const CarouselTrack = styled(motion.div)({
  display: 'flex',
  width: 'max-content',
  animation: 'scroll 40s linear infinite',
  '@keyframes scroll': {
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-50%)' }
  }
});

const BrandCard = styled(Box)(() => ({
  position: 'relative',
  margin: '0 20px',
  width: '300px',
  height: '200px',
  borderRadius: '12px',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  '&:hover': {
    transform: 'scale(1.05)'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(180deg, ${alpha('#000', 0)} 0%, ${alpha('#000', 0.2)} 100%)`
  }
}));

const BrandSection = () => {
  const trackRef = useRef<HTMLDivElement>(null);

  const duplicatedBrands = [...brands, ...brands];

  return (
    <Box sx={{
      py: 8,
      px: { xs: 2, md: 6 },
      position: 'relative'
    }}>
      <Typography variant="h3" sx={{
        textAlign: 'center',
        mb: 6,
        fontWeight: 800,
        fontSize: '2.5rem',
        position: 'relative',
        zIndex: 1,
        color:'white'
      }}>
        OUR BRANDS
      </Typography>

      <CarouselContainer>
        <CarouselTrack ref={trackRef}>
          {duplicatedBrands.map((brand, index) => (
            <BrandCard key={`${brand.name}-${index}`}>
              <Box
                component="img"
                src={brand.image}
                alt={brand.name}
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </BrandCard>
          ))}
        </CarouselTrack>
      </CarouselContainer>
    </Box>
  );
};

export default BrandSection;