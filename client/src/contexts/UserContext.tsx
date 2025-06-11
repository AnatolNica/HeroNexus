import React, { createContext, useContext, useEffect, useState } from 'react';
import pako from 'pako';
import axios from 'axios';

interface TradeItem {
  type: 'character' | 'coins' | 'collection';
  characterId?: number;
  quantity?: number;
  coins?: number;
  collectionId?: string;
}

interface PurchasedCharacter {
  characterId: number;
  quantity: number;
}

interface UserType {
  id?: string;
  avatar?: string;
  name?: string;
  email?: string;
  role?: string;
  coins?: number;
  purchasedCharacters?: PurchasedCharacter[];
  inventory?: Collection[];
}

interface UserContextType {
  user: UserType | null;
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  checkAuth: () => Promise<void>;
  marvelCharacters: any[];
  isLoadingMarvel: boolean;
  errorMarvel: string | null;
  loadMarvelCharacters: (forceRefresh?: boolean) => void;
  updateUserItems: (itemsToRemove: TradeItem[]) => void; 
}

interface Collection {
  _id: string;
  name: string;
  image: string;
  description?: string;
  displayedHeroes: number[];
  mainCharacterId?: number;
  maxHeroes: number;
  tags: string[];
}

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [marvelCharacters, setMarvelCharacters] = useState<any[]>([]);
  const [isLoadingMarvel, setIsLoadingMarvel] = useState<boolean>(false);
  const [errorMarvel, setErrorMarvel] = useState<string | null>(null);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        setUser({
          id: response.data._id || response.data.id,
          avatar: response.data.avatar ? `http://localhost:5000${response.data.avatar}` : '',
          name: response.data.name,
          role: response.data.role,
          coins: response.data.coins || 0,
          purchasedCharacters: response.data.purchasedCharacters || [],
          inventory: response.data.inventory || []
        });
      } catch (error) {
        console.error('Authentication verification error:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  };

  const compressData = (data: any) => {
    const compressed = pako.deflate(JSON.stringify(data));
    return btoa(String.fromCharCode(...new Uint8Array(compressed)));
  };

  const decompressData = (base64: string) => {
    try {
      const compressed = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      return JSON.parse(pako.inflate(compressed, { to: 'string' }));
    } catch (error) {
      console.error('Decompression error:', error);
      return null;
    }
  };
  const processCharacterData = (responseData: any) => {
    if (!responseData?.ids || !Array.isArray(responseData.ids)) {
      throw new Error('Unexpected data format from server.');
    }
    
    return responseData.ids.map(id => ({
      id,
      name: `Personaj ${id}`,
      thumbnail: {
        path: `https://via.placeholder.com/150`,
        extension: 'png'
      },
      description: `Description for the character. ${id}`,
      images: []
    }));
  };


  const loadMarvelCharacters = async (forceRefresh = false) => {
    setIsLoadingMarvel(true);
    setErrorMarvel(null);

    try {

      const cachedData = localStorage.getItem('marvelData');
      if (!forceRefresh && cachedData) {
        const decompressed = decompressData(cachedData);
        if (decompressed && Date.now() - decompressed.timestamp < 86400000) {
          setMarvelCharacters(decompressed.data);
          return;
        }
      }

      const response = await fetch('/api/marvel/characters');
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const rawData = await response.json();
      const processedData = processCharacterData(rawData);
      
      const compressed = compressData({
        data: processedData,
        timestamp: Date.now()
      });
      localStorage.setItem('marvelData', compressed);

      setMarvelCharacters(processedData);

    } catch (err) {
      console.error("Erorr:", err);
      setErrorMarvel(err.message);
      localStorage.removeItem('marvelData');
    } finally {
      setIsLoadingMarvel(false);
    }
  };

  const updateUserItems = (itemsToRemove: TradeItem[]) => {
    setUser(prev => {
      if (!prev) return prev;
      
      const updatedUser = { ...prev };
      const characterItems = itemsToRemove.filter(item => item.type === 'character');
      if (updatedUser.purchasedCharacters) {
        updatedUser.purchasedCharacters = updatedUser.purchasedCharacters.map(pc => {
          const item = characterItems.find(i => 
            i.characterId === pc.characterId
          );
          if (item) {
            return {
              ...pc,
              quantity: pc.quantity - (item.quantity || 1)
            };
          }
          return pc;
        }).filter(pc => pc.quantity > 0);
      }
      const collectionItems = itemsToRemove.filter(item => item.type === 'collection');
      if (updatedUser.inventory && collectionItems.length > 0) {
        updatedUser.inventory = updatedUser.inventory.filter(
          coll => !collectionItems.some(item => item.collectionId === coll._id)
        );
      }
      const coinsItem = itemsToRemove.find(item => item.type === 'coins');
      if (coinsItem && updatedUser.coins !== undefined) {
        updatedUser.coins = updatedUser.coins - (coinsItem.coins || 0);
      }
      
      return updatedUser;
    });
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener('storage', checkAuth);
    loadMarvelCharacters();

    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      checkAuth,
      marvelCharacters,
      isLoadingMarvel,
      errorMarvel,
      loadMarvelCharacters,
      updateUserItems 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};