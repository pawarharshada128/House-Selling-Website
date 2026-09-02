'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { INITIAL_PROPERTIES, INITIAL_PROJECTS, INITIAL_TESTIMONIALS, INITIAL_BLOG_POSTS } from '@/lib/mockData';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { HeroSearchBar } from '@/components/home/HeroSearchBar';
import { EmiCalculator } from '@/components/calculators/EmiCalculator';
import { ConstructionEstimator } from '@/components/calculators/ConstructionEstimator';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Hammer,
  Compass,
  CheckCircle2,
  Star,
  Award,
  Layers,
  PhoneCall,
  Calendar,
  Eye,
  TrendingUp,
} from 'lucide-react';

export default function HomePage() {
  const { openVisitModal } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [calculatorTab, setCalculatorTab] = useState<'emi' | 'build'>('build');

  const categories = ['All', 'Penthouse', 'Villa', 'Plot', 'Commercial'];

  const filteredProperties =
    activeCategory === 'All'
      ? INITIAL_PROPERTIES
      : INITIAL_PROPERTIES.filter((p) => p.property_type === activeCategory);

  return (
    <div className="space-y-24 pb-20">
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-12 pb-20 overflow-hidden">
        {/* Background Image with Ambient Overlays */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=90"
            alt="Shiv Properties Luxury Architecture"
            fill
            className="object-cover object-center brightness-[0.35] scale-105 animate-[pulse-slow_8s_ease-in-out_infinite]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#121414]/90 via-[#121414]/40 to-[#121414]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-tertiary/10 rounded-full blur-[160px] pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-md border border-tertiary/40 text-tertiary text-xs font-semibold uppercase tracking-widest shadow-[0_0_20px_rgba(230,194,116,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-tertiary animate-spin" style={{ animationDuration: '6s' }} />
            The Benchmark of Luxury Real Estate & Custom Home Construction
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Architecture Beyond Luxury.{' '}
            <span className="bg-gradient-to-r from-tertiary via-[#ebd08c] to-white bg-clip-text text-transparent italic block sm:inline">
              Built for Generations.
            </span>
          </h1>

          <p className="font-sans text-sm sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed font-light">
            Discover an ultra-exclusive collection of sea-facing penthouses and beachfront villas, or commission Shiv Properties to design and build a bespoke architectural masterpiece on your own private land.
          </p>

          {/* Quick Hero Search Bar */}
          <div className="pt-4">
            <HeroSearchBar />
          </div>

          {/* Trust Stat Pills */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-surface-container-low/60 backdrop-blur-md border border-white/5 text-center">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-tertiary block">
                ₹2,400+ Cr
              </span>
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                Portfolio Volume
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low/60 backdrop-blur-md border border-white/5 text-center">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-white block">
                450+
              </span>
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                Residences Delivered
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low/60 backdrop-blur-md border border-white/5 text-center">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-emerald-400 block">
                100%
              </span>
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                MahaRERA Verified
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low/60 backdrop-blur-md border border-white/5 text-center">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-tertiary block">
                0%
              </span>
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                Milestone Overrun
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED RESIDENCES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-tertiary font-semibold">
              <Building2 className="w-4 h-4" /> Signature Acquisitions
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-bold mt-1">
              Curated Luxury Properties
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 font-sans">
              Handpicked residences in Mumbai, Pune, Alibaug, and Lonavala with ready titles.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                  activeCategory === cat
                    ? 'bg-tertiary text-on-tertiary shadow-[0_0_15px_rgba(230,194,116,0.3)]'
                    : 'bg-surface-container-high/60 text-on-surface-variant hover:text-white border border-white/5'
                }`}
              >
                {cat === 'All' ? 'All Residences' : `${cat}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        <div className="text-center pt-4">
          <Link href="/properties">
            <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Full 2026 Luxury Portfolio
            </Button>
          </Link>
        </div>
      </section>

      {/* 3. "BUILD ON YOUR OWN LAND" SPOTLIGHT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-tertiary/40 bg-gradient-to-br from-[#1c1b1b] via-[#151414] to-[#0e0e0e] p-8 sm:p-12 shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-tertiary/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="gold" icon="sparkle">
                Turnkey Custom Construction Service
              </Badge>

              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
                Own a Land Parcel? We&apos;ll Build Your{' '}
                <span className="text-tertiary italic">Architectural Masterpiece.</span>
              </h2>

              <p className="text-sm sm:text-base text-on-surface-variant font-sans leading-relaxed">
                Shiv Properties provides end-to-end turnkey architectural design, civil construction, municipal approvals, and bespoke interior fit-outs for private land owners across Maharashtra & Goa.
              </p>

              {/* 4-Step Process highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-high/40 border border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-tertiary/20 text-tertiary flex items-center justify-center font-serif font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Architectural Blueprint
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      3D BIM modeling, solar passive study, structural layout.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-high/40 border border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-tertiary/20 text-tertiary flex items-center justify-center font-serif font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Clearances & Approvals
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      100% municipal sanctions, CRZ, environmental NOCs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-high/40 border border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-tertiary/20 text-tertiary flex items-center justify-center font-serif font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Civil & Structural Execution
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Seismic Zone IV concrete, German low-E glass, weekly drone audit.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-high/40 border border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-tertiary/20 text-tertiary flex items-center justify-center font-serif font-bold text-sm shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      10-Year Turnkey Handover
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Italian marble polish, smart home setup & warranty certificate.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link href="/build-on-your-land">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Start Custom Build Consultation
                  </Button>
                </Link>
                <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Fixed Price Guarantee
                </span>
              </div>
            </div>

            {/* Visual Preview Side */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=85"
                  alt="Custom Home Construction on Private Land"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#141313]/90 backdrop-blur-md border border-tertiary/30">
                  <span className="text-[10px] uppercase tracking-widest text-tertiary block font-semibold">
                    Recent Custom Handover
                  </span>
                  <div className="text-sm font-serif font-bold text-white">
                    The Glass Monolith Villa (8,500 sqft, Khandala)
                  </div>
                  <div className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Delivered in 14 Months on Client Land
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE SHIV PROPERTIES - 5 PILLARS OF EXCELLENCE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="gold">Craftsmanship & Integrity</Badge>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white">
            The 5 Pillars of Our Luxury Standard
          </h2>
          <p className="text-sm text-on-surface-variant font-sans">
            Every transaction and construction project adheres to unyielding standards of architectural mastery and complete legal clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl bg-surface-container-low/60 backdrop-blur-xl border border-white/10 space-y-4 hover:border-tertiary/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-tertiary/15 border border-tertiary/30 text-tertiary flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-white">
              Zero Legal Risk & Title Guarantee
            </h3>
            <p className="text-xs text-on-surface-variant font-sans leading-relaxed">
              Every property and land parcel undergoes exhaustive 30-year title searches, municipal sanction verification, and environmental clearance audits before listing.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface-container-low/60 backdrop-blur-xl border border-white/10 space-y-4 hover:border-tertiary/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-tertiary/15 border border-tertiary/30 text-tertiary flex items-center justify-center">
              <Hammer className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-white">
              Turnkey Civil & Structural Mastery
            </h3>
            <p className="text-xs text-on-surface-variant font-sans leading-relaxed">
              From cantilevered steel structures to Italian book-matched marble joinery, our in-house civil engineering teams deliver precision without subcontractor dilution.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface-container-low/60 backdrop-blur-xl border border-white/10 space-y-4 hover:border-tertiary/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-tertiary/15 border border-tertiary/30 text-tertiary flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-white">
              Milestone Escrow & Transparency
            </h3>
            <p className="text-xs text-on-surface-variant font-sans leading-relaxed">
              Construction payments are linked strictly to verified third-party site milestones. Track weekly progress via our digital client dashboard and drone feeds.
            </p>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE CALCULATORS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="gold">Financial & Planning Tools</Badge>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Interactive Cost & EMI Estimators
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-sans">
            Calculate custom construction budgets on your plot or structured mortgage payments in real time.
          </p>

          {/* Calculator Toggle Switch */}
          <div className="inline-flex bg-surface-container-high rounded-xl p-1.5 border border-white/10 mt-2">
            <button
              onClick={() => setCalculatorTab('build')}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                calculatorTab === 'build'
                  ? 'bg-tertiary text-on-tertiary shadow-md'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Custom Construction Estimator
            </button>
            <button
              onClick={() => setCalculatorTab('emi')}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                calculatorTab === 'emi'
                  ? 'bg-tertiary text-on-tertiary shadow-md'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Mortgage EMI Calculator
            </button>
          </div>
        </div>

        {calculatorTab === 'build' ? <ConstructionEstimator /> : <EmiCalculator />}
      </section>

      {/* 6. COMPLETED ARCHITECTURAL PROJECTS GALLERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Badge variant="gold" icon="check">
              Proof of Craftsmanship
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-bold mt-1">
              Completed Turnkey Projects
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 font-sans">
              Explore bespoke private residences designed and constructed by Shiv Properties.
            </p>
          </div>

          <Link href="/projects">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Projects
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_PROJECTS.map((project) => (
            <div
              key={project.id}
              className="group bg-surface-container-low/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-tertiary/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={project.images[0]?.url}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge variant="glass">{project.category}</Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-xs text-white/90">
                    <span className="font-medium">{project.location}</span> • {project.built_up_area_sqft.toLocaleString()} sqft
                  </div>
                </div>

                <div className="p-5 space-y-3 font-sans">
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-tertiary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                  {project.client_quote && (
                    <blockquote className="p-3 rounded-lg bg-surface-container-high/50 border-l-2 border-tertiary text-[11px] italic text-on-surface-variant">
                      &quot;{project.client_quote}&quot;
                      <span className="block text-[10px] text-tertiary font-bold mt-1 not-italic">
                        — {project.client_name}
                      </span>
                    </blockquote>
                  )}
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link href="/projects">
                  <Button variant="ghost" size="sm" className="w-full text-xs hover:text-tertiary" rightIcon={<ArrowRight className="w-3 h-3" />}>
                    Explore Project Blueprint & Specs
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CLIENT TESTIMONIALS & TRUST */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="gold">Client Accolades</Badge>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Trusted by Leaders & Visionaries
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-surface-container-low/60 backdrop-blur-xl border border-white/10 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3 font-sans">
                <div className="flex items-center gap-1 text-tertiary">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-tertiary" />
                  ))}
                </div>
                <p className="text-xs text-on-surface leading-relaxed italic">
                  &quot;{t.review_text}&quot;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-tertiary/40 shrink-0">
                  <Image
                    src={t.avatar_url}
                    alt={t.client_name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{t.client_name}</h4>
                  <p className="text-[10px] text-on-surface-variant">{t.designation}</p>
                  <span className="text-[9px] text-tertiary block font-mono">{t.property_type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. MARKET JOURNAL PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Badge variant="gold">Editorial</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-bold mt-1">
              The Architecture & Real Estate Journal
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 font-sans">
              Expert insights on construction sanctions, biophilic design, and luxury investment corridors.
            </p>
          </div>

          <Link href="/blog">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Read All Articles
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_BLOG_POSTS.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-surface-container-low/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-tertiary/40 transition-all duration-300 block"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={post.cover_image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="glass">{post.category}</Badge>
                </div>
              </div>

              <div className="p-5 space-y-2 font-sans">
                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                  {post.read_time_minutes} min read
                </div>
                <h3 className="font-serif text-lg font-bold text-white group-hover:text-tertiary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 9. VIP CONCIERGE LEAD CAPTURE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-tertiary/40 bg-[#161717] p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex items-center justify-center lg:justify-start">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-tertiary/50 shadow-[0_0_30px_rgba(230,194,116,0.25)]">
                <Image
                  src="/images/consultant.png"
                  alt="Senior Luxury Real Estate Consultant"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
              <Badge variant="gold">Private Advisory Desk</Badge>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                Request a Confidential Consultation with Our Senior Partner
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant font-sans max-w-xl leading-relaxed">
                Whether you wish to acquire an iconic off-market penthouse, evaluate land feasibility in Alibaug or Lonavala, or commission turnkey construction, our partners are ready to assist.
              </p>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button
                  onClick={() => openVisitModal()}
                  variant="primary"
                  size="lg"
                  leftIcon={<Calendar className="w-4 h-4" />}
                >
                  Book Private Meeting
                </Button>
                <a href="tel:+919820011223">
                  <Button variant="secondary" size="lg" leftIcon={<PhoneCall className="w-4 h-4 text-tertiary" />}>
                    Direct: +91 98200 11223
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
