import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Stack, Chip,
  CircularProgress, IconButton, CardMedia, Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NavBar from '../assets/NavBar';
import Footer from '../assets/Footer';
import HeartButton from '../assets/HeartButton';
import { Close } from '@mui/icons-material';
import AddToCartButton from '../assets/AddToCartButton';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';
import Coin from '../assets/Coin';

interface MarvelCharacter {
  id: number;
  name: string;
  description: string;
  thumbnail: {
    path: string;
    extension: string;
  };
  comics: {
    available: number;
  };
  price: number;
  rarity: string;
  images: string[];
  customDescription: string;
  tags: string[];
  modified: string;
}

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'rare': return '#ffd600';
    case 'epic': return '#d500f9';
    case 'legendary': return '#ff6d00';
    default: return '#616161';
  }
};

const Wishlist = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useUser();
  const [characters, setCharacters] = useState<MarvelCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchCharacterDetails = async (characterId: number) => {
    try {
      const response = await axios.get(`/api/marvel/fulldatacharacter/${characterId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching character:', error);
      return null;
    }
  };

  const loadFavoritesData = async (favoriteIds: number[]) => {
    try {
      const characterPromises = favoriteIds.map(id => fetchCharacterDetails(id));
      const charactersData = await Promise.all(characterPromises);
      const validCharacters = charactersData.filter(
        (c): c is MarvelCharacter => c !== null && c.name && typeof c.price === 'number'
      );
      setCharacters(validCharacters);
    } catch (error) {
      setError('Error loading favorite characters');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleCardClick = (character: MarvelCharacter) => {
    navigate(`/product/${character.id}`, { state: { character } });
  };

  const fetchFavorites = async () => {
    if (!token) {
      setCharacters([]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const favoriteIds: number[] = response.data;

      if (favoriteIds.length > 0) {
        await loadFavoritesData(favoriteIds);
      } else {
        setCharacters([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setCharacters([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      if (user) {
        await fetchFavorites();
      } else {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  return (
    <>
      <NavBar />
      <Box sx={{ background: '#121212', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'white' }}>
            Wishlist
            <Chip
              label={`${characters.length} items`}
              sx={{ ml: 2, background: '#00C8FF', color: '#000', fontWeight: 700 }}
            />
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress size={60} sx={{ color: '#00C8FF' }} />
            </Box>
          ) : !user ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <Typography variant="h6" sx={{ color: '#b0b0b0' }}>
                Please log in to view your wishlist.
              </Typography>
            </Box>
          ) : characters.length === 0 ? (
            <Box sx={{ height: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ color: '#b0b0b0' }}>
                Your wishlist is empty
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {characters.map((character) => (
                <Grid key={character.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: '#1a1a1a',
                      width: { sm: 700, xs: 290 },
                      height: { sm: 300, xs: 550 },
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
                      },
                      position: 'relative'
                    }}
                    onClick={() => handleCardClick(character)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        <Grid sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            sx={{
                              height: 220,
                              width: 220,
                              objectFit: 'cover',
                              borderRadius: 2,
                              zIndex: 1
                            }}
                            image={`${character.thumbnail.path}.${character.thumbnail.extension}`}
                            alt={character.name}
                          />
                          <Box
                           sx={{
                           position: 'absolute',
                           top: 8,
                           right: 8,
                           borderRadius:5,
                           bgcolor: 'rgba(0,0,0,0.5)',
                           '&:hover': {
                           bgcolor: 'rgba(0,0,0,0.3)',
                           }
                           }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <HeartButton characterId={character.id} />
                          </Box>
                        </Grid>

                        <Grid>
                          <Stack spacing={1.5}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                              {character.name}
                            </Typography>

                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={character.rarity.toUpperCase()}
                                sx={{
                                  backgroundColor: getRarityColor(character.rarity),
                                  color: 'white',
                                  fontWeight: 700
                                }}
                              />
                              <Chip
                                label={`${character.comics.available} Comics`}
                                sx={{ background: '#00C8FF', color: '#000', fontWeight: 700 }}
                              />
                            </Stack>

                            {character.tags.length > 0 && (
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                {character.tags.map((tag, index) => (
                                  <Chip key={index} label={tag} size="small" sx={{ background: '#00C8FF', color: '#000' }} />
                                ))}
                              </Stack>
                            )}

                            <Typography
                              variant="h5"
                              fontWeight={700}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                color: 'white',
                                mt: 2
                              }}
                            >
                              <Coin />
                              {character.price?.toFixed(2) || '0.00'}
                            </Typography>

                            <Box sx={{ width: 'fit-content' }} onClick={(e) => e.stopPropagation()}>
                              <AddToCartButton productId={character.id} />
                            </Box>

                            {character.images.length > 0 && (
                              <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                                {character.images.length} custom images available
                              </Typography>
                            )}
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default Wishlist;
