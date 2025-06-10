import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Button,
  Drawer,
  CircularProgress,
  Collapse,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { Close, Search } from '@mui/icons-material';
import axios from 'axios';

interface CharacterDetails {
  id: number;
  name: string;
  thumbnail: {
    path: string;
    extension: string;
  };
  rarity?: string;
  description?: string;
  comics?: { available: number };
}

interface Collection {
  _id: string;
  name: string;
  image: string;
  displayedHeroes: number[];
  mainCharacterId?: number;
}

interface CharacterDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  ownedCharacters: { characterId: number; quantity: number }[];
  collections: Collection[];
  onSelect: (id: number, maxQuantity: number) => void;
  onCharacterDataLoaded?: (characters: CharacterDetails[]) => void;
  onCollectionSelect?: (collectionId: string) => void;
  mode: 'offer' | 'request';
  initialTab: 'characters' | 'collections';
  tradeMode: 'Market' | 'Friend';
  friendData?: CharacterDetails[];
  friendCollections?: Collection[];
  onRequestCollectionSelect?: (collectionId: string) => void;
}

const CharacterDrawer = ({
  open,
  onClose,
  userId,
  ownedCharacters,
  collections,
  onSelect,
  onCharacterDataLoaded,
  onCollectionSelect,
  tradeMode,
  friendData,
  friendCollections,
  mode,
  initialTab,
  onRequestCollectionSelect
}: CharacterDrawerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ownedCharactersDetails, setOwnedCharactersDetails] = useState<CharacterDetails[]>([]);
  const [collectionCharactersDetails, setCollectionCharactersDetails] = useState<CharacterDetails[]>([]);
  const [searchResults, setSearchResults] = useState<CharacterDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'characters' | 'collections'>(initialTab);
  const [expandedCollectionIds, setExpandedCollectionIds] = useState<Set<string>>(new Set());

  const allCharacters = useMemo(() => {
    return [...ownedCharactersDetails, ...collectionCharactersDetails];
  }, [ownedCharactersDetails, collectionCharactersDetails]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const charactersUsedInCollections = useMemo(() => {
    const usageMap = new Map<number, number>();
    collections.forEach(collection => {
      collection.displayedHeroes.forEach(characterId => {
        const currentCount = usageMap.get(characterId) || 0;
        usageMap.set(characterId, currentCount + 1);
      });
    });
    return usageMap;
  }, [collections]);

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      try {
        const details = await Promise.all(
          ownedCharacters.map(async (pc) => {
            const res = await axios.get(`/api/marvel/fulldatacharacter/${pc.characterId}`);
            return {
              id: pc.characterId,
              name: res.data.name,
              thumbnail: res.data.thumbnail,
              rarity: res.data.rarity
            };
          })
        );
        setOwnedCharactersDetails(details);
        onCharacterDataLoaded?.(details);
      } catch (error) {
        console.error('Error fetching character details:', error);
      }
    };
    if (open && mode === 'offer' && tab === 'characters') fetchCharacterDetails();
  }, [open, ownedCharacters, onCharacterDataLoaded, mode, tab]);

  useEffect(() => {
    const fetchCollectionCharacters = async () => {
      const allHeroIds = collections.flatMap(c => c.displayedHeroes);
      const uniqueIds = [...new Set(allHeroIds)];
      if (!uniqueIds.length) return;
      try {
        const charactersData = await Promise.all(
          uniqueIds.map(id =>
            axios.get(`/api/marvel/fulldatacharacter/${id}`)
              .then(res => res.data)
              .catch(() => null)
          )
        );
        const validCharacters = charactersData.filter(Boolean);
        setCollectionCharactersDetails(validCharacters);
        onCharacterDataLoaded?.((prev) => {
          const existingIds = new Set(prev.map(c => c.id));
          const merged = [...prev];
          validCharacters.forEach((char: CharacterDetails) => {
            if (!existingIds.has(char.id)) {
              merged.push(char);
            }
          });
          return merged;
        });
      } catch (error) {
        console.error('Error loading collection character data:', error);
      }
    };
    if (open && mode === 'offer' && tab === 'collections') {
      fetchCollectionCharacters();
    }
  }, [open, tab, mode, collections, onCharacterDataLoaded]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchTerm.trim()) return setSearchResults([]);
      setLoading(true);
      try {
        const response = await axios.post('/api/marvel/search', { searchTerm });
        setSearchResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };
    const delayDebounce = setTimeout(() => {
      if (mode === 'request' && tradeMode === 'Market') fetchSearchResults();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, mode, tradeMode]);

  const filteredCollections = collections.filter(col =>
    col.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCollectionExpansion = (id: string) => {
    setExpandedCollectionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getAvailableQuantity = (characterId: number): number => {
    const owned = ownedCharacters.find(pc => pc.characterId === characterId)?.quantity || 0;
    const usedInCollections = charactersUsedInCollections.get(characterId) || 0;
    return Math.max(0, owned - usedInCollections);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      BackdropProps={{ invisible: true }}
      variant="persistent"
      
      hideBackdrop
      ModalProps={{
        keepMounted: true,
        disableEnforceFocus: true,
        disableAutoFocus: true,
        BackdropProps: {
          invisible: true,
        },
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          bgcolor: '#1a1a1a',
          p: 2,
          zIndex: 1400,
        },
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={
            mode === 'offer'
              ? tab === 'characters'
                ? "Search your characters..."
                : "Search your collections..."
              : tradeMode === 'Market'
                ? "Search all characters..."
                : "Search friend's items..."
          }
          InputProps={{
            startAdornment: <Search sx={{ color: 'rgba(0, 200, 255, 0.5)', mr: 1 }} />
          }}
          sx={{
            bgcolor: '#0f0f0f',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              color: '#00C8FF',
              '& fieldset': {
                borderColor: 'rgba(0, 200, 255, 0.3)'
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 200, 255, 0.5)'
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(0, 200, 255, 0.5)'
              }
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(0, 200, 255, 0.5)',
              opacity: 1
            }
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <IconButton onClick={onClose} sx={{ ml: 1, color: '#00C8FF' }}>
          <Close />
        </IconButton>
      </Box>

      {mode === 'offer' && (
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          sx={{ mb: 2 }}
          TabIndicatorProps={{
            style: {
              backgroundColor: '#00C8FF',
              height: 3,
              borderRadius: 2,
            }
          }}
        >
          <Tab 
            value="characters" 
            label="Characters" 
            sx={{ 
              color: 'rgba(0, 200, 255, 0.3)', 
              fontWeight: 600,
              '&.Mui-selected': {
                color: 'rgba(0, 200, 255, 0.7)', 
              }
            }}
          />
          <Tab 
            value="collections" 
            label="Collections" 
            sx={{ 
              color: 'rgba(0, 200, 255, 0.3)', 
              fontWeight: 600,
              '&.Mui-selected': {
                color: 'rgba(0, 200, 255, 0.7)', 
              }
            }}
          />
        </Tabs>
      )}

      <List>
        {tab === 'characters' && (
          <>
            {mode === 'request' && tradeMode === 'Friend' && friendData && (
              friendData
                .filter(char => 
                  char.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  char.id.toString().includes(searchTerm)
                )
                .map((char) => (
                  <ListItem
                    key={char.id}
                    secondaryAction={
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => onSelect(char.id, 1)}
                        sx={{
                          bgcolor: 'rgba(0, 200, 255, 0.1)',
                          color: '#00C8FF',
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: 'rgba(0, 200, 255, 0.2)'
                          }
                        }}
                      >
                        Add
                      </Button>
                    }
                    sx={{
                      bgcolor: '#262626',
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#333' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={`${char.thumbnail.path}.${char.thumbnail.extension}`}
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          border: '2px solid rgba(100, 200, 255, 0.2)',
                          boxShadow: '0 0 8px rgba(100, 200, 255, 0.3)'
                        }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                          {char.name}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ color: '#aaa', mt: 0.5 }}>
                          Rarity: {char.rarity}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))
            )}
            {mode === 'request' && tradeMode === 'Market' && (
              loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                searchResults
                  .filter(char => 
                    char.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    char.id.toString().includes(searchTerm)
                  )
                  .map((char) => (
                    <ListItem
                      key={char.id}
                      secondaryAction={
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => onSelect(char.id, 1)}
                          sx={{
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
                          Add
                        </Button>
                      }
                      sx={{
                        bgcolor: '#262626',
                        mb: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: '#333' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={`${char.thumbnail.path}.${char.thumbnail.extension}`}
                          sx={{ 
                            width: 56, 
                            height: 56, 
                            border: '2px solid rgba(100, 200, 255, 0.2)',
                            boxShadow: '0 0 8px rgba(100, 200, 255, 0.3)',
                          }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography sx={{ color: '#fff' }}>
                            {char.name}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: '#aaa', mt: 0.5 }}>
                            Comics: {char.comics?.available ?? 0}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
              )
            )}
            {mode === 'offer' && ownedCharactersDetails
              .filter(char => {
                const available = getAvailableQuantity(char.id);
                return available > 0 && (
                  char.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  char.id.toString().includes(searchTerm)
                );
              })
              .map((char) => {
                const available = getAvailableQuantity(char.id);
                return (
                  <ListItem
                    key={char.id}
                    secondaryAction={
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => onSelect(char.id, available)}
                        sx={{
                          bgcolor: 'rgba(0, 200, 255, 0.1)',
                          color: '#00C8FF',
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: 'rgba(0, 200, 255, 0.2)'
                          }
                        }}
                      >
                        Add
                      </Button>
                    }
                    sx={{
                      bgcolor: '#262626',
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#333' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={`${char.thumbnail.path}.${char.thumbnail.extension}`}
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          border: '2px solid rgba(100, 200, 255, 0.2)',
                          boxShadow: '0 0 8px rgba(100, 200, 255, 0.3)'
                        }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#fff' }}>
                          {char.name}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ color: '#ccc' }}>
                          <span style={{ color: '#0f0', fontWeight: 600 }}>Available: {available}</span> 
                          <span style={{ margin: '0 8px' }}>|</span>
                          Rarity: {char.rarity}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })
            }
          </>
        )}
        {tab === 'collections' && (
          <>
            {mode === 'offer' && filteredCollections.map((col) => {
              const displayedHeroes = col.displayedHeroes || [];
              const mainHeroId = col.mainCharacterId || displayedHeroes[0];
              const mainHero = allCharacters.find(c => c.id === mainHeroId);
              const isExpanded = expandedCollectionIds.has(col._id);
              return (
                <Box key={col._id}>
                  <ListItem
                    secondaryAction={
                      <>
                        <IconButton 
                          onClick={() => toggleCollectionExpansion(col._id)} 
                          sx={{ 
                            mr: 1, 
                            color: isExpanded ? 'rgba(0, 200, 255, 0.1)' : 'rgba(0, 200, 255, 0.3)',
                            transition: 'transform 0.3s',
                            background: 'rgba(0, 200, 255, 0.1)',
                            '&:hover': {
                              transform: 'scale(1.2)',
                              color: isExpanded ? 'rgba(0, 200, 255, 0.1)' : 'rgba(0, 200, 255, 0.3)'
                            }
                          }}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => onCollectionSelect?.(col._id)}
                          sx={{
                            bgcolor: 'rgba(0, 200, 255, 0.2)',
                            color: '#00C8FF',
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: 'rgba(0, 200, 255, 0.3)'
                            }
                          }}
                        >
                          Add
                        </Button>
                      </>
                    }
                    sx={{
                      bgcolor: '#262626',
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#333' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={mainHero ? `${mainHero.thumbnail.path}.${mainHero.thumbnail.extension}` : col.image}
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          mr: 2,
                          border: '2px solid rgba(100, 200, 255, 0.2)',
                          boxShadow: '0 0 8px rgba(100, 200, 255, 0.3)'
                        }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography sx={{ color: '#fff' }}>{col.name}</Typography>}
                      secondary={
                        <Typography sx={{ color: '#aaa' }}>
                          {displayedHeroes.length} characters
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 2, pr: 1 }}>
                      {displayedHeroes.map(heroId => {
                        const hero = allCharacters.find(c => c.id === heroId);
                        if (!hero) return null;
                        return (
                          <ListItem
                            key={hero.id}
                            sx={{
                              bgcolor: 'rgba(40, 40, 70, 0.5)',
                              mb: 1,
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'rgba(50, 50, 90, 0.7)' }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                src={`${hero.thumbnail.path}.${hero.thumbnail.extension}`}
                                sx={{ 
                                  width: 48, 
                                  height: 48,
                                  border: '1px solid rgba(148, 108, 230, 0.5)'
                                }}
                              />
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>
                                  {hero.name}
                                </Typography>
                              }
                              secondary={
                                <Typography sx={{ color: '#ccc', fontSize: '0.8rem' }}>
                                  Rarity: {hero.rarity}
                                </Typography>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            })}
            {mode === 'request' && tradeMode === 'Friend' && friendCollections && (
              friendCollections
                .filter(col => 
                  col.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  col._id.toString().includes(searchTerm)
                )
                .map((col) => {
                  const displayedHeroes = col.displayedHeroes || [];
                  const mainHeroId = col.mainCharacterId || displayedHeroes[0];
                  const mainHero = allCharacters.find(c => c.id === mainHeroId);
                  const isExpanded = expandedCollectionIds.has(col._id);
                  return (
                    <Box key={col._id}>
                      <ListItem
                        secondaryAction={
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => onRequestCollectionSelect?.(col._id)}
                            sx={{
                              bgcolor: 'rgba(0, 200, 255, 0.2)',
                              color: '#00C8FF',
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: 'rgba(0, 200, 255, 0.3)'
                              }
                            }}
                          >
                            Add
                          </Button>
                        }
                        sx={{
                          bgcolor: '#262626',
                          mb: 1,
                          borderRadius: 1,
                          '&:hover': { bgcolor: '#333' }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={mainHero ? `${mainHero.thumbnail.path}.${mainHero.thumbnail.extension}` : col.image}
                            sx={{ 
                              width: 56, 
                              height: 56, 
                              mr: 2,
                              border: '2px solid #64c8ff',
                              boxShadow: '0 0 8px rgba(100, 200, 255, 0.5)'
                            }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                              {col.name}
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: '#aaa' }}>
                              {displayedHeroes.length} characters
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ pl: 2, pr: 1 }}>
                          {displayedHeroes.map(heroId => {
                            const hero = allCharacters.find(c => c.id === heroId);
                            if (!hero) return null;
                            return (
                              <ListItem
                                key={hero.id}
                                sx={{
                                  bgcolor: 'rgba(100, 200, 255, 0.2)',
                                  mb: 1,
                                  borderRadius: 1,
                                  '&:hover': { bgcolor: 'rgba(100, 200, 255, 0.2)' }
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar
                                    src={`${hero.thumbnail.path}.${hero.thumbnail.extension}`}
                                    sx={{ 
                                      width: 48, 
                                      height: 48,
                                      border: '1px solid rgba(100, 200, 255, 0.5)'
                                    }}
                                  />
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>
                                      {hero.name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography sx={{ color: '#ccc', fontSize: '0.8rem' }}>
                                      Rarity: {hero.rarity}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Collapse>
                    </Box>
                  );
                })
            )}
          </>
        )}
        {mode === 'request' && tradeMode === 'Friend' && tab === 'characters' && friendData?.length === 0 && (
          <Typography sx={{ color: '#aaa', textAlign: 'center', mt: 3 }}>
            Friend has no characters available
          </Typography>
        )}
        {mode === 'request' && tradeMode === 'Friend' && tab === 'collections' && friendCollections?.length === 0 && (
          <Typography sx={{ color: '#aaa', textAlign: 'center', mt: 3 }}>
            Friend has no collections available
          </Typography>
        )}
        {mode === 'request' && tradeMode === 'Market' && !loading && searchResults.length === 0 && searchTerm && (
          <Typography sx={{ color: '#aaa', textAlign: 'center', mt: 3 }}>
            No characters found
          </Typography>
        )}
        {mode === 'offer' && tab === 'characters' && ownedCharactersDetails.length === 0 && (
          <Typography sx={{ color: '#aaa', textAlign: 'center', mt: 3 }}>
            No characters available
          </Typography>
        )}
        {mode === 'offer' && tab === 'collections' && filteredCollections.length === 0 && (
          <Typography sx={{ color: '#aaa', textAlign: 'center', mt: 3 }}>
            No collections found
          </Typography>
        )}
      </List>
    </Drawer>
  );
};

export default CharacterDrawer;