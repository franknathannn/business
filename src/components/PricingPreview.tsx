"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingPreview() {
  return (
    <section id="pricing" className="section-padding bg-[#050b18]/60 border-t border-[var(--border-color)]">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Simple, transparent pricing</h2>
          <p className="section-subtitle">
            Start building for free, upgrade to unlock advanced features.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Free Plan */}
          <div className="glass-panel pricing-card">
            <div className="pricing-header">
              <h3 className="pricing-name text-purple-300">Free Tier</h3>
              <div className="pricing-price">
                $0 <span>/ forever</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li><Check className="w-4 h-4" /> 15 free generations/month</li>
              <li><Check className="w-4 h-4" /> Standard generation speed</li>
              <li><Check className="w-4 h-4" /> 3 active listing optimizations</li>
              <li><Check className="w-4 h-4" /> Essential branding assets</li>
            </ul>
            <Link href="/login?signup=true" className="btn btn-outline w-full py-3 text-center rounded-full">
              Get started
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="glass-panel pricing-card premium">
            <div className="pricing-badge">BEST VALUE</div>
            <div className="pricing-header">
              <h3 className="pricing-name text-purple-400">Pro Plan</h3>
              <div className="pricing-price">
                $29 <span>/ month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li><Check className="w-4 h-4" /> Unlimited global generations</li>
              <li><Check className="w-4 h-4" /> Ultra-fast premium rendering</li>
              <li><Check className="w-4 h-4" /> Multi-marketplace optimization</li>
              <li><Check className="w-4 h-4" /> Studio-grade HD photos</li>
              <li><Check className="w-4 h-4" /> Advanced email sequence layouts</li>
              <li><Check className="w-4 h-4" /> 24/7 dedicated user support</li>
            </ul>
            <Link href="/login?signup=true" className="btn btn-primary w-full py-3 text-center rounded-full">
              Unlock everything
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
