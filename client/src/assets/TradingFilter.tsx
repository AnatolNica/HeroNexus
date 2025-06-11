import { useState, useEffect } from 'react';
import {
  Drawer,
  Tabs,
  Tab,
  Stack,
  Typography,
  useTheme,
  Chip,
  IconButton,
  Box,
  Card,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Slider,
  Grid,
  Avatar,
  Skeleton,
  CircularProgress,
  styled,
  CardContent,
  useMediaQuery
} from '@mui/material';
import { 
  FilterList, 
  Close,
  LocalFireDepartment,
  AttachMoney,
  TrendingUp,
  BarChart,
  Person,
  Search,
  People,
  CheckCircle,
  Group,
  Schedule,
  DateRange,
  AccessTime,
  SwapHoriz,
  Favorite,
  RestartAlt
} from '@mui/icons-material';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const PremiumCard = styled(Card)(({}) => ({
  background: 'linear-gradient(145deg, #1e1e2d, #232334)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  position: 'relative',
  overflow: 'visible',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: '#00C8FF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  }
}));

const StatCard = styled(Card)(({ theme }) => ({
  background: '#1a1a1a',
  borderRadius: '14px',
  padding: theme.spacing(2),
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
  }
}));

interface Filters {
  username: string;
  minValue: number;
  maxValue: number;
  dateRange: string;
  tradeType: string;
  characterName: string;
  timeOfDay: number[];
}

interface TradingFiltersProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

interface AnalyticsData {
  stats: {
    tradesCount: number;
    completedTrades: number;
    activeUsers: number;
    avgValue: number;
    maxValue: number;
    minValue: number;
  };
  peakHours: { hour: string; count: number }[];
  popularCharacters: { id: number; name: string; count: number }[];
  tradeActivity: { _id: string; trades: number }[];
  topPartners: { name: string; avatar: string; trades: number; lastTrade: string }[];
  popularCollections: { name: string; count: number }[];
}

interface HeroDetails {
  id: number;
  name: string;
  thumbnail: {
    path: string;
    extension: string;
  };
}

