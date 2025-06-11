import React from 'react';
import { Box, styled } from '@mui/material';

const CoinContainer = styled(Box)({
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const CoinImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

interface CoinDisplayProps {
  size?: number;
}

const CoinDisplay: React.FC<CoinDisplayProps> = ({  size = 50 }) => {
  return (
    <CoinContainer sx={{ width: size, height: size }}>
      <CoinImage
        src="/coin.png"
        alt="Coin"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100';
        }}
      />
    </CoinContainer>
  );
};

export default CoinDisplay;
