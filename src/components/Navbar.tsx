"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky-nav">
      <div className="container navbar-container">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold font-display text-white decoration-0">
          <Zap className="w-6 h-6 text-purple-500 fill-purple-500" />
          <span>SellForge</span>
        </Link>

        {/* Desktop Nav links */}
        <nav className="nav-links">
          <a href="#tools" className="nav-link">Tools</a>
          <a href="#how-it-works" className="nav-link">How it Works</a>
          <a href="#testimonials" className="nav-link">Reviews</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <Link href="/login" className="btn btn-outline text-sm py-2 px-4 rounded-full">
            Login
          </Link>
          <Link href="/login?signup=true" className="btn btn-dark text-sm py-2 px-4 rounded-full font-bold">
            Start free
          </Link>
        </nav>

        {/* Mobile hamburger menu button */}
        <button 
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <a href="#tools" className="nav-link py-2" onClick={() => setMobileMenuOpen(false)}>Tools</a>
          <a href="#how-it-works" className="nav-link py-2" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
          <a href="#testimonials" className="nav-link py-2" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
          <a href="#pricing" className="nav-link py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <hr className="border-[var(--border-color)] my-1" />
          <Link href="/login" className="btn btn-outline w-full py-2.5 rounded-full" onClick={() => setMobileMenuOpen(false)}>
            Login
          </Link>
          <Link href="/login?signup=true" className="btn btn-primary w-full py-2.5 rounded-full text-center" onClick={() => setMobileMenuOpen(false)}>
            Start free
          </Link>
        </div>
      )}
    </header>
  );
}
