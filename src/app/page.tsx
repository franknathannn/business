"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ToolsShowcase from "@/components/ToolsShowcase";
import DemoFlow from "@/components/DemoFlow";
import Testimonials from "@/components/Testimonials";
import PricingPreview from "@/components/PricingPreview";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] flex flex-col selection:bg-purple-900 selection:text-purple-100">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <ToolsShowcase />
        <DemoFlow />
        <Testimonials />
        <PricingPreview />
      </main>
      <Footer />
    </div>
  );
}
