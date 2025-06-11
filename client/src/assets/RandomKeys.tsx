import { useState, useEffect } from 'react';
import {  useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  useTheme,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import Coin from './Coin';
interface RouletteType {
  _id: string;
  name: string;
  image: string;
  category: string;
  price: number;
  items: any[];
  createdAt: Date;
  popularity?: number;
}

const Randomkeys = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [roulettes, setRoulettes] = useState<RouletteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [achievementUnlocked, setAchievementUnlocked] = useState(false);

  const categories = ['All', 'Heroes', 'Villains', 'Mutants', 'Anti-Heroes', 'Avengers'];

  useEffect(() => {
    const fetchRoulettes = async () => {
      try {
        const response = await fetch('/api/roulettes');
        const { data } = await response.json();
        setRoulettes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchRoulettes();
  }, []);

  const handleRouletteOpen = (roulette: RouletteType) => {
    navigate(`/roulette/${roulette._id}`);
  };

  const showMore = () => {
    setVisibleCount(prev => Math.min(prev + 8, roulettes.length));
    if (visibleCount >= 8 && !achievementUnlocked) {
      setAchievementUnlocked(true);
      setTimeout(() => setAchievementUnlocked(false), 3000);
    }
  };

  const particlesInit = async (engine: any) => {
    await loadFull(engine);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress size={60} thickness={4} />
    </Box>
  );

  if (error) return (
    <Alert severity="error" sx={{ m: 4, maxWidth: 600, mx: 'auto' }}>
      Error loading the roulette: {error}
    </Alert>
  );

  return (
    <Box sx={{ 
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      color: theme.palette.common.white,
      mb:20,
    }}>
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }}>
        <Particles
          init={particlesInit}
          options={{
            particles: {
              number: { value: 50 },
              color: { value: '#00b4d8' },
              opacity: { value: 0.5 },
              size: { value: 1 },
              move: {
                enable: true,
                speed: 1,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false,
              }
            }
          }}
        />
      </Box>
      <Box sx={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1440px',
        mx: 'auto',
        pt: { xs: 6, md: 12 },
        px: { xs: 2, sm: 4, md: 6 },
      }}>
        <Box sx={{ 
          textAlign: 'center', 
          mb: 8,
          position: 'relative',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #00b4d8, transparent)'
          }
        }}>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              mb: 3,
              fontSize: { xs: '2.5rem', md: '4rem' },
              color:'white',
            }}
          >
            Premium Marvel Roulettes
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.2rem',
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
              mb: 4
            }}
          >
            Spin your way to victory with our collection of epic Marvel roulettes. Claim rare characters and build your ultimate hero roster!
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: 'center',
          mb: 6,
          '& .MuiChip-root': {
            transition: 'all 0.3s',
            '&:hover': { transform: 'scale(1.05)' }
          }
        }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              clickable
              color="primary"
              onClick={() => setSelectedCategory(category)}
              sx={{
                fontSize: '0.9rem',
                px: 2,
                ...(selectedCategory === category && {
                  backgroundColor: '#00C8FF',
                  borderColor: '#00C8FF'
                })
              }}
            />
          ))}
        </Box>
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {roulettes
            .filter(r => selectedCategory === 'All' || r.category === selectedCategory)
            .slice(0, visibleCount)
            .map((roulette, _) => (
              <Grid key={roulette._id}>
                <Card
                sx={{
                    background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(45,45,45,0.9) 100%)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 16px 32px rgba(0,0,0,0.5)',
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => handleRouletteOpen(roulette)}
                >
                  {Date.now() - new Date(roulette.createdAt).getTime() < 604800000 && (
                    <Box sx={{
                      position: 'absolute',
                      left: 10,
                      top: 10,
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      <NewReleasesIcon sx={{ color: '#FFD700', fontSize: 18 }} />
                      <Typography variant="caption" sx={{ color: '#FFD700', fontWeight: 700 }}>
                        NEW
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    image={roulette.image}
                    alt={roulette.name}
                    sx={{
                      height: 300,
                      width: 320,
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '40%',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
                    }} />
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Chip
                        label={roulette.category}
                        color="primary"
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          backgroundColor: 'rgba(0,180,216,0.2)'
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 , color:'white'}}>
                        <CasinoIcon fontSize="small" />
                        <Typography variant="caption" fontSize={17} >
                          {roulette.items.length} items
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        fontSize: '1.1rem',
                        color: 'primary.contrastText',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {roulette.name}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Box>
                        <Typography variant="caption" sx={{ 
                          color: '#00C8FF',
                          display: 'block',
                          fontSize: '0.75rem'
                        }}>
                          SPIN PRICE
                        </Typography>
                        <Box display="flex" alignItems="center" mt={2}>
                    <Coin />
                  <Typography variant="h4"
                    sx={{
                    fontWeight: 800,
                    background: 'white',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                        }}
                    ml={1}>{roulette.price.toFixed(2)}</Typography>
                    </Box>
                      </Box>
                      <IconButton
                        color="primary"
                        sx={{
                          backgroundColor: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                            transform: 'rotate(15deg) scale(1.1)'
                          },
                          transition: 'all 0.3s',
                          boxShadow: '0 4px 12px rgba(0,180,216,0.3)'
                        }}
                      >
                        <CasinoIcon sx={{ color: 'white' }} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
        {visibleCount < roulettes.length && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 8,
            position: 'relative'
          }}>
            <Button
              onClick={showMore}
              variant="contained"
              endIcon={<ExpandMoreIcon sx={{ transition: 'transform 0.3s' }} />}
              sx={{
                px: 6,
                py: 1.5,
                borderRadius: 50,
                fontWeight: 700,
                background: 'linear-gradient(45deg, #00b4d8 30%, #90e0ef 90%)',
                '&:hover': {
                  transform: 'translateY(2px)',
                  boxShadow: '0 4px 12px rgba(144,224,239,0.5)',
                  '& .MuiSvgIcon-root': { transform: 'translateY(2px)' }
                },
                transition: 'all 0.3s',
                fontSize: '1.1rem'
              }}
            >
              Show More Roulettes
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Randomkeys;