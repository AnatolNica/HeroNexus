import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Pagination
} from '@mui/material';
import { Close, Save, Search } from '@mui/icons-material';
import { styled } from '@mui/system';

interface MarvelCharacterBase {
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
}
interface MarvelCharacter extends MarvelCharacterBase {
  price?: number;
  rarity?: string;
  images?: string[];
  customDescription?: string;
  tags?: string[];
}
interface MarvelCharacterUpdateDTO {
  price?: number;
  rarity?: string;
  images?: string;
  description?: string;
  tags?: string;
}

const HeroCard = styled(Card)(({ }) => ({
  height: '100%',
  display: 'flex',
  width: 250,
  flexDirection: 'column',
  borderRadius: 12,
  overflow: 'hidden',
  background: "#1a1a1a",
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
  }
}));
const HeroMedia = styled(CardMedia)({
  height: 250,
  objectFit: 'cover',
  backgroundPosition: 'top',
  position: 'relative'
});
const RarityBadge = styled(Chip)(({ rarity }: { rarity?: string }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: 1,
  backgroundColor:
    rarity === 'legendary' ? 'rgba(255, 215, 0, 0.9)' :
      rarity === 'epic' ? 'rgba(148, 0, 211, 0.9)' :
        rarity === 'rare' ? 'rgba(30, 144, 255, 0.9)' :
          'rgba(169, 169, 169, 0.9)',
  color: rarity === 'legendary' ? '#000' : '#fff'
}));
const SearchContainer = styled(Box)({
  position: 'relative',
  marginBottom: 40,
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: -10,
    left: 0,
    width: '100%',
    height: 2,
    background: 'linear-gradient(90deg, #00C8FF, #00CFFF)',
    borderRadius: 2
  }
});
const DetailDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)',
    color: '#fff',
    borderRadius: 16,
    maxWidth: 900,
    width: '90%',
    maxHeight: '90vh'
  }
});

