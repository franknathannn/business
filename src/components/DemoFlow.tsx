"use client";

import React from "react";

export default function DemoFlow() {
  return (
    <section id="how-it-works" className="section-padding bg-[#050b18]/60 border-y border-[var(--border-color)]">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Seamless setup in seconds</h2>
          <p className="section-subtitle">
            Skip the complicated guides. Launch and generate assets instantly.
          </p>
        </div>

        <div className="demo-flow">
          {/* Step 1 */}
          <div className="demo-step">
            <div className="step-number">1</div>
            <div className="glass-panel demo-step-card">
              <div className="step-icon">🎯</div>
              <h3 className="step-title">Pick a tool</h3>
              <p className="step-desc">Select any of our 6 dedicated utilities from the toolkit dashboard.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="demo-step">
            <div className="step-number">2</div>
            <div className="glass-panel demo-step-card">
              <div className="step-icon">📝</div>
              <h3 className="step-title">Fill in your details</h3>
              <p className="step-desc">Enter your product information or upload photos into the intuitive panel.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="demo-step">
            <div className="step-number">3</div>
            <div className="glass-panel demo-step-card">
              <div className="step-icon">✨</div>
              <h3 className="step-title">Get results instantly</h3>
              <p className="step-desc">Download, copy, or launch your studio-grade copy and brand assets immediately.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
