import  { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Avatar, Chip, Button, 
  CircularProgress, Tabs, Tab, useTheme, useMediaQuery, Skeleton, Tooltip,
  Card, CardContent, IconButton, Collapse, 
  CardActions
} from '@mui/material';
import { 
  SwapHoriz, Check, Close, Store, People, History, Cancel, 
   ExpandMore,  Star, AccessTime,
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { styled } from '@mui/material/styles';
import Coin from './Coin';

const ExpandButton = styled((props: any) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
  color: '#00C8FF'
}));

const StyledCard = styled(Card)(({}) => ({
  borderRadius: 16,
  marginBottom: 16,
  overflow: 'visible',
  background: '#1a1a1a',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
  position: 'relative',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  }
}));

let cachedCharacters = null;

const fetchAllCharactersBatch = async () => {
  if (cachedCharacters) {
    return cachedCharacters;
  }
  try {
    const response = await fetch('/api/marvel/batch-full-data');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cachedCharacters = data;
    return data;
  } catch (error) {
    console.error('Failed to fetch batch full data:', error);
    return [];
  }
};

const fetchCharacterDetails = async (characterId) => {
  const allCharacters = await fetchAllCharactersBatch();
  return allCharacters.find((char) => char.id === characterId) || null;
};

const fetchCollectionDetails = async (collectionId) => {
  try {
    const response = await axios.get(`/api/collections/${collectionId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch collection details:', error);
    return null;
  }
};

const fetchCollectionHeroes = async (heroIds) => {
  try {
    const heroesToFetch = heroIds.slice(0, 5);
    const heroes = await Promise.all(
      heroesToFetch.map(id => fetchCharacterDetails(id))
    );
    
    return heroes.filter(hero => hero !== null).map(hero => ({
      id: hero.id,
      name: hero.name,
      thumbnail: hero.thumbnail
    }));
  } catch (err) {
    console.warn('Failed to fetch collection heroes', err);
    return [];
  }
};

const TradeStatusChip = ({ status }) => {
  const statusColors = {
    pending: { bgcolor: '#ff980020', color: '#ff9800' },
    accepted: { bgcolor: '#4caf5020', color: '#4caf50' },
    rejected: { bgcolor: '#f4433620', color: '#f44336' },
    available: { bgcolor: '#2196f320', color: '#2196f3' },
    completed: { bgcolor: '#8bc34a20', color: '#8bc34a' },
    canceled: { bgcolor: '#9e9e9e20', color: '#9e9e9e' }
  };

  const statusText = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    available: 'Available',
    completed: 'Completed',
    canceled: 'Canceled'
  };

  return (
    <Chip
      label={statusText[status]}
      size="small"
      sx={{ 
        fontWeight: 600,
        ...statusColors[status]
      }}
    />
  );
};

const TradeCard = ({ trade, currentUserId, onAction }) => {
  const [expanded, setExpanded] = useState(false);
  const isInitiator = trade.initiator._id === currentUserId;
  const isRecipient = trade.recipient?._id === currentUserId;
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };


  const renderItem = (item, side) => {
    if (item.type === 'character') {
      return (
        <Box display="flex" alignItems="center" gap={1} mb={1} >
          {item.characterDetails ? (
            <Tooltip title={item.characterDetails.name}>
              <Avatar 
                src={`${item.characterDetails.thumbnail.path}.${item.characterDetails.thumbnail.extension}`}
                sx={{ width: 40, height: 40, border: '2px solid #00C8FF' }} 
              />
            </Tooltip>
          ) : (
            <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: '#333' }} />
          )}
          
          <Box>
            <Typography variant="body2" fontWeight={600} color="white">
              {item.characterDetails?.name || `Character #${item.characterId}`}
            </Typography>
            <Typography variant="caption" color="#aaa">
              {item.quantity} {item.quantity > 1 ? 'copies' : 'copy'}
            </Typography>
          </Box>
        </Box>
      );
    }

    if (item.type === 'coins') {
      return (
        <Box display="flex" alignItems="center" justifyContent={'center'} gap={1} mb={1}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
          }}>
            <Coin size={30}/>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600} color="white">
              {item.coins} Coins
            </Typography>
          </Box>
        </Box>
      );
    }

    if (item.type === 'collection') {
      return (
        <Box display="flex" flexDirection="column" gap={1} mb={2} >
          <Box display="flex" alignItems="center" gap={1}>
            {item.collectionDetails ? (
              <Tooltip title={item.collectionName}>
                <Avatar 
                  src={item.collectionImage || '/collection-icon.png'}
                  sx={{ width: 40, height: 40, border: '2px solid #00C8FF' }}
                />
              </Tooltip>
            ) : (
              <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: '#333' }} />
            )}
            
            <Box>
              <Typography variant="body2" fontWeight={600} color="white">
                {item.collectionName || 'Collection'}
              </Typography>
              <Typography variant="caption" color="#aaa">
                {item.collectionDetails?.heroes?.length || 0} heroes
              </Typography>
            </Box>
          </Box>
          
          {item.collectionHeroes && item.collectionHeroes.length > 0 && (
            <Box mt={1}>
              <Typography variant="caption" fontWeight={500} display="block" mb={1} color="#aaa">
                Heroes in collection:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {item.collectionHeroes.map((hero, idx) => (
                  <Tooltip key={idx} title={hero.name}>
                    <Avatar
                      src={`${hero.thumbnail.path}.${hero.thumbnail.extension}`}
                      sx={{ 
                        width: 30, 
                        height: 30, 
                        border: '1px solid #00C8FF' 
                      }}
                    />
                  </Tooltip>
                ))}
                {item.collectionDetails?.heroes?.length > 5 && (
                  <Chip 
                    size="small" 
                    label={`+${item.collectionDetails.heroes.length - 5}`} 
                    sx={{ 
                      height: 30, 
                      alignSelf: 'center',
                      bgcolor: 'rgba(0, 200, 255, 0.15)',
                      color: 'white'
                    }}
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    return null;
  };

  const handleAction = async (action) => {
    setIsProcessing(true);
    try {
      await onAction(trade._id, action);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <StyledCard>
      <CardContent>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={`http://localhost:5000${trade.initiator.avatar}`||''}
              sx={{
                width: 48,
                height: 48,
                mr: 1.5,
                border: '2px solid #00C8FF',
                boxShadow: '0 0 10px rgba(0, 200, 255, 0.5)',
              }}
            />
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="white">
                {trade.initiator.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Star fontSize="small" sx={{ color: '#00C8FF', mr: 0.5 }} />
                <Typography variant="body2" color="#aaa">
                  {trade.initiator.rating?.toFixed(1) || '5.0'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  <AccessTime fontSize="small" sx={{ color: '#aaa', mr: 0.5 }} />
                  <Typography variant="caption" color="#aaa">
                    {new Date(trade.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <TradeStatusChip status={trade.status} />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            p: 2,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.03)',
            position: 'relative',
          }}
        >
          <Box sx={{ flex: 1, pr: 1 }}>
            <Typography
              variant="subtitle2"
              align="center"
              gutterBottom
              sx={{ fontWeight: 700, color: '#00C8FF', mb: 1 }}
            >
              OFFERED
            </Typography>
            {trade.offeredItems.map((item, index) => (
              <Box key={index}>{renderItem(item, 'offered')}</Box>
            ))}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: '#00C8FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                animation: 'pulse 2s infinite',
              }}
            >
              <SwapHoriz sx={{ fontSize: 30, color: '#121212' }} />
            </Box>
          </Box>
          <Box sx={{ flex: 1, pl: 1 }}>
            <Typography
              variant="subtitle2"
              align="center"
              gutterBottom
              sx={{ fontWeight: 700, color: '#00C8FF', mb: 1 }}
            >
              REQUESTED
            </Typography>
            {trade.requestedItems.map((item, index) => (
              <Box key={index}>{renderItem(item, 'requested')}</Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {trade.status === 'pending' && isRecipient && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Check />}
                size="small"
                onClick={() => handleAction('accept')}
                disabled={isProcessing}
                sx={{
                  borderRadius: 20,
                  px: 3,
                  background: '#00C8FF',
                  color: '#121212',
                  fontWeight: 600,
                }}
              >
                Accept
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Close />}
                size="small"
                onClick={() => handleAction('reject')}
                disabled={isProcessing}
                sx={{
                  borderRadius: 20,
                  px: 3,
                  borderColor: '#f44336',
                  color: '#f44336',
                  fontWeight: 600,
                }}
              >
                Reject
              </Button>
            </>
          )}

          {trade.status === 'pending' && isInitiator && (
            <Button
              variant="outlined"
              color="error"
              startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Cancel />}
              size="small"
              onClick={() => handleAction('cancel')}
              disabled={isProcessing}
              sx={{
                borderRadius: 20,
                px: 3,
                borderColor: '#f44336',
                color: '#f44336',
                fontWeight: 600,
              }}
            >
              Cancel Trade
            </Button>
          )}

          {trade.status === 'available' && isInitiator && (
            <Button
              variant="outlined"
              color="error"
              startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Cancel />}
              size="small"
              onClick={() => handleAction('cancel')}
              disabled={isProcessing}
              sx={{
                borderRadius: 20,
                px: 3,
                borderColor: '#f44336',
                color: '#f44336',
                fontWeight: 600,
              }}
            >
              Remove Offer
            </Button>
          )}

          {trade.status === 'available' && !isInitiator && (
            <Button
              variant="contained"
              color="primary"
              startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Check />}
              size="small"
              onClick={() => handleAction('accept')}
              disabled={isProcessing}
              sx={{
                borderRadius: 20,
                px: 3,
                background: '#00C8FF',
                color: '#121212',
                fontWeight: 600,
              }}
            >
              Accept Offer
            </Button>
          )}
        </Box>
      </CardContent>

      <CardActions disableSpacing sx={{ pt: 0 }}>
        <ExpandButton
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMore />
        </ExpandButton>
      </CardActions>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#aaa' }}>
            Trade Details
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
              p: 2,
              borderRadius: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="#aaa">
                Trade ID:
              </Typography>
              <Typography variant="body2" color="white">
                {trade._id}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="#aaa">
                Created:
              </Typography>
              <Typography variant="body2" color="white">
                {new Date(trade.createdAt).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Collapse>
    </StyledCard>
  );
};

