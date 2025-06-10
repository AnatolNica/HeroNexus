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
  Divider,
  Stack,
  IconButton,
  Snackbar,
  Alert,
  Autocomplete,
  CircularProgress,
  Pagination,
  InputAdornment
} from '@mui/material';
import { Add, Delete, Edit, Save, Search } from '@mui/icons-material';
import axios from 'axios';

interface MarvelCharacter {
  id: number;
  name: string;
  thumbnail: {
    path: string;
    extension: string;
  };
}

interface RouletteItem {
  heroId: string;
  chance: number;
}

interface Roulette {
  _id: string;
  name: string;
  image: string;
  category: string;
  price: number;
  items: RouletteItem[];
}

const RoulettesAdmin = () => {
  const [roulettes, setRoulettes] = useState<Roulette[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [heroOptions, setHeroOptions] = useState<MarvelCharacter[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState<Roulette>({
    _id: '',
    name: '',
    image: '',
    category: 'Heroes',
    price: 1.99,
    items: [{ heroId: '', chance: 0 }]
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchRoulettes();
  }, []);

  const fetchRoulettes = async () => {
    try {
      const res = await axios.get('/api/roulettes');
      setRoulettes(res.data.data);
    } catch (err) {
      showError('Error loading roulettes');
    }
  };

  const searchHeroes = async (searchTerm: string) => {
    if (!searchTerm) return;
    setSearchLoading(true);
    try {
      const res = await axios.post('/api/marvel/search', { searchTerm });
      setHeroOptions(res.data);
    } catch (err) {
      showError('Error searching heroes');
    } finally {
      setSearchLoading(false);
    }
  };

const handleHeroSelect = (index: number, hero: MarvelCharacter | null) => {
  if (!hero) return;
  const newItems = [...form.items];
  newItems[index] = {
    heroId: hero.id.toString(),
    chance: newItems[index].chance
  };
  setForm({ ...form, items: newItems });
};

  const handleItemChange = (index: number, field: keyof RouletteItem, value: any) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm({ ...form, items: newItems });
  };

  const addNewItem = () => {
    setForm({ ...form, items: [...form.items, { heroId: '', chance: 0 }] });
  };

  const removeItem = (index: number) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const validateForm = () => {
    const totalChance = form.items.reduce((sum, item) => sum + Number(item.chance), 0);
    return Math.abs(totalChance - 1) < 0.001;
  };

  const handleSubmit = async () => {
  if (!validateForm()) {
    showError('Total chance must be exactly 100%');
    return;
  }

  try {
    const payload = {
      ...form,
      items: form.items.map(item => ({
        heroId: item.heroId,
        chance: Number(item.chance)
      }))
    };
    if (!editingId) {
      delete payload._id;
    }
    if (editingId) {
      await axios.put(`/api/roulettes/${editingId}`, payload, getAuthHeader());
    } else {
      await axios.post('/api/roulettes', payload, getAuthHeader());
    }

    fetchRoulettes();
    resetForm();
    showSuccess('Roulette saved successfully');
  } catch (err) {
    showError(err.response?.data?.error || 'Error saving roulette');
  }
};

  const resetForm = () => {
    setForm({
      _id: '',
      name: '',
      image: '',
      category: 'Heroes',
      price: 1.99,
      items: [{ heroId: '', chance: 0 }]
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const editRoulette = (roulette: Roulette) => {
    setForm(roulette);
    setEditingId(roulette._id);
    setIsAdding(true);
  };

  const deleteRoulette = async (id: string) => {
    if (!window.confirm('Delete this roulette?')) return;
    try {
      await axios.delete(`/api/roulettes/${id}`, getAuthHeader());
      fetchRoulettes();
      showSuccess('Roulette deleted');
    } catch (err) {
      showError('Error deleting roulette');
    }
  };

  const showError = (message: string) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  const showSuccess = (message: string) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const categories = ['All', 'Heroes', 'Villains', 'Mutants', 'Anti-Heroes','Avengers'];

  const filteredData = filterCategory === 'All'
    ? roulettes
    : roulettes.filter(r => r.category === filterCategory);

  const searchedData = searchTerm.trim()
    ? filteredData.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : filteredData;

  const totalPages = Math.ceil(searchedData.length / itemsPerPage);
  const paginatedData = searchedData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ p: 4, minHeight: '100vh', color: 'white', maxWidth: 510 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Roulette Management</Typography>
        <Button
          variant="contained"
          onClick={() => setIsAdding(true)}
          startIcon={<Add />}
          sx={{ bgcolor: '#00C8FF', '&:hover': { bgcolor: '#00B8E0' }, ml: 2 }}
        >
          Add Roulette
        </Button>
      </Box>
      <Grid container spacing={2} mb={4} alignItems="center">
        <Grid>
          <TextField
            label="Search by Name"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#00C8FF' }} />
                </InputAdornment>
              ),
              sx: {
                color: 'white',
                input: { color: 'white' },
                fieldset: { borderColor: '#00C8FF' },
                '&:hover fieldset': { borderColor: '#00C8FF' }
              }
            }}
            InputLabelProps={{
              sx: { color: '#00C8FF' }
            }}
          />
        </Grid>
        <Grid>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#00C8FF' }}>Filter by Category</InputLabel>
            <Select
              value={filterCategory}
              label="Filter by Category"
              onChange={(e) => {
                setFilterCategory(e.target.value as string);
                setPage(1);
              }}
              sx={{
                color: 'white',
                fieldset: { borderColor: '#00C8FF' },
                '&:hover fieldset': { borderColor: '#00C8FF' },
                '& .MuiSvgIcon-root': {
                  color: '#00C8FF'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1a1a1a',
                  }
                },
                MenuListProps: {
                  sx: {
                    bgcolor: '#1a1a1a',
                  }
                }
              }}
            >
              {categories.map(cat => (
                <MenuItem
                  key={cat}
                  value={cat}
                  sx={{
                    paddingTop: 1,
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
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {isAdding && (
        <Card sx={{ mb: 4, bgcolor: '#1a1a1a', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Roulette Data</Typography>
            <Grid container spacing={2}>
              <Grid>
                <TextField
                  label="Roulette Name"
                  name="name"
                  fullWidth
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  InputProps={{ sx: { color: 'white' } }}
                  InputLabelProps={{ sx: { color: '#00C8FF' } }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#00C8FF' },
                      '&:hover fieldset': { borderColor: '#00C8FF' }
                    }
                  }}
                />
              </Grid>
              <Grid>
                <TextField
                  label="Image URL"
                  name="image"
                  fullWidth
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  required
                  InputProps={{ sx: { color: 'white' } }}
                  InputLabelProps={{ sx: { color: '#00C8FF' } }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#00C8FF' },
                      '&:hover fieldset': { borderColor: '#00C8FF' }
                    }
                  }}
                />
              </Grid>
              <Grid>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#00C8FF' }}>Category</InputLabel>
                  <Select
                    name="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    sx={{
                      mb: 2,
                      color: 'white',
                      fieldset: { borderColor: '#00C8FF' },
                      '&:hover fieldset': { borderColor: '#00C8FF' },
                      '& .MuiSvgIcon-root': {
                        color: '#00C8FF'
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a',
                        }
                      },
                      MenuListProps: {
                        sx: {
                          bgcolor: '#1a1a1a',
                        }
                      }
                    }}
                  >
                    {['Heroes', 'Villains', 'Weapons', 'Special'].map(category => (
                      <MenuItem
                        key={category}
                        value={category}
                        sx={{
                          color: 'white',
                          bgcolor: '#1a1a1a',
                          paddingTop: 1,
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
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid>
                <TextField
                  label="Price per Spin ($)"
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  inputProps={{ min: 0.99, step: 0.01 }}
                  fullWidth
                  required
                  InputProps={{ sx: { color: 'white' } }}
                  InputLabelProps={{ sx: { color: '#00C8FF' } }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#00C8FF' },
                      '&:hover fieldset': { borderColor: '#00C8FF' }
                    }
                  }}
                />
              </Grid>
              <Grid sx={{maxWidth:600}}>
                <Typography variant="h6" sx={{ mb: 2 }}>Roulette Items</Typography>
                {form.items.map((item, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: '#1a1a1a', borderRadius: 1, ml: -2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid>
                      <Autocomplete
                        options={heroOptions}
                          getOptionLabel={(option) => `${option.name} (#${option.id})`}
                          isOptionEqualToValue={(option, value) => option?.id === value?.id}
                          loading={searchLoading}
                          onInputChange={(_, value, reason) => {
                            if (reason === 'input') {
                              searchHeroes(value);
                            }
                          }}
                          onChange={(_, value) => handleHeroSelect(index, value)}
                          value={heroOptions.find(h => h.id.toString() === item.heroId) || null}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Search Hero"
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
                                  width:200,
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
                          renderOption={(props, option) => {
                            const { key, ...rest } = props;
                            return (
                              <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={`${option.thumbnail.path}.${option.thumbnail.extension}`}
                                  alt={option.name}
                                  style={{ width: 40, height: 40, borderRadius: 4 }}
                                />
                                {`${option.name} (#${option.id})`}
                              </li>
                            );
                          }}
                        />
                      </Grid>
                      <Grid>
                        <TextField
                          label="Drop Chance (0-1)"
                          type="number"
                          value={item.chance}
                          onChange={(e) => handleItemChange(index, 'chance', e.target.value)}
                          inputProps={{ min: 0, max: 1, step: 0.01 }}
                          fullWidth
                          InputProps={{ sx: { color: 'white' } }}
                          InputLabelProps={{ sx: { color: '#00C8FF' } }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#00C8FF' },
                              '&:hover fieldset': { borderColor: '#00C8FF' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid>
                        <IconButton onClick={() => removeItem(index)} color="error">
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
                <Button onClick={addNewItem} startIcon={<Add />} sx={{ mt: 2, color: '#00C8FF' }}>
                  Add Item
                </Button>
              </Grid>
              <Grid>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" onClick={handleSubmit} startIcon={<Save />} sx={{ bgcolor: '#00C8FF' }}>
                    {editingId ? 'Update Roulette' : 'Create Roulette'}
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
        {paginatedData.map((roulette) => (
          <Grid key={roulette._id}>
            <Card sx={{ bgcolor: '#1a1a1a', color: 'white', borderRadius: 5, width: 240, height: 300 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">{roulette.name}</Typography>
                  <Box>
                    <IconButton onClick={() => editRoulette(roulette)}>
                      <Edit sx={{ color: '#00C8FF' }} />
                    </IconButton>
                    <IconButton onClick={() => deleteRoulette(roulette._id)} color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2">Category: {roulette.category}</Typography>
                <Typography variant="body2">Price: ${roulette.price.toFixed(2)}</Typography>
                <Typography variant="body2">Items: {roulette.items.length}</Typography>
                <Divider sx={{ my: 1 }} />
                {roulette.items.map((item, idx) => (
                  <Typography key={idx} variant="body2">
                    ID: {item.heroId}
                  </Typography>
                ))}
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

export default RoulettesAdmin;