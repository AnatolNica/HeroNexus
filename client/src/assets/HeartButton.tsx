import { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import axios from 'axios';

const HeartButton = ({ characterId }: { characterId: number }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') || '';

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = getToken();
      if (!token) {
        setIsFavorite(false);
        return;
      }
      try {
        const response = await axios.get('/api/favorites', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const favorites: number[] = response.data;
        setIsFavorite(favorites.includes(characterId));
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setIsFavorite(false);
      }
    };

    fetchFavorites();
  }, [characterId]);

  const handleToggleFavorite = async () => {
    if (loading) return;
    setLoading(true);

    const token = getToken();
    if (!token) {
      console.warn('No token found, user must be logged in to toggle favorites');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `/api/favorites/${characterId}`,
        {}, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newFavorites: number[] = response.data.favorites;
      setIsFavorite(newFavorites.includes(characterId));
    } catch (error) {
      console.error('Error updating favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IconButton
      onClick={handleToggleFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      disabled={loading}
    >
      {isFavorite ? <Favorite color="error" /> : <FavoriteBorder color="action" />}
    </IconButton>
  );
};

export default HeartButton;
