"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Star, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-glow"></div>
      <div className="container hero-content">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-xs font-semibold tracking-wider text-purple-300 uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Introducing SellForge 1.0
        </div>
        
        <h1 className="hero-title max-w-4xl mx-auto">
          Everything you need to <span className="gradient-text">sell more online.</span>
        </h1>
        
        <p className="hero-subtitle mx-auto">
          AI-powered tools that write your listings, build your brand, and grow your store — in seconds.
        </p>
        
        <div className="hero-ctas">
          <Link href="/login?signup=true" className="btn btn-primary px-8 py-3 rounded-full text-base">
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how-it-works" className="btn btn-outline px-8 py-3 rounded-full text-base">
            See how it works
          </a>
        </div>

        <div className="hero-social-proof">
          <div className="stars-container">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
            ))}
          </div>
          <span>Trusted by 2,400+ sellers worldwide</span>
        </div>
      </div>
    </section>
  );
}
