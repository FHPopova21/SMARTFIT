import React, { useState, useEffect } from 'react';
import MerchantSidebar from './MerchantSidebar';
import MerchantHeader from './MerchantHeader';
import CreateStoreDialog from './CreateStoreDialog';
import { MerchantStoreProvider, useMerchantStore } from '@/context/MerchantStoreContext';

interface MerchantLayoutInnerProps {
  children: React.ReactNode;
}

const MerchantLayoutInner: React.FC<MerchantLayoutInnerProps> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { isCreateStoreOpen, closeCreateStore, handleStoreCreated } = useMerchantStore();

  // Close mobile drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#0F1117] flex flex-col font-sans antialiased">
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Fixed Left Sidebar */}
        <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
          <MerchantSidebar />
        </div>

        {/* Mobile Navigation Drawer Modal */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Merchant Navigation Drawer"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
              onClick={() => setIsMobileNavOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Content */}
            <div className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
              <MerchantSidebar
                isMobile
                onCloseMobile={() => setIsMobileNavOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0">
          <MerchantHeader onOpenMobileNav={() => setIsMobileNavOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>

      {/* Global Create Store Modal */}
      <CreateStoreDialog
        isOpen={isCreateStoreOpen}
        onClose={closeCreateStore}
        onStoreCreated={handleStoreCreated}
      />
    </div>
  );
};

export const MerchantLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MerchantStoreProvider>
      <MerchantLayoutInner>{children}</MerchantLayoutInner>
    </MerchantStoreProvider>
  );
};

export default MerchantLayout;
