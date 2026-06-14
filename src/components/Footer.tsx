"use client";

import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="container">
        <div className="footer-grid">
          {/* Brand column */}
          <div className="footer-brand">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold font-display text-white decoration-0">
              <Zap className="w-6 h-6 text-purple-500 fill-purple-500" />
              <span>SellForge</span>
            </Link>
            <p className="footer-desc">
              AI-powered tools built specifically for digital store operators to list, style, and double sales.
            </p>
          </div>

          {/* Product Column */}
          <div className="footer-column">
            <span className="footer-column-title">Product</span>
            <ul className="footer-links">
              <li><a href="#tools">AI Description Builder</a></li>
              <li><a href="#tools">Marketplace SEO</a></li>
              <li><a href="#tools">Coming Soon Landing Pages</a></li>
              <li><a href="#tools">Email Sequences</a></li>
              <li><a href="#tools">Background Remover</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="footer-column">
            <span className="footer-column-title">Company</span>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Blog Insights</a></li>
              <li><a href="#">Customer Success</a></li>
              <li><a href="#">Contact Support</a></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="footer-column">
            <span className="footer-column-title">Legal</span>
            <ul className="footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">GDPR Compliance</a></li>
              <li><a href="#">Security Protocols</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SellForge Technologies Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
