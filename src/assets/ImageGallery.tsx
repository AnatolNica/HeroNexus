import { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Modal,
  Typography,
  styled,
  Avatar,
} from '@mui/material';
import {

  ViewInAr,
  PlayCircleFilled,
  Close,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { useSwipeable } from 'react-swipeable';

interface ImageGalleryProps {
  images: string[]; 
  currentImageIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onFavorite: () => void;
  setCurrentImageIndex: (index: number) => void;
}

const ThumbnailContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
  overflowX: 'auto',
  paddingBottom: theme.spacing(1),
  justifyContent: 'center',
  '&::-webkit-scrollbar': {
    height: '4px'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#00C8FF',
    borderRadius: '2px'
  }
}));

const Thumbnail = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active: boolean }>(({ active }) => ({
  width: 100,
  height: 60,
  borderRadius: 4,
  overflow: 'hidden',
  cursor: 'pointer',
  border: active ? `2px solid rgb(46, 46, 46)` : `2px solid transparent`,
  opacity: active ? 1 : 0.7,
  transition: 'all 0.2s ease',
  position: 'relative',
  flexShrink: 0,
  '&:hover': {
    opacity: 1
  }
}));

export const ImageGallery = ({
  images: rawImages,
  currentImageIndex,
  onNext,
  onPrev,
  setCurrentImageIndex
}: ImageGalleryProps) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFullGrid, setShowFullGrid] = useState(false);
  const [modalIndex, setModalIndex] = useState(currentImageIndex);
  const handlers = useSwipeable({
    onSwipedLeft: onNext,
    onSwipedRight: onPrev,
    trackMouse: true
  });
  const modalHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('left'),
    onSwipedRight: () => handleSwipe('right'),
    trackMouse: true
  });

  useEffect(() => {
    const fetchImages = async () => {
      if (!rawImages || rawImages.length === 0) {
        setImages([]);
        setLoading(false);
        return;
      }

      const ids = rawImages
        .filter(url => /\/comics\/(\d+)/.test(url))
        .map(url => url.match(/\/comics\/(\d+)/)?.[1])
        .filter(id => id);

      const staticImages = rawImages.filter(url => !/\/comics\/(\d+)/.test(url));

      try {
        let imageList: string[] = [];

        if (ids.length > 0) {
          const response = await fetch('/api/marvel/comic-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: ids.map(Number) })
          });
          const data = await response.json();
          imageList = Object.values(data).map(img => img as string);
        }
        const uniqueImages = [...new Set([...staticImages, ...imageList])];

        setImages(uniqueImages);
      } catch (error) {
        console.error('Error fetching images:', error);
        const uniqueStaticImages = [...new Set(staticImages)];
        setImages(uniqueStaticImages);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [rawImages]);

  useEffect(() => {
    setModalIndex(currentImageIndex);
  }, [currentImageIndex]);

  const isSketchfabModel = (url: string) => url.includes('sketchfab.com');
  const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);
  const getEmbedUrl = (url: string) => {
    const cleanUrl = url.replace(/(\/embed)?(\?.*)?$/, '');
    return `${cleanUrl}/embed?autostart=0&ui_theme=dark&preload=1&camera=0`;
  };

  const handleSwipe = (dir: 'left' | 'right') => {
    if (dir === 'left' && modalIndex < images.length - 1)
      setModalIndex((prev) => prev + 1);
    if (dir === 'right' && modalIndex > 0)
      setModalIndex((prev) => prev - 1);
  };

  const displayedThumbnails = images.slice(0, 4);
  const remainingCount = Math.max(images.length - 4, 0);

  const handleThumbnailClick = (index: number) => {
    if (index === 3 && remainingCount > 0) {
      setShowFullGrid(true);
    } else {
      setCurrentImageIndex(index);
    }
  };

  const FALLBACK_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', color: 'white', p: 4 }}>
        Loading images...
      </Box>
    );
  }

  return (
    <Box sx={{ mx: 'auto', width: '100%', position: 'relative', bgcolor: '#121212', p: 2 }}>  
      <Box
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#1a1a1a',
          boxShadow: 3,
          height: 700,
          width:{xl:900,lg:500,sm:"100%"},
          textAlign: 'center'
        }}
        {...handlers}
      >
        <Box
          sx={{
            aspectRatio: '1.5',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {images.length === 0 ? (
            <Avatar
              src={FALLBACK_IMAGE}
              alt="Fallback"
              sx={{
                width: '80%',
                height: 'auto',
                maxWidth: 600,
                maxHeight: 400,
                bgcolor: '#1a1a1a',
                color: 'white'
              }}
            />
          ) : isSketchfabModel(images[currentImageIndex]) ? (
            <Box
              component="iframe"
              title="3D Model"
              src={getEmbedUrl(images[currentImageIndex])}
              sx={{
                width: '100%',
                height: 440,
                border: 'none',
                bgcolor: '#000',
                borderRadius: 1,
                mb: -1
              }}
              allow="autoplay; fullscreen; xr-spatial-tracking"
              allowFullScreen
            />
          ) : isVideo(images[currentImageIndex]) ? (
            <Box
              component="video"
              controls
              sx={{
                width: '100%',
                height: 400,
                objectFit: 'contain',
                bgcolor: '#000',
                borderRadius: 1
              }}
            >
              <source
                src={images[currentImageIndex]}
                type={`video/${images[currentImageIndex].split('.').pop()}`}
              />
            </Box>
          ) : (
            <Box
              component="img"
              src={images[currentImageIndex] || FALLBACK_IMAGE}
              sx={{
                width: '%100',
                height: '%100',
                ml:-2,
                objectFit: 'contain',
              }}
            />
          )}
        </Box>
      </Box>

      <ThumbnailContainer>
        {displayedThumbnails.map((img, index) => {
          const shouldHide = !img;
          return (
            <Thumbnail
              key={index}
              active={currentImageIndex === index}
              onClick={() => handleThumbnailClick(index)}
              sx={{ display: shouldHide ? 'none' : 'block' }}
            >
              {isSketchfabModel(img) ? (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ViewInAr sx={{ color: '#00C8FF', fontSize: 40 }} />
                </Box>
              ) : isVideo(img) ? (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    bgcolor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PlayCircleFilled sx={{ color: '#00C8FF', fontSize: 40 }} />
                  <Box
                    component="img"
                    src={img.replace(/\.(mp4|webm|ogg)$/i, '.jpg')}
                    alt={`Video thumbnail ${index + 1}`}
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: -1
                    }}
                  />
                </Box>
              ) : (
                <>
                  {index === 3 && remainingCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      +{remainingCount}
                    </Box>
                  )}
                  <Box
                    component="img"
                    src={img}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </>
              )}
            </Thumbnail>
          );
        })}
      </ThumbnailContainer>

      <Modal
        open={showFullGrid}
        onClose={() => {
          setShowFullGrid(false);
          setCurrentImageIndex(modalIndex);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)'
        }}
      >
        <Box sx={{ width: '100%', height: '100%', bgcolor: '#000', position: 'relative' }}>
          <IconButton
            sx={{
              position: 'fixed',
              top: 24,
              right: 24,
              color: '#00C8FF',
              zIndex: 1,
              '&:hover': { bgcolor: 'rgba(218,31,40,0.1)' }
            }}
            onClick={() => setShowFullGrid(false)}
          >
            <Close fontSize="large" />
          </IconButton>
          <Box
            sx={{
              height: 'calc(100% - 120px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            {...modalHandlers}
          >
            <IconButton
              onClick={() => handleSwipe('right')}
              sx={{
                position: 'absolute',
                left: 24,
                color: '#00C8FF',
                zIndex: 1,
                visibility: modalIndex > 0 ? 'visible' : 'hidden'
              }}
            >
              <ChevronLeft sx={{ fontSize: 40, border: '1px solid #00C8FF', borderRadius: '50%' }} />
            </IconButton>
            <Box
              sx={{
                width: '100%',
                maxWidth: 1100,
                height: '80%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isSketchfabModel(images[modalIndex]) ? (
                <Box
                  component="iframe"
                  title="3D Model Viewer"
                  src={getEmbedUrl(images[modalIndex])}
                  sx={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    bgcolor: 'transparent'
                  }}
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  allowFullScreen
                />
              ) : isVideo(images[modalIndex]) ? (
                <Box
                  component="video"
                  controls
                  autoPlay
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    bgcolor: '#000'
                  }}
                >
                  <source src={images[modalIndex]} />
                </Box>
              ) : (
                <Box
                  component="img"
                  src={images[modalIndex] || FALLBACK_IMAGE}
                  alt="Fullscreen view"
                  sx={{
                    maxWidth: '1100px',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              )}
            </Box>
            <IconButton
              onClick={() => handleSwipe('left')}
              sx={{
                position: 'absolute',
                right: 24,
                color: '#00C8FF',
                zIndex: 1,
                visibility: modalIndex < images.length - 1 ? 'visible' : 'hidden'
              }}
            >
              <ChevronRight sx={{ fontSize: 40, border: '1px solid #00C8FF', borderRadius: '50%' }} />
            </IconButton>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.8)',
              py: 2,
              px: 2
            }}
          >
            <Typography variant="h6" sx={{ color: '#00C8FF', textAlign: 'center', mb: 1 }}>
              {modalIndex + 1} / {images.length}
            </Typography>
            <ThumbnailContainer sx={{ justifyContent: 'center' }}>
              {images.map((img, index) => (
                <Thumbnail
                  key={index}
                  active={modalIndex === index}
                  onClick={() => setModalIndex(index)}
                >
                  <Box
                    component="img"
                    src={img}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Thumbnail>
              ))}
            </ThumbnailContainer>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};