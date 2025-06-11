import React from 'react';
import { Box, Typography} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Coin from './Coin';
import AddToCartButton from './AddToCartButton';

interface PromoProps {
  leftLink: string;
  rightLink: string;
}

const GamePromo: React.FC<PromoProps> = () => {
  const navigate = useNavigate();

  return (
    <Box
    sx={{
        display:{sm:"flex",xs:'relative'},
        width:"100%",
        height:"500px",
        mb:{sm:25,xs:30},
        mt:20
    }}
    >
      <Box
        onClick={() => navigate(`product/1009282`)}
        sx={{
          width: {sm:'50%',sx:'100%'},
          position: 'relative',
          backgroundImage: 'url(https://static1.colliderimages.com/wordpress/wp-content/uploads/2022/02/doctor-strange-2-poster-social-featured.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: 'pointer',
          color: '#fff',
          borderRadius: {sm:'0 200px 0 0',xs:0},
          marginRight: {sm:'20px',xs:0},
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, p: 4, maxWidth: 400, marginTop: 20, marginLeft: {sm:'20%',xs:0} }}>
          <Typography variant="h4" fontWeight="bold">
          Doctor Strange Multiverse 
          </Typography>
          <Box display="flex" alignItems="center" mt={2}>
            <Coin />
            <Typography variant="h4" ml={1}>19.99</Typography>
          </Box>
          <Box sx={{marginTop:2}}>
<AddToCartButton productId={1009282}/>
</Box>
        </Box>
      </Box>
      <Box
        onClick={() => navigate(`/product/1014858`)}
        sx={{
          width: {sm:'50%',sx:'100%'},
          position: 'relative',
          backgroundImage: 'url(https://pbs.twimg.com/media/FFcdCZAUUAQ-e36?format=jpg&name=4096x4096)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: 'pointer',
          borderRadius: {sm:'0px 0px 0px 200px',xs:0},
          color: '#fff',
          marginLeft: {sm:'20px',xs:0},
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, p: 4, maxWidth: 400, ml: 'auto', marginTop: 20, marginRight: '23%' }}>
          <Typography variant="h4" fontWeight="bold">
          Spider-Man: No Way Home
          </Typography>
          <Box display="flex" alignItems="center" mt={2}>
            <Coin />
            <Typography variant="h4" ml={1}>14.99</Typography>
          </Box>
          <Box sx={{marginTop:2}}>
          <AddToCartButton productId={1014858}/>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default GamePromo;
