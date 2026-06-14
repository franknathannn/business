"use client";

import React from "react";
import { Star } from "lucide-react";

export default function Testimonials() {
  return (
    <section id="testimonials" className="section-padding">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Loved by store owners</h2>
          <p className="section-subtitle">
            See how Etsy, Shopify, and Amazon sellers are scaling their workflows.
          </p>
        </div>

        <div className="testimonials-grid">
          {/* Testimonial 1 */}
          <div className="glass-panel testimonial-card">
            <div className="stars-container">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <blockquote className="testimonial-quote">
              "Saved me hours every week on product listings. The description generator writes high-end copy that matches my exact tone."
            </blockquote>
            <div className="testimonial-user">
              <div className="avatar-placeholder">SK</div>
              <div className="user-info">
                <span className="user-name">Sarah K.</span>
                <span className="user-store">Etsy Candle Seller</span>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="glass-panel testimonial-card">
            <div className="stars-container">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <blockquote className="testimonial-quote">
              "The brand kit generator and background remover gave my store an instant facelift. Sales are up 35% since refreshing my imagery."
            </blockquote>
            <div className="testimonial-user">
              <div className="avatar-placeholder">MD</div>
              <div className="user-info">
                <span className="user-name">Marcus D.</span>
                <span className="user-store">Shopify Fashion Retailer</span>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="glass-panel testimonial-card">
            <div className="stars-container">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <blockquote className="testimonial-quote">
              "The marketplace listing optimizer got my items onto the first page of search results. Outstanding product."
            </blockquote>
            <div className="testimonial-user">
              <div className="avatar-placeholder">JL</div>
              <div className="user-info">
                <span className="user-name">Julie L.</span>
                <span className="user-store">Amazon Tech Brand Owner</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
