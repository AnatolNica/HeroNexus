import  { useRef, useState } from 'react';
import { 
  Box, Button, Typography
} from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';
import TradingFilters from '../assets/TradingFilter';
import NavBar from '../assets/NavBar';
import Footer from '../assets/Footer';
import CreateTradeMenu from '../assets/CreateTradeMenu';
import MarketplaceTrades from '../assets/MarketplaceTrades';

const TradingHub = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    username: '',
    minValue: 0,
    maxValue: 10000,
    dateRange: 'all',
    tradeType: 'all',
    characterName: '',
    timeOfDay: [0, 24]
  });
  const [tradesCount, setTradesCount] = useState(0);
  const [averageValue, setAverageValue] = useState(0);
  const itemsPerPage = 7;
  const [createTradeOpen, setCreateTradeOpen] = useState(false);
  const [tradeCreated, setTradeCreated] = useState(0);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTradeCreated = () => {
    setTradeCreated(prev => prev + 1);
    setCreateTradeOpen(false);
  };

  const updateTradeStats = (trades: any[]) => {
    setTradesCount(trades.length);
    
    if (trades.length > 0) {
      const totalValue = trades.reduce((sum, trade) => sum + (trade.tradeValue || 0), 0);
      setAverageValue(totalValue / trades.length);
    } else {
      setAverageValue(0);
    }
  };

  return (
    <>
      <NavBar />
      <Box sx={{ display: 'flex', minHeight: '100vh'}}>
        <TradingFilters
          filters={filters}
          setFilters={setFilters}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tradesCount={tradesCount}
          averageValue={averageValue}
        />

<Box 
  component="main" 
  ref={mainContainerRef}
  sx={{ flexGrow: 1, p: 4 }}
>
  <Box 
    sx={{ 
      display: {sm:'flex'}, 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      mb: 4 
    }}
  >
    <Typography 
      variant="h3" 
      gutterBottom 
      sx={{ 
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: '#00C8FF',
        bgcolor: 'white'
      }}
    >
      <SwapHoriz sx={{ mr: 2, transform: 'rotate(90deg)' }} />
      Collector's Exchange Hub
    </Typography>

    <Button 
  variant="contained" 
  onClick={() => setCreateTradeOpen(true)}
  sx={{ 
    backgroundColor: '#00C8FF', 
    color: 'white',
    '&:hover': {
      backgroundColor: '#00a7d6',
    }
  }}
>
  Create New Trade
</Button>

  </Box>

          
          <CreateTradeMenu 
            open={createTradeOpen} 
            onClose={() => setCreateTradeOpen(false)} 
            onTradeCreated={handleTradeCreated}
            mode="Market"
          />
          
          <MarketplaceTrades
  currentPage={currentPage}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
  onTradeCreated={tradeCreated}
  filters={filters}
  onUpdateStats={updateTradeStats}
/>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default TradingHub;