import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Chip,
  IconButton,
  Paper,
  Stack,
  Rating,
  CircularProgress
} from "@mui/material";
import { useParams, useLocation } from "react-router-dom";
import NavBar from "../assets/NavBar";
import {  Info } from "@mui/icons-material";
import { ImageGallery } from "../assets/ImageGallery";
import Figurines from '../assets/NewFigurines';
import Footer from '../assets/Footer';
import axios from 'axios';
import Reviews from '../assets/Reviews';
import HeartButton from '../assets/HeartButton';
import AddToCartButton from '../assets/AddToCartButton';
import Coin from '../assets/Coin';

interface MarvelCharacter {
  series: any;
  id: number;
  name: string;
  description: string;
  thumbnail: {
    path: string;
    extension: string;
  };
  comics: {
    available: number;
    items?: Array<{ resourceURI: string }>;
  };
  price?: number;
  rarity?: string;
  images?: string[];
  customDescription?: string;
  tags?: string[];
  modified: string;
}

const ProductPage = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [character, setCharacter] = useState<MarvelCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchCharacterData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/marvel/charactersdb/${id}`);
        
        const combinedData = {
          ...response.data,
          price: response.data.price || 1,
          rarity: response.data.rarity || 'common',
          images: response.data.images || [],
          customDescription: response.data.customDescription || '',
          tags: response.data.tags || []
        };

        setCharacter(combinedData);
        const reviewsResponse = await fetch(`/api/reviews/${id}`);
        const reviewsData = await reviewsResponse.json();
        
        if (reviewsData.length > 0) {
          const totalStars = reviewsData.reduce((sum: number, review: any) => sum + review.stars, 0);
          setAverageRating(totalStars / reviewsData.length);
        }
        
        setReviewCount(reviewsData.length);
        
      } catch (err) {
        setError('Failed to load character data');
        console.error('Error fetching character:', err);
      } finally {
        setLoading(false);
      }
    };

    if (state?.character) {
      setCharacter(state.character);
      setLoading(false);
    } else {
      fetchCharacterData();
    }

    window.scrollTo(0, 0);
  }, [id, state]);

  const images = character ? [
    `${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}`,
    ...(character.images || []),
    ...(character.comics?.items?.slice(0, 3).map(c => c.resourceURI) || [])
  ] : ['/fallback-image.jpg'];

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleFavorite = () => setIsFavorite(!isFavorite);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Typography variant="h4" color="error">{error}</Typography>
      </Box>
    );
  }

  if (!character) {
    return (
      <Box textAlign="center" py={10}>
        <Typography variant="h4">Character not found</Typography>
      </Box>
    );
  }

  return (
    <>
      <NavBar />
      <Container maxWidth='xl'>
        <Grid container spacing={6} sx={{ mt: '30px', mb: '30px' }}>
          <Grid>
            <Box sx={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
              <ImageGallery
                images={images}
                currentImageIndex={currentImageIndex}
                onNext={handleNextImage}
                onPrev={handlePrevImage}
                onFavorite={toggleFavorite}
                setCurrentImageIndex={setCurrentImageIndex}
              />
              <IconButton
                onClick={toggleFavorite}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 2,
                  color: isFavorite ? '#DA1F28' : '#FFF',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.3)',
                  }
                }}
              >
                <HeartButton characterId={character.id} />
              </IconButton>
            </Box>
          </Grid>

          <Grid>
            <Paper sx={{ bgcolor: '#111', color: 'white', p: 4, borderRadius: 4, maxWidth: 360 }}>
              <Stack direction="row" spacing={1} mb={2}>
                <Chip 
                  label={`${character.comics?.available} Comics`}
                  sx={{ bgcolor: '#fff', color: '#000', fontWeight: 700 }}
                />
                 <Chip 
                  label={`${character.series?.available} Series`}
                  sx={{ bgcolor: '#00CFFF', color: '#000', fontWeight: 700 }}
                />
                <Chip 
                  label={character.rarity?.toUpperCase() || 'COMMON'}
                  sx={{ 
                    bgcolor: 
                      character.rarity === 'rare' ? '#ffd600' :
                      character.rarity === 'epic' ? '#d500f9' :
                      character.rarity === 'legendary' ? '#ff6d00' : '#616161',
                    color: 'white', 
                    fontWeight: 700 
                  }}
                />
              </Stack>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {character.name}
              </Typography>

              <Typography variant="body2" color="#999" mb={2}>
                Character ID: {character.id}
              </Typography>
              
              <Typography
                variant="h5"
                fontWeight={700}
                mb={1}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Coin size={40}/>
                {character.price?.toFixed(2) || '0.00'}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Rating value={averageRating} readOnly size="small" precision={0.1} 
                sx={{
                  '& .MuiRating-iconEmpty': {
                    color: 'gray',  
                  },
                  '& .MuiRating-iconFilled': {
                    color: '#fbc02d', 
                  },
                }}
                />
                <Typography variant="body2" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
                  {reviewCount} {reviewCount === 1 ? 'Recenzie' : 'Recenzii'}
                </Typography>
                <Typography variant="body2" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
                  Share
                </Typography>
              </Stack>

              <Typography variant="body2" sx={{ color: '#4caf50', mb: 2 }}>
                ● In Stock
              </Typography>

              <AddToCartButton productId={character.id} />
              <Stack direction="row" spacing={2} mb={4} mt={2}>
                <Typography variant="body2" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
                  Return Policy
                </Typography>
                <Typography variant="body2" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
                  Shipping Policy
                </Typography>
              </Stack>

              <Paper sx={{ bgcolor: '#1a1a1a', color:'white', p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Character Details
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Info sx={{ color: '#00b0ff', fontSize: 20 }} />
                  <Typography variant="caption" color="#aaa">
                    First appearance: {new Date(character.modified).toLocaleDateString()}
                  </Typography>
                </Stack>
              </Paper>

              <Paper sx={{ bgcolor: '#1a1a1a', color:'white', p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Product Features
                </Typography>
                <Typography variant="body2" color="#aaa">
                  {character.customDescription || character.description || 'Official Marvel collectible figure with premium detailing and articulation.'}
                </Typography>
              </Paper>

              {character.tags && character.tags.length > 0 && (
                <Paper sx={{ bgcolor: '#1a1a1a', p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Tags
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {character.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{ bgcolor: '#00b0ff', color: 'white', mb: 0.5 }}
                      />
                    ))}
                  </Stack>
                </Paper>
              )}
            </Paper>
          </Grid>
        </Grid>
        <Reviews figureId={character.id} />
        <Figurines/>
      </Container>
      <Footer/>
    </>
  );
};

export default ProductPage;