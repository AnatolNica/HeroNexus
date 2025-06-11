import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Snackbar,
  Alert,
  Pagination,
  InputAdornment,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { Add, Close, Delete, Edit, Save, Search } from '@mui/icons-material';
import axios from 'axios';

interface MarvelCharacter {
  id: number;
  name: string;
  thumbnail: {
    path: string;
    extension: string;
  };
}

interface Offer {
  _id: string;
  title: string;
  type: 'coins' | 'bundle';
  coins: number;
  price: number;
  bonus?: number;
  popularity?: number;
  image?: string;
  includedCharacters?: string[];
}

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const [form, setForm] = useState<Offer>({
    _id: '',
    title: '',
    type: 'coins',
    coins: 0,
    price: 0,
    bonus: 0,
    popularity: 0,
    image: '',
    includedCharacters: []
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [characterOptions, setCharacterOptions] = useState<MarvelCharacter[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get('/api/offers');
      setOffers(res.data.offers);
    } catch (err) {
      showSnackbar('Error loading offers', 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : ['coins', 'price', 'bonus', 'popularity'].includes(name)
        ? Number(value)
        : value
    });
  };

  const resetForm = () => {
    setForm({
      _id: '',
      title: '',
      type: 'coins',
      coins: 0,
      price: 0,
      bonus: 0,
      popularity: 0,
      image: '',
      includedCharacters: []
    });
    setCharacterOptions([]);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form
      };
      if (editingId) {
        await axios.put(`/api/offers/${editingId}`, payload, getAuthHeader());
      } else {
        await axios.post('/api/offers', payload, getAuthHeader());
      }
      fetchOffers();
      resetForm();
      showSnackbar(editingId ? 'Offer updated!' : 'Offer created!');
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Error saving offer', 'error');
    }
  };

  const editOffer = (offer: Offer) => {
    setForm(offer);
    setEditingId(offer._id);
    setIsAdding(true);
  };

  const deleteOffer = async (id: string) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await axios.delete(`/api/offers/${id}`, getAuthHeader());
      fetchOffers();
      showSnackbar('Offer deleted!', 'success');
    } catch (err) {
      showSnackbar('Error deleting offer', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const searchHeroes = async (searchTerm: string) => {
    if (!searchTerm) return;
    setSearchLoading(true);
    try {
      const res = await axios.post('/api/marvel/search', { searchTerm });
      setCharacterOptions(res.data);
    } catch (err) {
      console.error('Error searching heroes:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCharacterSelect = (index: number, hero: MarvelCharacter | null) => {
    if (!hero) return;
    const newIds = [...form.includedCharacters];
    newIds[index] = hero.id.toString(); 
    setForm({ ...form, includedCharacters: newIds });
  };

  const addCharacterField = () => {
    setForm({ ...form, includedCharacters: [...form.includedCharacters, ''] });
  };

  const removeCharacterField = (index: number) => {
    const newIds = form.includedCharacters.filter((_, i) => i !== index);
    setForm({ ...form, includedCharacters: newIds });
  };

  const filteredData = offers.filter((offer) => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || offer.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ p: 4, minHeight: '100vh', color: 'white',width:510 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} >
        <Typography variant="h4">Manage Offers</Typography>
        <Button
          variant="contained"
          onClick={() => setIsAdding(true)}
          startIcon={<Add />}
          sx={{ bgcolor: '#00C8FF', '&:hover': { bgcolor: '#00B8E0' } }}
        >
          Add Offer
        </Button>
      </Box>
      <Grid container spacing={2} mb={4}>
        <Grid>
          <TextField
            label="Search by Title"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#00C8FF' }} />
                </InputAdornment>
              ),
              sx: { input: { color: 'white' }, fieldset: { borderColor: '#00C8FF' } }
            }}
            InputLabelProps={{ sx: { color: '#00C8FF' } }}
          />
        </Grid>
        <Grid>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#00C8FF' }}>Filter by Type</InputLabel>
            <Select
              value={filterType}
              label="Filter by Type"
              onChange={(e) => {
                setFilterType(e.target.value as string);
                setPage(1);
              }}
              sx={{
                color: 'white',
                fieldset: { borderColor: '#00C8FF' },
                '& .MuiSvgIcon-root': { color: '#00C8FF' }
              }}
              MenuProps={{
                PaperProps: { sx: { bgcolor: '#1a1a1a' } },
                MenuListProps: { sx: { bgcolor: '#1a1a1a' } }
              }}
            >
              {['All', 'coins', 'bundle'].map(type => (
                <MenuItem key={type} value={type} sx={{ color: 'white' }}>
                  {type === 'All' ? 'All' : type === 'coins' ? 'Coins' : 'Bundle'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {isAdding && (
        <Card sx={{ mb: 4, bgcolor: '#1a1a1a' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>Offer Details</Typography>
            <Grid container spacing={2}>
              <Grid>
                <TextField
                  label="Title"
                  name="title"
                  fullWidth
                  value={form.title}
                  onChange={handleInputChange}
                  required
                  InputProps={{ sx: { color: 'white' } }}
                  InputLabelProps={{ sx: { color: '#00C8FF' } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#00C8FF' } } }}
                />
              </Grid>
              <Grid>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#00C8FF' }}>Type</InputLabel>
                  <Select
                    name="type"
                    value={form.type}
                    onChange={handleInputChange}
                    sx={{
                      color: 'white',
                      fieldset: { borderColor: '#00C8FF' },
                      '& .MuiSvgIcon-root': { color: '#00C8FF' }
                    }}
                    MenuProps={{
                      PaperProps: { sx: { bgcolor: '#1a1a1a' } },
                      MenuListProps: { sx: { bgcolor: '#1a1a1a' } }
                    }}
                  >
                    <MenuItem value="coins" sx={{ color: 'white' }}>Coins</MenuItem>
                    <MenuItem value="bundle" sx={{ color: 'white' }}>Bundle</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid>
                <TextField
                  label="Coins"
                  name="coins"
                  type="number"
                  value={form.coins}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputProps={{ sx: { color: 'white' } }}
                  InputLabelProps={{ sx: { color: '#00C8FF' } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#00C8FF' } } }}
                />
              </Grid>
              <Grid>
                <TextField
                  label="Price ($)"
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputProps={{ sx: { color: 'white' } }}
                  InputLabelProps={{ sx: { color: '#00C8FF' } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#00C8FF' } } }}
                />
              </Grid>
              <Grid>
                <TextField
                  label="Bonus (%)"
                  name="bonus"
                  type="number"
                  value={form.bonus ?? 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{ sx: { color: 'white' } }}
                  InputLabelProps={{ sx: { color: '#00C8FF' } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#00C8FF' } } }}
                />
              </Grid>
              <Grid>
                <TextField
                  label="Popularity (0-5)"
                  name="popularity"
                  type="number"
                  value={form.popularity ?? 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{ sx: { color: 'white' } }}
                  InputLabelProps={{ sx: { color: '#00C8FF' } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#00C8FF' } } }}
                />
              </Grid>
              <Grid>
                <TextField
                  label="Image URL"
                  name="image"
                  value={form.image ?? ''}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{ sx: { color: 'white' } }}
                  InputLabelProps={{ sx: { color: '#00C8FF' } }}
                  sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#00C8FF' } } }}
                />
              </Grid>
              {form.type === 'bundle' && (
                <>
                  <Grid>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: 'white' }}>Character IDs</Typography>
                  {form.includedCharacters.map((charId, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        gap: 1,
                        mb: 1,
                        p: 1.5,
                        ml:-1.5,
                        borderRadius: 2,
                        backgroundColor: '#1a1a1a'
                      }}
                    >
                      <Autocomplete
                  sx={{ width: 230 }}
                  freeSolo
                  options={characterOptions}
                  getOptionLabel={(option) =>
                    typeof option === 'string'
                      ? option
                      : `${option.name} (#${option.id})`
                  }
                  onInputChange={(_, value) => searchHeroes(value)}
                  onChange={(_, value) => handleCharacterSelect(index, value as MarvelCharacter)}
                  loading={searchLoading}
                  componentsProps={{
                    paper: {
                      sx: {
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`Character #${index + 1}`}
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                        sx: {
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#00C8FF',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#00C8FF',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#00C8FF',
                          },
                        },
                      }}
                      InputLabelProps={{ sx: { color: '#00C8FF' } }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={`${option.thumbnail.path}.${option.thumbnail.extension}`}
                        alt={option.name}
                        style={{ width: 40, height: 40, borderRadius: 4 }}
                      />
                      {option.name} (#{option.id})
                    </li>
                  )}
                />
              <Button onClick={() => removeCharacterField(index)} color="error" variant="outlined">
           <Close />
       </Button>
      </Box>
    ))}
    <Button onClick={addCharacterField} variant="outlined" fullWidth sx={{ mt: 1 }}>
      Add Another Character
    </Button>
      </Grid>
          </>
              )}
              <Grid>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" onClick={handleSubmit} startIcon={<Save />} sx={{ bgcolor: '#00C8FF' }}>
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                  <Button variant="outlined" onClick={resetForm} sx={{ color: '#00C8FF' }}>
                    Cancel
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      <Grid container spacing={3}>
        {paginatedData.map((offer) => (
          <Grid key={offer._id}>
             <Card sx={{ bgcolor: '#1a1a1a',color:'white',borderRadius:5,width:220,height:220 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">{offer.title}</Typography>
                  <Box>
                    <IconButton onClick={() => editOffer(offer)}>
                      <Edit sx={{ color: '#00C8FF' }} />
                    </IconButton>
                    <IconButton onClick={() => deleteOffer(offer._id)} color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2">Type: {offer.type}</Typography>
                <Typography variant="body2">Coins: {offer.coins}</Typography>
                <Typography variant="body2">Price: ${offer.price.toFixed(2)}</Typography>
                {offer.includedCharacters?.length > 0 && (
                  <Typography variant="body2">
                    Character IDs: {offer.includedCharacters.join(', ')}
                  </Typography>
                )}
              </CardContent>
            </Card>
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Offers;