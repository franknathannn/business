"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, FileText, Palette, TrendingUp, Mail, Globe, Image as ImageIcon } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

export default function ToolsShowcase() {
  const router = useRouter();

  const tools: Tool[] = [
    {
      id: "product-desc",
      name: "AI Product Description Generator",
      desc: "Generate high-converting, SEO-optimized descriptions for any product in seconds.",
      icon: <FileText className="w-6 h-6" />,
      color: "#9333ea"
    },
    {
      id: "brand-kit",
      name: "Store Name + Brand Kit Generator",
      desc: "Design your complete store identity and assets with stunning brand mockups instantly.",
      icon: <Palette className="w-6 h-6" />,
      color: "#06b6d4"
    },
    {
      id: "listing-opt",
      name: "Etsy/Amazon Listing Optimizer",
      desc: "Analyze and boost your organic search rankings on top global marketplaces.",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "#10b981"
    },
    {
      id: "email-sequence",
      name: "AI Email Sequence Generator",
      desc: "Draft highly engaging sequences for welcome series, discounts, or cart recoveries.",
      icon: <Mail className="w-6 h-6" />,
      color: "#f59e0b"
    },
    {
      id: "coming-soon",
      name: "One-Page Coming Soon Builder",
      desc: "Publish responsive landing pages instantly to validate ideas and collect early leads.",
      icon: <Globe className="w-6 h-6" />,
      color: "#ec4899"
    },
    {
      id: "bg-remover",
      name: "Product Photo Background Remover",
      desc: "Isolate items perfectly to create professional, studio-grade listings in one click.",
      icon: <ImageIcon className="w-6 h-6" />,
      color: "#3b82f6"
    }
  ];

  const handleToolClick = (toolName: string) => {
    toast.success(`Opening ${toolName} simulator! Redirecting to setup page.`);
    router.push(`/login?redirect=${encodeURIComponent(toolName.toLowerCase().replace(/\s+/g, "-"))}`);
  };

  return (
    <section id="tools" className="section-padding">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">6 tools. One toolkit.</h2>
          <p className="section-subtitle">
            Supercharge your digital storefront with professional artificial intelligence.
          </p>
        </div>

        <div className="tools-grid">
          {tools.map((tool) => (
            <div 
              key={tool.id} 
              className="glass-panel tool-card hover-lift cursor-pointer"
              onClick={() => handleToolClick(tool.name)}
            >
              <div 
                className="tool-icon-wrapper"
                style={{ backgroundColor: `${tool.color}15`, color: tool.color }}
              >
                {tool.icon}
              </div>
              <h3 className="tool-name">{tool.name}</h3>
              <p className="tool-desc">{tool.desc}</p>
              <span className="tool-link">
                Try it <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