const UserTrades = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(0);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const enrichTradeItems = async (items) => {
    return Promise.all(items.map(async (item) => {
      try {
        if (item.type === 'character' && item.characterId) {
          const characterDetails = await fetchCharacterDetails(item.characterId);
          return { ...item, characterDetails };
        } 
        else if (item.type === 'collection' && (item.collectionId || item.collection?._id)) {
            const collectionId = item.collectionId || item.collection._id;
            const collectionDetails = await fetchCollectionDetails(collectionId);
          
            let collectionImage = '/collection-icon.png';
            let collectionHeroes = [];
            let collectionName = 'Collection';
          
            if (collectionDetails) {
              collectionName = collectionDetails.name || 'Collection';
          
              if (collectionDetails.heroes && collectionDetails.heroes.length > 0) {
                collectionHeroes = await fetchCollectionHeroes(collectionDetails.heroes);
              }
          
              const mainHeroId =
                collectionDetails.mainCharacterId ||
                collectionDetails.displayedHeroes?.[0] ||
                collectionDetails.heroes?.[0];
          
              if (mainHeroId) {
                const mainHero = await fetchCharacterDetails(mainHeroId);
                if (mainHero) {
                  collectionImage = `${mainHero.thumbnail.path}.${mainHero.thumbnail.extension}`;
                }
              }
            }
          
            return {
              ...item,
              collectionDetails,
              collectionImage,
              collectionHeroes,
              collectionName
            };
          }
          
        return item;
      } catch (error) {
        console.error('Failed to enrich trade item:', error);
        return item;
      }
    }));
  };

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/trades/user', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTrades(response.data);
      
      setEnriching(true);
      const enrichedTrades = await Promise.all(
        response.data.map(async trade => {
          try {
            const offeredItems = await enrichTradeItems(trade.offeredItems);
            const requestedItems = await enrichTradeItems(trade.requestedItems);
            return { ...trade, offeredItems, requestedItems };
          } catch (error) {
            console.error('Failed to enrich trade:', trade._id, error);
            return trade;
          }
        })
      );
      
      setTrades(enrichedTrades);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setLoading(false);
      setEnriching(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user]);

  const handleTradeAction = async (tradeId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/trades/${tradeId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      fetchTrades();
    } catch (error) {
      console.error('Trade action failed:', error);
      alert(`Failed to ${action} trade: ${error.response?.data?.error || error.message}`);
    }
  };


  const filteredTrades = trades.filter(trade => {
    if (activeTab === 0) { 
      return trade.status === 'pending' && 
             (trade.recipient?._id === user?.id || trade.initiator._id === user?.id);
    }
    if (activeTab === 1) { 
      return trade.status === 'available' && trade.initiator._id === user?.id;
    }
    if (activeTab === 2) { 
      return ['accepted', 'rejected', 'completed', 'canceled'].includes(trade.status);
    }
    return true;
  });

  return (
    <Box sx={{ p: isMobile ? 1 : 3,bgcolor:'#1f1f1f' ,boxShadow: '0 8px 24px rgba(0,0,0,0.3)', borderRadius:5}}>
      <Box display="flex" alignItems="center" gap={2} mb={3} >
        <SwapHoriz sx={{ fontSize: 40, color: '#00b3ff' }} />
        <Typography variant="h5" sx={{ 
          color: 'white', 
          fontWeight: 700,
          background: 'linear-gradient(90deg, #00b3ff, #0066cc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Trade Center
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons="auto"
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': {
            backgroundColor: '#00b3ff',
            height: 3
          },
          '& .MuiTab-root': {
            minHeight: 48,
            color: 'white',
            '&.Mui-selected': { color: '#00b3ff' }
          }
        }}
      >
        <Tab 
          label="Pending Trades" 
          icon={<People />} 
          iconPosition="start"
        />
        <Tab 
          label="My Marketplace" 
          icon={<Store />} 
          iconPosition="start"
        />
        <Tab 
          label="Trade History" 
          icon={<History />} 
          iconPosition="start"
        />
      </Tabs>

      {loading || enriching ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={2}>
          <CircularProgress size={40} sx={{ color: '#00b3ff' }} />
          <Typography variant="body2" color="#aaa">
            {enriching ? 'Loading item details...' : 'Loading trades...'}
          </Typography>
        </Box>
      ) : filteredTrades.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="#aaa">
            {activeTab === 0 ? 'No pending trades' : 
             activeTab === 1 ? 'You have no marketplace offers' : 
             'No trade history'}
          </Typography>
          <Typography variant="body2" color="#666" mt={1}>
            {activeTab === 0 ? 'Your trade requests will appear here' : 
             activeTab === 1 ? 'Create new offers to see them here' : 
             'Completed trades will appear here'}
          </Typography>
        </Box>
      ) : (
        <Box>
          {filteredTrades.map(trade => (
            <TradeCard
              key={trade._id}
              trade={trade}
              currentUserId={user?.id}
              onAction={handleTradeAction}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default UserTrades;