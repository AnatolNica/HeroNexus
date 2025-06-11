import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Pagination,
  Typography,
  useTheme
} from '@mui/material';
import TradeCard from '../assets/TradeCard'; 
import axios from 'axios';
interface TradeItem {
  type: string;
  characterId?: number;
  collectionId?: string;
  quantity?: number;
  coins?: number;
}

interface Trade {
  _id: string;
  initiator: {
    _id: string;
    name: string;
    avatar: string;
  };
  offeredItems: TradeItem[];
  requestedItems: TradeItem[];
  status: string;
  createdAt: string;
}

interface Filters {
  username: string;
  minValue: number;
  maxValue: number;
  dateRange: string;
  tradeType: string;
  characterName: string;
  timeOfDay: number[];
}

interface MarketplaceTradesProps {
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onTradeCreated: () => void;
  filters: Filters;
}

const Marketplace = ({
  currentPage,
  itemsPerPage,
  onPageChange,
  onTradeCreated,
  filters
}: MarketplaceTradesProps) => {
  const theme = useTheme();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTrades, setTotalTrades] = useState(0);
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/trades/marketplace', {
          params: {
            ...filters,
            page: currentPage,
            limit: itemsPerPage
          }
        });

        if (response.data && Array.isArray(response.data)) {
          setTrades(response.data);
          setTotalTrades(response.headers['x-total-count'] || response.data.length);
        } else {
          setTrades([]);
          setTotalTrades(0);
        }

      } catch (err) {
        console.error('Failed to fetch trades:', err);
        setError('Failed to load trades. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [onTradeCreated, filters, currentPage]);

  const handleAcceptTrade = async (tradeId: string) => {
    try {
      await axios.post(
        `/api/trades/${tradeId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setTrades(trades.filter(trade => trade._id !== tradeId));
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to accept trade');
    }
  };

  const calculateTradeValue = (items: TradeItem[]) => {
    return items.reduce((total, item) => {
      if (item.type === 'character') return total + 150;
      if (item.type === 'coins') return total + (item.coins || 0) * 0.1;
      if (item.type === 'collection') return total + 500;
      return total;
    }, 0);
  };

  const pageCount = Math.ceil(totalTrades / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTrades = trades.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="h6" color="error" sx={{ mt: 4, textAlign: 'center' }}>
        {error}
      </Typography>
    );
  }

  if (currentTrades.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          No trades found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Try adjusting your filters or create a new trade!
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {currentTrades.map((trade) => (
        <TradeCard
          key={trade._id}
          trade={{
            ...trade,
            tradeValue: calculateTradeValue(trade.offeredItems),
            condition: "Excellent"
          }}
          onAcceptTrade={handleAcceptTrade}
        />
      ))}
      {totalTrades > itemsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
            shape="rounded"
            sx={{
              '& .MuiPaginationItem-root': {
                color: theme.palette.text.primary,
                '&.Mui-selected': {
                  background: theme.palette.warning.main,
                  color: theme.palette.background.paper,
                  '&:hover': {
                    background: theme.palette.warning.dark
                  }
                }
              }
            }}
          />
        </Box>
      )}
    </>
  );
};

export default Marketplace;