export default function Characters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [characters, setCharacters] = useState<MarvelCharacter[]>(() => {
    const saved = localStorage.getItem('marvelCharacters');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCharacter, setSelectedCharacter] = useState<MarvelCharacter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const charactersPerPage = 12;
  const totalPages = Math.ceil(characters.length / charactersPerPage);
  const indexOfLast = page * charactersPerPage;
  const indexOfFirst = indexOfLast - charactersPerPage;
  const currentCharacters = characters.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    localStorage.setItem('marvelCharacters', JSON.stringify(characters));
  }, [characters]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder-character.jpg';
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      setError('Please enter a search term');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/marvel/search',
        { searchTerm: trimmedTerm },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      setCharacters(response.data);
      if (!response.data.length) {
        setError('No heroes found - try a different search');
      }
    } catch (err: any) {
      const serverError = err.response?.data?.error;
      const message = serverError || err.message || 'Search failed. Please try again.';
      setError(message);
      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelect = async (character: MarvelCharacter) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/marvel/charactersdb/${character.id}`);
      setSelectedCharacter(response.data);
      setActiveTab(0);
    } catch (error) {
      console.error('Error loading character details:', error);
      showSnackbar('Failed to load character details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedCharacter: MarvelCharacter) => {
    try {
      const updateData: MarvelCharacterUpdateDTO = {
        price: updatedCharacter.price,
        rarity: updatedCharacter.rarity,
        images: updatedCharacter.images?.join(', ') || '',
        description: updatedCharacter.customDescription,
        tags: updatedCharacter.tags?.join(', ') || ''
      };
      const response = await axios.put(
        `/api/marvel/charactersdb/${updatedCharacter.id}`,
        updateData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      setCharacters(prev => prev.map(c =>
        c.id === updatedCharacter.id ? { ...c, ...response.data } : c
      ));
      setSelectedCharacter(null);
      showSnackbar('Character saved successfully!', 'success');
    } catch (err) {
      console.error('Save error:', err);
      const message = err.response?.data?.error || 'Failed to save changes';
      showSnackbar(message, 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 6, color: 'white', width: 600 }}>
      <Box textAlign="center" mb={6}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 800,
            color: '#00C8FF',
            letterSpacing: 2,
            mb: 2
          }}
        >
          MARVEL CHARACTER
        </Typography>
        <Divider sx={{
          bgcolor: '#00C8FF',
          height: 4,
          width: 200,
          mx: 'auto',
          borderRadius: 2
        }} />
      </Box>

      <SearchContainer component="form" onSubmit={handleSearch}>
        <Grid container spacing={2} alignItems="center">
          <Grid >
            <TextField
              fullWidth
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Heroes..."
              InputProps={{
                sx: {
                  borderRadius: 15,
                  width: 300,
                  color: 'white',
                  fontSize: '1.1rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00C8FF !important',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00C8FF !important',
                  },
                },
              }}
              InputLabelProps={{
                sx: { color: 'white' },
              }}
            />
          </Grid>
          <Grid>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={!loading && <Search />}
              sx={{
                height: 56,
                bgcolor: '#00C8FF',
                backgroundImage: 'linear-gradient(45deg, #00C8FF, #00CFFF)',
                borderRadius: 50,
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: 1,
                mb: 1,
                '&:hover': {
                  bgcolor: '#00DFFF',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'FIND HEROES'}
            </Button>
          </Grid>
        </Grid>
      </SearchContainer>

      {error && (
        <Box textAlign="center" mb={4}>
          <Typography color="error" sx={{ fontSize: '1.2rem' }}>
            {error}
          </Typography>
        </Box>
      )}

      {characters.length === 0 && !loading && !error && (
        <Box textAlign="center" mt={8}>
        </Box>
      )}

      <Grid container spacing={4}>
        {currentCharacters.map((character) => (
          <Grid  key={character.id}>
            <HeroCard onClick={() => handleCharacterSelect(character)}>
              <Box position="relative">
                <HeroMedia
                  image={`${character.thumbnail.path}.${character.thumbnail.extension}`}
                  title={character.name}
                  onError={handleImageError}
                />
                {character.rarity && (
                  <RarityBadge
                    rarity={character.rarity}
                    label={character.rarity}
                    size="small"
                  />
                )}
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    minHeight: 64,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {character.name}
                </Typography>
              </CardContent>
            </HeroCard>
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

      <DetailDialog
        open={!!selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        maxWidth="lg"
      >
        {selectedCharacter && (
          <>
            <DialogTitle sx={{
              bgcolor: '#121212',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h4" sx={{ color: '#00C8FF', fontWeight: 700 }}>
                {selectedCharacter.name}
              </Typography>
              <IconButton onClick={() => setSelectedCharacter(null)} sx={{ color: '#00C8FF' }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{
                  mb: 3,
                  '& .MuiTabs-indicator': {
                    bgcolor: '#1a1a1a'
                  }
                }}
              >
                <Tab
                  label="Character Details"
                  sx={{
                    color: activeTab === 0 ? '#00C8FF' : 'white',
                    fontWeight: 700
                  }}
                />
                <Tab
                  label="Customize"
                  sx={{
                    color: activeTab === 1 ? '#00C8FF' : 'white',
                    fontWeight: 700
                  }}
                />
              </Tabs>
              {activeTab === 0 ? (
                <Grid container spacing={4}>
                  <Grid>
                    <Box sx={{
                      bgcolor: '#121212',
                      borderRadius: 3,
                      width:350,
                      p: 3,
                    }}>
                      <Typography variant="h6" color="white" mb={2}>
                        Api Data
                      </Typography>
                      <Box
                        component="img"
                        src={`${selectedCharacter.thumbnail.path}.${selectedCharacter.thumbnail.extension}`}
                        alt={selectedCharacter.name}
                        sx={{
                          width: 300,
                          height: 300,
                          borderRadius: 2,
                          mb: 3
                        }}
                      />
                      <Typography color="rgba(255, 255, 255, 0.8)" mb={2}>
                        {selectedCharacter.description || 'No description available in Marvel database.'}
                      </Typography>
                      <Box display="flex" justifyContent="space-between">
                        <Chip
                          label={`${selectedCharacter.comics.available} comics`}
                          sx={{ bgcolor: 'rgba(30, 144, 255, 0.2)', color: 'white' }}
                        />
                        <Chip
                          label="Marvel Universe"
                          sx={{ bgcolor: '#00C8FF', color: 'white' }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid>
                    <Box sx={{
                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 3,
                      p: 3,
                    }}>
                      <Typography variant="h6" color='#00C8FF' mb={2}>
                        YOUR CUSTOM DATA
                      </Typography>
                      <Box mb={3}>
                        <Typography variant="body1" color='#00C8FF' mb={1}>
                          Price:
                        </Typography>
                        <Typography variant="h5" color="white">
                          {selectedCharacter.price ? `$${selectedCharacter.price.toFixed(2)}` : 'Not set'}
                        </Typography>
                      </Box>
                      <Box mb={3}>
                        <Typography variant="body1" color='#00C8FF' mb={1}>
                          Rarity:
                        </Typography>
                        {selectedCharacter.rarity ? (
                          <Chip
                            label={selectedCharacter.rarity}
                            sx={{
                              bgcolor:
                                selectedCharacter.rarity === 'legendary' ? 'rgba(255, 215, 0, 0.2)' :
                                  selectedCharacter.rarity === 'epic' ? 'rgba(148, 0, 211, 0.2)' :
                                    selectedCharacter.rarity === 'rare' ? 'rgba(30, 144, 255, 0.2)' :
                                      'rgba(169, 169, 169, 0.2)',
                              color: 'white',
                              fontWeight: 700
                            }}
                          />
                        ) : (
                          <Typography color="rgba(255, 255, 255, 0.7)">
                            Not set
                          </Typography>
                        )}
                      </Box>
                      <Box mb={3}>
                        <Typography variant="body1" color='#00C8FF' mb={1}>
                          Custom Description:
                        </Typography>
                        <Typography color="white">
                          {selectedCharacter.customDescription || 'No custom description added'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body1" color='#00C8FF' mb={1}>
                          Tags:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {selectedCharacter.tags?.length ? (
                            selectedCharacter.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                sx={{
                                  bgcolor: '#00C8FF',
                                  color: 'white'
                                }}
                              />
                            ))
                          ) : (
                            <Typography color="white">
                              No tags added
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <EditForm
                  character={selectedCharacter}
                  onSave={handleSave}
                  onCancel={() => setSelectedCharacter(null)}
                />
              )}
            </DialogContent>
            <DialogActions sx={{
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'space-between',
              p: 2
            }}>
              <Button
                onClick={() => setSelectedCharacter(null)}
                startIcon={<Close />}
                sx={{ color: '#00C8FF' }}
              >
                Close
              </Button>
              {activeTab === 1 && (
                <Button
                  type="submit"
                  form="edit-form"
                  startIcon={<Save />}
                  variant="contained"
                  sx={{
                    bgcolor: '#00C8FF',
                    backgroundImage: 'linear-gradient(45deg, #00C8FF, #00CFFF)',
                    '&:hover': {
                      bgcolor: '#00CFFF'
                    }
                  }}
                >
                  Save Changes
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </DetailDialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            bgcolor: snackbarSeverity === 'success' ? 'rgba(46, 125, 50, 0.9)' : 'rgba(211, 47, 47, 0.9)',
            color: '#fff'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

const EditForm = ({ character, onSave, onCancel }: {
  character: MarvelCharacter;
  onSave: (character: MarvelCharacter) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    price: character.price || 0,
    customDescription: character.customDescription || '',
    rarity: character.rarity || 'common',
    images: character.images?.join(', ') || '',
    tags: character.tags?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...character,
      price: formData.price,
      customDescription: formData.customDescription,
      rarity: formData.rarity,
      images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
      tags: formData.tags.split(',').map(s => s.trim().substring(0, 20)).filter(Boolean).slice(0, 10)
    });
  };

  return (
    <Box component="form" id="edit-form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Grid container spacing={2} direction="column">
        <Grid>
          <FormControl fullWidth>
            <InputLabel sx={{color:'white'}}shrink>Rarity</InputLabel>
            <Select
              value={formData.rarity}
              onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
              label="Rarity"
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#00C8FF',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#00CFFF',
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
              }}
              inputProps={{ sx: { color: 'white' } }}
              MenuProps={{
                PaperProps: {
                  sx: { bgcolor: '#1a1a1a', color: 'white' }
                }
              }}
            >
              <MenuItem value="common" sx={{ color: 'white', bgcolor: "#1a1a1a" }}>Common</MenuItem>
              <MenuItem value="rare" sx={{ color: 'white', bgcolor: "#1a1a1a" }}>Rare</MenuItem>
              <MenuItem value="epic" sx={{ color: 'white', bgcolor: "#1a1a1a" }}>Epic</MenuItem>
              <MenuItem value="legendary" sx={{ color: 'white', bgcolor: "#1a1a1a" }}>Legendary</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid>
          <FormControl fullWidth>
            <TextField
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              variant="outlined"
              InputProps={{
                startAdornment: <Typography sx={{ color: '#00C8FF', mr: 1 }}>$</Typography>,
                sx: { color: 'white' }
              }}
              InputLabelProps={{ sx: { color: 'white' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#00C8FF' },
                  '&:hover fieldset': { borderColor: '#00CFFF' }
                }
              }}
            />
          </FormControl>
        </Grid>
        <Grid>
          <FormControl fullWidth>
            <TextField
              label="Image URLs (comma separated)"
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              variant="outlined"
              multiline
              rows={1}
              InputLabelProps={{ sx: { color: 'white' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#00C8FF' },
                  '&:hover fieldset': { borderColor: '#00CFFF' }
                }
              }}
            />
          </FormControl>
        </Grid>
        <Grid>
          <FormControl fullWidth>
            <TextField
              label="Custom Description"
              value={formData.customDescription}
              onChange={(e) => setFormData({ ...formData, customDescription: e.target.value })}
              variant="outlined"
              multiline
              rows={2}
              InputLabelProps={{ sx: { color: 'white' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#00C8FF' },
                  '&:hover fieldset': { borderColor: '#00CFFF' }
                }
              }}
            />
          </FormControl>
        </Grid>
        <Grid>
          <FormControl fullWidth>
            <TextField
              label="Tags (comma separated, max 10)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              variant="outlined"
              multiline
              rows={2}
              helperText="Enter tags to help categorize your character"
              InputLabelProps={{ sx: { color: 'white' } }}
              FormHelperTextProps={{ sx: { color: 'white' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#00C8FF' },
                  '&:hover fieldset': { borderColor: '#00CFFF' }
                }
              }}
            />
          </FormControl>
          <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
            {formData.tags.split(',').filter(Boolean).map((tag, index) => (
              <Chip
                key={index}
                label={tag.trim()}
                size="small"
                sx={{
                  bgcolor: '#00C8FF',
                  color: 'white'
                }}
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};