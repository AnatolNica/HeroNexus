import React from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  Button, Avatar, useTheme, useMediaQuery, 
} from '@mui/material';
import { 
  Star, LocalShipping, Favorite, Group, 
  Public, Rocket, ShoppingBasket, History, 
   Diversity3, ExpandMore, 
  ThumbUp, VerifiedUser, Event, Storefront,
  EmojiEvents,
  Stars
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import Footer from '../assets/Footer';
import NavBar from '../assets/NavBar';






const AboutUs = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const teamMembers = [
    { name: "Me", role: "Founder & Collector", funFact: "Web developer" },
    { name: "Me", role: "Marketing & Community", funFact: "Figurin maker" },
    { name: "Me", role: "Product Specialist", funFact: "Knows every Marvel character" },
    { name: "Me", role: "Customer Experience", funFact: "Gaming enthusiast" },
  ];

  return (
    <>
    <NavBar/>
    <Box sx={{ 
      backgroundColor: '#121212', 
      color: 'white',
      minHeight: '100vh',
      pt: 4,
      pb: 8,
      overflowX: 'hidden'
    }}>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box textAlign="center" mb={10} sx={{ mt: 8 }}>
            <Box>
              <Typography 
                variant="h1" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 900, 
                  fontSize: isMobile ? '2.5rem' : '4rem',
                  background: 'linear-gradient(45deg, #00C8FF 30%, #00a5cc 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(0, 200, 255, 0.3)',
                  mb: 3
                }}
              >
                From Fans, For Fans
              </Typography>
              
              <Typography variant="h5" component="p" sx={{ 
                maxWidth: 800, 
                mx: 'auto', 
                mb: 4,
                fontWeight: 300,
                fontSize: isMobile ? '1.1rem' : '1.5rem'
              }}>
                We're passionate collectors who turned our love for pop culture into a destination for authentic figures
              </Typography>
              
              <Box>
                <Button 
                  variant="contained" 
                  size="large" 
                  component={Link}
                  to="/catalog"
                  endIcon={<ShoppingBasket />}
                  sx={{
                    bgcolor: '#00C8FF',
                    color: '#121212',
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                    boxShadow: '0 0 15px rgba(0, 200, 255, 0.5)',
                    '&:hover': { 
                      bgcolor: '#00a5cc',
                      boxShadow: '0 0 15px rgba(0, 200, 255, 0.6)'
                    }
                  }}
                >
                  Explore Collections
                </Button>
              </Box>
            </Box>
          
          <Box textAlign="center" mt={8} mb={4}>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
              Scroll to discover our story
            </Typography>
            <ExpandMore sx={{ 
              fontSize: 40, 
              color: '#00C8FF', 
            }} />
          </Box>
        </Box>

        <Box>
          <Box sx={{ 
            bgcolor: '#1a1a1a', 
            p: 4, 
            borderRadius: 4, 
            mb: 8,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 4,
              background: 'linear-gradient(90deg, #00C8FF, #00a5cc)'
            }
          }}>
            <Box display="flex" alignItems="center" mb={4}>
              <History sx={{ 
                fontSize: 40, 
                color: '#00C8FF', 
                mr: 2 
              }} />
              <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
                Our Story
              </Typography>
            </Box>
            
            <Grid container spacing={4}>
              <Grid >
                <Typography variant="body1" paragraph sx={{ 
                  fontSize: '1.1rem', 
                  lineHeight: 1.8,
                  position: 'relative',
                  pl: 3,
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 8,
                    height: '90%',
                    width: 2,
                    background: 'linear-gradient(to bottom, #00C8FF, transparent)',
                    borderRadius: 2
                  }
                }}>
                  Passion has always been the start of all great things. Our story began in 2021 - not in a big office, 
                  but in a small room with a shelf full of figurines and big dreams.
                </Typography>
                <Typography variant="body1" paragraph sx={{ 
                  fontSize: '1.1rem', 
                  lineHeight: 1.8,
                  pl: 3
                }}>
                  We're a team of pop culture fans, collectors, and detail enthusiasts who decided to turn a hobby into 
                  a business dedicated to those who love fantastic universes and iconic characters as much as we do.
                </Typography>
              </Grid>
              <Grid >
                <Typography variant="body1" paragraph sx={{ 
                  fontSize: '1.1rem', 
                  lineHeight: 1.8,
                  pl: 3
                }}>
                  It all started with a simple question: <Box component="span" sx={{ 
                    fontWeight: 700, 
                    color: '#00C8FF',
                    textShadow: '0 0 10px rgba(0, 200, 255, 0.5)'
                  }}>"Why is it so hard to find authentic, quality figurines locally?"</Box> 
                  The answer became our mission - to build a place where fans feel at home.
                </Typography>
                <Typography variant="body1" paragraph sx={{ 
                  fontSize: '1.1rem', 
                  lineHeight: 1.8,
                  pl: 3
                }}>
                  Today, we carefully select, verify, and deliver each product with the same care we'd want for our own collections.
                </Typography>
              </Grid>
            </Grid>
            <Typography variant="h4" component="h3" sx={{ 
              fontWeight: 700, 
              mt: 6, 
              mb: 4,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Event sx={{ mr: 2, color: '#00C8FF' }} />
              Our Journey
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {[
                { year: '2021', event: 'Founded in a small apartment with just 50 figures', icon: <Storefront /> },
                { year: '2022', event: 'First 1000 customers & international partnerships', icon: <ThumbUp /> },
                { year: '2023', event: 'Expanded to 10,000+ products across all categories', icon: <VerifiedUser /> },
                { year: '2024', event: 'Launched exclusive limited-edition hero figurines', icon: <Stars /> },
                { year: '2025', event: 'Opened flagship store & hosted first community expo', icon: <EmojiEvents /> },
                { year: 'Today', event: 'Trusted by collectors throughout Eastern Europe', icon: <Public /> },
              ].map((milestone, index) => (
                <Grid key={index}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 3,
                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 3,
                    height:200,
                    width:298,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 25px rgba(0, 200, 255, 0.2)'
                    }
                  }}>
                    <Box sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: '#00C8FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      animationDelay: `${index * 0.5}s`
                    }}>
                      {milestone.icon && React.cloneElement(milestone.icon, {
                        sx: { fontSize: 40, color: '#121212' }
                      })}
                    </Box>
                    <Typography variant="h5" sx={{ 
                      color: '#00C8FF', 
                      fontWeight: 700,
                      mb: 1
                    }}>
                      {milestone.year}
                    </Typography>
                    <Typography>{milestone.event}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        <Box>
          <Box mb={8}>
            <Box display="flex" alignItems="center" mb={4}>
              <ThumbUp sx={{ 
                fontSize: 40, 
                color: '#00C8FF', 
                mr: 2 
              }} />
              <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
                Why Collectors Choose Us
              </Typography>
            </Box>
            
            <Grid container spacing={4}>
              {[
                { icon: <Star fontSize="large" />, 
                  title: '100% Authentic', 
                  text: 'Direct partnerships with authorized distributors and manufacturers' },
                
                { icon: <LocalShipping fontSize="large" />, 
                  title: 'Secure Shipping', 
                  text: 'Protective packaging designed specifically for collectibles' },
                
                { icon: <Favorite fontSize="large" />, 
                  title: 'By Collectors, For Collectors', 
                  text: 'We understand what matters because we are collectors too' },
                
                { icon: <Group fontSize="large" />, 
                  title: 'Community Focused', 
                  text: 'Regular events, exclusive launches, and collector meetups' },

                { icon: <VerifiedUser fontSize="large" />, 
                  title: 'Quality Guaranteed', 
                  text: 'Rigorous inspection process for every item before shipping' },

                { icon: <Event fontSize="large" />, 
                  title: 'Exclusive Releases', 
                  text: 'Early access and special editions for our community members' },
              ].map((feature, index) => (
                <Grid  key={index}>
                  <Card sx={{ 
                    bgcolor: 'rgba(26, 26, 26, 0.7)', 
                    borderRadius: 3,
                    height:300,
                    width:360,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    border: '1px solid rgba(0, 200, 255, 0.1)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    '&:hover': { 
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 30px rgba(0, 200, 255, 0.2)',
                      borderColor: 'rgba(0, 200, 255, 0.3)'
                    }
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 4 }}>
                      <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: '#00C8FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        boxShadow: '0 0 20px rgba(0, 200, 255, 0.5)',
                        animationDelay: `${index * 0.3}s`
                      }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h5" gutterBottom sx={{ 
                        fontWeight: 700,
                        color: '#00C8FF'
                      }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color='white'>{feature.text}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
        <Box>
          <Box mb={8}>
            <Box display="flex" alignItems="center" mb={4}>
              <Diversity3 sx={{ 
                fontSize: 40, 
                color: '#00C8FF', 
                mr: 2 
              }} />
              <Typography variant="h3" component="h2" sx={{ fontWeight: 800 }}>
                Meet Our Team
              </Typography>
            </Box>
            
            <Grid container spacing={10} justifyContent="center">
              {teamMembers.map((member, index) => (
                <Grid key={index} mb={10}>
                  <Box sx={{ 
                    textAlign: 'center',
                    p: 3,
                    width:350,
                    borderRadius: 3,
                    bgcolor: 'rgba(26, 26, 26, 0.7)',
                    height: '100%',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    border: '1px solid rgba(0, 200, 255, 0.1)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 25px rgba(0, 200, 255, 0.2)',
                      borderColor: 'rgba(0, 200, 255, 0.3)'
                    }
                  }}>
                    <Avatar sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto',
                      mb: 2,
                      bgcolor: '#00C8FF',
                      color: '#121212',
                      fontSize: '3rem',
                      fontWeight: 700,
                      boxShadow: '0 0 20px rgba(0, 200, 255, 0.5)',
                      transition: 'transform 0.3s',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}>
                      {member.name.charAt(0)}
                    </Avatar>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700,
                      mb: 0.5
                    }}>
                      {member.name}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#00C8FF', 
                      mb: 2,
                      fontWeight: 500
                    }}>
                      {member.role}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontStyle: 'italic',
                      bgcolor: 'rgba(0, 200, 255, 0.1)',
                      p: 1.5,
                      borderRadius: 2,
                      borderLeft: '3px solid #00C8FF'
                    }}>
                      "{member.funFact}"
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
        <Box>
          <Box sx={{ 
            bgcolor: 'rgba(26, 26, 26, 0.7)', 
            borderRadius: 4,
            p: 4,
            pb:15,
            mb: 8,
            border: '1px solid rgba(0, 200, 255, 0.2)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at center, rgba(0, 200, 255, 0.05), transparent 70%)',
              zIndex: 0,
            }
          }}>
            <Typography variant="h3" component="h2" textAlign="center" sx={{ 
              fontWeight: 800,
              mb: 6,
              position: 'relative',
              zIndex: 1
            }}>
              Our Mission & Vision
            </Typography>
            
            <Grid container spacing={10} sx={{ position: 'relative', zIndex: 1 }}>
              <Grid>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  p: 4,
                  borderRadius: 3,
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  height: '100%',
                  border: '1px solid rgba(0, 200, 255, 0.2)'
                }}>
                  <Public sx={{ 
                    fontSize: 60, 
                    color: '#00C8FF', 
                    mr: 3,
                    flexShrink: 0 
                  }} />
                  <Box >
                    <Typography variant="h4" component="h3" gutterBottom sx={{ 
                      fontWeight: 700,
                      color: '#00C8FF'
                    }}>
                      Our Mission
                    </Typography>
                    <Typography variant="body1">
                      To become the premier destination for pop culture collectors in Eastern Europe by providing 
                      authentic, high-quality figures with exceptional service. We're building a community where 
                      every collector—from beginner to expert—finds exactly what they're searching for.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  p: 4,
                  borderRadius: 3,
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  height: '100%',
                  border: '1px solid rgba(0, 200, 255, 0.2)'
                }}>
                  <Rocket sx={{ 
                    fontSize: 60, 
                    color: '#00C8FF', 
                    mr: 3,
                    flexShrink: 0 
                  }} />
                  <Box>
                    <Typography variant="h4" component="h3" gutterBottom sx={{ 
                      fontWeight: 700,
                      color: '#00C8FF'
                    }}>
                      Our Vision
                    </Typography>
                    <Typography variant="body1">
                      We're expanding our partnerships with global brands and developing exclusive products. 
                      Soon, we'll launch physical showrooms and host collector events. Our goal is to create 
                      Eastern Europe's most vibrant hub for pop culture enthusiasts—both online and in real life.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Box>
          <Box textAlign="center" sx={{ mt: 8 }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ 
              fontWeight: 800, 
              mb: 2,
              background: 'linear-gradient(45deg, #00C8FF 30%, #00a5cc 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Join Our Collector Community
            </Typography>
            <Typography variant="h5" component="p" gutterBottom sx={{ 
              mb: 4, 
              maxWidth: 700, 
              mx: 'auto',
              fontWeight: 300
            }}>
              Looking for something special? Need help finding that rare figure? Let's connect!
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mt: 4
            }}>
              <Button 
  variant="contained" 
  size="large" 
  component={Link}
  to="/catalog"
  endIcon={<ShoppingBasket />}
  sx={{
    bgcolor: '#00C8FF',
    color: '#121212',
    fontWeight: 700,
    px: 4,
    py: 1.5,
    fontSize: '1.1rem',
    borderRadius: 2,
    boxShadow: '0 0 15px rgba(0, 200, 255, 0.5)',
    '&:hover': { 
      bgcolor: '#00a5cc',
      boxShadow: '0 0 15px rgba(0, 200, 255, 0.6)'
    }
  }}
>
  Browse Collections
</Button>
              
              <Button 
                variant="outlined" 
                size="large"
                component={Link}
                to="/contactUs"
                sx={{
                  border: '2px solid #00C8FF',
                  color: '#00C8FF',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  '&:hover': { 
                    border: '2px solid #00a5cc',
                    color: '#00a5cc',
                    bgcolor: 'rgba(0, 200, 255, 0.05)'
                  }
                }}
              >
                Contact Us
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
    <Footer/>
    </>
  );
};

export default AboutUs;