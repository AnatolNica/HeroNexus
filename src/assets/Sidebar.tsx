import { 
  Box,
  Checkbox,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  Slider,
  Stack,
  Typography,
  styled,
  Grow,
  keyframes,
  useMediaQuery,
  useTheme
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from '@mui/icons-material/FilterList';
import { useState, useEffect } from "react";

interface SidebarProps {
  selectedRarities: string[];
  comicsRange: number[];
  seriesRange: number[];
  priceRange: number[];
  handleRarityChange: (rarity: string) => void;
  handleComicsChange: (event: Event, newValue: number | number[]) => void;
  handleSeriesChange: (event: Event, newValue: number | number[]) => void;
  handlePriceChange: (event: Event, newValue: number | number[]) => void;
  maxComics: number;
  maxSeries: number;
}

const availableRarities = ["common", "rare", "epic", "legendary"];

const hoverPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const MarvelCheckbox = styled(Checkbox)(({}) => ({
  color: '#00C8FF',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&.Mui-checked': {
    color: '#00C8FF',
    transform: 'scale(1.1)'
  },
  '&:hover': {
    backgroundColor: 'rgba(0,200,255, 0.2)',
    animation: `${hoverPulse} 0.5s ease`
  },
}));

const Sidebar = ({
  selectedRarities,
  comicsRange,
  seriesRange,
  priceRange,
  handleRarityChange,
  handleComicsChange,
  handleSeriesChange,
  handlePriceChange,
  maxComics,
  maxSeries,
}: SidebarProps) => {
  const [mounted, setMounted] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMobileDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  const content = (
    <Box sx={{
      bgcolor: '#1a1a1a',
      borderRadius: { md: 4 },
      p: 3,
      height: '100%',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: !isSmallScreen ? 'sidebarEntrance 0.6s ease-out forwards' : undefined,
      '@keyframes sidebarEntrance': {
        '0%': { transform: 'translateX(-20px)', opacity: 0 },
        '100%': { transform: 'translateX(0)', opacity: 1 }
      },
      position: 'relative',
    }}>
      {isSmallScreen && (
        <IconButton
          onClick={() => setMobileOpen(false)}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: '#00C8FF',
            zIndex: 10,
          }}
        >
          <CloseIcon fontSize="large" />
        </IconButton>
      )}

      <Typography variant="h4" sx={{
        color: 'white',
        letterSpacing: 1.5,
        mb: 3,
        width: 300,
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
      }}>
        FILTERS
      </Typography>

      <Box mb={4}>
        <Typography variant="h6" sx={{
          color: 'white',
          mb: 2,
          fontSize: '1.4rem'
        }}>
          RARITY
        </Typography>
        <Stack spacing={1}>
          {availableRarities.map((rarity, index) => (
            <Grow key={rarity} in={mounted} timeout={index * 200 + 500}>
              <Box sx={{
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateX(8px)'
                }
              }}>
                <FormControlLabel
                  control={
                    <MarvelCheckbox
                      checked={selectedRarities.includes(rarity)}
                      onChange={() => handleRarityChange(rarity)}
                    />
                  }
                  label={
                    <Typography sx={{
                      color: 'white',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      textTransform: 'capitalize',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -2,
                        left: 0,
                        width: selectedRarities.includes(rarity) ? '100%' : '0%',
                        height: '2px',
                        backgroundColor: '#00C8FF',
                        transition: 'width 0.3s ease'
                      }
                    }}>
                      {rarity}
                    </Typography>
                  }
                  sx={{
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                />
              </Box>
            </Grow>
          ))}
        </Stack>
      </Box>

      <Divider sx={{
        borderColor: '#00C8FF',
        my: 4,
        '&:hover': {
          transform: 'scaleX(1.05)',
          borderColor: '#00C8FF'
        }
      }} />

      <Box mb={4}>
        <Typography variant="h6" sx={{
          color: 'white',
          mb: 3,
          fontSize: '1.4rem'
        }}>
          COMICS COUNT
        </Typography>
        <Slider
          value={comicsRange}
          onChange={handleComicsChange}
          valueLabelDisplay="auto"
          min={0}
          max={maxComics}
          sx={{
            color: '#00C8FF',
            height: 8,
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              backgroundColor: '#00C8FF',
              boxShadow: '0 0 8px rgba(0,200,255,0.5)',
            },
            '& .MuiSlider-valueLabel': {
              backgroundColor: '#00C8FF',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: 2,
              py: 0.5,
              px: 2
            }
          }}
        />
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography variant="body2" color="white">
            {comicsRange[0]}
          </Typography>
          <Typography variant="body2" color="white">
            {comicsRange[1]}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{
        borderColor: '#00C8FF',
        my: 4,
        '&:hover': {
          transform: 'scaleX(1.05)',
          borderColor: '#00C8FF'
        }
      }} />

      <Box mb={4}>
        <Typography variant="h6" sx={{
          color: 'white',
          mb: 3,
          fontSize: '1.4rem'
        }}>
          SERIES COUNT
        </Typography>
        <Slider
          value={seriesRange}
          onChange={handleSeriesChange}
          valueLabelDisplay="auto"
          min={0}
          max={maxSeries}
          sx={{
            color: '#00C8FF',
            height: 8,
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              backgroundColor: '#00C8FF',
              boxShadow: '0 0 8px rgba(0,200,255,0.5)',
            },
            '& .MuiSlider-valueLabel': {
              backgroundColor: '#00C8FF',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: 2,
              py: 0.5,
              px: 2
            }
          }}
        />
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography variant="body2" color="white">
            {seriesRange[0]}
          </Typography>
          <Typography variant="body2" color="white">
            {seriesRange[1]}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{
        borderColor: '#00C8FF',
        my: 4,
        '&:hover': {
          transform: 'scaleX(1.05)',
          borderColor: '#00C8FF'
        }
      }} />

      <Box>
        <Typography variant="h6" sx={{
          color: 'white',
          mb: 3,
          fontSize: '1.4rem'
        }}>
          PRICE RANGE
        </Typography>
        <Slider
          value={priceRange}
          onChange={handlePriceChange}
          valueLabelDisplay="auto"
          min={0}
          max={200}
          sx={{
            color: '#00C8FF',
            height: 8,
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              backgroundColor: '#00C8FF',
              boxShadow: '0 0 8px rgba(0,200,255,0.5)',
            },
            '& .MuiSlider-valueLabel': {
              backgroundColor: '#00C8FF',
              color: 'white',
              fontWeight: 'bold',
              borderRadius: 2,
              py: 0.5,
              px: 2
            }
          }}
        />
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography variant="body2" color="white">
            ${priceRange[0]}
          </Typography>
          <Typography variant="body2" color="white">
            ${priceRange[1]}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  if (isSmallScreen) {
    return (
      <>
        <IconButton
          onClick={toggleMobileDrawer}
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
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={toggleMobileDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: '100%',
              maxWidth: 'none',
              bgcolor: '#121212',
              animation: mobileOpen ? 'slideIn 0.4s ease-out' : undefined,
              '@keyframes slideIn': {
                '0%': { transform: 'translateX(100%)' },
                '100%': { transform: 'translateX(0)' }
              }
            }
          }}
        >
          {content}
        </Drawer>
      </>
    );
  }

  return content;
};

export default Sidebar;