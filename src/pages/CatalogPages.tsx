import {
  Box,
  Grid,
  TextField,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Container,
  Chip,
  useMediaQuery,
  Stack,
  Divider,
  CircularProgress,
  IconButton,
  styled,
} from "@mui/material";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../assets/Sidebar";
import NavBar from "../assets/NavBar";
import { useTheme } from "@mui/material/styles";
import { AttachMoney, EventNote, SortByAlpha, Shuffle, TrendingDown, TrendingUp } from "@mui/icons-material";
import EventAvailable from "@mui/icons-material/EventAvailable";
import { SelectChangeEvent } from "@mui/material/Select";
import { useUser } from "../contexts/UserContext";
import AddToCartButton from "../assets/AddToCartButton";
import FilterListIcon from '@mui/icons-material/FilterList';
import Coin from "../assets/Coin";

const ProductCard = styled(Box)({
  maxWidth: '320px',
  backgroundColor: '#1a1a1a',
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  cursor: 'pointer',
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'scale(1.03)',
  },
});

const ImageBox = styled(Box)({
  width: '100%',
  height: '270px',
  overflow: 'hidden',
  position: 'relative',
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

const CartButton = styled(IconButton)({
  position: 'absolute',
  bottom: 16,
  right: 16,
  backgroundColor: '#00C8FF!important',
  color: '#121212!important',
  padding: '10px!important',
  transition: 'all 0.3s!important',
  '&:hover': {
    backgroundColor: '#00B0E0!important',
    transform: 'scale(1.1)',
  },
});

const RarityLabel = styled(Typography)({
  position: 'absolute',
  top: 16,
  left: 16,
  backgroundColor: '#00C8FF',
  color: '#121212',
  fontWeight: '700',
  fontSize: '12px',
  padding: '4px 8px',
  borderRadius: '8px',
  textTransform: 'uppercase',
  userSelect: 'none',
});

interface Product {
  id: number;
  name: string;
  rarity: string;
  price: number;
  image: string;
  description: string;
  releaseDate: string;
  comicsCount: number;
  seriesCount: number;
  tags: string[];
}

const Catalog: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [comicsRange, setComicsRange] = useState<number[]>([0, 500]);
  const [seriesRange, setSeriesRange] = useState<number[]>([0, 100]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 200]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("random");
  const [randomSeed, setRandomSeed] = useState<number>(Date.now());
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(12);
  const { marvelCharacters, isLoadingMarvel } = useUser();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const maxComics = useMemo(() => {
    if (allProducts.length === 0) return 500;
    return Math.max(...allProducts.map(p => p.comicsCount), 500);
  }, [allProducts]);

  const maxSeries = useMemo(() => {
    if (allProducts.length === 0) return 100;
    return Math.max(...allProducts.map(p => p.seriesCount), 100);
  }, [allProducts]);

  const fetchAllCharacters = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const idsResponse = await fetch('/api/marvel/characters');
      if (!idsResponse.ok) throw new Error('Failed to fetch character IDs');
  
      const detailsResponse = await fetch('/api/marvel/batch-full-data');
      if (!detailsResponse.ok) throw new Error('Failed to fetch character details');
      const detailsData = await detailsResponse.json();
  
      const products = detailsData.map((char: any) => ({
        id: char.id,
        name: char.name || `Hero ${char.id}`,
        rarity: char.rarity || 'common',
        price: char.price || Math.floor(Math.random() * (200 - 10 + 1)) + 10,
        image: char.thumbnail 
          ? `${char.thumbnail.path}.${char.thumbnail.extension}`
          : "https://via.placeholder.com/150",
        description: char.description || "No description available",
        releaseDate: new Date(
          2000 + Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28)
        ).toISOString().split('T')[0],
        comicsCount: char.comics?.available || 0,
        seriesCount: char.series?.available || 0,
        tags: char.tags || []
      }));
  
      setAllProducts(products);
      
      const comicsMax = Math.max(...products.map(p => p.comicsCount), 500);
      const seriesMax = Math.max(...products.map(p => p.seriesCount), 100);
      setComicsRange([0, comicsMax]);
      setSeriesRange([0, seriesMax]);
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    if (isLoadingMarvel || !marvelCharacters) return;
    fetchAllCharacters();
  }, [isLoadingMarvel, marvelCharacters, fetchAllCharacters]);

  const handleRarityChange = (rarity: string) => {
    setSelectedRarities((prev) =>
      prev.includes(rarity)
        ? prev.filter((r) => r !== rarity)
        : [...prev, rarity]
    );
  };

  const handleComicsChange = (_: Event, newValue: number | number[]) => {
    setComicsRange(newValue as number[]);
  };

  const handleSeriesChange = (_: Event, newValue: number | number[]) => {
    setSeriesRange(newValue as number[]);
  };

  const handlePriceChange = (_: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  const handleSortChange = (e: SelectChangeEvent) => {
    const newSortOrder = e.target.value as string;
    setSortOrder(newSortOrder);
    if (newSortOrder === "random") {
      setRandomSeed(Date.now());
    }
  };

  const handleCardClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, [currentPage]);

  const filteredProducts = allProducts
    .filter((product) => {
      const matchRarity = selectedRarities.length === 0 || selectedRarities.includes(product.rarity);
      const matchComics = product.comicsCount >= comicsRange[0] && product.comicsCount <= comicsRange[1];
      const matchSeries = product.seriesCount >= seriesRange[0] && product.seriesCount <= seriesRange[1];
      const matchPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const normalizedSearch = searchTerm.toLowerCase().trim();
      const matchSearch = !searchTerm || 
        product.name.toLowerCase().startsWith(normalizedSearch);
      
      return matchRarity && matchComics && matchSeries && matchPrice && matchSearch;
    });
    
  let sortedProducts = [...filteredProducts];
  
  if (sortOrder === "random") {
    const shuffled = [...filteredProducts];
    const random = () => {
      const x = Math.sin(randomSeed) * 10000;
      return x - Math.floor(x);
    };
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    sortedProducts = shuffled;
  } else {
    sortedProducts.sort((a, b) => {
      const [criteria, order] = sortOrder.split('-');
      let compare = 0;

      switch(criteria) {
        case 'alpha':
          compare = a.name.localeCompare(b.name);
          break;
        case 'price':
          compare = a.price - b.price;
          break;
        case 'date':
          const dateA = new Date(a.releaseDate).getTime();
          const dateB = new Date(b.releaseDate).getTime();
          compare = dateA - dateB;
          break;
        case 'comics':
          compare = a.comicsCount - b.comicsCount;
          break;
        case 'series':
          compare = a.seriesCount - b.seriesCount;
          break;
        default:
          compare = 0;
      }

      return order === 'desc' ? -compare : compare;
    });
  }
    
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayProducts = sortedProducts.slice(startIndex, endIndex);
  
  const heroCount = filteredProducts.length;

  return (
    <>
      <NavBar />
      <Container maxWidth="xl" sx={{ py: 6, background: '#121212' }}>
        <Box
          display="flex"
          gap={4}
          flexDirection={{ xs: "column", md: "row" }}
          sx={{
            background: "#1a1a1a",
            borderRadius: 4,
            p: { xs: 2, md: 4 },
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "url('https://www.transparenttextures.com/patterns/asfalt-dark.png')",
              opacity: 0.1,
              zIndex: 0,
            },
          }}
        >
          {!isMobile && (
            <Sidebar
              selectedRarities={selectedRarities}
              comicsRange={comicsRange}
              seriesRange={seriesRange}
              priceRange={priceRange}
              handleRarityChange={handleRarityChange}
              handleComicsChange={handleComicsChange}
              handleSeriesChange={handleSeriesChange}
              handlePriceChange={handlePriceChange}
              maxComics={maxComics}
              maxSeries={maxSeries}
              mobileOpen={showMobileSidebar}
              onMobileClose={() => setShowMobileSidebar(false)}
            />
          )}

          <Box flexGrow={1} position="relative" zIndex={1}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={6}
              flexWrap="wrap"
              gap={3}
              sx={{
                "& .MuiInputBase-root": {
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(0,200,255,0.1)",
                  borderRadius: "30px",
                  color: "white",
                },
                "& .MuiSvgIcon-root": {
                  color: "#00C8FF",
                },
                position: "relative",
              }}
            >
              <TextField
                label="Search Heroes..."
                variant="outlined"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
                size="small"
                sx={{ 
                  flexGrow: 1, 
                  maxWidth: 500,
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00C8FF!important',
                    borderRadius: '15px'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00C8FF!important',
                    boxShadow: '0 0 12px rgba(0, 200, 255, 0.5)'
                  }
                }}
                InputLabelProps={{ style: { color: "white" } }}
              />
              
              <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 240 }}>
                  <InputLabel sx={{ 
                    color: 'white!important',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    Sort Heroes
                  </InputLabel>
                  <Select
                    value={sortOrder}
                    onChange={handleSortChange}
                    label="Sort Heroes"
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00C8FF!important',
                        borderRadius: '15px'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00C8FF!important',
                        boxShadow: '0 0 12px rgba(0, 200, 255, 0.5)'
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: '#1a1a1a',
                          border: '2px solid #00C8FF',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                          '& .MuiMenuItem-root': {
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            color: 'white'
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="random">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Shuffle sx={{ color: '#00C8FF', fontSize: 20 }} />
                        <Typography variant="body2">Random</Typography>
                      </Stack>
                    </MenuItem>

                    <Divider sx={{ my: 1, bgcolor: '#00C8FF', opacity: 0.5 }} />

                    <MenuItem value="alpha-asc">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <SortByAlpha sx={{ color: '#00C8FF', fontSize: 20 }} />
                        <Typography variant="body2">A to Z</Typography>
                      </Stack>
                    </MenuItem>

                    <MenuItem value="alpha-desc">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <SortByAlpha sx={{ color: '#00C8FF', fontSize: 20, transform: 'scaleX(-1)' }} />
                        <Typography variant="body2">Z to A</Typography>
                      </Stack>
                    </MenuItem>

                    <Divider sx={{ my: 1, bgcolor: '#00C8FF', opacity: 0.5 }} />

                    <MenuItem value="price-asc">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <AttachMoney sx={{ color: '#00C8FF', fontSize: 20 }} />
                        <Typography variant="body2">Price: Low to High</Typography>
                      </Stack>
                    </MenuItem>

                    <MenuItem value="price-desc">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <AttachMoney sx={{ color: '#00C8FF', fontSize: 20, transform: 'rotate(180deg)' }} />
                        <Typography variant="body2">Price: High to Low</Typography>
                      </Stack>
                    </MenuItem>

                    <MenuItem value="date-asc">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <EventNote sx={{ color: '#00C8FF', fontSize: 20 }} />
                        <Typography variant="body2">Date: Oldest</Typography>
                      </Stack>
                    </MenuItem>

                    <MenuItem value="date-desc">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <EventAvailable sx={{ color: '#00C8FF', fontSize: 20 }} />
                        <Typography variant="body2">Date: Newest</Typography>
                      </Stack>
                    </MenuItem>

                    <Divider sx={{ my: 1, bgcolor: '#00C8FF', opacity: 0.5 }} />

                    <MenuItem value="comics-asc">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <TrendingUp sx={{ color: '#00C8FF', fontSize: 20 }} />
                        <Typography variant="body2">Comics: Low to High</Typography>
                      </Stack>
                    </MenuItem>

                    <MenuItem value="comics-desc">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <TrendingDown sx={{ color: '#00C8FF', fontSize: 20 }} />
                        <Typography variant="body2">Comics: High to Low</Typography>
                      </Stack>
                    </MenuItem>

                    <MenuItem value="series-asc">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <TrendingUp sx={{ color: '#00C8FF', fontSize: 20 }} />
                        <Typography variant="body2">Series: Low to High</Typography>
                      </Stack>
                    </MenuItem>

                    <MenuItem value="series-desc">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <TrendingDown sx={{ color: '#00C8FF', fontSize: 20 }} />
                        <Typography variant="body2">Series: High to Low</Typography>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>

                <Chip
                  label={`HEROES FOUND: ${heroCount}`}
                  sx={{
                    background: "#00C8FF",
                    color: "#121212",
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    px: 3,
                    py: 1,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                  }}
                />
              </Box>
            </Box>

            {isLoading ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh',
                width: '100%'
              }}>
                <CircularProgress 
                  sx={{ 
                    color: '#00C8FF',
                    animationDuration: '850ms',
                  }} 
                  size={60}
                  thickness={4}
                />
              </Box>
            ) : (
              <>
                {displayProducts.length === 0 ? (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '200px',
                    width: '100%',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h5" sx={{ color: 'white' }}>
                      {searchTerm ? `No heroes found for "${searchTerm}"` : 'No heroes match your filters'}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Grid container spacing={4} justifyContent="flex-start">
                      {displayProducts.map((product) => (
                        <Grid 
                          key={product.id}
                        >
                          <ProductCard onClick={() => handleCardClick(product.id)} width={300}>
                            <ImageBox >
                              <img
                                src={product.image}
                                alt={product.name}                             
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/280x280';
                                }}
                              />
                              <RarityLabel >{product.rarity}</RarityLabel>
                            </ImageBox>
                            <Box sx={{ p: 2 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '14px',
                                  display: 'block',
                                  mb: 1,
                                }}
                              >
                                {product.comicsCount} Comics
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '16px',
                                  lineHeight: 1.3,
                                  minHeight: '48px',
                                }}
                              >
                                {product.name}
                              </Typography>
                              <Typography
  variant="body2"
  sx={{
    color: 'white',
    fontWeight: 800,
    fontSize: '24px',
    mt: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  }}
>
  <Coin size={32} />
  {product.price.toFixed(2)}
</Typography>

                            </Box>
                            <CartButton onClick={(e) => {
                              e.stopPropagation();
                            }}>
                              <AddToCartButton width={40}productId={product.id} iconOnly />
                            </CartButton>
                          </ProductCard>
                        </Grid>
                      ))}
                    </Grid>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mt: 6,
                      px: 2,
                      py: 2,
                      background: 'rgba(0, 200, 255, 0.05)',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 200, 255, 0.3)'
                    }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          sx={{
                            minWidth: 32,
                            height: 32,
                            background: currentPage === 1 ? 'rgba(255,255,255,0.1)' : '#00C8FF',
                            color: currentPage === 1 ? '#aaa' : '#121212',
                            borderRadius: '8px',
                            '&:hover': {
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          &lt;
                        </Button>

                        {[...Array(totalPages)].map((_, idx) => {
                          const page = idx + 1;
                          if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                            return (
                              <Button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                sx={{
                                  minWidth: 32,
                                  height: 32,
                                  background: currentPage === page ? '#00C8FF' : 'rgba(255,255,255,0.1)',
                                  color: currentPage === page ? '#121212' : 'white',
                                  borderRadius: '8px',
                                  '&:hover': {
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                {page}
                              </Button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <Typography key={page} sx={{ color: 'white', px: 2 }}>...</Typography>;
                          }
                          return null;
                        })}

                        <Button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          sx={{
                            minWidth: 32,
                            height: 32,
                            background: currentPage === totalPages ? 'rgba(255,255,255,0.1)' : '#00C8FF',
                            color: currentPage === totalPages ? '#aaa' : '#121212',
                            borderRadius: '8px',
                            '&:hover': {
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          &gt;
                        </Button>
                      </Box>
                    </Box>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
        {isMobile && (
          <IconButton
            onClick={toggleMobileSidebar}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
              backgroundColor: '#00C8FF',
              color: '#121212',
              width: 56,
              height: 56,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              '&:hover': {
                backgroundColor: '#00B0E0',
                transform: 'scale(1.1)'
              }
            }}
          >
            <FilterListIcon fontSize="large" />
          </IconButton>
        )}
        {isMobile && (
          <Sidebar
            selectedRarities={selectedRarities}
            comicsRange={comicsRange}
            seriesRange={seriesRange}
            priceRange={priceRange}
            handleRarityChange={handleRarityChange}
            handleComicsChange={handleComicsChange}
            handleSeriesChange={handleSeriesChange}
            handlePriceChange={handlePriceChange}
            maxComics={maxComics}
            maxSeries={maxSeries}
            mobileOpen={showMobileSidebar}
            onMobileClose={() => setShowMobileSidebar(false)}
          />
        )}
      </Container>
    </>
  );
};

export default Catalog;