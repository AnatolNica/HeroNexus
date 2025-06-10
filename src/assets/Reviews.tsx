import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Rating,
  Stack,
  Typography,
  TextField,
  Alert,
  IconButton,
  Collapse,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Send,
  Reply,
  ExpandMore,
  ExpandLess,
  Delete,
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';

interface ReplyType {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  text: string;
  createdAt: string;
}
interface ReviewType {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  stars: number;
  text: string;
  date: string;
  likes: string[];
  dislikes: string[];
  replies: ReplyType[];
}

const ReplyComponent = ({
  reply,
  onDeleteReply,
  currentUserId,
}: {
  reply: ReplyType;
  onDeleteReply: (reviewId: string, replyId: string) => void;
  currentUserId?: string;
}) => {
  const isAuthor = currentUserId === reply.user._id;
  const handleDelete = () => {
    if (isAuthor) {
      onDeleteReply(reply._id, reply._id);
    }
  };
  return (
    <Box sx={{ ml: 4, mt: 2, borderLeft: '2px solid #333', pl: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Avatar sx={{ width: 32, height: 32 }} src={reply.user.avatar}>
          {reply.user.name.charAt(0)}
        </Avatar>
        <Typography variant="body2" fontWeight={600}>
          {reply.user.name}
        </Typography>
        <Typography variant="caption" color="white">
          {new Date(reply.createdAt).toLocaleDateString()}
        </Typography>
        {isAuthor && (
          <IconButton size="small" onClick={handleDelete} color="error">
            <Delete fontSize="small" />
          </IconButton>
        )}
      </Stack>
      <Typography variant="body2" color="white" mt={1}>
        {reply.text}
      </Typography>
    </Box>
  );
};

const Review = ({
  review,
  onLike,
  onDislike,
  onReply,
  onDeleteReview,
  onDeleteReply,
  currentUserId,
}: {
  review: ReviewType;
  onLike: (reviewId: string) => void;
  onDislike: (reviewId: string) => void;
  onReply: (reviewId: string, text: string) => Promise<void>;
  onDeleteReview: (reviewId: string) => void;
  onDeleteReply: (reviewId: string, replyId: string) => void;
  currentUserId?: string;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const isAuthor = currentUserId === review.user._id;
  const handleReply = async () => {
    if (!currentUserId || !replyText.trim()) return;
    await onReply(review._id, replyText);
    setReplyText('');
  };
  const handleDeleteReview = () => {
    if (isAuthor) {
      onDeleteReview(review._id);
    }
  };
  const handleDeleteReply = (replyId: string) => {
    onDeleteReply(review._id, replyId);
  };
  const hasLiked = currentUserId && review.likes.includes(currentUserId);
  const hasDisliked = currentUserId && review.dislikes.includes(currentUserId);
  return (
    <Box mb={4} key={review._id}>
      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
        <Avatar 
          src={review.user.avatar || ''} 
          sx={{ width: 56, height: 56 }}
        >
          {review.user.name.charAt(0)}
        </Avatar>
        <Box flex={1}>
          <Typography fontWeight={700}>{review.user.name}</Typography>
          <Rating value={review.stars} readOnly size="small" 
          sx={{
            '& .MuiRating-iconEmpty': {
              color: 'gray',   
            },
            '& .MuiRating-iconFilled': {
              color: '#fbc02d', 
            },
          }}
          />
        </Box>
        <Typography variant="caption" color="white">
          {review.date}
        </Typography>
        {isAuthor && (
          <IconButton size="small" onClick={handleDeleteReview} color="error">
            <Delete fontSize="small" />
          </IconButton>
        )}
      </Stack>
      <Typography variant="body2" color="white" mb={2}>
        {review.text}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
      <IconButton
  size="small"
  onClick={() => onLike(review._id)}
  disabled={!currentUserId}
  sx={{
    color: hasLiked ? 'white' : '#888', 
    '&:hover': {
      color: hasLiked ? '#ccc' : '#aaa', 
    },
  }}
>
          <ThumbUp fontSize="small" />
          <Typography variant="caption" sx={{ ml: 0.5 }}>{review.likes.length}</Typography>
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onDislike(review._id)}
          disabled={!currentUserId}
          sx={{
            color: hasDisliked ? 'white' : '#888',
            '&:hover': {
              color: hasDisliked ? '#ccc' : '#aaa', 
            },
          }}
        >
          <ThumbDown fontSize="small" />
          <Typography variant="caption" sx={{ ml: 0.5 }}>{review.dislikes.length}</Typography>
        </IconButton>
        <IconButton size="small" onClick={() => setShowReplies(!showReplies)}>
          <Reply fontSize="small" 
          sx={{
            color:'#888',
            '&:hover': {
              color:'#ccc', 
            },
          }}
          />
          <Typography variant="caption" sx={{ ml: 0.5, color:'#888' }}>{review.replies.length}</Typography>
          {showReplies ? <ExpandLess sx={{ color:'#ccc' }}/> : <ExpandMore sx={{color:'#888' }}/>}
        </IconButton>
      </Stack>
      <Collapse in={showReplies}>
        <Box mt={2}>
          {review.replies.map((reply) => (
            <ReplyComponent
              key={reply._id}
              reply={reply}
              currentUserId={currentUserId}
              onDeleteReply={handleDeleteReply}
            />
          ))}
          {currentUserId && (
            <Stack direction="row" spacing={1} mt={2}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Write a response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                sx={{
                  bgcolor: '#1a1a1a',
                  borderRadius: 1,
                  '& .MuiInputBase-input': {
                    color: 'white', 
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ccc', 
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ccc', 
                  },
                  '& .MuiInputBase-root': {
                    bordercolor: '#ccc',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'white', 
                    opacity: 1,
                  },
                }}
              />
              <Button variant="contained" size="small" onClick={handleReply} disabled={!replyText.trim()}
              sx={{
                bgcolor: '#00C8FF',
                '&:hover': { bgcolor: '#00CFFF' },
                fontWeight: 600,
                color: 'white',
                '&.Mui-disabled': {
                  color: 'white',       
                  bgcolor: '#555',      
                  opacity: 0.5,         
                },
              }}
              >
                Send
              </Button>
            </Stack>
          )}
        </Box>
      </Collapse>
      <Divider sx={{ my: 3, bgcolor: '#333' }} />
    </Box>
  );
};

const Reviews = ({ figureId }: { figureId: string }) => {
  const { user } = useUser();
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [newReview, setNewReview] = useState({ text: '', stars: 5 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/${figureId}`);
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      setError('Error loading reviews');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [figureId]);

  const totalReviews = reviews.length;

  const starDistribution = Array.from({ length: 5 }, (_, i) => i + 1).map(stars => ({
    stars,
    count: reviews.filter(review => review.stars === stars).length,
  }));

  const handleLike = async (reviewId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchReviews();
    } catch (err) {
      setError('Like Error');
    }
  };
  const handleDislike = async (reviewId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/reviews/${reviewId}/dislike`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchReviews();
    } catch (err) {
      setError('Dislike Error');
    }
  };

  const handleReply = async (reviewId: string, text: string) => {
    if (!user) {
      setError('You need to log in to reply.');
      return;
    }
    try {
      await fetch(`/api/reviews/${reviewId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text }),
      });
      fetchReviews();
    } catch (err) {
      setError('Error sending response');
    }
  };

  const handleDeleteReply = async (reviewId: string, replyId: string) => {
    if (!user) {
      setError('Login required for deletion.');
      return;
    }
    try {
      const response = await fetch(
        `/api/reviews/${reviewId}/replies/${replyId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Could not delete the response');
      fetchReviews();
    } catch (err: any) {
      setError('Error deleting response');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) {
      setError('Login required for deletion');
      return;
    }
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Could not delete the review');
      setReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch (err: any) {
      setError(err.message || 'Error deleting review');
    }
  };

  const submitReview = async () => {
    if (!user) {
      setError('You need to log in to submit a review');
      return;
    }
    if (!newReview.text.trim()) {
      setError('The review cannot be empty');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          figureId,
          stars: newReview.stars,
          text: newReview.text,
        }),
      });
      if (!response.ok) throw new Error('Send Error');
      setNewReview({ text: '', stars: 5 });
      fetchReviews();
    } catch (err: any) {
      setError(err.message || 'Could not submit the review');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalReviews / itemsPerPage);
  const currentReviews = reviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  return (
    <Box sx={{ bgcolor: '#111', color: 'white', p: 4, borderRadius: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {user ? (
        <Box mb={4}>
          <Stack spacing={2}>
            <Rating
              value={newReview.stars}
              onChange={(e, value) =>
                setNewReview({ ...newReview, stars: value || 5 })
              }
              sx={{
                '& .MuiRating-iconEmpty': {
                  color: 'gray',  
                },
                '& .MuiRating-iconFilled': {
                  color: '#fbc02d', 
                },
              }}
            />
<TextField
  multiline
  rows={3}
  variant="outlined"
  placeholder="Write a review..."
  value={newReview.text}
  onChange={(e) =>
    setNewReview({ ...newReview, text: e.target.value })
  }
  sx={{
    bgcolor: '#1a1a1a',
    borderRadius: 1,
    '& .MuiInputBase-input': {
      color: 'white', 
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ccc', 
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ccc', 
    },
    '& .MuiInputBase-root': {
      bordercolor: '#ccc',
    },
    '& .MuiInputBase-input::placeholder': {
      color: 'white', 
      opacity: 1,
    },
  }}
/>

<Button
  variant="contained"
  color="primary"
  onClick={submitReview}
  disabled={loading || !newReview.text.trim()}
  endIcon={<Send />}
  sx={{
    bgcolor: '#00C8FF',
    '&:hover': { bgcolor: '#00CFFF' },
    fontWeight: 600,
    color: 'white',
    '&.Mui-disabled': {
      color: 'white',       
      bgcolor: '#555',       
      opacity: 0.5,          
    },
  }}
>
  {loading ? 'Sending...' : 'Submit review'}
</Button>

          </Stack>
          <Divider sx={{ my: 3, bgcolor: '#333' }} />
        </Box>
      ) : (
        <Typography color="error" mb={4}>
          You need to log in to write or appreciate reviews.
        </Typography>
      )}

      {reviews.length === 0 ? (
        <Typography>There are no reviews for this character yet.</Typography>
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <TableContainer
              component={Paper}
              sx={{
                bgcolor: '#111',
                border: 'none',
                boxShadow: 'none',
                width: 'calc(100% + 20px)',
                ml: -2,
              }}
            >
              <Table size="small" sx={{ borderCollapse: 'separate' }}>
                <TableHead>
                  <TableRow sx={{ borderBottom: 'none' }}>
                    <TableCell sx={{ color: 'white', borderBottom: 'none' }}>Rating</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: 'none' }}>Percentage</TableCell>
                    <TableCell align="right" sx={{ color: 'white', borderBottom: 'none' }}>Reviews</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {starDistribution.map(({ stars, count }) => {
                    const total = starDistribution.reduce((acc, cur) => acc + cur.count, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <TableRow key={stars} sx={{ borderBottom: 'none' }}>
                        <TableCell sx={{ borderBottom: 'none' }}>
                          <Rating value={stars} readOnly size="small"
                          sx={{
                            '& .MuiRating-iconEmpty': {
                              color: 'gray',   
                            },
                            '& .MuiRating-iconFilled': {
                              color: '#fbc02d', 
                            },
                          }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: '100%', borderBottom: 'none' }}>
                          <Box sx={{ position: 'relative', width: '100%', height: 10, borderRadius: 5, bgcolor: '#333' }}>
                            <Box
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${percentage}%`,
                                backgroundColor: '#fbc02d',
                                borderRadius: 5,
                                transition: 'width 0.3s ease-in-out',
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'white', borderBottom: 'none' }}>{count}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {currentReviews.map((review) => (
            <Review
              key={review._id}
              review={review}
              currentUserId={user?.id}
              onLike={handleLike}
              onDislike={handleDislike}
              onReply={handleReply}
              onDeleteReview={handleDeleteReview}
              onDeleteReply={handleDeleteReply}
            />
          ))}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
  <Pagination
    count={totalPages}
    page={currentPage}
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
        bgcolor: '#00CFFF',
        color: 'white',
      },
      '& .Mui-selected:hover': {
        bgcolor: '#00CFFF', 
        color: 'white',
      },
    }}
  />
</Box>

          )}
        </>
      )}
    </Box>
  );
};

export default Reviews;