import React from "react";
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Link,
  Stack,
} from "@mui/material";
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  LocationOn,
  Phone,
  Email,
  Home,
  Storefront,
  ShoppingCart as ShoppingCartIcon,
  Info,
  ContactMail,
} from "@mui/icons-material";

const navItems = [
  { name: "Home", path: "/", icon: <Home sx={{ fontSize: 20 }} /> },
  { name: "Catalog", path: "/catalog", icon: <Storefront sx={{ fontSize: 20 }} /> },
  { name: "Market", path: "/market", icon: <ShoppingCartIcon sx={{ fontSize: 20 }} /> },
  { name: "About", path: "/about", icon: <Info sx={{ fontSize: 20 }} /> },
  { name: "Contact", path: "/contactUs", icon: <ContactMail sx={{ fontSize: 20 }} /> },
];

const Footer: React.FC = () => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0072bc, #00c8ff)',

        color: "white",
        padding: { xs: "2rem 1rem", md: "3rem 2rem" },
      }}
    >
      <Grid
        container
        spacing={4}
        justifyContent="space-between"
        sx={{
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <Grid>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Our Mission
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.8)", width: "300px" }}
          >
            Our mission is to provide a platform that celebrates creativity and
            passion through Marvel collectibles. We aim to help fans build
            legendary collections and keep the Marvel spirit alive.
          </Typography>
        </Grid>
        <Grid>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quick Links
          </Typography>
          <Stack spacing={1}>
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.path}
                underline="none"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.5,
                  color: "rgba(255,255,255,0.8)",
                  px: 1,
                  py: 0.5,
                  transition: "all 0.3s ease",
                  transform: "translateX(0)",
                  "&:hover": {
                    color: "white",
                    transform: "translateX(5px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {item.icon}
                </Box>
                <Typography variant="body2">{item.name}</Typography>
              </Link>
            ))}
          </Stack>
        </Grid>
        <Grid>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Contact Us
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocationOn fontSize="small" />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                Chișinău, Moldova
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Phone fontSize="small" />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                +373 123 456 78
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Email fontSize="small" />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                contact@marvelcollectibles.md
              </Typography>
            </Stack>
          </Stack>
        </Grid>
        <Grid>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Follow Us
          </Typography>
          <Stack direction="row" spacing={2}>
            {[
              { icon: <Facebook />, url: "https://facebook.com" },
              { icon: <Twitter />, url: "https://twitter.com" },
              { icon: <Instagram />, url: "https://instagram.com" },
              { icon: <LinkedIn />, url: "https://linkedin.com" },
            ].map((social, index) => (
              <IconButton
                key={index}
                component="a"
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  "&:hover": {
                    color: "primary.main",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                {social.icon}
              </IconButton>
            ))}
          </Stack>
        </Grid>
      </Grid>
      <Box
        sx={{
          mt: 4,
          pt: 3,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          textAlign: "center",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        <Typography color={'white'}>
          © {new Date().getFullYear()} Hero Nexus. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;
