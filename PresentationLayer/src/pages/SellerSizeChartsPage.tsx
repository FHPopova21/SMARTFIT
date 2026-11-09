import React from 'react';
import MerchantLayout from '@/components/merchant/MerchantLayout';
import MerchantSizeChartsView from '@/components/merchant/MerchantSizeChartsView';

const SellerSizeChartsPage: React.FC = () => {
  return (
    <MerchantLayout>
      <MerchantSizeChartsView />
    </MerchantLayout>
  );
};

export default SellerSizeChartsPage;

