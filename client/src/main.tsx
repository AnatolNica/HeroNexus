import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Catalog from './pages/CatalogPages';
import ProductPage from './pages/ProductPage';
import Cart from './pages/ProductCart';
import ContactUs from './pages/ContactUs';
import Login from './pages/Login';
import UserProfile from './pages/UserPage';
import AboutUs from './pages/AboutUs';
import Wishlist from './pages/WhishList';
import Marketplace from './pages/TradingHub';
import Main from './App';
import Others from './pages/OthersPage';
import { UserProvider } from './contexts/UserContext';
import Admin from './pages/Admin';
import Roulette from './assets/Roulette';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
    <UserProvider>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contactUs" element={<ContactUs />} />
        <Route path="/user" element={<UserProfile />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/market" element={<Marketplace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/roulette/:id" element={<Roulette />} />
        <Route path="/user/:userId" element={<Others />}/>
      </Routes>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);
