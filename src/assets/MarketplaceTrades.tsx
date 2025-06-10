import { useEffect, useState } from 'react';
import { Box, CircularProgress, Pagination, Typography} from '@mui/material';
import TradeCard from './TradeCard';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

interface HeroDetails {
  id: number;
  name: string;
  thumbnail: {
    path: string;
    extension: string;
  };
}

interface TradeItem {
  type: string;
  characterId?: number;
  collection?: any;
  quantity?: number;
  coins?: number;
  characterDetails?: any;
  collectionImage?: string;
  collectionName?: string;
  collectionHeroes?: HeroDetails[];
}

interface Trade {
  _id: string;
  initiator: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
  };
  offeredItems: TradeItem[];
  requestedItems: TradeItem[];
  status: string;
  createdAt: string;
  tradeValue?: number;
  condition?: string;
}

interface MarketplaceTradesProps {
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onTradeCreated: number;
  filters: {
    username: string;
    minValue: number;
    maxValue: number;
    dateRange: string;
    tradeType: string;
    characterName: string;
    timeOfDay: number[];
  };
  onUpdateStats?: (trades: any[]) => void;
}

const MarketplaceTrades = ({
  currentPage,
  itemsPerPage,
  onPageChange,
  onTradeCreated,
  filters,
}: MarketplaceTradesProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTrades, setTotalTrades] = useState(0);
  const { user } = useUser();

  let cachedBatchData: any[] | null = null;

  const fetchAllCharactersBatch = async () => {
    if (cachedBatchData) return cachedBatchData;
    try {
      const response = await fetch('/api/marvel/batch-full-data');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      cachedBatchData = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch batch full data:', error);
      return [];
    }
  };

  const fetchCharacterDetails = async (characterId: number) => {
    try {
      const batchData = await fetchAllCharactersBatch();
      const character = batchData.find(char => char.id === characterId);
      if (!character) throw new Error(`Character ${characterId} not found`);
      return character;
    } catch (err) {
      console.warn(`Failed to fetch character ${characterId}`);
      return null;
    }
  };

  const fetchCollectionDetails = async (collectionId: string) => {
    try {
      const res = await axios.get(`/api/collections/${collectionId}`);
      return res.data;
    } catch (err) {
      console.warn(`Failed to fetch collection ${collectionId}`);
      return null;
    }
  };

  const fetchCollectionHeroes = async (heroIds: number[]): Promise<HeroDetails[]> => {
    try {
      const batchData = await fetchAllCharactersBatch();
      return heroIds.map(id => batchData.find((c: any) => c.id === id)).filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch collection heroes:', err);
      return [];
    }
  };

  const fetchFullCharacterDetails = async (items: TradeItem[]) => {
    const enrichedItems = await Promise.all(items.map(async (item) => {
      try {
        if (item.type === 'character' && item.characterId) {
          const characterDetails = await fetchCharacterDetails(item.characterId);
          return { ...item, characterDetails };
        } else if (item.type === 'collection' && item.collection?._id) {
          const collectionDetails = await fetchCollectionDetails(item.collection._id);

          if (!collectionDetails) {
            console.warn(`Collection details not found for ID: ${item.collection._id}`);
            return item;
          }

          const mainHeroId = collectionDetails.mainCharacterId ||
            collectionDetails.displayedHeroes?.[0] ||
            collectionDetails.heroes?.[0];

          let characterDetails = null;
          if (mainHeroId) {
            characterDetails = await fetchCharacterDetails(mainHeroId);
          }

          const collectionHeroes = await fetchCollectionHeroes(collectionDetails.heroes || []);

          return {
            ...item,
            collection: collectionDetails,
            characterDetails,
            collectionImage: characterDetails
              ? `${characterDetails.thumbnail.path}.${characterDetails.thumbnail.extension}`
              : collectionDetails.image || '/collection-icon.png',
            collectionName: collectionDetails.name,
            collectionHeroes
          };
        }
        return item;
      } catch (err) {
        console.error(`Failed to enrich item: ${item.type}`, err);
        return item;
      }
    }));

    return enrichedItems;
  };

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trades/marketplace', {
        params: {
          username: filters.username,
          minValue: filters.minValue,
          maxValue: filters.maxValue,
          dateRange: filters.dateRange,
          tradeType: filters.tradeType,
          timeOfDay: filters.timeOfDay
        },
      });

      const rawTrades = response.data.filter((trade: any) =>
        trade.status === 'available'
      );

      const enrichedTrades: Trade[] = await Promise.all(
  rawTrades.map(async (trade: any) => {
    if (!trade || !trade._id) return null;
    try {
      if (!trade.initiator || !trade.initiator._id) {
        console.warn(`Trade ${trade._id} has invalid initiator`);
        return null;
      }
      const offered = await fetchFullCharacterDetails(trade.offeredItems || []);
      const requested = await fetchFullCharacterDetails(trade.requestedItems || []);
      return {
        _id: trade._id,
        initiator: {
          id: trade.initiator._id,
          name: trade.initiator.name || 'Unknown User',
          avatar: trade.initiator.avatar || '/default-avatar.png',
          rating: 4.5,
        },
        offeredItems: offered,
        requestedItems: requested,
        status: trade.status,
        createdAt: trade.createdAt,
        tradeValue: calculateItemValue(offered),
        condition: "Excellent",
      };
    } catch (err) {
      console.error(`Failed to process trade ${trade._id}`, err);
      return null;
    }
  })
);
const validTrades = enrichedTrades.filter(trade => trade !== null) as Trade[];
setTrades(validTrades);
      const filteredTrades = filters.characterName
        ? validTrades.filter(trade => {
            const allItems = [...trade.offeredItems, ...trade.requestedItems];
            return allItems.some(item =>
              item.type === 'character' &&
              item.characterDetails?.name?.toLowerCase().includes(filters.characterName.toLowerCase())
            );
          })
        : validTrades;

      setTrades(filteredTrades);
      setTotalTrades(filteredTrades.length);
    } catch (err) {
      console.error('Failed to fetch trades:', err);
      setError('Failed to load trades. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [onTradeCreated, filters]);

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

  const calculateItemValue = (items: TradeItem[]) => {
    return items.reduce((total, item) => {
      if (item.type === 'character') return total + 150;
      if (item.type === 'coins') return total + (item.coins || 0);
      if (item.type === 'collection') return total + (item.collection?.heroes?.length || 0) * 50;
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

  if (trades.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          No trades available
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Be the first to create a trade!
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {currentTrades.map((trade) => (
        <TradeCard
          key={trade._id}
          trade={trade}
          onAcceptTrade={handleAcceptTrade}
          currentUser={user}
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
                borderColor: '#00C8FF',
                borderRadius: 10,
                color: 'white',
                '&.Mui-selected': {
                  bgcolor: '#00C8FF',
                  color: '#121212',
                  
                }
              }
            }}
          />
        </Box>
      )}
    </>
  );
};

export default MarketplaceTrades;
