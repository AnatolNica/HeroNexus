import { useState, useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import Collections from './Collections';
import Characters from './Characters';

interface Collection {
  _id: string;
  name: string;
  description: string;
  maxHeroes: number;
  displayedHeroes: number[];
  
  tags: string[];
}

interface PurchasedCharacter {
  characterId: number;
  quantity: number;
}

interface InventoryPageProps {
  inventory: Collection[];
  purchasedCharacters: PurchasedCharacter[];
  onInventoryUpdate: (newInventory: Collection[]) => void;
}

const InventoryPage = ({
  inventory,
  purchasedCharacters,
  onInventoryUpdate
}: InventoryPageProps) => {
  const [error] = useState('');
  const [characterIds, setCharacterIds] = useState<number[]>([]);
  useEffect(() => {
    const purchasedIds = purchasedCharacters.map(pc => pc.characterId);
    const collectionIds = inventory.flatMap(c => c.displayedHeroes);
    const mergedIds = [...new Set([...purchasedIds, ...collectionIds])];
    setCharacterIds(mergedIds);
  }, [purchasedCharacters, inventory]);

  const handleInventoryUpdate = (newInventory: Collection[]) => {
    onInventoryUpdate(newInventory);
    const newCollectionIds = newInventory.flatMap(c => c.displayedHeroes);
    const purchasedIds = purchasedCharacters.map(pc => pc.characterId);
    setCharacterIds([...new Set([...purchasedIds, ...newCollectionIds])]);
  };

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4,maxWidth:{xl:1300,lg:900,md:600} }}>
      <Characters purchasedCharacters={purchasedCharacters} />
<Collections 
  inventory={inventory}
  characterIds={characterIds}
  purchasedCharacters={purchasedCharacters} 
  onInventoryUpdate={handleInventoryUpdate}
/>
    </Box>
  );
};

export default InventoryPage;