const TradingFilters = ({ 
  filters, 
  setFilters, 
  activeTab, 
  setActiveTab,
}: TradingFiltersProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [valueRange, setValueRange] = useState<number[]>([
    filters.minValue || 0, 
    filters.maxValue || 1000
  ]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [characterDetails, setCharacterDetails] = useState<Record<number, HeroDetails>>({});
  const [charactersLoading, setCharactersLoading] = useState(false);

  const resetFilters = () => {
    setFilters({
      username: '',
      minValue: 0,
      maxValue: 1000,
      dateRange: 'all',
      tradeType: 'all',
      characterName: '',
      timeOfDay: [0, 24]
    });
    setValueRange([0, 1000]);
  };

  const handleValueChange = (event: Event, newValue: number | number[]) => {
    setValueRange(newValue as number[]);
  };

  const handleValueCommit = () => {
    setFilters({
      ...filters,
      minValue: valueRange[0],
      maxValue: valueRange[1]
    });
  };

  const toggleMobileDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      if (!analyticsData || !analyticsData.popularCharacters || analyticsData.popularCharacters.length === 0) return;
      try {
        setCharactersLoading(true);
        const token = localStorage.getItem('token');
        const characterIds = analyticsData.popularCharacters.map(char => char.id);
        const details = await Promise.all(
          characterIds.map(async id => {
            try {
              const response = await axios.get(
                `/api/marvel/fulldatacharacter/${id}`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              return response.data;
            } catch (error) {
              console.error(`Failed to fetch character ${id}:`, error);
              return null;
            }
          })
        );
        const detailsMap: Record<number, HeroDetails> = {};
        details.forEach((detail, index) => {
          if (detail) {
            detailsMap[characterIds[index]] = detail;
          }
        });
        setCharacterDetails(detailsMap);
      } catch (error) {
        console.error('Failed to fetch character details:', error);
      } finally {
        setCharactersLoading(false);
      }
    };
    fetchCharacterDetails();
  }, [analyticsData]);

  useEffect(() => {
  if (activeTab === 1) {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/trades/trading-analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          date.setHours(0, 0, 0, 0);
          return date;
        }).reverse(); 
        const receivedData = [...(response.data.tradeActivity || [])].sort(
          (a, b) => new Date(a._id) - new Date(b._id)
        );
        const fullTradeActivity = last7Days.map(date => {
          const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
          const found = receivedData.find(d => d._id.startsWith(dateString));
          return {
            _id: dateString,
            trades: found ? found.trades : 0
          };
        });
        setAnalyticsData({
          ...response.data,
          tradeActivity: fullTradeActivity
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }
}, [activeTab]);

  const maxTradeCount = analyticsData?.tradeActivity?.length > 0 
    ? Math.max(...analyticsData.tradeActivity.map(item => item.trades), 1) 
    : 1;

  const maxHourlyCount = analyticsData?.peakHours?.length > 0 
    ? Math.max(...analyticsData.peakHours.map(h => h.count), 1) 
    : 1;

  const maxCharacterCount = analyticsData?.popularCharacters?.length > 0 
    ? Math.max(...analyticsData.popularCharacters.map(c => c.count), 1) 
    : 1;
  const ValueBar = ({ value, maxValue, color }: { value: number; maxValue: number; color: string }) => (
    <Box sx={{ position: 'relative', width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', mt: 0.5 }}>
      <Box sx={{ 
        position: 'absolute', 
        left: 0, 
        top: 0, 
        height: '100%', 
        width: `${(value / maxValue) * 100}%`, 
        borderRadius: 3, 
        background: color 
      }} />
    </Box>
  );

  const drawerContent = (
    <Stack sx={{ 
      height: '100%',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexShrink: 0, mb: 3}}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '0.5px', color: 'white' }}>
            Trading Nexus
          </Typography>
          <Typography variant="caption" sx={{ color: 'white', display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <FilterList sx={{ fontSize: 14, mr: 0.5, color: '#00C8FF' }} />
            Advanced filters & analytics
          </Typography>
        </Box>
        <Box>
        <IconButton onClick={resetFilters} title="Reset filters" sx={{ color: '#00C8FF' }}>
            <RestartAlt />
          </IconButton>
          {isMobile && (
            <IconButton onClick={toggleMobileDrawer} title="Close filters" sx={{ color: '#00C8FF', mr: 1 }}>
              <Close />
            </IconButton>
          )}
        </Box>
      </Stack>
      <Tabs 
        value={activeTab} 
        onChange={(e, v) => setActiveTab(v)}
        sx={{ 
          mb: 3,
          flexShrink: 0,
          '& .MuiTabs-indicator': {
            height: 3,
            backgroundColor: '#00C8FF'
          }
        }}
      >
        <Tab 
          label="Filters" 
          icon={<FilterList sx={{ color: '#00C8FF' }} />} 
          iconPosition="start"
          sx={{ 
            color: activeTab === 0 ? 'white' : '#aaa', 
            fontWeight: 600,
            minHeight: 48,
            '&.Mui-selected': {
              color: '#00C8FF'
            }
          }} 
        />
        <Tab 
          label="Analytics" 
          icon={<BarChart sx={{ color: '#00C8FF' }} />} 
          iconPosition="start"
          sx={{ 
            color: activeTab === 1 ? 'white' : '#aaa', 
            fontWeight: 600,
            minHeight: 48,
            '&.Mui-selected': {
              color: '#00C8FF'
            }
          }} 
        />
      </Tabs>
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        pb: 4,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#00C8FF',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(255,255,255,0.05)',
        }
      }}>
        {activeTab === 0 ? (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Person sx={{ fontSize: 18, mr: 1, color: '#00C8FF' }} />
                Search by User
              </Typography>
              <TextField
                value={filters.username}
                onChange={(e) => setFilters({...filters, username: e.target.value})}
                fullWidth
                size="small"
                placeholder="Enter username"
                sx={{
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      borderColor: '#00C8FF',
                    },
                    '&.Mui-focused': {
                      borderColor: '#00C8FF',
                      boxShadow: '0 0 0 2px rgba(0, 200, 255, 0.2)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'white' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Favorite sx={{ fontSize: 18, mr: 1, color: '#00C8FF' }} />
                Search Character
              </Typography>
              <TextField
                value={filters.characterName}
                onChange={(e) => setFilters({...filters, characterName: e.target.value})}
                fullWidth
                size="small"
                placeholder="Character name"
                sx={{
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      borderColor: '#00C8FF',
                    },
                    '&.Mui-focused': {
                      borderColor: '#00C8FF',
                      boxShadow: '0 0 0 2px rgba(0, 200, 255, 0.2)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'white' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ fontSize: 18, mr: 1, color: '#00C8FF' }} />
                Trade Value Range
              </Typography>
              <Slider
                value={valueRange}
                onChange={handleValueChange}
                onChangeCommitted={handleValueCommit}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                valueLabelFormat={(value) => `${value}`}
                sx={{
                  color: '#00C8FF',
                  '& .MuiSlider-thumb': {
                    width: 18,
                    height: 18,
                    backgroundColor: '#fff',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(0, 200, 255, 0.16)'
                    }
                  },
                  '& .MuiSlider-valueLabel': {
                    background: 'linear-gradient(45deg, #00C8FF, #007AFF)',
                    borderRadius: '10px',
                    fontWeight: 700,
                  }
                }}
              />
              <Box sx={{
                display:'flex',
                justifyContent:'space-between',
                justifyItems:'center'
              }}>
              <Grid container spacing={2}>
                <Grid>
                  <TextField
                    label="Min Value"
                    type="number"
                    value={valueRange[0]}
                    onChange={(e) => setValueRange([Number(e.target.value), valueRange[1]])}
                    size="small"
                    fullWidth
                    sx={{
                      color: 'white',              
                      '& .MuiInputLabel-root': {
                        color: 'white', 
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                      },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  />
                </Grid>
                <Grid>
                  <TextField
                    label="Max Value"
                    type="number"
                    
                    value={valueRange[1]}
                    onChange={(e) => setValueRange([valueRange[0], Number(e.target.value)])}
                    size="small"
                    fullWidth
                    sx={{
                      color: 'white',
                      '& .MuiInputLabel-root': {
                        color: 'white', 
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                      },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  />
                </Grid>
              </Grid>
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ fontSize: 18, mr: 1, color: '#00C8FF' }} />
                Time of Day
              </Typography>
              <Slider
                value={filters.timeOfDay}
                onChange={(e, newValue) => setFilters({...filters, timeOfDay: newValue as number[]})}
                valueLabelDisplay="auto"
                min={0}
                max={24}
                valueLabelFormat={(value) => `${value}:00`}
                sx={{
                  color: '#00C8FF',
                  '& .MuiSlider-thumb': {
                    width: 18,
                    height: 18,
                    backgroundColor: '#fff',
                    boxShadow: '0 0 8px rgba(0, 200, 255, 0.8)',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(0, 200, 255, 0.16)'
                    }
                  },
                  '& .MuiSlider-valueLabel': {
                    background: 'linear-gradient(45deg, #00C8FF, #007AFF)',
                    borderRadius: '10px',
                    fontWeight: 700
                  }
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <SwapHoriz sx={{ fontSize: 18, mr: 1, color: '#00C8FF' }} />
                Trade Type
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.tradeType}
                  onChange={(e) => setFilters({...filters, tradeType: e.target.value as string})}
                  sx={{
                    color: 'white',
                    borderRadius: '12px',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '& .MuiSelect-icon': {
                      color: 'white'
                    },
                    '&:hover': {
                      borderColor: '#00C8FF',
                    },
                    '&.Mui-focused': {
                      borderColor: '#00C8FF',
                      boxShadow: '0 0 0 2px rgba(0, 200, 255, 0.2)'
                    }
                  }}
                >
                  <MenuItem value="all">All Trades</MenuItem>
                  <MenuItem value="character">Character Trades</MenuItem>
                  <MenuItem value="collection">Collection Trades</MenuItem>
                  <MenuItem value="mixed">Mixed Trades</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <DateRange sx={{ fontSize: 18, mr: 1, color: '#00C8FF' }} />
                Date Range
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value as string})}
                  sx={{
                    color: 'white',
                    borderRadius: '12px',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '& .MuiSelect-icon': {
                      color: 'white'
                    },
                    '&:hover': {
                      borderColor: '#00C8FF',
                    },
                    '&.Mui-focused': {
                      borderColor: '#00C8FF',
                      boxShadow: '0 0 0 2px rgba(0, 200, 255, 0.2)'
                    }
                  }}
                >
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={3}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={60} sx={{ color: '#00C8FF' }} />
              </Box>
            ) : analyticsData ? (
              <>
                <PremiumCard>
                  <CardContent>
                    <Typography variant="h6" sx={{ 
                      color: 'white',
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <TrendingUp fontSize="small" 
                      sx={{
                        color:'#00C8FF'
                      }} />
                      Market Insights
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid>
                        <StatCard sx={{ width: 180, height:50}}>
                          <Stack direction="row" alignItems="center" spacing={2} >
                            <Box sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'rgba(255, 107, 107, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <LocalFireDepartment sx={{ color: '#ff6b6b' }} />
                            </Box>
                            <Stack>
                              <Typography variant="body2" color="#aaa">Active Trades</Typography>
                              <Typography variant="h5" fontWeight={700} color="white">
                                {analyticsData.stats.tradesCount}
                              </Typography>
                            </Stack>
                          </Stack>
                        </StatCard>
                      </Grid>
                      <Grid>
                      <StatCard sx={{ width: 200, height:50}}> 
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'rgba(155, 89, 182, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <CheckCircle sx={{ color: '#9b59b6' }} />
                            </Box>
                            <Stack>
                              <Typography variant="body2" color="#aaa">Completed Trades</Typography>
                              <Typography variant="h5" fontWeight={700} color="white">
                                {analyticsData.stats.completedTrades}
                              </Typography>
                            </Stack>
                          </Stack>
                        </StatCard>
                      </Grid>
                      <Grid>
                        <StatCard sx={{ width: 180, height:50}}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'rgba(52, 152, 219, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Group sx={{ color: '#3498db' }} />
                            </Box>
                            <Stack>
                              <Typography variant="body2" color="#aaa">Active Traders</Typography>
                              <Typography variant="h5" fontWeight={700} color="white">
                                {analyticsData.stats.activeUsers}
                              </Typography>
                            </Stack>
                          </Stack>
                        </StatCard>
                      </Grid>
                      <Grid>
                      </Grid>
                    </Grid>
                  </CardContent>
                </PremiumCard>
                <PremiumCard>
  <CardContent>
    <Typography variant="subtitle1" gutterBottom sx={{ 
      fontWeight: 700,
      color: 'white',
      mb: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      <BarChart fontSize="small"
                sx={{
                  color: '#00C8FF'
                }}
      />
      Trade Activity (Last 7 Days)
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 120, gap: 1, mt: 2 }}>
      {analyticsData?.tradeActivity?.length > 0 ? (
        analyticsData.tradeActivity.map((day, index) => (
          <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ mb: 0.5, color: 'white' }}>
              {day.trades}
            </Typography>
            <Box
              sx={{
                width: '80%',
                height: `${(day.trades / maxTradeCount) * 80}px`,
                background: 'linear-gradient(to top, #ff6b6b, #ffa502)',
                borderRadius: '4px 4px 0 0',
                position: 'relative',
                overflow: 'hidden',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '20%',
                  background: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            />
            <Typography variant="caption" sx={{ mt: 0.5, color: 'white' }}>
              {new Date(day._id).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </Typography>
          </Box>
        ))
      ) : (
        Array.from({ length: 7 }).map((_, index) => (
          <Skeleton 
            key={index} 
            variant="rectangular" 
            width="100%" 
            height={Math.random() * 80 + 20} 
            sx={{ borderRadius: '4px 4px 0 0' }} 
          />
        ))
      )}
    </Box>
  </CardContent>
</PremiumCard>
                <PremiumCard>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ 
                      fontWeight: 700,
                      color: 'white',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <AccessTime fontSize="small" 
                      sx={{
                        color:'#00C8FF'
                      }}
                      />
                      Peak Trading Hours
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 120, gap: 1, mt: 2 }}>
                      {analyticsData.peakHours.length > 0 ? (
                        analyticsData.peakHours.map((hour, index) => (
                          <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ mb: 0.5, color: '#aaa' }}>
                              {hour.count}
                            </Typography>
                            <Box
                              sx={{
                                width: '70%',
                                height: `${(hour.count / maxHourlyCount) * 80}px`,
                                background: 'linear-gradient(to top, #3498db, #2ecc71)',
                                borderRadius: '4px 4px 0 0',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:after': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '20%',
                                  background: 'rgba(255, 255, 255, 0.2)'
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ mt: 0.5, color: '#aaa' }}>
                              {hour.hour}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        Array.from({ length: 8 }).map((_, index) => (
                          <Skeleton 
                            key={index} 
                            variant="rectangular" 
                            width="100%" 
                            height={Math.random() * 80 + 20} 
                            sx={{ borderRadius: '4px 4px 0 0' }} 
                          />
                        ))
                      )}
                    </Box>
                  </CardContent>
                </PremiumCard>
                <PremiumCard>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ 
                      fontWeight: 700,
                      color: 'white',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Favorite fontSize="small" 
                                            sx={{
                                              color:'#00C8FF'
                                            }}
                      />
                      Most Traded Characters
                    </Typography>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      {charactersLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Skeleton variant="circular" width={40} height={40} />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton variant="text" width="60%" />
                              <Skeleton variant="rectangular" height={6} sx={{ borderRadius: 3, mt: 1 }} />
                            </Box>
                            <Skeleton variant="rectangular" width={40} height={24} />
                          </Box>
                        ))
                      ) : analyticsData.popularCharacters.length > 0 ? (
                        analyticsData.popularCharacters.map((character, index) => {
                          const details = characterDetails[character.id];
                          const charId = character.id ? character.id.toString() : '0';
                          const displayId = charId.slice(-2);
                          return (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                              {details ? (
                                <Avatar 
                                  src={`${details.thumbnail.path}.${details.thumbnail.extension}`}
                                  alt={details.name}
                                  sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    mr: 2,
                                    border: '2px solid #00C8FF'
                                  }}
                                />
                              ) : (
                                <Box sx={{ 
                                  width: 40, 
                                  height: 40, 
                                  borderRadius: '50%', 
                                  mr: 2,
                                  background: `linear-gradient(45deg, #00C8FF, #007AFF)`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: 14
                                }}>
                                  {displayId}
                                </Box>
                              )}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ color: 'white' }}>
                                  {details?.name || character.name || `Character ${charId}`}
                                </Typography>
                                <ValueBar 
                                  value={character.count} 
                                  maxValue={maxCharacterCount} 
                                  color="#00C8FF" 
                                />
                              </Box>
                              <Chip 
                                label={character.count} 
                                size="small" 
                                sx={{ 
                                  background: 'linear-gradient(45deg, #00C8FF, #007AFF)',
                                  color: 'white',
                                  fontWeight: 700
                                }} 
                              />
                            </Box>
                          );
                        })
                      ) : (
                        <Typography variant="body2" color="#aaa" sx={{ textAlign: 'center', py: 2 }}>
                          No character trading data available
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </PremiumCard>
                <PremiumCard>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <People sx={{ color: '#00C8FF' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white' }}>
                        Top Trading Partners
                      </Typography>
                    </Stack>
                    <Stack spacing={2}>
                      {analyticsData.topPartners.length > 0 ? (
                        analyticsData.topPartners.map((user, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={user.avatar} 
                                sx={{ 
                                  width: 36, 
                                  height: 36, 
                                  mr: 1.5,
                                  border: '2px solid #00C8FF'
                                }} 
                              />
                              <Box>
                                <Typography variant="body2" sx={{ color: 'white' }}>{user.name}</Typography>
                                <Typography variant="caption" sx={{ color: '#aaa' }}>
                                  Last trade: {new Date(user.lastTrade).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip 
                              label={`${user.trades} trades`} 
                              size="small" 
                              sx={{ 
                                background: 'linear-gradient(45deg, #3498db, #2ecc71)',
                                color: 'white',
                                fontWeight: 700
                              }}
                            />
                          </Box>
                        ))
                      ) : (
                        Array.from({ length: 5 }).map((_, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Skeleton variant="circular" width={36} height={36} />
                              <Skeleton variant="text" width={80} height={24} sx={{ ml: 1.5 }} />
                            </Box>
                            <Skeleton variant="rectangular" width={80} height={24} />
                          </Box>
                        ))
                      )}
                    </Stack>
                  </CardContent>
                </PremiumCard>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 4,
                textAlign: 'center'
              }}>
                <BarChart sx={{ fontSize: 60, color: '#00C8FF', mb: 2 }} />
                <Typography variant="h6" color="white">
                  Trading Analytics
                </Typography>
                <Typography variant="body2" color="#aaa" sx={{ mt: 1 }}>
                  {loading ? 'Loading market insights...' : 'No analytics data available yet'}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Stack>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          onClick={toggleMobileDrawer}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1200,
            backgroundColor: '#00C8FF',
            color: 'white',
            width: 56,
            height: 56,
            boxShadow: '0 4px 20px rgba(0, 200, 255, 0.3)',
            '&:hover': {
              backgroundColor: '#0099CC',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <FilterList fontSize="large" />
        </IconButton>
      )}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: 360,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 360,
              boxSizing: 'border-box',
              p: 3,
              bgcolor: '#121212',
              borderRight: `1px solid rgba(255, 255, 255, 0.08)`,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              height: 'auto',
              overflow: 'hidden',
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.01), rgba(255, 255, 255, 0.01))'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      )}
      {isMobile && (
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={toggleMobileDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              p: 3,
              bgcolor: '#121212',
              borderRight: `1px solid rgba(255, 255, 255, 0.08)`,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              height: 'auto',
              overflow: 'hidden',
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.01), rgba(255, 255, 255, 0.01))'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default TradingFilters;