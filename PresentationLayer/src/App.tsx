import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import UserDashboard from "./pages/UserDashboard";
import Measurements from "./pages/Measurements";
import Recommendation from "./pages/Recommendation";
import ClothingListing from "./pages/ClothingListing";
import NotFound from "./pages/NotFound";
import SellerListings from "./pages/SellerListings";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProductsPage from "./pages/SellerProductsPage";
import SellerSizeChartsPage from "./pages/SellerSizeChartsPage";
import SellerWidgetStudioPage from "./pages/SellerWidgetStudioPage";
import MerchantProfile from "./pages/MerchantProfile";
import AdminDashboard from "@/pages/AdminDashboard";
import About from './pages/About';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AboutYouQuiz from './pages/AboutYouQuiz';
import ShoeRecommendation from './pages/ShoeRecommendation';
import Footer from '@/components/Footer';
import MerchantLayout from '@/components/merchant/MerchantLayout';

const queryClient = new QueryClient();

/**
 * Public Layout Wrapper
 * Renders the public marketing Navbar and Footer for shopper and visitor pages.
 * Merchant Console pages are explicitly kept outside this layout to preserve
 * an authentic enterprise SaaS application interface.
 */
const PublicLayout = () => (
  <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between">
    <div>
      <Navbar />
      <Outlet />
    </div>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Authenticated Merchant Console Routes (Strictly MerchantSidebar + MerchantHeader + Main Area) */}
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/products" element={<SellerProductsPage />} />
          <Route path="/seller/size-charts" element={<SellerSizeChartsPage />} />
          <Route path="/seller/widget" element={<SellerWidgetStudioPage />} />
          <Route
            path="/seller/listings"
            element={
              <MerchantLayout>
                <SellerListings />
              </MerchantLayout>
            }
          />
          <Route
            path="/seller/profile"
            element={
              <MerchantLayout>
                <MerchantProfile />
              </MerchantLayout>
            }
          />

          {/* Public & Customer Routes (Includes Public Navbar and Footer) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/measurements" element={<Measurements />} />
            <Route path="/quiz" element={<AboutYouQuiz />} />
            <Route path="/recommendation" element={<Recommendation />} />
            <Route path="/shoes" element={<ShoeRecommendation />} />
            <Route path="/clothing" element={<ClothingListing />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
