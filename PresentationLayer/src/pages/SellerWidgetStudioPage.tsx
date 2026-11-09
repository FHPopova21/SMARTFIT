import React from 'react';
import MerchantLayout from '@/components/merchant/MerchantLayout';
import MerchantWidgetStudioView from '@/components/merchant/MerchantWidgetStudioView';

export const SellerWidgetStudioPage: React.FC = () => {
  return (
    <MerchantLayout>
      <MerchantWidgetStudioView />
    </MerchantLayout>
  );
};

export default SellerWidgetStudioPage;

