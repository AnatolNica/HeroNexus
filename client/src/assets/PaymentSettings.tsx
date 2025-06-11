import { useState, useEffect } from 'react';
import PaymentMethods from './PaymentMethod';
import BillingAddress from './BillingAddress';
import axios from 'axios';
import { Box} from '@mui/material';

const PaymentSettings = ({ 
  paymentMethods: initialMethods = [], 
  billingAddress: initialAddress = null, 
  onUpdateUserData 
}) => {
  const [paymentMethods, setPaymentMethods] = useState(initialMethods);
  const [billingAddress, setBillingAddress] = useState(initialAddress);

  useEffect(() => {
    setPaymentMethods(initialMethods);
  }, [initialMethods]);
  useEffect(() => {
    setBillingAddress(initialAddress);
  }, [initialAddress]);
  const handlePaymentMethodsUpdate = async (updatedMethods) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        '/api/auth/payment-methods',
        updatedMethods,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPaymentMethods(response.data);
      if (billingAddress) {
        onUpdateUserData({ paymentMethods: response.data });
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleBillingAddressUpdate = async (updatedAddress) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        '/api/billing-address',
        updatedAddress,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBillingAddress(response.data);

      if (onUpdateUserData) {
        onUpdateUserData({ billingAddress: response.data });
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };
  return (
    <Box bgcolor={'#262626'} borderRadius={5}>
      <PaymentMethods 
        paymentMethods={paymentMethods} 
        onUpdate={handlePaymentMethodsUpdate} 
      />
      <BillingAddress 
        address={billingAddress} 
        onUpdate={handleBillingAddressUpdate} 
      />
    </Box>
  );
};

export default PaymentSettings;