import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  InputAdornment,
  IconButton,
  Grid,
  Paper,
  Skeleton,
  CircularProgress,
  Fade,
  Grow,
  Collapse,
  Chip,
  Drawer
} from '@mui/material';
import { Add, Close, Collections, ErrorOutline, ExpandLess, ExpandMore, Favorite, Star } from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import CharacterDrawer from './CharacterDrawer';

interface TradeItem {
  type: 'character' | 'coins' | 'collection';
  characterId?: number;
  quantity?: number;
  maxQuantity?: number;
  coins?: number;
  collectionId?: string;
}

interface CharacterDetails {
  id: number;
  name: string;
  thumbnail: {
    path: string;
    extension: string;
  };
  rarity: string;
}

interface Collection {
  _id: string;
  name: string;
  image: string;
  displayedHeroes: number[];
  mainCharacterId?: number;
}

interface CreateTradeMenuProps {
  open: boolean;
  onClose: () => void;
  onTradeCreated: () => void;
  mode: 'Market' | 'Friend';
  friendId?: string;
}

const CreateTradeMenu = ({ open, onClose, onTradeCreated, mode, friendId }: CreateTradeMenuProps) => {
  const { user, updateUserItems, checkAuth } = useUser();
  const [offeredItems, setOfferedItems] = useState<TradeItem[]>([]);
  const [requestedItems, setRequestedItems] = useState<TradeItem[]>([]);
  const [offerCoins, setOfferCoins] = useState<number>(0);
  const [requestCoins, setRequestCoins] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [charactersDetails, setCharactersDetails] = useState<CharacterDetails[]>([]);
  const [drawerMode, setDrawerMode] = useState<'offer' | 'request'>('offer');
  const [tabValue, setTabValue] = useState<'characters' | 'collections'>('characters');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [loadingCharacters, setLoadingCharacters] = useState<Set<number>>(new Set());
  const [failedCharacters, setFailedCharacters] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendCharacters, setFriendCharacters] = useState<CharacterDetails[]>([]);
  const [friendCollections, setFriendCollections] = useState<Collection[]>([]);
  const [friendName, setFriendName] = useState<string>('');

  const fetchCharacterDetails = async (characterId: number) => {
    setLoadingCharacters(prev => new Set(prev).add(characterId));
    setFailedCharacters(prev => {
      const newSet = new Set(prev);
      newSet.delete(characterId);
      return newSet;
    });

    try {
      const response = await axios.get(`/api/marvel/fulldatacharacter/${characterId}`);
      setCharactersDetails(prev => [...prev, response.data]);
    } catch (error) {
      console.error(`Failed to fetch character ${characterId}:`, error);
      setFailedCharacters(prev => new Set(prev).add(characterId));
    } finally {
      setLoadingCharacters(prev => {
        const newSet = new Set(prev);
        newSet.delete(characterId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const fetchFriendData = async () => {
      if (mode === 'Friend' && friendId) {
        try {
          const response = await axios.get(`/api/user/${friendId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          setFriendName(response.data.name || 'Friend');
          const friendChars = response.data.purchasedCharacters || [];
          const friendColls = response.data.inventory || [];
          
          const details = await Promise.all(
            friendChars.map(async (pc: any) => {
              try {
                const res = await axios.get(`/api/marvel/fulldatacharacter/${pc.characterId}`);
                return {
                  id: pc.characterId,
                  name: res.data.name,
                  thumbnail: res.data.thumbnail,
                  rarity: res.data.rarity
                };
              } catch (error) {
                console.error(`Failed to fetch friend character ${pc.characterId}:`, error);
                return null;
              }
            })
          );
          
          setFriendCharacters(details.filter(Boolean) as CharacterDetails[]);
          setFriendCollections(friendColls);
        } catch (error) {
          console.error('Failed to fetch friend data:', error);
        }
      }
    };
  
    if (open && mode === 'Friend') {
      fetchFriendData();
    }
  }, [open, mode, friendId]);
  
  useEffect(() => {
    const requestedIds = requestedItems
      .filter(item => item.type === 'character')
      .map(item => item.characterId)
      .filter(id => id && 
        !charactersDetails.some(c => c.id === id) && 
        !loadingCharacters.has(id) &&
        !failedCharacters.has(id)
      ) as number[];
    
    requestedIds.forEach(id => {
      fetchCharacterDetails(id);
    });
  }, [requestedItems, charactersDetails, loadingCharacters, failedCharacters]);

  const handleAddOfferCharacter = (characterId: number, maxQty: number) => {
    setOfferedItems(prev => {
      const existingIndex = prev.findIndex(item => 
        item.type === 'character' && item.characterId === characterId
      );
      
      if (existingIndex !== -1) {
        return prev.map((item, index) => {
          if (index === existingIndex) {
            const currentQty = item.quantity || 0;
            const newQty = Math.min(currentQty + 1, maxQty);
            return { ...item, quantity: newQty };
          }
          return item;
        });
      }
      
      return [
        ...prev, 
        { type: 'character', characterId, quantity: 1, maxQuantity: maxQty }
      ];
    });
  };

  const handleAddOfferCollection = (collectionId: string) => {
    setOfferedItems(prev => [
      ...prev.filter(item => item.type !== 'collection' || item.collectionId !== collectionId),
      { type: 'collection', collectionId }
    ]);
  };

  const handleAddOfferCoins = (coins: number) => {
    setOfferCoins(coins);
    setOfferedItems(prev => [
      ...prev.filter(item => item.type !== 'coins'),
      { type: 'coins', coins }
    ]);
  };

  const handleAddRequestCoins = (coins: number) => {
    setRequestCoins(coins);
    setRequestedItems(prev => [
      ...prev.filter(item => item.type !== 'coins'),
      { type: 'coins', coins }
    ]);
  };

  const handleAddRequestCharacter = (characterId: number) => {
    setRequestedItems(prev => {
      const existingIndex = prev.findIndex(item => 
        item.type === 'character' && item.characterId === characterId
      );
      
      if (existingIndex !== -1) {
        return prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: (item.quantity || 0) + 1 } 
            : item
        );
      }
      
      return [
        ...prev, 
        { type: 'character', characterId, quantity: 1 }
      ];
    });
    
    const charExists = charactersDetails.some(c => c.id === characterId);
    if (!charExists && !loadingCharacters.has(characterId)) {
      fetchCharacterDetails(characterId);
    }
  };

  const handleAddRequestCollection = (collectionId: string) => {
    setRequestedItems(prev => [
      ...prev.filter(item => item.type !== 'collection' || item.collectionId !== collectionId),
      { type: 'collection', collectionId }
    ]);
  };

  const toggleExpandCollection = (collectionId: string) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev);
      newSet.has(collectionId) ? newSet.delete(collectionId) : newSet.add(collectionId);
      return newSet;
    });
  };

  const handleSubmitTrade = async () => {
    if (!offeredItems.length || !requestedItems.length) {
      setError('Please add items to both offer and request sections');
      return;
    }
  
    setError(null);
    setIsSubmitting(true);
  
    try {
      let inventorySource = user?.inventory || [];
  
      if (mode === 'Friend') {
        const { data: freshUser } = await axios.get(`/api/user/${user.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        inventorySource = freshUser?.inventory || [];
      }
  
      const tradeData = {
        offeredItems: offeredItems.map(item => {
          if (item.type === 'collection') {
            const collection = inventorySource.find(c => `${c._id}` === `${item.collectionId}`);
            return {
              type: item.type,
              collectionId: item.collectionId,
              collection,
              quantity: item.quantity
            };
          }
  
          return {
            type: item.type,
            characterId: item.characterId,
            collectionId: item.collectionId,
            quantity: item.quantity,
            coins: item.coins
          };
        }),
        requestedItems: requestedItems.map(item => ({
          type: item.type,
          characterId: item.characterId,
          collectionId: item.collectionId,
          quantity: item.quantity,
          coins: item.coins
        })),
        mode,
        friendId: mode === 'Friend' ? friendId : undefined
      };
  
      const endpoint = mode === 'Market'
        ? '/api/trades/marketplace'
        : '/api/trades/friend';
  
      await axios.post(endpoint, tradeData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      updateUserItems(offeredItems);
      await checkAuth();
  
      setOfferedItems([]);
      setRequestedItems([]);
      setOfferCoins(0);
      setRequestCoins(0);
      onClose();
      onTradeCreated?.();
    } catch (err: any) {
      console.error('Trade creation failed:', err);
      setError(err.response?.data?.error || 'Failed to create trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!open) return null;

  return (
    <>
      <Fade in={true} timeout={500}>
    <Paper
      elevation={10}
      sx={{
        position: 'fixed',
        top: {sm:'5%',xs:0},
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 1100,
        maxHeight:{sm:1200,xs:'200vh'},
        bgcolor: '#121212',
        color: 'white',
        p: 4,
        borderRadius: 3,
        zIndex: 1200,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 200, 255, 0.2)',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
        }
      }}
    >
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(0,200,255,0.1) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,200,255,0.1) 0%, transparent 40%)',
            zIndex: -1
          }}/>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" 
          sx={{
            mb:{sm:3,xs:'5px'},
            mt:{sm:0,xs:-3}
          }}
          >
            <Typography  sx={{ 
              fontWeight: 700,
              color: '#00C8FF',
              ml:{sm:0,xs:2},
              fontSize:{sm:24,xs:20}
            }}>
              {mode === 'Market' ? 'Create Marketplace Offer' : `Trade with ${friendName}`}
            </Typography>
            <IconButton 
              onClick={() => {
                onClose();
                setIsDrawerOpen(false);
              }} 
              sx={{ 
                color: 'white',
                background: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  background: 'rgba(0, 200, 255, 0.3)',
                }
              }}
            >
              <Close fontSize="large" />
            </IconButton>
          </Box>
    
          <Grid container spacing={4} sx={{ position: 'relative', zIndex: 2 ,mb:10}}>

            <Grid>
              <Box sx={{
                bgcolor: '#1a1a1a', 
                borderRadius: 3,
                p: 3,
                boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                border: '1px solid rgba(0, 200, 255, 0.2)', 
                height: '100%',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  mb: 3, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#00C8FF',
                  fontWeight: 600
                }}>
                  <Star sx={{ fontSize: 28, color: '#00C8FF' }} /> Your Offer
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: {sm:3,xs:"10px" }}}>
                  <Button
                    variant="outlined"
                    startIcon={<Add sx={{ transition: 'transform 0.3s', color: '#00C8FF' }} />}
                    onClick={() => {
                      setTabValue('characters');
                      setDrawerMode('offer');
                      setIsDrawerOpen(true);
                    }}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      background: 'rgba(0, 200, 255, 0.1)',
                      border: '1px solid rgba(0, 200, 255, 0.3)',
                      color: '#00C8FF',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'rgba(0, 200, 255, 0.2)',
                        border: '1px solid rgba(0, 200, 255, 0.5)',
                        boxShadow: '0 0 15px rgba(0, 200, 255, 0.4)'
                      }
                    }}
                  >
                    Add Characters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Collections sx={{ transition: 'transform 0.3s', color: '#00C8FF' }} />}
                    onClick={() => {
                      setTabValue('collections');
                      setDrawerMode('offer');
                      setIsDrawerOpen(true);
                    }}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      background: 'rgba(0, 200, 255, 0.1)',
                      border: '1px solid rgba(0, 200, 255, 0.3)',
                      color: '#00C8FF',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'rgba(0, 200, 255, 0.2)',
                        border: '1px solid rgba(0, 200, 255, 0.5)',
                        boxShadow: '0 0 15px rgba(0, 200, 255, 0.4)'
                      }
                    }}
                  >
                    Add Collection
                  </Button>
                </Box>
    
                <Box sx={{ maxHeight: {sm:250,xs:100}, overflowY: 'auto', pr: 1 }}>
                  {offeredItems.filter(item => item.type === 'character').map((item, index) => {
                    const char = charactersDetails.find(c => c.id === item.characterId);
                    const maxQty = item.maxQuantity || 1;
                    if (!char) return null;
                    
                    return (
                      <Grow in={true} key={`${item.characterId}-${index}`} timeout={index * 100}>
                        <Paper sx={{ 
                          mb: 2,
                          p: 2, 
                          bgcolor: 'rgba(30, 30, 30, 0.7)',
                          borderRadius: 2, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          border: '1px solid rgba(0, 200, 255, 0.1)',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'scale(1.01)',
                            boxShadow: '0 0 20px rgba(0, 200, 255, 0.3)',
                            borderColor: 'rgba(0, 200, 255, 0.3)'
                          }
                        }}>
                          <Avatar
                            src={`${char.thumbnail.path}.${char.thumbnail.extension}`}
                            sx={{ 
                              width: 60, 
                              height: 60,
                              boxShadow: '0 0 10px rgba(0, 200, 255, 0.5)',
                              border: '2px solid #00C8FF'
                            }}
                          />
                          <Box flexGrow={1}>
                            <Typography variant="body1" color="white" sx={{ fontWeight: 600 }}>
                              {char.name}
                            </Typography>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              inputProps={{ min: 1, max: maxQty }}
                              onChange={(e) => {
                                const raw = parseInt(e.target.value);
                                const qty = Math.max(1, Math.min(raw, maxQty));
                                setOfferedItems(prev =>
                                  prev.map((itm, i) => i === index ? { ...itm, quantity: qty } : itm)
                                );
                              }}
                              sx={{
                                mt: 1,
                                '& .MuiInputBase-root': {
                                  background: 'rgba(0,0,0,0.3)',
                                  borderRadius: 1
                                },
                                input: { 
                                  color: '#00C8FF',
                                  fontWeight: 600,
                                  textAlign: 'center'
                                },
                                '& label': { 
                                  color: '#aaa',
                                  transform: 'translate(14px, 8px) scale(1)'
                                },
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': { 
                                    borderColor: 'rgba(0, 200, 255, 0.3)',
                                    borderWidth: 2
                                  },
                                  '&:hover fieldset': { 
                                    borderColor: 'rgba(0, 200, 255, 0.5)' 
                                  },
                                  '&.Mui-focused fieldset': { 
                                    borderColor: '#00C8FF',
                                    boxShadow: '0 0 10px rgba(0, 200, 255, 0.5)'
                                  }
                                }
                              }}
                            />
                          </Box>
                          <IconButton
                            onClick={() =>
                              setOfferedItems(prev => prev.filter((_, i) => i !== index))
                            }
                            sx={{ 
                              color: '#ff6b6b',
                              transition: 'all 0.3s',
                              '&:hover': {
                                color: '#ff3b3b',
                                transform: 'scale(1.2)'
                              }
                            }}
                          >
                            <Close />
                          </IconButton>
                        </Paper>
                      </Grow>
                    );
                  })}
    
                  {offeredItems.filter(item => item.type === 'collection').map((item, index) => {
                    const collection = user?.inventory?.find(c => c._id === item.collectionId);
                    if (!collection) return null;

                    const mainHeroId = collection.mainCharacterId || collection.displayedHeroes[0];
                    const mainHero = charactersDetails.find(c => c.id === mainHeroId);
                    const isExpanded = expandedCollections.has(collection._id);
    
                    return (
                      <Grow in={true} key={`${item.collectionId}-${index}`} timeout={index * 100}>
                        <Paper sx={{ 
                          mb: 2,
                          p: 2, 
                          bgcolor: 'rgba(30, 30, 30, 0.7)',
                          borderRadius: 2,
                          border: '1px solid rgba(0, 200, 255, 0.2)',
                          transition: 'all 0.3s',
                          '&:hover': {
                            boxShadow: '0 0 20px rgba(0, 200, 255, 0.3)',
                            borderColor: 'rgba(0, 200, 255, 0.4)'
                          }
                        }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar
                                  src={mainHero ? `${mainHero.thumbnail.path}.${mainHero.thumbnail.extension}` : undefined}
                                  sx={{ 
                                    width: 60, 
                                    height: 60,
                                    border: '2px solid #00C8FF',
                                    boxShadow: '0 0 10px rgba(0, 200, 255, 0.5)'
                                  }}
                                />
                                <Box>
                                  <Typography variant="body1" color="white" sx={{ fontWeight: 600 }}>
                                    {collection.name}
                                  </Typography>
                                  <Typography variant="body2" color="#aaa">
                                    {collection.displayedHeroes.length} heroes in collection
                                  </Typography>
                                </Box>
                              </Box>
                              <Box display="flex" gap={1}>
                                <IconButton 
                                  onClick={() => toggleExpandCollection(collection._id)} 
                                  sx={{ 
                                    color: isExpanded ? '#ff8a00' : '#00C8FF',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      color: isExpanded ? '#ffaa00' : '#00d4ff'
                                    }
                                  }}
                                >
                                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                                <IconButton
                                  onClick={() => setOfferedItems(prev => prev.filter(i => !(i.type === 'collection' && i.collectionId === collection._id)))}
                                  sx={{ 
                                    color: '#ff6b6b',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                      color: '#ff3b3b',
                                      transform: 'scale(1.2)'
                                    }
                                  }}
                                >
                                  <Close />
                                </IconButton>
                              </Box>
                            </Box>
    
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Typography variant="body2" color="#aaa" sx={{ mt: 2, mb: 1 }}>
                                Collection Heroes:
                              </Typography>
                              <Grid container spacing={1} mt={1}>
                                {collection.displayedHeroes.map((heroId, idx) => {
                                  const hero = charactersDetails.find(c => c.id === heroId);
                                  if (!hero) return null;
                                  return (
                                    <Grid key={hero.id}>
                                      <Paper sx={{ 
                                        p: 1, 
                                        bgcolor: 'rgba(40, 40, 40, 0.7)',
                                        borderRadius: 1,
                                        border: '1px solid rgba(0, 200, 255, 0.1)',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                          transform: 'translateY(-3px)',
                                          boxShadow: '0 5px 15px rgba(0, 200, 255, 0.3)'
                                        }
                                      }}>
                                        <Avatar
                                          src={`${hero.thumbnail.path}.${hero.thumbnail.extension}`}
                                          sx={{ 
                                            width: '100%', 
                                            height: 100, 
                                            borderRadius: 1,
                                            border: '2px solid #00C8FF'
                                          }}
                                        />
                                        <Typography variant="body2" color="white" noWrap sx={{ mt: 1, fontWeight: 600 }}>
                                          {hero.name}
                                        </Typography>
                                        <Chip 
                                          label={hero.rarity} 
                                          size="small" 
                                          sx={{ 
                                            mt: 0.5,
                                            background: 'rgba(0, 200, 255, 0.2)',
                                            color: '#a8e6ff',
                                            fontSize: '0.7rem',
                                            height: 20
                                          }}
                                        />
                                      </Paper>
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            </Collapse>
                          </Paper>
                      </Grow>
                    );
                  })}
                </Box>
    
                <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label={`Offer Coins (max ${user?.coins})`}
                  type="number"
                  value={offerCoins}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ color: '#00C8FF', fontWeight: 600 }}>coins</Typography>
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, max: user?.coins }
                  }}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value);
                    const value = Math.min(Math.max(0, raw), user?.coins || 0);
                    handleAddOfferCoins(value);
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 1
                    },
                    input: { 
                      color: '#00C8FF',
                      fontWeight: 600,
                      fontSize: '1.1rem'
                    },
                    '& label': { 
                      color: '#aaa',
                      fontSize: '1rem'
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { 
                        borderColor: 'rgba(0, 200, 255, 0.3)',
                        borderWidth: 2
                      },
                      '&:hover fieldset': { 
                        borderColor: 'rgba(0, 200, 255, 0.5)' 
                      },
                      '&.Mui-focused fieldset': {                 
                        borderColor: '#00C8FF',
                        boxShadow: '0 0 10px rgba(0, 200, 255, 0.5)'
                      }
                    }
                  }}
                />
                </Box>
              </Box>
            </Grid>
            <Grid>
              <Box sx={{
                bgcolor: '#1a1a1a', 
                borderRadius: 3,
                p: 3,
                boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                border: '1px solid rgba(0, 200, 255, 0.2)',
                height: '100%',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  mb: 3, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#00C8FF',
                  fontWeight: 600
                }}>
                  <Favorite sx={{ fontSize: 28, color: '#00C8FF' }} /> {mode === 'Market' ? 'You Want In Return' : `Request from ${friendName}`}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Add sx={{ transition: 'transform 0.3s', color: '#00C8FF' }} />}
                    onClick={() => {
                      setTabValue('characters');
                      setDrawerMode('request');
                      setIsDrawerOpen(true);
                    }}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      background: 'rgba(0, 200, 255, 0.1)',
                      border: '1px solid rgba(0, 200, 255, 0.3)',
                      color: '#00C8FF',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'rgba(0, 200, 255, 0.2)',
                        border: '1px solid rgba(0, 200, 255, 0.5)',
                        boxShadow: '0 0 15px rgba(0, 200, 255, 0.4)'
                      }
                    }}
                  >
                    {mode === 'Market' ? 'Add Characters' : "Add Friend's Characters"}
                  </Button>
                  
                  {mode === 'Friend' && (
                    <Button
                      variant="outlined"
                      startIcon={<Collections sx={{ color: '#00C8FF' }} />}
                      onClick={() => {
                        setTabValue('collections');
                        setDrawerMode('request');
                        setIsDrawerOpen(true);
                      }}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        background: 'rgba(0, 200, 255, 0.1)',
                        border: '1px solid rgba(0, 200, 255, 0.3)',
                        color: '#00C8FF',
                        fontWeight: 600,
                        '&:hover': {
                          background: 'rgba(0, 200, 255, 0.2)',
                          border: '1px solid rgba(0, 200, 255, 0.5)',
                          boxShadow: '0 0 15px rgba(0, 200, 255, 0.4)'
                        }
                      }}
                    >
                      Add Friend's Collections
                    </Button>
                  )}
                </Box>
    
                <Box sx={{ maxHeight: {sm:250,xs:100}, overflowY: 'auto', pr: 1 }}>
                  {requestedItems.filter(item => item.type === 'character').map((item, index) => {
                    const char = charactersDetails.find(c => c.id === item.characterId);
                    const isLoading = loadingCharacters.has(item.characterId!);
                    const hasFailed = failedCharacters.has(item.characterId!);
                    
                    if (isLoading) {
                      return (
                        <Paper key={`loading-${item.characterId}-${index}`} sx={{ 
                          mb: 2,
                          p: 2, 
                          bgcolor: 'rgba(30, 30, 30, 0.7)',
                          borderRadius: 2, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          border: '1px dashed rgba(0, 200, 255, 0.3)'
                        }}>
                          <Skeleton variant="circular" width={56} height={56} animation="wave" />
                          <Box flexGrow={1}>
                            <Skeleton variant="text" width="80%" height={24} animation="wave" />
                            <Skeleton variant="text" width="60%" height={40} animation="wave" />
                          </Box>
                        </Paper>
                      );
                    }
                    
                    if (hasFailed) {
                      return (
                        <Paper key={`error-${item.characterId}-${index}`} sx={{ 
                          mb: 2,
                          p: 2, 
                          bgcolor: 'rgba(70, 30, 40, 0.7)',
                          borderRadius: 2, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          border: '1px solid rgba(255, 90, 90, 0.5)'
                        }}>
                          <Avatar sx={{ 
                            bgcolor: 'rgba(255, 90, 90, 0.2)', 
                            width: 56, 
                            height: 56,
                            border: '2px solid #ff5a5a'
                          }}>
                            <ErrorOutline sx={{ color: '#ff5a5a', fontSize: 32 }} />
                          </Avatar>
                          <Box flexGrow={1}>
                            <Typography variant="body1" color="white" sx={{ fontWeight: 600 }}>
                              Failed to load
                            </Typography>
                            <Typography variant="body2" color="#ff5a5a">
                              ID: {item.characterId}
                            </Typography>
                          </Box>
                          <IconButton
                            onClick={() =>
                              setRequestedItems(prev => prev.filter((_, i) => i !== index))
                            }
                            sx={{ 
                              color: '#ff6b6b',
                              transition: 'all 0.3s',
                              '&:hover': {
                                color: '#ff3b3b',
                                transform: 'scale(1.2)'
                              }
                            }}
                          >
                            <Close />
                          </IconButton>
                        </Paper>
                      );
                    }
                    
                    if (char) {
                      return (
                        <Grow in={true} key={char.id} timeout={index * 100}>
                          <Paper sx={{ 
                            mb: 2,
                            p: 2, 
                            bgcolor: 'rgba(30, 30, 30, 0.7)',
                            borderRadius: 2, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            border: '1px solid rgba(0, 200, 255, 0.3)',
                            transition: 'all 0.3s',
                            '&:hover': {
                              transform: 'scale(1.01)',
                              boxShadow: '0 0 20px rgba(0, 200, 255, 0.3)',
                              borderColor: 'rgba(0, 200, 255, 0.5)'
                            }
                          }}>
                            <Avatar
                              src={`${char.thumbnail.path}.${char.thumbnail.extension}`}
                              sx={{ 
                                width: 56, 
                                height: 56,
                                border: '2px solid #00C8FF',
                                boxShadow: '0 0 10px rgba(0, 200, 255, 0.5)'
                              }}
                            />
                            <Box flexGrow={1}>
                              <Typography variant="body1" color="white" sx={{ fontWeight: 600 }}>
                                {char.name}
                                {mode === 'Friend' && (
                                  <Chip 
                                    label="Friend's Item" 
                                    size="small" 
                                    sx={{ 
                                      ml: 1,
                                      background: 'rgba(0, 200, 255, 0.2)',
                                      color: '#00C8FF',
                                      fontWeight: 600
                                    }}
                                  />
                                )}
                              </Typography>
                              <TextField
                                label="Quantity"
                                type="number"
                                size="small"
                                value={item.quantity}
                                inputProps={{ min: 1 }}
                                onChange={(e) => {
                                  const qty = Math.max(1, parseInt(e.target.value));
                                  setRequestedItems(prev =>
                                    prev.map((itm, i) => i === index ? { ...itm, quantity: qty } : itm)
                                  );
                                }}
                                sx={{
                                  mt: 1,
                                  '& .MuiInputBase-root': {
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: 1
                                  },
                                  input: { 
                                    color: '#00C8FF',
                                    fontWeight: 600,
                                    textAlign: 'center'
                                  },
                                  '& label': { 
                                    color: '#aaa',
                                    transform: 'translate(14px, 8px) scale(1)'
                                  },
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': { 
                                      borderColor: 'rgba(0, 200, 255, 0.3)',
                                      borderWidth: 2
                                    },
                                    '&:hover fieldset': { 
                                      borderColor: 'rgba(0, 200, 255, 0.5)' 
                                    },
                                    '&.Mui-focused fieldset': { 
                                      borderColor: '#00C8FF',
                                      boxShadow: '0 0 10px rgba(0, 200, 255, 0.5)'
                                    }
                                  }
                                }}
                              />
                            </Box>
                            <IconButton
                              onClick={() =>
                                setRequestedItems(prev => prev.filter((_, i) => i !== index))
                              }
                              sx={{ 
                                color: '#ff6b6b',
                                transition: 'all 0.3s',
                                '&:hover': {
                                  color: '#ff3b3b',
                                  transform: 'scale(1.2)'
                                }
                              }}
                            >
                              <Close />
                            </IconButton>
                          </Paper>
                        </Grow>
                      );
                    }
                    
                    return null;
                  })}

                  {requestedItems.filter(item => item.type === 'collection').map((item, index) => {
                    const collection = friendCollections?.find(c => c._id === item.collectionId);
                    if (!collection) return null;

                    const mainHeroId = collection.mainCharacterId || collection.displayedHeroes[0];
                    const mainHero = charactersDetails.find(c => c.id === mainHeroId);
                    const isExpanded = expandedCollections.has(collection._id);

                    return (
                      <Grow in={true} key={`${item.collectionId}-${index}`} timeout={index * 100}>
                        <Paper sx={{ 
                          mb: 2,
                          p: 2, 
                          bgcolor: 'rgba(30, 30, 30, 0.7)',
                          borderRadius: 2,
                          border: '1px solid rgba(0, 200, 255, 0.2)',
                          transition: 'all 0.3s',
                          '&:hover': {
                            boxShadow: '0 0 20px rgba(0, 200, 255, 0.3)',
                            borderColor: 'rgba(0, 200, 255, 0.4)'
                          }
                        }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar
                                src={mainHero ? `${mainHero.thumbnail.path}.${mainHero.thumbnail.extension}` : collection.image}
                                sx={{ 
                                  width: 60, 
                                  height: 60,
                                  border: '2px solid #00C8FF',
                                  boxShadow: '0 0 10px rgba(0, 200, 255, 0.5)'
                                }}
                              />
                              <Box>
                                <Typography variant="body1" color="white" sx={{ fontWeight: 600 }}>
                                  {collection.name}
                                  <Chip 
                                    label="Friend's Collection" 
                                    size="small" 
                                    sx={{ 
                                      ml: 1,
                                      background: 'rgba(0, 200, 255, 0.2)',
                                      color: '#00C8FF',
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      height: 20
                                    }}
                                  />
                                </Typography>
                                <Typography variant="body2" color="#aaa">
                                  {collection.displayedHeroes.length} heroes in collection
                                </Typography>
                              </Box>
                            </Box>
                            <Box display="flex" gap={1}>
                              <IconButton 
                                onClick={() => toggleExpandCollection(collection._id)} 
                                sx={{ 
                                  color: isExpanded ? '#ff8a00' : '#00C8FF',
                                  transition: 'all 0.3s',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    color: isExpanded ? '#ffaa00' : '#00d4ff'
                                  }
                                }}
                              >
                                {isExpanded ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                              <IconButton
                                onClick={() => setRequestedItems(prev => prev.filter(i => !(i.type === 'collection' && i.collectionId === collection._id)))}
                                sx={{ 
                                  color: '#ff6b6b',
                                  transition: 'all 0.3s',
                                  '&:hover': {
                                    color: '#ff3b3b',
                                    transform: 'scale(1.2)'
                                  }
                                }}
                              >
                                <Close />
                              </IconButton>
                            </Box>
                          </Box>

                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Typography variant="body2" color="#aaa" sx={{ mt: 2, mb: 1 }}>
                              Collection Heroes:
                            </Typography>
                            <Grid container spacing={1} mt={1}>
                              {collection.displayedHeroes.map((heroId, idx) => {
                                const hero = charactersDetails.find(c => c.id === heroId);
                                if (!hero) return null;
                                return (
                                  <Grid key={hero.id}>
                                    <Paper sx={{ 
                                      p: 1, 
                                      bgcolor: 'rgba(40, 40, 40, 0.7)',
                                      borderRadius: 1,
                                      border: '1px solid rgba(0, 200, 255, 0.1)',
                                      transition: 'all 0.3s',
                                      '&:hover': {
                                        transform: 'translateY(-3px)',
                                        boxShadow: '0 5px 15px rgba(0, 200, 255, 0.3)'
                                      }
                                    }}>
                                      <Avatar
                                        src={`${hero.thumbnail.path}.${hero.thumbnail.extension}`}
                                        sx={{ 
                                          width: '100%', 
                                          height: 100, 
                                          borderRadius: 1,
                                          border: '2px solid #00C8FF'
                                        }}
                                      />
                                      <Typography variant="body2" color="white" noWrap sx={{ mt: 1, fontWeight: 600 }}>
                                        {hero.name}
                                      </Typography>
                                      <Chip 
                                        label={hero.rarity} 
                                        size="small" 
                                        sx={{ 
                                          mt: 0.5,
                                          background: 'rgba(0, 200, 255, 0.2)',
                                          color: '#a8e6ff',
                                          fontSize: '0.7rem',
                                          height: 20
                                        }}
                                      />
                                    </Paper>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </Collapse>
                        </Paper>
                      </Grow>
                    );
                  })}
                </Box>
    
                <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Request Coins"
                  type="number"
                  value={requestCoins}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ color: '#00C8FF', fontWeight: 600 }}>coins</Typography>
                      </InputAdornment>
                    ),
                    inputProps: { min: 0 }
                  }}
                  onChange={(e) => {
                    const value = Math.max(0, parseInt(e.target.value));
                    handleAddRequestCoins(value);
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 1
                    },
                    input: { 
                      color: '#00C8FF',
                      fontWeight: 600,
                      fontSize: '1.1rem'
                    },
                    '& label': { 
                      color: '#aaa',
                      fontSize: '1rem'
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { 
                        borderColor: 'rgba(0, 200, 255, 0.3)',
                        borderWidth: 2
                      },
                      '&:hover fieldset': { 
                        borderColor: 'rgba(0, 200, 255, 0.5)' 
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#00C8FF',
                        boxShadow: '0 0 10px rgba(0, 200, 255, 0.5)'
                      }
                    }
                  }}
                />
                </Box>
              </Box>
            </Grid>
          </Grid>
    
          {error && (
            <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}
    
          <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
            <Button 
              onClick={onClose} 
              variant="outlined"
              disabled={isSubmitting}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 700,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  boxShadow: '0 0 15px rgba(255,255,255,0.3)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              disabled={!offeredItems.length || !requestedItems.length || isSubmitting}
              onClick={handleSubmitTrade}
              sx={{
                px: 5,
                py: 1.5,
                fontWeight: 700,
                fontSize: '1rem',
                background: '#00C8FF',
                color: '#121212',
                '&:hover': {
                  background: '#00a0cc',
                  boxShadow: '0 0 20px rgba(0, 200, 255, 0.5)'
                },
                '&.Mui-disabled': {
                  background: 'rgba(100,100,100,0.3)',
                  color: 'rgba(200,200,200,0.5)'
                }
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: '#121212' }} />
              ) : mode === 'Market' ? (
                'Post to Marketplace'
              ) : (
                'Send Trade Request'
              )}
            </Button>
          </Box>
        </Paper>
      </Fade>
        <CharacterDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          userId={user?.id || 0}
          ownedCharacters={user?.purchasedCharacters || []}
          collections={user?.inventory || []}
          onSelect={(id, maxQty) => {
            if (drawerMode === 'offer') {
              handleAddOfferCharacter(id, maxQty);
            } else {
              handleAddRequestCharacter(id);
            }
          }}
          onCollectionSelect={(id) => {
            if (drawerMode === 'offer') {
              handleAddOfferCollection(id);
            }
          }}
          onCharacterDataLoaded={setCharactersDetails}
          mode={drawerMode}
          initialTab={tabValue}
          tradeMode={mode}
          friendData={mode === 'Friend' ? friendCharacters : undefined}
          friendCollections={mode === 'Friend' ? friendCollections : undefined}
          onRequestCollectionSelect={handleAddRequestCollection}
        />
    </>
  );
};

export default CreateTradeMenu;