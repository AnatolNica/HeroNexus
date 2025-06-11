import { useState, useEffect, ChangeEvent } from 'react';
import {
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import { styled } from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

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
  quantity: number;
}

interface CharactersProps {
  purchasedCharacters: Array<{
    characterId: number;
    quantity: number;
  }>;
}

const ProductCard = styled(Box)(({}) => ({
  width: 250,
  height: 350,
  backgroundColor: '#1C1C1C',
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  cursor: 'pointer',
  transition: 'transform 0.3s',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'scale(1.03)',
  },
}));

const ImageBox = styled(Box)({
  width: '100%',
  aspectRatio: '3 / 4',
  overflow: 'hidden',
  position: 'relative',
  img: {
    width: '100%',
    height: 250,
    objectFit: 'cover',
  },
});

const RarityLabel = styled(Box)({
  position: 'absolute',
  top: 12,
  left: 12,
  backgroundColor: 'rgba(0,0,0,0.7)',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: 600,
  zIndex: 2,
});

const Characters = ({ purchasedCharacters = [] }: CharactersProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [characters, setCharacters] = useState<CharacterDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      try {
        const details = await Promise.all(
          purchasedCharacters.map(async (pc) => {
            const res = await axios.get(`/api/marvel/fulldatacharacter/${pc.characterId}`);
            return {
              ...res.data,
              quantity: pc.quantity,
            };
          })
        );
        setCharacters(details);
        setLoading(false);
      } catch (err) {
        setError('Error loading character data');
        setLoading(false);
      }
    };

    if (purchasedCharacters.length > 0) {
      fetchCharacterDetails();
    } else {
      setLoading(false);
    }
  }, [purchasedCharacters]);

  const totalUnique = purchasedCharacters.length;
  const totalCharacters = purchasedCharacters.reduce((sum, pc) => sum + pc.quantity, 0);

  const rarityCounts = characters.reduce((acc, character) => {
    const rarity = character.rarity.toLowerCase();
    acc[rarity] = (acc[rarity] || 0) + character.quantity;
    return acc;
  }, {} as Record<string, number>);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#808080';
      case 'uncommon': return '#00ff00';
      case 'rare': return '#0066ff';
      case 'epic': return '#9900ff';
      case 'legendary': return '#ff9900';
      default: return '#ffffff';
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const filteredCharacters = characters.filter((char) =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedCharacters = filteredCharacters.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCharacters.length / itemsPerPage);

  if (loading) return <CircularProgress sx={{ color: '#00b3ff', margin: 'auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ px: 2, width: '100%', maxWidth: '100%' }}>
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          bgcolor: '#1a1a1a',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            mb: 3,
            fontFamily: 'Bebas Neue',
            letterSpacing: 1.5,
          }}
        >
          COLLECTION STATS
        </Typography>

        <Grid container spacing={3} alignItems="center">
          <Grid>
            <Chip
              label={`${totalUnique} UNIQUE / ${totalCharacters} TOTAL`}
              sx={{
                bgcolor: '#00b3ff',
                color: 'white',
                fontSize: '1.1rem',
                px: 2,
                py: 1,
                fontWeight: 'bold',
                borderRadius: '4px',
              }}
            />
          </Grid>

          <Grid>
            <Grid container spacing={1}>
              {Object.entries(rarityCounts).map(([rarity, count]) => (
                <Grid  key={rarity}>
                  <Chip
                    label={`${count}x ${rarity.toUpperCase()}`}
                    sx={{
                      bgcolor: getRarityColor(rarity),
                      color: 'white',
                      fontWeight: 'bold',
                      minWidth: '120px',
                      fontSize: '0.9rem',
                      px: 1.5,
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            background: '#1a1a1a',
            borderRadius: 2,
            input: { color: 'white' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#00C8FF' },
              '&:hover fieldset': { borderColor: '#00C8FF' },
              '&.Mui-focused fieldset': { borderColor: '#00C8FF' },
              color: 'white',
              paddingRight: 0,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#00C8FF' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Typography
        variant="h4"
        sx={{
          color: 'white',
          mb: 3,
          fontFamily: 'Bebas Neue',
          letterSpacing: 1.5,
        }}
      >
        MY CHARACTERS {totalCharacters > 0 && `(${filteredCharacters.length})`}
      </Typography>

      <Grid container spacing={3}>
        {paginatedCharacters.map((character) => (
          <Grid
            key={character.id}
            sx={{ display: 'flex', justifyContent: 'flex-start' }}
          >
            <Box sx={{ width: '100%', maxWidth: 300 }}>
              <ProductCard onClick={() => (window.location.href = `/product/${character.id}`)}>
                <ImageBox>
                  <img
                    src={`${character.thumbnail.path}.${character.thumbnail.extension}`}
                    alt={character.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/380x380';
                    }}
                  />
                  {character.rarity && (
                    <RarityLabel sx={{ backgroundColor: getRarityColor(character.rarity) }}>
                      {character.rarity.toUpperCase()}
                    </RarityLabel>
                  )}
                </ImageBox>
                <Box sx={{ p: 2, flexGrow: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#00C8FF',
                      fontWeight: 700,
                      fontSize: '14px',
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    {character.comics?.available} Comics
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#FFF',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: 1.3,
                      minHeight: '48px',
                    }}
                  >
                    {character.name}
                    {character.quantity > 1 && (
                      <span
                        style={{
                          color: '#00b3ff',
                          marginLeft: '8px',
                          fontSize: '0.85em',
                        }}
                      >
                        x{character.quantity}
                      </span>
                    )}
                  </Typography>
                </Box>
              </ProductCard>
            </Box>
          </Grid>
        ))}
      </Grid>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            shape="rounded"
            variant="outlined"
            sx={{
              '& .MuiPaginationItem-root': {
                borderColor: '#00C8FF',
                borderRadius: 10,
                color: 'white',
              },
              '& .Mui-selected': {
                bgcolor: '#00C8FF',
                color: 'white',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Characters;
