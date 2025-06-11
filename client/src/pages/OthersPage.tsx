import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Avatar, 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Grid, 
  CircularProgress,
  Button,
  styled,
  Tooltip,
  Stack
} from '@mui/material';
import {  People, Circle } from '@mui/icons-material';
import Characters from '../assets/Characters';
import ShowCollection from '../assets/ShowCollection';
import axios from 'axios';
import CreateTradeMenu from '../assets/CreateTradeMenu';
import NavBar from '../assets/NavBar';
import Footer from '../assets/Footer';

const FriendCard = styled(Paper)(({ theme }) => ({
  backgroundColor: '#1a1a1a',
  padding: theme.spacing(2),
  borderRadius: 8,
  transition: 'all 0.3s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-3px)',
  }
}));

const OthersProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createTradeOpen, setCreateTradeOpen] = useState(false);
  const [setTradeCreated] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const [currentUserRes, viewedUserRes] = await Promise.all([
          axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`/api/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
  
        const currentUser = currentUserRes.data;
        const viewedUser = viewedUserRes.data;

        const [currentUserFriends, viewedUserFriends] = await Promise.all([
          axios.get(`/api/auth/user/${currentUser._id}/friends`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`/api/auth/user/${viewedUser._id}/friends`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
  
        const mutual = currentUserFriends.data.filter(currentFriend => 
          viewedUserFriends.data.some(viewedFriend => 
            viewedFriend._id === currentFriend._id
          )
        );
  
        setUserData(viewedUser);
        setMutualFriends(mutual);
  
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [userId]);

  const handleFriendClick = (friendId: string) => {
    navigate(`/user/${friendId}`);
    window.location.reload();
  };
  const handleTradeCreated = () => {
    setTradeCreated(prev => prev + 1);
    setCreateTradeOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress sx={{ color: '#00b3ff' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate(-1)}
          sx={{ bgcolor: '#00b3ff', '&:hover': { bgcolor: '#0099cc' } }}
        >
          Back to Previous Page
        </Button>
      </Box>
    );
  }

  return (
    <>
    <NavBar/>
    <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto' }}>
    <Paper sx={{ 
          bgcolor: '#262626', 
          borderRadius: 4, 
          p: 4, 
          mb: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 4,
            flexDirection: { xs: 'column', md: 'row' },
            textAlign: { xs: 'center', md: 'left' }
          }}>
            <Avatar 
              src={userData.avatar || ''} 
              alt={userData.name}
              sx={{ 
                width: 160, 
                height: 160, 
                flexShrink: 0
              }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h3" sx={{ color: 'white', mb: 1, fontWeight: 700 }}>
                {userData.name}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: { xs: 'center', md: 'flex-start' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <People sx={{ color: '#00b3ff', mr: 1 }} />
                  <Typography sx={{ color: '#00b3ff', fontWeight: 600, mr: 2 }}>
                    {mutualFriends.length} Mutual Friend{mutualFriends.length !== 1 ? 's' : ''}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {mutualFriends.slice(0, 5).map(friend => (
                      <Tooltip key={friend._id} title={friend.name}>
                        <Avatar 
                          src={friend.avatar || ''}
                          alt={friend.name}
                          sx={{ width: 32, height: 32, cursor: 'pointer' }}
                          onClick={() => handleFriendClick(friend._id)}
                        />
                      </Tooltip>
                    ))}
                    {mutualFriends.length > 5 && (
                      <Chip 
                        label={`+${mutualFriends.length - 5}`} 
                        sx={{ bgcolor: '#00b3ff20', color: '#00b3ff', height: 32, cursor: 'default' }} 
                      />
                    )}
                  </Stack>
                </Box>
                <Button 
                  variant="contained" 
                  onClick={() => setCreateTradeOpen(true)}
                  sx={{ 
                    backgroundColor: '#00C8FF', 
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#00a7d6',
                    },
                    height: 40,
                    width: 'fit-content'
                  }}
                >
                  Create New Trade
                </Button>
              </Box>
            </Box>

          </Box>
          {userData?._id && (
            <CreateTradeMenu 
              open={createTradeOpen} 
              onClose={() => setCreateTradeOpen(false)} 
              onTradeCreated={handleTradeCreated}
              mode="Friend"
              friendId={userData._id}
            />
          )}
          {mutualFriends.length > 0 ? (
            <>
              <Typography variant="h4" sx={{ color: '#00b3ff', mt: 6, mb: 4, fontWeight: 600 }}>
                Mutual Friends
              </Typography>
              <Grid container spacing={3}>
                {mutualFriends.map(friend => (
                  <Grid key={friend._id}
                  sx={{
                    mb:2
                  }}
                  >
                    <FriendCard onClick={() => handleFriendClick(friend._id)}
                     sx={{
                     mb:-3
                   }}
                      >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 ,height: 40}}>
                        <Avatar 
                          src={friend.avatar || ''}
                          sx={{ 
                            width: 60, 
                            height: 60,
                          }}
                        />
                        <Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: 'white',
                              fontWeight: 600,
                              mb: 0.5
                            }}
                          >
                            {friend.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#999',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <Circle sx={{ 
                              color:  '#ff5722',
                              fontSize: '12px'
                            }} />
                            OFFLINE
                          </Typography>
                        </Box>
                      </Box>
                    </FriendCard>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <Typography sx={{ mt: 6, color: '#888', textAlign: 'center' }}>
              No mutual friends found.
            </Typography>
          )}
        </Paper>
      {userData.inventory?.length > 0 && (
        <Paper sx={{ 
          bgcolor: '#262626',
          borderRadius: 4,
          p: 4,
          mt: 4,
        }}>
          <Typography variant="h4" sx={{ 
            color: '#00b3ff', 
            mb: 4,
            fontFamily: 'Bebas Neue', 
            letterSpacing: '2px'
          }}>
            HERO COLLECTIONS
          </Typography>
          <ShowCollection collections={userData.inventory} />
        </Paper>
      )}
      <Paper sx={{ 
        bgcolor: '#262626',
        borderRadius: 4,
        p: 4,
        mt: 4,
      }}>
        <Typography variant="h4" sx={{ 
          color: '#00b3ff', 
          mb: 4,
          fontFamily: 'Bebas Neue', 
          letterSpacing: '2px'
        }}>
          CHARACTER COLLECTION
        </Typography>
        
        {userData.purchasedCharacters?.length > 0 ? (
          <Characters 
            purchasedCharacters={userData.purchasedCharacters}
          />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ color: '#666' }}>
              No characters purchased yet.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
    <Footer />
    </>
  );
};

export default OthersProfile;
