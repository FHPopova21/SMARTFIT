import React from 'react';
import MerchantLayout from '@/components/merchant/MerchantLayout';
import MerchantProductsView from '@/components/merchant/MerchantProductsView';

const SellerProductsPage: React.FC = () => {
  return (
    <MerchantLayout>
      <MerchantProductsView />
    </MerchantLayout>
  );
};

export default SellerProductsPage;

