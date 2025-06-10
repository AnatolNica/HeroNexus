import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Chip, Button,
  useTheme, Grid, Tooltip, Divider, Stack, Skeleton, CircularProgress,
  IconButton, Collapse, CardActions, CardMedia, Badge
} from '@mui/material';
import {
  SwapHoriz, Favorite, Star, AttachMoney, Collections, Check,
  ArrowForward, ExpandMore, LocalOffer, AccessTime, VerifiedUser
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Coin from './Coin';

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

interface TradeCardProps {
  trade: Trade;
  onAcceptTrade: (tradeId: string) => Promise<void>;
  currentUser: any;
}

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
  marginTop:16,
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



const TradeCard = ({ trade, onAcceptTrade, currentUser }: TradeCardProps) => {
  const theme = useTheme();
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const findCoinsItem = (items: TradeItem[]) => {
    const coinsItem = items.find(item => item.type === 'coins');
    return coinsItem ? coinsItem.coins || 0 : 0;
  };

  const findCollectionItems = (items: TradeItem[]) => {
    return items.filter(item => item.type === 'collection');
  };

  const findCharacterItems = (items: TradeItem[]) => {
    return items.filter(item => item.type === 'character');
  };

  const renderCoins = (coins: number, side: 'offered' | 'requested') => (
    <Grid sx={{ mt: 1, display: 'flex', alignItems: 'center',justifyContent:'center', p: 1, borderRadius: 2,gap:1 }}>
      <Coin size={35}
      />
      <Typography 
        variant="body1" 
        fontWeight={600}
        sx={{ 
          color: 'white',
          fontSize: '1.1rem'
        }}
      >
        {coins} Coins
      </Typography>
    </Grid>
  );

  const renderCollectionHeroes = (heroes: HeroDetails[], side: 'offered' | 'requested') => (
    <Grid container spacing={1} justifyContent="center" sx={{ mt: 1 }}>
      {heroes.map((hero, index) => (
        <Grid key={index}>
          <Tooltip title={hero.name}>
            <Avatar
              src={`${hero.thumbnail.path}.${hero.thumbnail.extension}`}
              sx={{
                width: 40,
                height: 40,
                border: `2px solid #00C8FF`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            />
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  );

  const renderCollections = (collections: TradeItem[], side: 'offered' | 'requested') => (
    <Grid container spacing={2} justifyContent="center">
      {collections.map((item, index) => {
        const collection = item.collection || {};
        const heroIds = collection.heroes || [];
        
        return (
          <Grid key={index}>
            <Box textAlign="center" sx={{ 
              mb: 1,
              p: 2,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid rgba(0, 200, 255, 0.2)`,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box sx={{ 
                      bgcolor: '#00C8FF', 
                      color: '#121212',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      {heroIds.length}
                    </Box>
                  }
                >
                  <Avatar 
                    src={item.collectionImage || collection.image || '/collection-icon.png'}
                    sx={{
                      width: 70,
                      height: 70,
                      border: `2px solid #00C8FF`,
                      boxShadow: theme.shadows[2],
                      mr: 2
                    }}
                  />
                </Badge>
                <Box textAlign="left">
                  <Chip
                    icon={<Collections fontSize="small" sx={{ color: '#00C8FF' }} />}
                    label={item.collectionName || collection.name || "Collection"}
                    size="small"
                    sx={{ 
                      mb: 0.5,
                      background: 'rgba(0, 200, 255, 0.15)',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: '#aaa' }}>
                    {heroIds.length} heroes
                  </Typography>
                  {collection.description && (
                    <Tooltip title={collection.description}>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        fontStyle: 'italic',
                        color: '#aaa',
                        maxWidth: 150,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {collection.description}
                      </Typography>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              {heroIds.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500, mb: 1, color: '#aaa' }}>
                    Heroes in collection:
                  </Typography>
                  
                  {item.collectionHeroes ? (
                    renderCollectionHeroes(item.collectionHeroes, side)
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {Array.from({ length: Math.min(4, heroIds.length) }).map((_, idx) => (
                        <Skeleton 
                          key={idx} 
                          variant="circular" 
                          width={40} 
                          height={40} 
                          sx={{ mx: 0.5, bgcolor: '#333' }} 
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderCharacters = (characters: TradeItem[], side: 'offered' | 'requested') => (
    <Grid container spacing={2} justifyContent="center">
      {characters.map((item, index) => {
        if (!item.characterDetails) return null;
        
        return (
          <Grid key={index}>
            <Tooltip title={item.characterDetails.name}>
              <Box textAlign="center" sx={{
                p: 1.5,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid rgba(0, 200, 255, 0.2)`,
              }}>
                <Avatar
                  src={`${item.characterDetails.thumbnail.path}.${item.characterDetails.thumbnail.extension}`}
                  sx={{
                    width: 70,
                    height: 70,
                    border: `2px solid #00C8FF`,
                    boxShadow: theme.shadows[2],
                    mx: 'auto'
                  }}
                />
                <Chip
                  label={item.characterDetails.name}
                  size="small"
                  sx={{ 
                    mt: 1, 
                    maxWidth: 120,
                    background: 'rgba(0, 200, 255, 0.15)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Tooltip>
          </Grid>
        );
      })}
    </Grid>
  );

  const hasSufficientResources = (): boolean => {
    try {
      for (const item of trade.requestedItems) {
        if (item.type === 'character') {
          const char = currentUser.purchasedCharacters.find(
            (c: any) => String(c.characterId) === String(item.characterId)
          );
          if (!char || char.quantity < (item.quantity || 1)) {
            return false;
          }
        } 
        else if (item.type === 'coins') {
          if (currentUser.coins < (item.coins || 0)) {
            return false;
          }
        }
        else if (item.type === 'collection') {
          const collectionExists = currentUser.inventory.some(
            (c: any) => c._id === item.collection?._id
          );
          if (!collectionExists) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Resource check failed:', error);
      return false;
    }
  };

  const handleAcceptTrade = async () => {
    if (!window.confirm('Are you sure you want to accept this trade? This action cannot be undone.')) {
      return;
    }

    try {
      setIsAccepting(true);
      setAcceptError(null);
      await onAcceptTrade(trade._id);
    } catch (error) {
      setAcceptError(error.message || 'Failed to accept trade');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const isLoggedIn = !!currentUser;
  const isTradeAvailable = trade.status === 'available';
  const isCurrentUserInitiator = isLoggedIn && trade.initiator.id === currentUser.id;
  const canAccept = isLoggedIn && isTradeAvailable && !isCurrentUserInitiator && hasSufficientResources();

  return (
    <StyledCard>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={trade.initiator.avatar? `http://localhost:5000${trade.initiator.avatar}` : ''}
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
                  {trade.initiator.rating.toFixed(1)}
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

          <Chip
            label={isTradeAvailable ? 'Active' : trade.status}
            size="small"
            icon={isTradeAvailable ? <VerifiedUser fontSize="small" sx={{ color: 'white' }} /> : undefined}
            sx={{
              textTransform: 'capitalize',
              fontWeight: 600,
              bgcolor: isTradeAvailable
                ? 'rgba(0, 200, 255, 0.15)'
                : 'rgba(149, 165, 166, 0.15)',
              color: 'white',
            }}
          />
        </Box>
        <Box
          sx={{
            display: {sm:'flex',xs:'relative'},
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
            {findCoinsItem(trade.offeredItems) > 0 &&
              renderCoins(findCoinsItem(trade.offeredItems), 'offered')}
            {findCollectionItems(trade.offeredItems).length > 0 &&
              renderCollections(findCollectionItems(trade.offeredItems), 'offered')}
            {findCharacterItems(trade.offeredItems).length > 0 &&
              renderCharacters(findCharacterItems(trade.offeredItems), 'offered')}
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
            {findCoinsItem(trade.requestedItems) > 0 &&
              renderCoins(findCoinsItem(trade.requestedItems), 'requested')}
            {findCollectionItems(trade.requestedItems).length > 0 &&
              renderCollections(findCollectionItems(trade.requestedItems), 'requested')}
            {findCharacterItems(trade.requestedItems).length > 0 &&
              renderCharacters(findCharacterItems(trade.requestedItems), 'requested')}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          {trade.condition && (
            <Chip
              label={trade.condition}
              size="small"
              sx={{
                background: 'rgba(0, 200, 255, 0.15)',
                color: '#00C8FF',
                fontWeight: 600,
              }}
            />
          )}

          <Box>
            {isTradeAvailable && (
              <>
                <Button
                  variant="contained"
                  startIcon={
                    isAccepting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Check />
                    )
                  }
                  onClick={handleAcceptTrade}
                  disabled={!canAccept || isAccepting}
                  sx={{
                    borderRadius: 20,
                    px: 3,
                    mr: 1,
                    background: canAccept ? '#00C8FF' : '#555',
                    color: canAccept ? '#121212' : '#aaa',
                    fontWeight: 600,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    '&:hover': {
                      boxShadow: '0 6px 15px rgba(0,0,0,0.3)',
                      transform: 'translateY(-2px)',
                      background: canAccept ? '#00a0cc' : '#555',
                    },
                  }}
                >
                  {isAccepting ? 'Accepting...' : 'Accept Trade'}
                </Button>

                {!isLoggedIn && (
                  <Typography
                    variant="caption"
                    color="#aaa"
                    sx={{ mt: 1, display: 'block', textAlign: 'center' }}
                  >
                    Login to accept this trade
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>

        {!canAccept && isLoggedIn && isTradeAvailable && !isCurrentUserInitiator && (
          <Typography
            variant="caption"
            color="#ff6b6b"
            sx={{ mt: 1, display: 'block', textAlign: 'center' }}
          >
            You don't have sufficient resources for this trade
          </Typography>
        )}

        {acceptError && (
          <Typography color="#ff6b6b" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            {acceptError}
          </Typography>
        )}
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
            <Box>
              <Typography variant="caption" color="#aaa">
                Condition:
              </Typography>
              <Typography variant="body2" color="white">
                {trade.condition || 'Excellent'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Collapse>
    </StyledCard>
  );
};

export default TradeCard;