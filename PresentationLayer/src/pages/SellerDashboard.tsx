import React from 'react';
import MerchantLayout from '@/components/merchant/MerchantLayout';
import MerchantOverview from '@/components/merchant/MerchantOverview';

const SellerDashboard: React.FC = () => {
  return (
    <MerchantLayout>
      <MerchantOverview />
    </MerchantLayout>
  );
};

export default SellerDashboard;
