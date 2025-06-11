import { 
  Avatar, 
  Box, 
  Button,   
  Grid, 
  InputAdornment, 
  Paper, 
  TextField, 
  Typography,
} from '@mui/material';
import { 
  Search, 
  PersonAdd, 
  CheckCircle,
  Cancel,
  People
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Friends = () => {
  const [addFriendSearch, setAddFriendSearch] = useState('');
  const [friendsSearchTerm, setFriendsSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [requests, setRequests] = useState({
    received: [],
    sent: []
  });
  const [friendsList, setFriendsList] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests({
          received: response.data.friendRequestsReceived || [],
          sent: response.data.friendRequestsSent || []
        });
        setFriendsList(response.data.friends || []);
      } catch (err) {
        setError('Failed to load friends data.');
      }
    };
    fetchInitialData();
  }, []);

  const handleAddFriendSearch = async (e) => {
    e.preventDefault();
    if (!addFriendSearch) {
      setSearchResults([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/auth/search?q=${addFriendSearch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('User not found');
      setSearchResults([]);
    }
  };

  const sendFriendRequest = async (user) => {
    try {
      const token = localStorage.getItem('token');
      setRequests(prev => ({
        ...prev,
        sent: [...prev.sent, user]
      }));
      await axios.post(
        '/api/friends/request',
        { userId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(prev => prev.filter(u => u._id !== user._id));
    } catch (error) {
      console.error('Failed to send friend request:', error);
      setRequests(prev => ({
        ...prev,
        sent: prev.sent.filter(u => u._id !== user._id)
      }));
      alert(error.response?.data?.error || 'Failed to send request');
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      setRequests(prev => ({
        ...prev,
        sent: prev.sent.filter(u => u._id !== userId)
      }));
      await axios.delete(`/api/friends/request/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to cancel request:', error);
      alert(error.response?.data?.error || 'Failed to cancel request');
    }
  };

  const handleRequestResponse = async (userId, accept) => {
    try {
      setRequests(prev => ({
        ...prev,
        received: prev.received.filter(u => u._id !== userId)
      }));
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/friends/${accept ? 'accept' : 'decline'}`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (accept) {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFriendsList(res.data.friends || []);
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
      alert(error.response?.data?.error || 'Failed to process request');
    }
  };

  const filteredFriends = friendsList.filter(friend =>
    friend.name.toLowerCase().includes(friendsSearchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 4 }}>
      {error && (
        <Typography color="error" align="center" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Paper sx={{
        bgcolor: '#1f1f1f',
        borderRadius: 4,
        p: 4,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        maxWidth:600,
        mb: 4
      }}>
        <SectionHeader variant="h6">
          <PersonAdd sx={{ fontSize: 24 }} />
          Add Friend
        </SectionHeader>
        <Box component="form" onSubmit={handleAddFriendSearch} sx={{ mb: 4 }}>
          <Box sx={{ display: {sm:'flex',xs:'relative',}, gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by name "
              value={addFriendSearch}
              onChange={(e) => setAddFriendSearch(e.target.value)}
              sx={{
                mb:{xs:3,sm:0},
                bgcolor: '#1a1a1a',
                borderRadius: 4,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#333' }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#666' }} />
                  </InputAdornment>
                )
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: '#00b3ff',
                px: 4,
                borderRadius: 4,
                '&:hover': { bgcolor: '#0099cc' }
              }}
            >
              Search
            </Button>
          </Box>
        </Box>

        {searchResults.length > 0 && addFriendSearch && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ color: '#888', mb: 2 }}>
              Search Results ({searchResults.length})
            </Typography>
            <Grid container spacing={3} direction="column">
              {searchResults.map((user) => (
                <Grid key={user._id}>
                  <FriendCard>
                    <Box sx={{ 
                      display: {sm:'flex',xs:'relative'},
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Box 
                        component={Link}
                        to={`/user/${user._id}`}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          mb:{xs:3,sm:0},
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': { opacity: 0.8 }
                        }}
                      >
                        <Avatar src={friend.avatar ? `http://localhost:5000${friend.avatar}` : ''} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            sx={{ 
                              color: 'white',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {user.name}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => sendFriendRequest(user)}
                          disabled={requests.sent.some(u => u._id === user._id)}
                          sx={{
                            marginRight:1,
                            bgcolor: '#00b3ff',
                            '&:hover': { bgcolor: '#0099cc' },
                            '&:disabled': { bgcolor: '#666' }
                          }}
                        >
                          {requests.sent.some(u => u._id === user._id)
                            ? 'Request Sent'
                            : 'Add Friend'}
                        </Button>
                      </Box>
                    </Box>
                  </FriendCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
      {(requests.received.length > 0 || requests.sent.length > 0) && (
        <Paper sx={{
          bgcolor: '#1f1f1f',
          borderRadius: 4,
          p: 4,
          maxWidth:600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          mb: 4
        }}>
          <SectionHeader variant="h6">
            <People sx={{ fontSize: 24 }} />
            Friend Requests
          </SectionHeader>

          {requests.received.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ color: '#888', mt: 2, mb: 2 }}>
                Received ({requests.received.length})
              </Typography>
              <Grid container spacing={3} direction="column">
                {requests.received.map((user) => (
                  <Grid key={user._id}>
                    <FriendCard>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Box 
                          component={Link}
                          to={`/user/${user._id}`}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': { opacity: 0.8 }
                          }}
                        >
                          <Avatar src={user.avatar ? `http://localhost:5000${user.avatar}` : ''} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              sx={{ 
                                color: 'white',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {user.name}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#999',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            onClick={() => handleRequestResponse(user._id, true)}
                            startIcon={<CheckCircle />}
                            sx={{
                              color: '#00b3ff',
                              borderColor: '#00b3ff',
                              '&:hover': { bgcolor: '#00b3ff10' }
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleRequestResponse(user._id, false)}
                            startIcon={<Cancel />}
                            sx={{
                              color: '#ff4444',
                              borderColor: '#ff4444',
                              '&:hover': { bgcolor: '#ff444410' }
                            }}
                          >
                            Decline
                          </Button>
                        </Box>
                      </Box>
                    </FriendCard>
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {requests.sent.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ color: '#888', mt: 2, mb: 2 }}>
                Sent ({requests.sent.length})
              </Typography>
              <Grid container spacing={3} direction="column">
                {requests.sent.map((user) => (
                  <Grid key={user._id}>
                  <FriendCard>
                    <Box sx={{ 
                      display: {sm:'flex',xs:'relative'},
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box 
                        component={Link}
                        to={`/user/${user._id}`}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb:{xs:3,sm:0},
                          gap: 2,
                          textDecoration: 'none',
                          color: 'inherit',
                          flex: 1,
                          '&:hover': { opacity: 0.8 }
                        }}
                      >
                        <Avatar src={user.avatar ? `http://localhost:5000${user.avatar}` : ''} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            sx={{ 
                              color: 'white',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {user.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#999',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                
                      <Box sx={{ mr: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleCancelRequest(user._id)}
                          sx={{
                            color: '#ff4444',
                            borderColor: '#ff4444',
                            '&:hover': { bgcolor: '#ff444410' }
                          }}
                        >
                          Cancel Request
                        </Button>
                      </Box>
                    </Box>
                  </FriendCard>
                </Grid>
                ))}
              </Grid>
            </>
          )}
        </Paper>
      )}
      <Paper sx={{
        bgcolor: '#1f1f1f',
        borderRadius: 4,
        maxWidth:600,
        p: 4,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
      }}>
        <SectionHeader variant="h6">
          <People sx={{ fontSize: 24 }} />
          Friends List ({filteredFriends.length})
        </SectionHeader>
        <Box component="form" onSubmit={(e) => e.preventDefault()} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search friends..."
              variant="outlined"
              value={friendsSearchTerm}
              onChange={(e) => setFriendsSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
                sx: {
                  color: 'white',
                  borderRadius: 4,
                  bgcolor: '#1a1a1a',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#333'
                  }
                }
              }}
            />
          </Box>
        </Box>

        {filteredFriends.length === 0 ? (
          <Typography align="center" sx={{ color: '#888' }}>
            {friendsSearchTerm ? 'No friends found' : 'Start by searching friends'}
          </Typography>
        ) : (
          <Grid container spacing={3} direction="column">
            {filteredFriends.map((friend) => (
              <Grid key={friend._id}>
                <FriendCard>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <Box 
                      component={Link}
                      to={`/user/${friend._id}`}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': { opacity: 0.8 }
                      }}
                    >
                      <Avatar src={friend.avatar ? `http://localhost:5000${friend.avatar}` : ''} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          sx={{ 
                            color: 'white',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {friend.name}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </FriendCard>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

const SectionHeader = styled(Typography)(({ theme }) => ({
  color: '#00b3ff',
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const FriendCard = styled(Paper)(({ theme }) => ({
  backgroundColor: '#1a1a1a',
  padding: theme.spacing(2),
  borderRadius: 8,
  paddingRight:1,
  width: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
  }
}));

export default Friends;