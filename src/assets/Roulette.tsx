import { Box, Button, Typography, Paper, CircularProgress, Alert, Chip, Grid } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import { useState,  useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import { Casino } from '@mui/icons-material';

interface Character {
  id: number;
  name: string;
  thumbnail: {
    path: string;
    extension: string;
  };
  price: number;
  rarity: string;
}

interface RouletteItem {
  heroId: number;
  chance: number;
  hero?: Character;
}

interface RouletteData {
  _id: string;
  name: string;
  items: RouletteItem[];
}


const getDisplayWidth = () => {
  const width = window.innerWidth;

  if (width >= 1920) return 1536; 
  if (width >= 1536) return 1440; 
  if (width >= 1200) return 1280; 
  if (width >= 900) return 960; 
  if (width >= 600) return 640;  
  return 320;                      
};
const ITEM_WIDTH = 240;
const POOL_SIZE = 80;
const STATIC_ITEMS_COUNT = 6;
const WINNER_INDEX = 40;

export default function MarvelRoulette() {
  const { id } = useParams<{ id: string }>();
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Character | null>(null);
  const [skinsPool, setSkinsPool] = useState<Character[]>([]);
  const controls = useAnimation();
  const [currentX, setCurrentX] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [lastVisibleItems, setLastVisibleItems] = useState<Character[]>([]);
  const [rouletteData, setRouletteData] = useState<RouletteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [DISPLAY_WIDTH, setDisplayWidth] = useState(getDisplayWidth());
  useEffect(() => {
    const handleResize = () => {
      setDisplayWidth(getDisplayWidth());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rouletteResponse = await fetch(`/api/roulettes/${id}`);
        if (!rouletteResponse.ok) throw new Error('Roulette not found');
        const { data: roulette } = await rouletteResponse.json();

        const validItems = roulette.items.filter(item =>
          Number.isInteger(Number(item.heroId)) &&
          item.heroId.toString().length >= 4
        );

        if (validItems.length === 0) {
          throw new Error('There are no valid characters in this roulette');
        }

        const characters = await Promise.all(
          validItems.map(async (item) => {
            try {
              const charResponse = await fetch(`/api/marvel/fulldatacharacter/${item.heroId}`);
              if (!charResponse.ok) return null;
              return charResponse.json();
            } catch (error) {
              console.error(`Error retrieving character ${item.heroId}:`, error);
              return null;
            }
          })
        );

        const validCharacters = characters.filter(c => c !== null);
        const completeItems = validItems
          .map((item, index) => ({
            ...item,
            hero: validCharacters[index]
          }))
          .filter(item => item.hero !== undefined);

        setRouletteData({
          ...roulette,
          items: completeItems
        });

        const initialPool = generateInitialPool(completeItems.map(i => i.hero));
        setLastVisibleItems(initialPool);
        setSkinsPool(initialPool);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

  const generateInitialPool = (items: Character[]) => {
    const pool: Character[] = [];
    for (let i = 0; i < STATIC_ITEMS_COUNT; i++) {
      pool.push(items[Math.floor(Math.random() * items.length)]);
    }
    return pool;
  };

  const generatePool = (winner: Character, preserved: Character[]) => {
    const pool = [...preserved];
    const allItems = rouletteData?.items.map(i => i.hero) || [];
    for (let i = 0; i < POOL_SIZE; i++) {
      pool.push(allItems[Math.floor(Math.random() * allItems.length)]);
    }
    pool[STATIC_ITEMS_COUNT + WINNER_INDEX] = winner;
    for (let i = 0; i < 3; i++) {
      pool.push(allItems[Math.floor(Math.random() * allItems.length)]);
    }
    return pool;
  };
  const spin = async () => {
    if (!rouletteData || isSpinning || !user) return;
    setIsSpinning(true);
    setResult(null);
    setError('');
    try {
      if (user.coins < rouletteData.price) {
        throw new Error('You dont have enough coins for this spin!');
      }

      const response = await fetch(`/api/roulettes/${id}/spin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Spin processing error');
      }

      const { newBalance, wonCharacter } = responseData;
      const winner = rouletteData.items.find(
        item => Number(item.heroId) === Number(wonCharacter.id)
      )?.hero;

      if (!winner) {
        throw new Error('The hero you won was not found in the local list');
      }

      setUser({ ...user, coins: newBalance });
      await controls.set({ x: 0 });
      setCurrentX(0);

      const newPool = generatePool(winner, lastVisibleItems);
      setSkinsPool(newPool);

      const winnerPosition = STATIC_ITEMS_COUNT + WINNER_INDEX;
      const winnerOffset = winnerPosition * ITEM_WIDTH - 47;
      const randomOffset = Math.floor(Math.random() * 237);
      const centerOffset = DISPLAY_WIDTH / 2 - ITEM_WIDTH / 2 - randomOffset;
      const distance = -(winnerOffset - centerOffset);

      await controls.start({
        x: distance,
        transition: {
          duration: 7,
          ease: [0.6, 0.2, 0.5, 1],
        },
      });

      setCurrentX(distance);
      setResult(winner);
      setSpinCount(prev => prev + 1);

      const visibleStart = winnerPosition - Math.floor(DISPLAY_WIDTH / ITEM_WIDTH / 2);
      const newVisible = newPool.slice(visibleStart, visibleStart + STATIC_ITEMS_COUNT);
      setLastVisibleItems(newVisible);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsSpinning(false);
    }
  };

  const handleCardClick = (character: Character) => {
    navigate(`/product/${character.id}`, { state: { character } });
  };
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 4, maxWidth: 600, mx: 'auto' }}>
        {error}
      </Alert>
    );
  }

  if (!rouletteData) {
    return (
      <Alert severity="error" sx={{ m: 4, maxWidth: 600, mx: 'auto' }}>
        Roulette not found
      </Alert>
    );
  }

  return (
    <>
      <NavBar />
      <Box sx={{
        background: '#121212',
        color: 'white',
        textAlign: 'center',
        mt: 4,
        p: 4,
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
<Typography
  variant="h3"
  sx={{
    mb: 5,
    fontFamily: 'Bebas Neue',
    letterSpacing: '3px',
    color: '#00C8FF',
    textShadow: '0 0 15px rgba(0, 200, 255, 0.4)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -8,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '120px',
      height: '3px',
      background: 'linear-gradient(90deg, transparent 0%, #00C8FF 50%, transparent 100%)'
    }
  }}
>
  <Casino fontSize="large" />
  {rouletteData.name.toUpperCase()}
</Typography>


        <Paper
          elevation={24}
          sx={{
            width: DISPLAY_WIDTH,
            height: 280,
            mx: 'auto',
            overflow: 'hidden',
            position: 'relative',
            borderRadius: 4,
            background: '#1a1a1a',
            boxShadow:'0 0 15px rgba(0, 200, 255, 0.4)',
          }}
        >
          <motion.div
            style={{
              display: 'flex',
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
            animate={controls}
          >
            {skinsPool.map((hero, idx) => (
              <Box
                key={idx}
                sx={{
                  width: ITEM_WIDTH,
                  height: 280,
                  position: 'relative',
                  borderRight: '2px solid #333',
                  flexShrink: 0,
                  overflow: 'hidden',
                  '&:hover': {
                    '& .overlay': {
                      opacity: 1
                    }
                  }
                }}
              >
                {hero?.thumbnail && (
                  <>
                    <img
                      src={`${hero.thumbnail.path}/portrait_uncanny.${hero.thumbnail.extension}`}
                      alt={hero.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scale(1.05)',
                        filter: 'brightness(0.9)'
                      }}
                    />
                    <Box
                      className="overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 50%, rgba(0,0,0,0.8) 100%)',
                        opacity: 0.8,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <Chip
                        label={hero.rarity.toUpperCase()}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: getRarityColor(hero.rarity),
                          color: 'black',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          px: 1,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      />
                      <Typography
                        variant="subtitle1"
                        sx={{
                          position: 'absolute',
                          bottom: 16,
                          left: 16,
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          lineHeight: 1.2
                        }}
                      >
                        {hero.name}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            ))}
          </motion.div>

          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '6px',
              height: '120%',
              background: 'linear-gradient(180deg, #ffd700 0%, #daa520 100%)',
              zIndex: 2,
              boxShadow: '0 0 30px rgba(255,215,0,0.5)',
              borderRadius: '2px'
            }}
          />
        </Paper>

        <Button
          variant="contained"
          onClick={spin}
          disabled={isSpinning || !rouletteData}
          sx={{
            mt: 4,
            px: 6,
            py: 2,
            fontSize: '1.2rem',
            background: '#00C8FF',
            color: 'black',
            fontWeight: 'bold',
            borderRadius: '50px',
            boxShadow: '0 8px 20px rgba(0, 192, 255, 0.3)',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 12px 25px rgba(0, 192, 255, 0.5)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isSpinning ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={24} sx={{ color: 'black', mr: 2 }} />
              SPINNING...
            </Box>
          ) : (
            'SPIN! 🎰'
          )}
        </Button>

        <Typography variant="h6" sx={{
          mt: 3,
          color: '#aaa',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          Total Spins: {spinCount}
        </Typography>

        {result && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <Box sx={{
              mt: 6,
              p: 2,
              background: 'linear-gradient(135deg, rgba(42,42,42,0.9) 0%, rgba(26,26,26,0.95) 100%)',
              borderRadius: 4,
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              border: '2px solid #333',
              maxWidth: 200,
              mx: 'auto',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(45deg, ${getRarityColor(result.rarity)} 0%, transparent 100%)`,
                opacity: 0.15,
                zIndex: 0
              }
            }}>
              <Typography variant="h5" sx={{
                color: '#fff',
                mb: 2,
                fontFamily: 'Bebas Neue',
                letterSpacing: '2px',
                position: 'relative',
                zIndex: 1
              }}>
                 You Won!
              </Typography>
              
              <Box sx={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                border: `2px solid ${getRarityColor(result.rarity)}`,
                boxShadow: `0 0 20px ${getRarityColor(result.rarity)}`
              }}
              onClick={() => handleCardClick(result)}
                role="button"
              >
                
                <img
                  src={`${result.thumbnail.path}/portrait_uncanny.${result.thumbnail.extension}`}
                  alt={result.name}
                  style={{
                    width: '100%',
                    height: 300,
                    objectFit: 'cover',
                    filter: 'brightness(1.1) saturate(1.2)'
                  }}
                />
                  <Chip
                        label={result.rarity.toUpperCase()}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: getRarityColor(result.rarity),
                          color: 'black',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          px: 1,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      />
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 2,
                  background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.9) 100%)'
                }}>
                  <Typography variant="h6" sx={{
                    color: '#fff',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    mb: 1
                  }}>
                    {result.name}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Box sx={{
            mt: 8,
            px: 4,
            pb: 6,
            textAlign: 'left',
            maxWidth: 1200,
            mx: 'auto'
          }}>
            <Typography variant="h4" sx={{
              mb: 4,
              color:'#00C8FF',
              fontFamily: 'Bebas Neue',
              letterSpacing: '2px',
              textAlign: 'center',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '200px',
                height: '3px',
              background: 'linear-gradient(90deg, transparent 0%, #00C8FF 50%, transparent 100%)'
              }
            }}>
               AVAILABLE HEROES
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {rouletteData.items.map((item, index) => (
                <Grid key={index}>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: `2px solid ${getRarityColor(item.hero?.rarity || 'common')}`,
                      boxShadow: `0 0 15px ${getRarityColor(item.hero?.rarity || 'common')}40`,
                      transition: 'transform 0.3s ease',
                      backgroundColor: '#1a1a1a',
                      '&:hover': {
                        transform: 'translateY(-5px)'
                      }
                    }}
                    onClick={() => handleCardClick(item.hero)}
                    role="button"
                    tabIndex={0}
                  >
                    {item.hero?.thumbnail && (
                      <img
                        src={`${item.hero.thumbnail.path}/portrait_uncanny.${item.hero.thumbnail.extension}`}
                        alt={item.hero.name}
                        style={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          filter: 'brightness(0.9)'
                        }}
                      />
                    )}
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 2,
                      background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.9) 100%)'
                    }}>
                      <Typography variant="h6" sx={{
                        color: '#fff',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        mb: 1
                      }}>
                        {item.hero?.name}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Chip
                          label={item.hero?.rarity.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: getRarityColor(item.hero?.rarity || 'common'),
                            color: 'black',
                            fontWeight: 'bold'
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#fff' }}>
                          chance: {(item.chance * 100).toFixed(1)}%
                          </Typography>
                          <Chip
                            label={`$${item.hero?.price.toFixed(2)}`}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.15)',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>
      </Box>
      <Footer/>
    </>
  );
}