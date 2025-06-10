import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { Box, Typography,  Paper, Grid, LinearProgress, Container } from "@mui/material";
import {  Bolt, TrendingUp } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import AddToCartButton from "./AddToCartButton";
import Coin from "./Coin";

const FlashDeal = () => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const storedEndTime = localStorage.getItem("flashDealEndTime");
    const endTime = storedEndTime ? parseInt(storedEndTime) : Date.now() + 4 * 3600 * 1000 + 36 * 60 * 1000 + 4 * 1000;
    if (!storedEndTime) {
      localStorage.setItem("flashDealEndTime", endTime.toString());
    }
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    return { totalSeconds: remaining, hours, minutes, seconds };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.totalSeconds <= 0) {
          clearInterval(interval);
          return { totalSeconds: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        const totalSeconds = prev.totalSeconds - 1;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return { totalSeconds, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  const formatTime = (value: number) => value.toString().padStart(2, "0");

  return (
    <FlashDealContainer sx={{mb:15}}>
      <Container maxWidth='xl'>
        <Grid container spacing={5}>
          <Grid marginRight={1}>
            <Link to={`/product/1009368`} style={{ textDecoration: 'none' }}>
              <MainDealCard>
                <TimerContainer>
                  <Bolt sx={{ color: '#00C8FF', fontSize: 28 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "white" }}>
                    Flash Deal
                  </Typography>
                </TimerContainer>
                <TimeBox color={"white"}>
                  <TimeSegment>
                    <Typography variant="h4">{formatTime(timeLeft.hours)}</Typography>
                    <Typography variant="caption">HOURS</Typography>
                  </TimeSegment>
                  <TimeSeparator>:</TimeSeparator>
                  <TimeSegment>
                    <Typography variant="h4">{formatTime(timeLeft.minutes)}</Typography>
                    <Typography variant="caption">MINUTES</Typography>
                  </TimeSegment>
                  <TimeSeparator>:</TimeSeparator>
                  <TimeSegment>
                    <Typography variant="h4">{formatTime(timeLeft.seconds)}</Typography>
                    <Typography variant="caption">SECONDS</Typography>
                  </TimeSegment>
                </TimeBox>
                <DealImage
                  src={'https://imgcdn.stablediffusionweb.com/2024/10/30/89fa1ee1-dde3-4d4d-b44c-cf88a5314d42.jpg'} 
                  sx={{
                    height: 450,
                    width: "100%",
                    objectFit: 'cover',
                  }}
                />
                <Typography variant="h4" sx={{ color: "white", fontWeight: 700, mt: 1 }}>
                  Iron Man
                </Typography>
                <PriceRow>
                  <Box display="flex" alignItems="center" mt={2}>
                    <Coin size={40} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }} ml={1}>24.99</Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ textDecoration: "line-through", color: "#999", marginTop: 2 }}
                  >
                    29.99
                  </Typography>
                  <Box sx={{ marginTop: 2 }}>
                    <DiscountText>-16%</DiscountText>
                  </Box>
                </PriceRow>
                <LinearProgress
                  variant="determinate"
                  value={70}
                  sx={{ height: 8, borderRadius: 4, my: 2 }}
                />
                <AddToCartButton  width={'100%'}productId={1009368} />
              </MainDealCard>
            </Link>
          </Grid>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Grid>
              <TrendingSection>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <TrendingUp sx={{ color: '#00C8FF' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                    More currently trending offers
                  </Typography>
                </Box>
                <Box sx={{ display: {xl:"flex", md:'relativ'}, gap: 2, mb: 2 }}>
                  {[
                    {
                      id: 1009351,
                      image: "https://www.superherohype.com/wp-content/uploads/sites/4/2023/12/Giant-Size-Hulk.jpg?w=1024",
                      title: "Hero",
                      name: "Hulk",
                      price: 19.99,
                    },
                    {
                      id: 1009220,
                      image: "https://img.asmedia.epimg.net/resizer/v2/OBJTVLMDMJBODL2QUAPXTCJVXI.jpg?auth=b6060831d1fc09f4a13503effda96e7aff9864594aab80153acb157924d03898&width=1472&height=1104&smart=true",
                      title: "Hero",
                      name: "Captain America",
                      price: 19.99,
                    },
                  ].map((deal) => (
                    <Link key={deal.id} to={`/product/${deal.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                      <TrendingCard sx={{ display: {sm:"flex"}, alignItems: "center", gap:2,mb:2 ,mr:2}}>
                        <Box
                          component="img"
                          src={deal.image}
                          alt={deal.name}
                          sx={{ width: {lg:200,sm:171,xs:'100%'}, height: {lg:200,sm:171,xs:150}, borderRadius: 2, objectFit: "cover" }}
                        />
                        <Box sx={{ color: "white" }}>
                          <Typography variant="caption">
                            {deal.title}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {deal.name}
                          </Typography>
                          <PriceRow>
                          <Coin size={30} />
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                              {deal.price.toFixed(2)}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ textDecoration: "line-through", color: "#999", ml: 1 }} 
                            >
                              {(deal.price * 1.2).toFixed(2)}
                            </Typography>
                            <DiscountText>-20%</DiscountText>
                          </PriceRow>
                        </Box>
                      </TrendingCard>
                    </Link>
                  ))}
                </Box>
                <Box sx={{ display: {xl:"flex", md:'relativ'}, gap: 2, mb: 2 }}>
                  {[
                    {
                      id: 1009664,
                      image: "https://www.gamespot.com/a/uploads/scale_landscape/171/1712892/3311332-thor-facebook.jpg", 
                      title: "Hero",
                      name: "Thor",
                      price: 19.99,
                    },
                    {
                      id: 1009189,
                      image: "https://w0.peakpx.com/wallpaper/720/238/HD-wallpaper-black-widow-marvel-illustration-black-widow-superheroes-artist-artwork-digital-art-artstation.jpg", 
                      title: "Hero",
                      name: "Black Widow",
                      price: 19.99,
                    },
                  ].map((deal) => (
                    <Link key={deal.id} to={`/product/${deal.id}`} style={{ textDecoration: 'none', flex: 1}}
                    >
                      <TrendingCard sx={{ display: {sm:"flex"}, alignItems: "center",color:'white', gap:2,mb:2 ,mr:2}}>
                        <Box
                          component="img"
                          src={deal.image}
                          alt={deal.name}
                          sx={{ width: {lg:200,sm:171,xs:'100%'}, height: {lg:200,sm:171,xs:150}, borderRadius: 2, objectFit: "cover" }}
                        />
                        <Box>
                          <Typography variant="caption">
                            {deal.title}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {deal.name}
                          </Typography>
                          <PriceRow>
                          <Coin size={30} />
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                              {deal.price.toFixed(2)}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ textDecoration: "line-through", color: "#999", ml: 1 }}
                            >
                              {(deal.price * 1.2).toFixed(2)}
                            </Typography>
                            <DiscountText>-20%</DiscountText>
                          </PriceRow>
                        </Box>
                      </TrendingCard>
                    </Link>
                  ))}
                </Box>
              </TrendingSection>
            </Grid>
          </Box>
        </Grid>
      </Container>
    </FlashDealContainer>
  );
};

const FlashDealContainer = styled(Box)({
  borderRadius: 8,
  padding: "50px",
  backgroundImage: `url("https://cdn.marvel.com/content/2x/custaorus2023_03_avegersbattle.jpg")`, 
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
});
const MainDealCard = styled(Paper)(({ theme }) => ({
  backgroundColor: "#1a1a1a",
  padding: "20px",
  borderRadius: 8,
  textAlign: "center",
  position: "relative",

  [theme.breakpoints.up("sm")]: {
    width: "100%",
    positon:'relativ',
    padding: 0,
  },
  [theme.breakpoints.up("md")]: {
    padding: "20px",
    width: "300px",
  },
  [theme.breakpoints.up("lg")]: {
    padding: "20px",
    width: "310px",
  },
  [theme.breakpoints.up("xl")]: {
    padding: "20px",
    width: "320px",
  },
}));
const TimerContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8
});
const TimeBox = styled(Box)({
  display: "flex",
  justifyContent: "center",
  gap: 8,
  marginTop: 8
});
const TimeSegment = styled(Box)({
  textAlign: "center"
});
const TimeSeparator = styled(Typography)({
  fontSize: "1.5rem",
  fontWeight: 700,
  color: "#00b3ff"
});
const DealImage = styled("img")({
  width: "100%",
  borderRadius: 8,
  marginTop: 12
});
const PriceRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  [theme.breakpoints.up("xs")]: {
    display:"relative",
  },
}));
const DiscountText = styled(Typography)({
  backgroundColor: '#00C8FF',
  color: "black",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: "0.8rem",
  fontWeight: 700
});
const TrendingSection =styled(Box)(({ theme }) => ({
  backgroundColor: "#1a1a1a",
  borderRadius: 8,
  padding: "20px",
  [theme.breakpoints.up("sm")]: {
    width:"100%",
  },
}));
const TrendingCard = styled(Paper)({
  padding: "15px",
  borderRadius: 8,
  backgroundColor: "#333",
  flex: 1,
  cursor: "pointer"
});

export default FlashDeal;