import { useState, useEffect } from 'react';
import { 
  Grid, Typography, CircularProgress, Alert, Card, 
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, 
  IconButton, MenuItem, Select, Chip, Avatar, Box, Drawer, List, ListItem, ListItemAvatar, ListItemText,
  Badge, useMediaQuery,
  styled
} from '@mui/material';
import { Add, Edit, Delete, Close, Star,ArrowBack } from '@mui/icons-material';
import axios from 'axios';

interface Collection {
  _id: string;
  name: string;
  description: string;
  maxHeroes: number;
  displayedHeroes: number[];
  mainCharacterId?: number;
  heroes: number[];
  tags: string[];
}

interface PurchasedCharacter {
  characterId: number;
  quantity: number;
}

interface CharacterDetails {
  id: number;
  name: string;
  thumbnail: {
    path: string;
    extension: string;
  };
  comics: {
    available: number;
  };
  rarity: string;
}

interface CollectionsProps {
  inventory: Collection[];
  characterIds: number[];
  purchasedCharacters: PurchasedCharacter[];
  onInventoryUpdate: (newInventory: Collection[]) => void;
}

const Collections = ({ 
  inventory = [], 
  characterIds = [], 
  purchasedCharacters = [], 
  onInventoryUpdate 
}: CollectionsProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collections, setCollections] = useState<Collection[]>(inventory);
  const [availableHeroes, setAvailableHeroes] = useState<number[]>([]);
  const [characters, setCharacters] = useState<Record<number, CharacterDetails>>({});
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [heroDrawerOpen, setHeroDrawerOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [maxHeroes, setMaxHeroes] = useState(12);
  const [mainCharacterId, setMainCharacterId] = useState<number | null>(null);
  
  const isMobile = useMediaQuery('(max-width:900px)');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const characterResponses = await Promise.all(
          characterIds.map(id =>
            axios.get(`/api/marvel/fulldatacharacter/${id}`)
              .then(res => res.data)
              .catch(() => null)
          )
        );
        const charactersMap = characterResponses.reduce((acc, curr) => {
          if (curr) acc[curr.id] = curr;
          return acc;
        }, {} as Record<number, CharacterDetails>);
        setCharacters(charactersMap);

        const usedCounts: Record<number, number> = {};
        inventory.forEach(collection => {
          (collection.heroes || []).forEach(heroId => {
            usedCounts[heroId] = (usedCounts[heroId] || 0) + 1;
          });
        });

        const available = purchasedCharacters
          .filter(pc => (pc.quantity - (usedCounts[pc.characterId] || 0)) > 0)
          .map(pc => pc.characterId);

        setAvailableHeroes(available);

        const rebuiltCollections = inventory.map(c => {
          const baseHeroes = [...(c.displayedHeroes || [])];
          if (c.mainCharacterId && !baseHeroes.includes(c.mainCharacterId)) {
            baseHeroes.push(c.mainCharacterId);
          }
          return {
            ...c,
            heroes: baseHeroes
          };
        });

        setCollections(rebuiltCollections);
      } catch (err) {
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [inventory, characterIds, purchasedCharacters]);

  useEffect(() => {
    if (!loading) {
      const usedCounts: Record<number, number> = {};
      collections.forEach(c => {
        c.heroes.forEach(heroId => {
          usedCounts[heroId] = (usedCounts[heroId] || 0) + 1;
        });
      });
      const globalAvailable = purchasedCharacters
        .filter(pc => pc.quantity > (usedCounts[pc.characterId] || 0))
        .map(pc => pc.characterId);

      if (selectedCollection) {
        const currentHeroes = new Set(selectedCollection.heroes);
        setAvailableHeroes(globalAvailable.filter(id => !currentHeroes.has(id)));
      } else {
        setAvailableHeroes(globalAvailable);
      }
    }
  }, [collections, purchasedCharacters, selectedCollection, loading]);

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      try {
        const details = await Promise.all(
          characterIds.map(async (id) => {
            const res = await axios.get(`/api/marvel/fulldatacharacter/${id}`);
            return res.data;
          })
        );
        const charactersMap = details.reduce((acc, curr) => ({
          ...acc,
          [curr.id]: curr
        }), {});
        setCharacters(charactersMap);
        setLoading(false);
      } catch (err) {
        setError('Error loading character data');
        setLoading(false);
      }
    };
    characterIds.length > 0 ? fetchCharacterDetails() : setLoading(false);
  }, [characterIds]);

  const handleSaveCollection = async () => {
    if (!name.trim() || !mainCharacterId) return;
    try {
      const token = localStorage.getItem('token');
      const method = editingCollection ? 'put' : 'post';
      const url = editingCollection 
        ? `/api/collections/${editingCollection._id}`
        : '/api/collections';

      const { data } = await axios[method](url, {
        name,
        description,
        tags: tags.split(',').map(t => t.trim()),
        maxHeroes,
        mainCharacterId,
        displayedHeroes: [mainCharacterId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedCollections = editingCollection
        ? collections.map(c => c._id === data._id ? data : c)
        : [...collections, data];

      setCollections(updatedCollections);
      onInventoryUpdate(updatedCollections);
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving collection');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/collections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedCollections = collections.filter(c => c._id !== id);
      setCollections(updatedCollections);
      onInventoryUpdate(updatedCollections);

      const usedHeroes = new Set(updatedCollections.flatMap(c => c.displayedHeroes));
      setAvailableHeroes(characterIds.filter(id => !usedHeroes.has(id)));
    } catch (err) {
      setError('Error deleting collection');
    }
  };

  const handleAddHero = async (heroId: number) => {
    if (!selectedCollection || selectedSlotIndex === null) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `/api/collections/${selectedCollection._id}/add-hero`,
        { 
          marvelId: heroId,
          slotIndex: selectedSlotIndex
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCollections(prev => 
        prev.map(c => c._id === data._id ? {
          ...c,
          heroes: data.heroes,
          displayedHeroes: data.displayedHeroes
        } : c)
      );

      setSelectedCollection(prev => 
        prev?._id === data._id ? { ...prev, ...data } : prev
      );

      setHeroDrawerOpen(false);
      setSelectedSlotIndex(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating hero');
    }
  };

  const handleRemoveHero = async (collectionId: string, slotIndex: number) => {
    try {
      if (slotIndex === 0) {
        setError('You cannot delete the first hero from the collection');
        return;
      }
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `/api/collections/${collectionId}/remove-hero`,
        { slotIndex },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCollections(prev => 
        prev.map(c => c._id === collectionId ? data : c)
      );

      if (selectedCollection?._id === collectionId) {
        setSelectedCollection(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTags('');
    setMaxHeroes(12);
    setMainCharacterId(null);
    setEditingCollection(null);
  };

  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return '#808080';
      case 'uncommon': return '#00ff00';
      case 'rare': return '#0066ff';
      case 'epic': return '#9900ff';
      case 'legendary': return '#ff9900';
      default: return '#ffffff';
    }
  };

  const getRemainingCount = (heroId: number) => {
    const purchased = purchasedCharacters.find(pc => pc.characterId === heroId);
    if (!purchased) return 0;
    
    const usedCount = collections.reduce((acc, c) => {
      return acc + c.heroes.filter(hId => hId === heroId).length;
    }, 0);
    
    return purchased.quantity - usedCount;
  };

  if (loading) return <CircularProgress sx={{ color: '#00C8FF', margin: 'auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ 
          color: 'white',  
          letterSpacing: 2,
        }}>
          MARVEL COLLECTIONS
        </Typography>
        <AuthButton 
          variant="contained" 
          sx={{
            bgcolor: '#00b3ff',
            px: 4,
            borderRadius: 4,
            '&:hover': { bgcolor: '#0099cc' }
          }}
          startIcon={<Add />}
          onClick={() => {
            resetForm();
            setOpenDialog(true);
          }}
        >
          NEW COLLECTION
        </AuthButton >
      </Box>
      <Dialog
       open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md"
       hideBackdrop
       disableEnforceFocus
       disableAutoFocus
       disableEscapeKeyDown
       disableRestoreFocus
       keepMounted
       >
        <DialogTitle sx={{ 
          bgcolor: '#1a1a1a', 
          color: 'white', 
          borderBottom: '2px solid #00C8FF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{editingCollection ? 'EDIT COLLECTION' : 'NEW COLLECTION'}</span>
          <IconButton onClick={() => setOpenDialog(false)} sx={{ color: '#00C8FF' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a1a1a', p: 3 }}>
          <Grid container spacing={2} mt={3}>
            <Grid>
            <TextField
             fullWidth
             label="Collection Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
              inputProps={{ 
              minLength: 3,
              pattern: ".{3,}",
              title: "The name must contain at least 3 characters",
              }}
              InputLabelProps={{
                sx: { color: 'white' }
              }}
              InputProps={{
                sx: {
                  color: 'white',
                }
              }}
            />

            </Grid>

            <Grid>
              <Select
                fullWidth
                value={maxHeroes}
                onChange={(e) => setMaxHeroes(Number(e.target.value))}
                sx={{ 
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: '#00C8FF'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#1a1a1a' 
                    }
                  },
                  MenuListProps: {
                    sx: {
                      bgcolor: '#1a1a1a'
                    }
                  }
                }}
              >
                {[12, 16, 20, 24, 30, 50].map(size => (
                  <MenuItem
  key={size}
  value={size}
  sx={{
    paddingTop:1,
    bgcolor: '#1a1a1a',
    color: 'white',
    '&.Mui-selected': {
      bgcolor: '#1a1a1a', 
      color: 'white',
    },
    '&.Mui-selected:hover': {
      bgcolor: '#333333',   
    },
    '&:hover': {
      bgcolor: '#333333',   
    }
  }}
>
  {size} Heroes
</MenuItem>

                ))}
              </Select>
            </Grid>
            <Grid>
              <Typography variant="h6" sx={{ color: '#00C8FF', mb: 2 }}>
                Select Main Hero
              </Typography>
              <Grid container spacing={1}>
                {availableHeroes.map(id => (
                  <Grid key={id}>
                    <Avatar
                      src={`${characters[id]?.thumbnail.path}.${characters[id]?.thumbnail.extension}`}
                      sx={{
                        width: 80,
                        height: 80,
                        border: mainCharacterId === id ? '3px solid #00C8FF' : '2px solid #444',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: '#00C8FF'
                        }
                      }}
                      onClick={() => setMainCharacterId(id)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a1a1a', borderTop: '2px solid #00C8FF' }}>
          <AuthButton
            onClick={() => setOpenDialog(false)} 
            variant="outlined"
            sx={{ borderColor: '#404040', color: 'white', height:40, mt:1 }}
          >
            Cancel
          </AuthButton>
          <AuthButton 
            onClick={handleSaveCollection}
            variant="contained"
            sx={{height:40, mt:1}}
          >
            {editingCollection ? 'UPDATE' : 'CREATE'}
          </AuthButton>
        </DialogActions>
      </Dialog>

      <Drawer
      anchor="right"
      open={heroDrawerOpen}
      onClose={() => setHeroDrawerOpen(false)}
      hideBackdrop
      variant="persistent"
      ModalProps={{
        keepMounted: true,
        disableEnforceFocus: true,
        disableAutoFocus: true,
        BackdropProps: {
          invisible: true,
        },
      }}
      PaperProps={{
        sx: {
          bgcolor: '#121212',
          width: isMobile ? 300 : 400,
          zIndex: 1400,
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100%',
        },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            bgcolor: '#1a1a1a',
            p: 2,
            borderBottom: '2px solid #00C8FF',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <IconButton onClick={() => setHeroDrawerOpen(false)} sx={{ color: '#00C8FF', mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Select Hero for Slot {selectedSlotIndex !== null ? selectedSlotIndex + 1 : ''}
          </Typography>
        </Box>
        <List sx={{ overflowY: 'auto', flex: 1 }}>
          {availableHeroes.map((id) => {
            const character = characters[id];
            const remaining = getRemainingCount(id);
            const isInCurrentCollection = selectedCollection?.heroes.includes(id);

            return (
              <ListItem
                key={id}
                button
                onClick={() => {
                  if (!isInCurrentCollection && remaining > 0) {
                    handleAddHero(id); 
                  }
                }}
                disabled={isInCurrentCollection || remaining <= 0}
                sx={{
                  bgcolor: '#1a1a1a',
                  mb: 1,
                  '&:hover': {
                    bgcolor: '#00C8FF20',
                  },
                }}
              >
                <ListItemAvatar>
                  <Badge badgeContent={remaining} color={remaining > 0 ? 'success' : 'error'} overlap="circular">
                    <Avatar
                      src={`${character?.thumbnail.path}.${character?.thumbnail.extension}`}
                      sx={{ width: 60, height: 60 ,mr:1}}
                    />
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={character?.name}
                  primaryTypographyProps={{
                    sx: {
                      color: isInCurrentCollection ? '#666' : 'white',
                      fontWeight: 'bold',
                    },
                  }}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Chip
                        label={character?.rarity}
                        size="small"
                        sx={{
                          bgcolor: getRarityColor(character?.rarity || ''),
                          color: '#121212',
                          fontWeight: 'bold',
                          mr: 1,
                        }}
                      />
                      {isInCurrentCollection && (
                        <Chip
                          label="Already in collection"
                          size="small"
                          sx={{ bgcolor: '#666', color: 'white' }}
                        />
                      )}
                    </Box>
                  }
                />
                {!isInCurrentCollection && remaining > 0 && (
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#00C8FF',
                      borderColor: '#00C8FF',
                      '&:hover': {
                        bgcolor: '#00C8FF20',
                      },
                    }}
                  >
                    Select
                  </Button>
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
      {selectedCollection && (
  <Box
    sx={{
      position: 'fixed',
      top: 100,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90vw',
      maxWidth: 1200,
      maxHeight: '80vh',
      bgcolor: '#121212',
      zIndex: 1300,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 1,
      boxShadow: 24,
      overflow: 'hidden',
      
    }}
  >
    <Box
      sx={{
        bgcolor: '#1a1a1a',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #00C8FF',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant="h5"
          sx={{
            color: '#00C8FF',
            fontFamily: 'Bebas Neue',
            letterSpacing: 1.2,
          }}
        >
          {selectedCollection.name.toUpperCase()}
        </Typography>
        <Chip
          label={`${selectedCollection.displayedHeroes.length}/${selectedCollection.maxHeroes}`}
          sx={{
            bgcolor: '#00C8FF',
            color: '#121212',
            fontWeight: 'bold',
          }}
        />
      </Box>
      <IconButton onClick={() => setSelectedCollection(null)} sx={{ color: '#00C8FF' }}>
        <Close />
      </IconButton>
    </Box>
    <Box
      sx={{
        p: 3,
        overflowY: 'auto',
        flexGrow: 1,
      }}
    >
      <Grid container spacing={2}>
        {Array.from({
          length: Math.min(
            (selectedCollection.displayedHeroes?.length || 0) + 1,
            selectedCollection.maxHeroes || 0
          ),
        }).map((_, index) => {
          const heroId = selectedCollection.displayedHeroes[index];
          const character = heroId ? characters[heroId] : null;
          return (
            <Grid key={index}>
              <Card
                sx={{
                  bgcolor: '#1a1a1a',
                  cursor: 'pointer',
                  position: 'relative',
                  height: 250,
                  border: character
                    ? `2px solid ${getRarityColor(character.rarity)}`
                    : '2px dashed #00C8FF',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    transition: 'all 0.3s ease',
                  },
                  transition: 'all 0.3s ease',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSlotIndex(index);
                  setHeroDrawerOpen(true);
                }}
              >
                {character ? (
                  <>
                    {index !== 0 && (
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          zIndex: 2,
                          color: '#00C8FF',
                          '&:hover': {
                            bgcolor: '#00C8FF20',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveHero(selectedCollection._id, index);
                        }}
                      >
                        <Delete />
                      </IconButton>
                    )}
                    <Avatar
                      src={`${character.thumbnail.path}.${character.thumbnail.extension}`}
                      sx={{
                        width: 200,
                        height: '100%',
                        borderRadius: 0,
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        bgcolor: 'rgba(0,0,0,0.8)',
                        p: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color:'white',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: 'white' }}>
                        {character.name}
                      </Typography>
                      <Chip
                        label={character.rarity}
                        size="small"
                        sx={{
                          bgcolor: getRarityColor(character.rarity),
                          color: '#121212',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                    {index === 0 && (
                      <Star sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'gold',
                        fontSize: 30,
                        zIndex: 2
                      }} />
                    )}
                  </>
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      width:200,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00C8FF',
                    }}
                  >
                    <Add sx={{ fontSize: 50 }} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Add Hero
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  </Box>
)}
      <Grid container spacing={3}>
        {collections.map(collection => {
          const mainHeroId = collection.mainCharacterId || collection.displayedHeroes[0];
          const mainHero = mainHeroId ? characters[mainHeroId] : null;
          return (
            <Grid key={collection._id}>
              <Card 
                sx={{ 
                  bgcolor: '#1a1a1a',
                  cursor: 'pointer',
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  '&:hover': { 
                    transform: 'translateY(-10px)',
                    transition: 'all 0.3s ease'
                  },
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSelectedCollection(collection)}
              >
                {mainHero && (
                  <>
                    <Box sx={{
                      position: 'relative',
                      height: 300,
                      overflow: 'hidden',
                      mb:-4,
                    }}>
                      <Avatar
                        src={`${mainHero.thumbnail.path}.${mainHero.thumbnail.extension}`}
                        sx={{ 
                          width:250, 
                          height:300,
                          borderRadius: 0,
                          objectFit: 'cover'
                        }}
                      />
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        p: 1,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Typography variant="h6" sx={{ 
                          color: 'white', 
                          fontFamily: 'Bebas Neue',
                          letterSpacing: 1.2,
                          fontSize: '1.4rem'
                        }}>
                          {collection.name}
                        </Typography>
                      </Box>
                      <Box sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        gap: 1,
                        justifyContent: 'flex-end'
                      }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCollection(collection);
                            setName(collection.name);
                            setDescription(collection.description);
                            setTags(collection.tags.join(','));
                            setMaxHeroes(collection.maxHeroes);
                            setMainCharacterId(collection.mainCharacterId || null);
                            setOpenDialog(true);
                          }}
                          sx={{ 
                            bgcolor: 'transparent', 
                            color: '#00C8FF',
                            border: '1px solid #00C8FF',
                            '&:hover': { bgcolor: '#00C8FF20' }
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(collection._id);
                          }}
                          sx={{ 
                            bgcolor: 'transparent', 
                            color: '#ff5555',
                            border: '1px solid #ff5555',
                            '&:hover': { bgcolor: '#ff555520' }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                      <Star sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'gold',
                        fontSize: 30,
                        zIndex: 2
                      }} />
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#121212' }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {collection.tags.map((tag, i) => (
                          <Chip 
                            key={i} 
                            label={tag} 
                            size="small" 
                            sx={{ 
                              bgcolor: '#00C8FF20', 
                              color: '#00C8FF',
                              border: '1px solid #00C8FF'
                            }} 
                          />
                        ))}
                      </Box>
                    </Box>
                  </>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
const AuthButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  padding: theme.spacing(1.5, 3),
  borderRadius: '8px',
  color:'white',
  transition: 'all 0.3s ease',
  fontSize: '0.95rem',
  '&:hover': {
    transform: 'translateY(-2px)',
  }
}));
export default Collections;