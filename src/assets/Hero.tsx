import React, { useRef } from 'react';
import { Box, Card, CardMedia, IconButton } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import 'swiper/css';
import 'swiper/css/navigation';

const slides = [
  {
    title: 'Avangers',
    image: 'https://alltimelines.com/wp-content/uploads/2019/10/amalgam-banner.jpg',
  },
  {
    title: 'StarWars',
    image: 'https://i.redd.it/5isxex9k0h551.jpg',
  },
  {
    title: 'Marvel Heroes',
    image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/dc49df67-8273-417d-aca0-239ff4c726f4/d4dis4x-d1f110b6-06e6-4ee8-99f5-8ec2bd838b77.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2RjNDlkZjY3LTgyNzMtNDE3ZC1hY2EwLTIzOWZmNGM3MjZmNFwvZDRkaXM0eC1kMWYxMTBiNi0wNmU2LTRlZTgtOTlmNS04ZWMyYmQ4MzhiNzcucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.sJqg36WmuTef8xhYpVffs6Yhv_LzYrzPj7gkXaB5xko',
  },
  {
    title: 'DC',
    image: 'https://storytellingdb.com/wp-content/uploads/2019/10/homepagebanner-dc.jpg',
  },
  {
    title: 'Harry Potter',
    image: 'https://www.halfmoonbayshop.co.uk/cdn/shop/collections/HMB_Shop_Brand_Banners37.jpg?v=1652883750',
  }
];

const FancySwiper: React.FC = () => {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 450,
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <IconButton
        ref={prevRef}
        sx={{
          position: 'absolute',
          top: '50%',
          left: 50,
          zIndex: 2,
          transform: 'translateY(-50%)',
          backgroundColor: '#fff',
          boxShadow: 2,
          display:{md:"inherit",sm:'none'},
          '&:hover': { backgroundColor: '#f5f5f5' },
        }}
      >
        <ChevronLeft />
      </IconButton>
      <IconButton
        ref={nextRef}
        sx={{
          position: 'absolute',
          top: '50%',
          right: 50,
          zIndex: 2,
          transform: 'translateY(-50%)',
          backgroundColor: '#fff',
          boxShadow: 2,
          display:{md:"inherit",sm:'none'},
          '&:hover': { backgroundColor: '#f5f5f5' },
        }}
      >
        <ChevronRight />
      </IconButton>

      <Swiper
        modules={[Navigation, Autoplay]}
        loop
        spaceBetween={10}
        centeredSlides={true}
        slidesPerView={1.5}
        initialSlide={1}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          // @ts-ignore
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-ignore
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        breakpoints={{
          0:{
            slidesPerView: 1.0,
          },
          600: {
            slidesPerView: 1.1,
          },
          900: {
            slidesPerView: 1.4,
          },
          1200: {
            slidesPerView: 1.2,
          },
        }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <Card
              sx={{
                mt: 10,
                height: 350,
                borderRadius: 4,
                boxShadow: 4,
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardMedia
                component="img"
                image={slide.image}
                alt={slide.title}
                sx={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'cover',
                }}
              />
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

export default FancySwiper;
