import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { Link, Navigate } from 'react-router-dom';
import {
  ShoppingBag,
  Sliders,
  Sparkles,
  Footprints,
  Eye,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Star,
  ChevronDown,
  CheckCircle2,
  Scan,
  Cpu,
  Layers,
  Activity,
  Code2,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Check,
  Ruler
} from 'lucide-react';
import Interactive3DHeroScanner from '@/components/Interactive3DHeroScanner';
import EcommerceProductHeroDemo from '@/components/EcommerceProductHeroDemo';
import { BentoPlatformFeatures } from '@/components/BentoPlatformFeatures';
import { InteractiveDemoSection } from '@/components/InteractiveDemoSection';
import { PricingPreviewSection } from '@/components/PricingPreviewSection';
import { EarlyAccessDialog } from '@/components/EarlyAccessDialog';

const Index = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);

  if (isAuthenticated) {
    switch (user?.role) {
      case 'user':
        return <Navigate to="/dashboard" replace />;
      case 'seller':
        return <Navigate to="/seller/profile" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        break;
    }
  }

  const faqs = [
    {
      q: 'What is FitVision and how does it help fashion ecommerce stores?',
      a: 'FitVision is an AI-assisted size recommendation platform designed to match shopper body measurements with explicit garment dimensions. By providing transparent fit guidance and 2D ease breakdowns directly on product pages, it helps reduce sizing guesswork for shoppers.',
    },
    {
      q: 'How does the size recommendation engine work?',
      a: 'The engine uses a calibrated Random Forest classification pipeline trained on anthropometric proportions. It computes class probability distributions across standard sizes (XS to XL) and calculates chest and waist ease tolerances in centimeters rather than guessing from size labels alone.',
    },
    {
      q: 'What garment data is required from our store?',
      a: 'Merchants provide structured garment specifications—clearly distinguishing flat garment width from full circumference—along with fabric composition and size charts. Explicit measurement metadata ensures body circumferences are never mathematically mismatched with flat clothing dimensions.',
    },
    {
      q: 'Which ecommerce platforms are supported or planned?',
      a: 'FitVision currently operates with an internal reference Flask REST service and prototype React components. Turnkey connectors for Shopify, WooCommerce, and Magento 2 are currently planned on the engineering roadmap.',
    },
    {
      q: 'What are the current prototype limitations?',
      a: 'Our sizing visualizations represent approximate 2D ease wireframes and statistical probability classifications. They do not simulate dynamic 3D cloth physics, fabric drape tension under movement, or medical-grade body scans.',
    },
    {
      q: 'How can our brand participate in early partner testing?',
      a: 'You can explore our open catalog and size recommendation demo today without creating an account. To participate in our upcoming partner beta or discuss custom catalog ingestion, click "Request Early Access" to join our private preview list.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-zinc-900">
      {/* 1. HERO SECTION: B2B Enterprise SaaS */}
      <section className="relative pt-12 sm:pt-16 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#F8F9FC] via-white to-[#F8F9FC]">
        {/* Фонови фини дифузни светлини (Lavender & Indigo glow) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Лява колона: B2B Текстово послание и CTAs (7 от 12) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-[#4F46E5] border border-indigo-200/80 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>AI-POWERED SIZE INTELLIGENCE</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#0F1117] font-heading leading-[1.06]">
                Turn size uncertainty into{' '}
                <span className="bg-gradient-to-r from-[#0F1117] via-[#4F46E5] to-indigo-600 bg-clip-text text-transparent">
                  shopping confidence.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                AI-powered size recommendations designed to help fashion ecommerce stores offer a more personalized shopping experience.
              </p>

              {/* CTAs: Primary & Secondary */}
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start items-center pt-2">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 py-6 text-base font-bold shadow-md rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    Book a Demo
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>

                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-[#E9EAF3] text-[#0F1117] hover:bg-zinc-100/80 px-7 py-6 text-base font-semibold rounded-2xl bg-white shadow-2xs"
                  >
                    See How It Works
                  </Button>
                </a>
              </div>

              {/* Достъп до съществуващите потребителски демо среди */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-xs font-sans text-zinc-500">
                <span className="font-semibold text-zinc-700">Интерактивни демо среди:</span>
                <Link to="/clothing" className="text-[#4F46E5] hover:underline flex items-center gap-1 font-medium">
                  <ShoppingBag className="w-3.5 h-3.5" /> Каталог
                </Link>
                <span>•</span>
                <Link to="/recommendation" className="text-[#4F46E5] hover:underline flex items-center gap-1 font-medium">
                  <Layers className="w-3.5 h-3.5" /> 3D/2D Пробна
                </Link>
                <span>•</span>
                <Link to="/quiz" className="text-[#4F46E5] hover:underline flex items-center gap-1 font-medium">
                  <Sliders className="w-3.5 h-3.5" /> Quiz
                </Link>
                <span>•</span>
                <Link to="/shoes" className="text-[#4F46E5] hover:underline flex items-center gap-1 font-medium">
                  <Footprints className="w-3.5 h-3.5" /> Обувки
                </Link>
              </div>

              {/* B2B Value Pillars (Честни и верифицирани предимства без измислени 0% твърдения) */}
              <div className="pt-6 border-t border-[#E9EAF3] grid grid-cols-3 gap-4 text-center lg:text-left max-w-lg mx-auto lg:mx-0 font-mono">
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-[#0F1117]">Embeddable</h4>
                  <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Drop-in Widget</p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-emerald-600">2D & 3D</h4>
                  <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Size Assistant</p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-[#4F46E5]">ISO/TS 19407</h4>
                  <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Mondopoint Standard</p>
                </div>
              </div>
            </div>

            {/* Дясна колона: ИНТЕРАКТИВНО E-COMMERCE WIDGET ДЕМО (5 от 12) */}
            <div className="lg:col-span-5 relative">
              <EcommerceProductHeroDemo />
            </div>
          </div>
        </div>
      </section>

      {/* 2. E-COMMERCE INTEGRATION COMPATIBILITY STRIP */}
      <section id="integrations" className="py-6 bg-white border-y border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>Storefront & API Compatibility</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs">
            {/* Custom REST API */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200/80 shadow-xs">
              <span className="font-semibold text-zinc-800">Custom REST API</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Available (Internal Service)
              </span>
            </div>

            {/* Shopify */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50/70 border border-zinc-200/60">
              <span className="font-medium text-zinc-600">Shopify</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
                Planned
              </span>
            </div>

            {/* WooCommerce */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50/70 border border-zinc-200/60">
              <span className="font-medium text-zinc-600">WooCommerce</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
                Planned
              </span>
            </div>

            {/* Magento 2 */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50/70 border border-zinc-200/60">
              <span className="font-medium text-zinc-600">Magento 2</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
                Planned
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW FITVISION WORKS: B2B SaaS Workflow */}
      <section id="how-it-works" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFC] border-b border-zinc-200/80">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 sm:mb-20">
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono font-bold mb-3 px-3.5 py-1 text-xs uppercase tracking-wider">
              HOW IT WORKS
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F1117] font-heading tracking-tight">
              Smarter sizing, seamlessly integrated.
            </h2>
            <p className="text-zinc-600 mt-3 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              From product data to personalized recommendations, FitVision is designed to work within your storefront.
            </p>
          </div>

          {/* Three Horizontally Aligned Workflow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* STEP 01 — Connect Your Catalog */}
            <div className="bg-white p-7 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-indigo-500/40 hover:shadow-[0_12px_30px_rgba(79,70,229,0.06)] motion-safe:hover:-translate-y-1.5 motion-reduce:transform-none transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                    <Code2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    STEP 01
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#0F1117] font-heading tracking-tight mb-3">
                  Connect Your Catalog
                </h3>
                <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-6">
                  Connect your product catalog using standard JSON data formats. Our proposed pipeline maps your products to our sizing intelligence without changing your existing store architecture.
                </p>
              </div>

              <div className="pt-5 border-t border-zinc-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Standard product & measurement ingestion</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Seamless catalog synchronization</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="text-zinc-500">Direct REST API integration (Roadmap)</span>
                </div>
              </div>
            </div>

            {/* STEP 02 — Configure Your Products */}
            <div className="bg-white p-7 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-indigo-500/40 hover:shadow-[0_12px_30px_rgba(79,70,229,0.06)] motion-safe:hover:-translate-y-1.5 motion-reduce:transform-none transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                    <Sliders className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                    STEP 02
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#0F1117] font-heading tracking-tight mb-3">
                  Configure Your Products
                </h3>
                <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-6">
                  Map structured garment dimensions—distinguishing flat garment width from full circumference—and attach size chart specifications for transparent fit alignment.
                </p>
              </div>

              <div className="pt-5 border-t border-zinc-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Explicit flat width vs. circumference</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Per-size measurement charts</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Garment material specification</span>
                </div>
              </div>
            </div>

            {/* STEP 03 — Deliver Personalized Recommendations */}
            <div className="bg-white p-7 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-indigo-500/40 hover:shadow-[0_12px_30px_rgba(79,70,229,0.06)] motion-safe:hover:-translate-y-1.5 motion-reduce:transform-none transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                    STEP 03
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#0F1117] font-heading tracking-tight mb-3">
                  Deliver Personalized Recommendations
                </h3>
                <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-6">
                  Shoppers receive calibrated size suggestions and an approximate 2D ease breakdown directly on product pages, designed to reduce sizing uncertainty before purchase.
                </p>
              </div>

              <div className="pt-5 border-t border-zinc-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Calibrated ML size prediction</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Approximate 2D ease breakdown in cm</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Transparent confidence indicator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE PLATFORM: B2B FEATURES & SOLUTIONS (BENTO GRID) */}
      <BentoPlatformFeatures />

      {/* 5. INTERACTIVE DEMO PREVIEW */}
      <InteractiveDemoSection />

      {/* 6. DESIGNED FOR MODERN ECOMMERCE (Pillars & Principles) */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-zinc-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono font-bold mb-3 px-3.5 py-1 text-xs uppercase tracking-wider">
              ENGINEERING PRINCIPLES
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F1117] font-heading tracking-tight">
              Designed for modern ecommerce.
            </h2>
            <p className="text-zinc-600 mt-3 text-sm sm:text-base leading-relaxed">
              Built with a focus on measurement transparency, product-specific data integrity, shopper privacy, and scalable storefront integration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="bg-[#FAFAFC] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5 text-indigo-600">
                <Ruler className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 font-heading mb-2">Measurement Transparency</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Explicitly distinguishes flat garment width from full body circumference. Never infers conventions from arbitrary numerical thresholds.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#FAFAFC] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-5 text-purple-600">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 font-heading mb-2">Product-Specific Sizing</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Sizing varies across brands and fabrics. We map individual garment specs and elasticity rather than assuming generic size labels are uniform.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#FAFAFC] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 font-heading mb-2">Privacy-Aware Design</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Shopper measurements are processed strictly for fit calculations without third-party ad tracking, personal profiling, or data resale.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-[#FAFAFC] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 text-blue-600">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 font-heading mb-2">Extensible Architecture</h3>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Designed to standardize sizing intelligence into a clean contract adaptable across web stores, headless frontends, and future merchant plugins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PLANS & EARLY ACCESS (PRICING PREVIEW) */}
      <PricingPreviewSection />

      {/* 8. FREQUENTLY ASKED QUESTIONS (B2B FAQ) */}
      <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAFAFC] border-b border-zinc-200/80">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono font-bold mb-3 px-3.5 py-1 text-xs uppercase tracking-wider">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F1117] font-heading tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-600 mt-2 text-sm max-w-xl mx-auto">
              Everything you need to know about integrating and using FitVision.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-zinc-900 hover:text-indigo-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-indigo-600' : 'text-zinc-400'
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. FINAL B2B CONVERSION CTA */}
      <section className="py-24 sm:py-32 px-4 text-center bg-gradient-to-b from-[#FAFAFC] via-white to-white">
        <div className="max-w-3xl mx-auto space-y-6">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider">
            EXPERIENCE THE DIFFERENCE
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F1117] font-heading tracking-tight">
            Bring smarter sizing to your storefront.
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Explore our interactive prototype catalog or connect with our team to learn more about upcoming partner releases.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              type="button"
              onClick={() => setEarlyAccessOpen(true)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-sm font-bold shadow-md rounded-2xl transition-all"
            >
              Request Early Access
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link to="/clothing" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-zinc-200 text-zinc-900 hover:bg-zinc-50 px-8 py-6 text-sm font-bold rounded-2xl shadow-xs"
              >
                <ShoppingBag className="w-4 h-4 mr-2 text-indigo-600" />
                Explore Demo Catalog
              </Button>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Open public prototype demo
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Zero merchant lock-in
            </span>
          </div>
        </div>
      </section>

      <EarlyAccessDialog
        open={earlyAccessOpen}
        onOpenChange={setEarlyAccessOpen}
        selectedPlan="FitVision Partner Early Access"
      />
    </div>
  );
};

export default Index;
