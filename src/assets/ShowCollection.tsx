import { useState, useEffect } from 'react';
import { 
  Grid, Typography, Card, Avatar, Box, Chip, 
  CircularProgress, Alert, Dialog, DialogTitle, 
  DialogContent, IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import axios from 'axios';

interface Collection {
  _id: string;
  name: string;
  description: string;
  maxHeroes: number;
  displayedHeroes: number[];
  mainCharacterId?: number;
  tags: string[];
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

interface ShowCollectionProps {
  collections: Collection[];
}

const ShowCollection = ({ collections }: ShowCollectionProps) => {
  const [characters, setCharacters] = useState<Record<number, CharacterDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: '#808080',
      uncommon: '#00ff00',
      rare: '#0066ff',
      epic: '#9900ff',
      legendary: '#ff9900'
    };
    return colors[rarity.toLowerCase()] || '#ffffff';
  };

  const fixImageUrl = (thumbnail: { path: string; extension: string }) => {
    let url = `${thumbnail.path}.${thumbnail.extension}`;
    url = url.replace('http://', 'https://');
    if (url.includes('image_not_available')) {
      return 'https://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available/portrait_uncanny.jpg';
    }
    return url;
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCharacterData = async () => {
      try {
        const allCharacterIds = collections
          .flatMap(c => c.displayedHeroes)
          .filter(id => id !== undefined && !isNaN(id));

        const uniqueIds = [...new Set(allCharacterIds)];

        if (!uniqueIds.length) {
          setLoading(false);
          return;
        }

        const charactersData = await Promise.all(
          uniqueIds.map(id => 
            axios.get(`/api/marvel/fulldatacharacter/${id}`, {
              signal: controller.signal
            })
            .then(res => res.data)
            .catch(() => null)
          )
        );

        if (isMounted) {
          const validCharacters = charactersData.filter(Boolean);
          const charactersMap = validCharacters.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
          }, {} as Record<number, CharacterDetails>);
          
          setCharacters(charactersMap);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load character data');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCharacterData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [collections]);

  const getMainHero = (collection: Collection) => {
    const displayedHeroes = collection.displayedHeroes || [];
    const validHeroes = displayedHeroes
      .filter(id => characters[id])
      .map(id => characters[id]);
  
    if (!validHeroes.length) return null;
    
    return validHeroes.find(h => h.id === collection.mainCharacterId) || validHeroes[0];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#00b3ff' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }
  return (
    <Box sx={{ p: 3 }}>

      <Grid container spacing={3}>
      {collections.map(collection => {
  const displayedHeroes = collection.displayedHeroes || [];
  const hasHeroes = displayedHeroes.length > 0;
  const mainHero = getMainHero(collection);

          return (
            <Grid key={collection._id}>
              <Card 
                sx={{ 
                  bgcolor: '#1a1a1a',
                  height: 300,
                  overflow: 'hidden',
                  position: 'relative',
                  borderRadius:5,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => setSelectedCollection(collection)}
              >
                {hasHeroes && mainHero ? (
                  <>
                    <Avatar
                      src={fixImageUrl(mainHero.thumbnail)}
                      sx={{ 
                        width: 300, 
                        height: 300,
                        borderRadius: 0,
                        bgcolor: '#333',
                        '& .MuiAvatar-img': {
                          objectFit: 'cover',
                          objectPosition: 'top'
                        }
                      }}
                      variant="square"
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
                        letterSpacing: 1.2
                      }}>
                        {collection.name}
                      </Typography>
                      <Chip
                        label={`${collection.displayedHeroes.length}/${collection.maxHeroes}`}
                        sx={{ 
                          bgcolor: '#e62429', 
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 1,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      gap: 1
                    }}>
                      <Chip
                        label={mainHero.rarity}
                        size="small"
                        sx={{ 
                          bgcolor: getRarityColor(mainHero.rarity),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Typography variant="body2" sx={{ 
                        color: 'white',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {mainHero.name}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00b3ff',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {collection.name}
                    </Typography>
                    <Typography variant="body2">
        {displayedHeroes.length > 0 
          ? 'Loading characters...'
          : 'Empty collection'}
      </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
  open={!!selectedCollection}
  onClose={() => setSelectedCollection(null)}
  fullWidth
  maxWidth="lg"
  PaperProps={{
    sx: {
      overflowY: 'visible',  
      borderRadius: 5,
      overflow: 'hidden',     
      bgcolor: '#202020',     
    }
  }}
>
  <DialogTitle sx={{ 
    bgcolor: '#1a1a1a', 
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #00b3ff',
  }}>
    {selectedCollection?.name.toUpperCase()}
    <IconButton onClick={() => setSelectedCollection(null)}>
      <Close sx={{ color: 'white' }} />
    </IconButton>
  </DialogTitle>
  <DialogContent sx={{ 
    bgcolor: '#202020', 
    p: 3,
    overflowY: 'visible',
    '& .MuiGrid-container': {
      maxHeight: '70vh',
      minHeight:350,
      overflow: 'auto',
      justifyContent: 'flex-start',
      maxWidth: '100%',
      margin: '0 auto'
    }
  }}>
    <Grid container spacing={2}>
      {selectedCollection?.displayedHeroes.map((heroId, index) => {
        const character = characters[heroId];
        const imageUrl = character ? fixImageUrl(character.thumbnail) : '';

        return (
          <Grid key={index} mt={3} sx={{
            width: 250,
            height: 320,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Card 
              sx={{ 
                height: '100%',
                minHeight: 300,
                ml:1,
                bgcolor: 'transparent',
                position: 'relative',
                border: character ? `2px solid ${getRarityColor(character.rarity)}` : '2px dashed #444',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,  
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.3s'
                }
              }}
            >
              {character ? (
                <>
                  <Avatar
                    src={imageUrl}
                    sx={{ 
                      width: '100%',
                      height: 279,
                      borderRadius: 2,
                      flexShrink: 0,
                      bgcolor: '#333',
                      '& .MuiAvatar-img': {
                        objectFit: 'cover',
                        objectPosition: 'top'
                      }
                    }}
                  />
                  <Box sx={{ 
                    bgcolor: 'rgba(0,0,0,0.1)',
                    p: 1,
                    mt: 'auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '70%',
                      fontFamily: 'Bebas Neue',
                      letterSpacing: 1.1
                    }}>
                      {character.name}
                    </Typography>
                    <Chip
                      label={character.rarity}
                      size="small"
                      sx={{ 
                        bgcolor: getRarityColor(character.rarity),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </>
              ) : (
                <Box sx={{ 
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}>
                  <CircularProgress size={40} sx={{ color: '#00b3ff' }} />
                </Box>
              )}
            </Card>
          </Grid>
        );
      })}
    </Grid>
  </DialogContent>
</Dialog>

    </Box>
  );
};

export default ShowCollection;