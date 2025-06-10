import { useState } from 'react';
import { 
  Box, 
  Avatar, 
  IconButton, 
} from '@mui/material';
import { CameraAlt } from '@mui/icons-material';
import axios from 'axios';

const ProfileAvatarUpload = ({ currentAvatar}) => {
  const [preview] = useState(currentAvatar || '');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
  
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
  
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
  
        axios.put('/api/auth/update-avatar', { avatar: compressedBase64 }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }).then(() => {
          setUserData((prev) => ({
            ...prev,
            avatar: compressedBase64
          }));
        }).catch(err => {
          alert('Could not save avatar.');
        });
      };
    };
  
    reader.readAsDataURL(file);
  };

  return (
    <Box textAlign="center" sx={{ mb: 3 }}>
      <Box position="relative" display="inline-block">
        <Avatar
          src={preview}
          alt="Profile"
          sx={{
            width: 100,
            height: 100,
            border: '3px solid #00b3ff',
            mb: 1
          }}
        />
        <input
          accept="image/*"
          id="upload-avatar"
          type="file"
          hidden
          onChange={handleImageChange}
        />
        <label htmlFor="upload-avatar">
          <IconButton
            component="span"
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              bgcolor: '#00b3ff',
              color: 'white',
              '&:hover': { bgcolor: '#0099cc' }
            }}
          >
            <CameraAlt fontSize="small" />
          </IconButton>
        </label>
      </Box>
    </Box>
  );
};

export default ProfileAvatarUpload;