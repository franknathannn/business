"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  FileText, 
  Palette, 
  TrendingUp, 
  Mail, 
  Globe, 
  Image as ImageIcon,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Lock,
  X
} from "lucide-react";

interface RecentItem {
  id: string;
  title: string;
  tool: string;
  date: string;
  icon: React.ReactNode;
  color: string;
  content: string;
}

export default function DashboardHome() {
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [usesCount, setUsesCount] = useState(2);
  const [greeting, setGreeting] = useState("Good morning");
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedRecent, setSelectedRecent] = useState<RecentItem | null>(null);

  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs >= 12 && hrs < 17) {
      setGreeting("Good afternoon");
    } else if (hrs >= 17) {
      setGreeting("Good evening");
    }
  }, []);

  const tools = [
    {
      id: "product-desc",
      name: "AI Product Description Generator",
      desc: "Write 5 descriptions instantly.",
      href: "/dashboard/product-desc",
      icon: <FileText className="w-5 h-5" />,
      color: "#9333ea",
      requiresPro: false
    },
    {
      id: "brand-kit",
      name: "Store Name + Brand Kit Generator",
      desc: "Names, colors, fonts, taglines.",
      href: "/dashboard/brand-kit",
      icon: <Palette className="w-5 h-5" />,
      color: "#06b6d4",
      requiresPro: false
    },
    {
      id: "listing-opt",
      name: "Etsy/Amazon Listing Optimizer",
      desc: "marketplace SEO and tags generator.",
      href: "/dashboard/listing-opt",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "#10b981",
      requiresPro: false
    },
    {
      id: "email-sequence",
      name: "AI Email Sequence Generator",
      desc: "Welcome and cart recovery series.",
      href: "#",
      icon: <Mail className="w-5 h-5" />,
      color: "#f59e0b",
      requiresPro: true
    },
    {
      id: "coming-soon",
      name: "One-Page Coming Soon Builder",
      desc: "Validate pre-sales instantly.",
      href: "#",
      icon: <Globe className="w-5 h-5" />,
      color: "#ec4899",
      requiresPro: true
    },
    {
      id: "photo-tool",
      name: "Product Photo Background Remover",
      desc: "Clean studio-grade catalog shots.",
      href: "#",
      icon: <ImageIcon className="w-5 h-5" />,
      color: "#3b82f6",
      requiresPro: true
    }
  ];

  const recentGenerations: RecentItem[] = [
    {
      id: "rec-1",
      title: "Handmade Soy Wax Lavender Candle",
      tool: "AI Product Description Generator",
      date: "Today, 9:34 AM",
      icon: <FileText className="w-4 h-4" />,
      color: "#9333ea",
      content: "Escape into serenity with our premium Handcrafted Soy Wax Lavender Candle. Poured carefully in micro-batches with 100% natural, eco-friendly soy wax, this candle infuses your room with the soothing essence of botanical lavender fields. Ideal for yoga sessions, deep meditation, or unwinding after a long work day.\n\n✨ Burn time: 45 hours\n✨ Key notes: Sweet French Lavender, Vanilla bean, fresh eucalyptus."
    },
    {
      id: "rec-2",
      title: "EcoLeaf Naturals",
      tool: "Store Name + Brand Kit Generator",
      date: "Yesterday, 4:12 PM",
      icon: <Palette className="w-4 h-4" />,
      color: "#06b6d4",
      content: "Brand Kit Proposal: EcoLeaf Naturals\n\n🌿 Brand Name Options: EcoLeaf Naturals, LeafPure Organic, GreenRoots Co.\n🎨 Primary Colors: Mint Green (#A7F3D0), Slate Black (#1F2937), Cream (#FDFBF7)\n💡 Tagline: 'Pure by Nature, Gentle by Design.'\n📖 Font Pairing: Outfit / Inter"
    },
    {
      id: "rec-3",
      title: "Ceramic Minimalist Mug Listing",
      tool: "Etsy/Amazon Listing Optimizer",
      date: "May 25, 2:30 PM",
      icon: <TrendingUp className="w-4 h-4" />,
      color: "#10b981",
      content: "Listing Optimization Report:\n\n🔑 Main Optimized Keywords: 'minimalist ceramic mug', 'scandinavian coffee cup', 'handmade clay mug'\n🏷️ Top Recommended tags:\nminimalist mug, scandinavian cup, clay tableware, boho style mug, ceramic coffee mug, pottery lover."
    }
  ];

  const handleUpgradeClick = () => {
    setPlan("pro");
    toast.success("Simulation Upgrade Successful! Welcome to SellForge PRO.");
  };

  const handleToolClick = (e: React.MouseEvent, tool: typeof tools[0]) => {
    const isLocked = plan === "free" && (usesCount >= 3 || tool.requiresPro);
    if (isLocked) {
      e.preventDefault();
      toast.error(`The tool "${tool.name}" is locked. Upgrade to Pro to bypass daily limits!`);
    }
  };

  return (
    <main className="dash-main flex-grow">
      {/* Plan Switcher Simulator */}
      <div className="plan-switcher-container">
        <div className="plan-switcher">
          <button 
            className={`plan-switcher-btn ${plan === "free" ? "active" : ""}`}
            onClick={() => { setPlan("free"); toast.info("Switched dashboard to FREE plan view."); }}
          >
            Free View
          </button>
          <button 
            className={`plan-switcher-btn ${plan === "pro" ? "active" : ""}`}
            onClick={() => { setPlan("pro"); toast.info("Switched dashboard to PRO plan view."); }}
          >
            Pro View
          </button>
        </div>
      </div>

      {/* Top Greeting section with Usage Indicator */}
      <section className="dash-header-section">
        <h1 className="dash-greeting">{greeting}, Alex</h1>
        
        <div 
          className="usage-bar-row"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => {
            if (plan === "free") {
              setUsesCount(usesCount === 3 ? 0 : usesCount + 1);
              toast.info(`Usage simulated: ${usesCount === 3 ? 0 : usesCount + 1}/3 uses today.`);
            }
          }}
        >
          <span>
            {plan === "free" ? `${3 - usesCount} of 3 uses remaining today` : "Unlimited uses active (Pro)"}
          </span>
          <div className="usage-bar-bg">
            <div 
              className="usage-bar-fill" 
              style={{ width: plan === "free" ? `${((3 - usesCount) / 3) * 100}%` : "100%" }}
            ></div>
          </div>
          <HelpCircle className="w-4 h-4 text-purple-400" />
          
          {showTooltip && (
            <div className="usage-tooltip">
              <p className="font-semibold mb-1 text-white">Daily Conversion Limits</p>
              {plan === "free" ? (
                <p>Free accounts get 3 generations daily. Click the bar to cycle mock usage counts.</p>
              ) : (
                <p>Unlimited premium generations are active on your Pro subscription.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Stats metrics row */}
      <section className="dash-stats-row">
        <div className="glass-panel stat-card">
          <span className="stat-label">Uses Today</span>
          <div className="stat-val">
            {plan === "free" ? `${usesCount} / 3` : "0"}
          </div>
          <span className="stat-meta text-[var(--text-muted)]">Resets in 14 hours</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-label">Total Generated</span>
          <div className="stat-val">
            {plan === "free" ? "12" : "47"}
          </div>
          <span className="stat-meta text-[var(--text-muted)]">Across all active tools</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-label">Current Plan</span>
          <div className="stat-val capitalize">
            {plan}
          </div>
          {plan === "free" ? (
            <button 
              onClick={handleUpgradeClick} 
              className="stat-upgrade-link bg-transparent border-none p-0 cursor-pointer text-left font-bold"
            >
              Upgrade to Pro →
            </button>
          ) : (
            <span className="stat-meta text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Premium Active
            </span>
          )}
        </div>
      </section>

      {/* Toolkit Grid */}
      <section className="tools-section">
        <h2 className="dash-section-title">Your SellForge Toolkit</h2>
        
        <div className="dash-tools-grid">
          {tools.map((tool) => {
            const isLocked = plan === "free" && (usesCount >= 3 || tool.requiresPro);

            return (
              <Link 
                href={isLocked ? "#" : tool.href}
                key={tool.id} 
                className={`glass-panel dash-tool-card hover-lift ${isLocked ? "locked" : ""}`}
                onClick={(e) => handleToolClick(e, tool)}
                style={{ textDecoration: "none" }}
              >
                <div className="dash-tool-info">
                  <div 
                    className="dash-tool-icon"
                    style={{ backgroundColor: `${tool.color}15`, color: tool.color }}
                  >
                    {tool.icon}
                  </div>
                  <div className="dash-tool-details">
                    <span className="dash-tool-name">{tool.name}</span>
                    <span className="dash-tool-desc">{tool.desc}</span>
                  </div>
                </div>

                <div className="dash-tool-action">
                  {isLocked ? (
                    <span className="lock-badge">
                      <Lock className="w-4 h-4" />
                      <span>Upgrade</span>
                    </span>
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Generations section */}
      <section className="recent-section">
        <h2 className="dash-section-title">Recent Generations</h2>
        
        <div className="glass-panel recent-table-card">
          {recentGenerations.map((item) => (
            <div key={item.id} className="recent-row">
              <div className="recent-item-info">
                <div 
                  className="recent-item-icon"
                  style={{ backgroundColor: `${item.color}15`, color: item.color }}
                >
                  {item.icon}
                </div>
                <div className="recent-item-details">
                  <span className="recent-item-title">{item.title}</span>
                  <span className="recent-item-type">{item.tool}</span>
                </div>
              </div>

              <div className="recent-right">
                <span className="recent-date">{item.date}</span>
                <button 
                  className="btn-view-recent"
                  onClick={() => { setSelectedRecent(item); toast.success(`Viewing ${item.title}`); }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upgrade alert banner - Free users only */}
      {plan === "free" && (
        <section className="upgrade-banner-card">
          <div className="upgrade-banner-content">
            <h3 className="upgrade-banner-title flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400 fill-purple-400 animate-pulse" />
              Unlock unlimited generations
            </h3>
            <p className="upgrade-banner-desc">
              Upgrade to Pro for just $19/month and get lifetime unlimited access to background removers, coming-soon builders, and our premium email sequence generator.
            </p>
          </div>
          <button 
            onClick={handleUpgradeClick}
            className="btn btn-primary px-6 py-3 rounded-full flex-shrink-0"
          >
            Upgrade now
          </button>
        </section>
      )}

      {/* View Output Detail Overlay Dialog Modal */}
      {selectedRecent && (
        <div className="modal-overlay" onClick={() => setSelectedRecent(null)}>
          <div 
            className="glass-panel modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ borderTop: `4px solid ${selectedRecent.color}` }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Saved Output</h3>
              <button className="modal-close-btn" onClick={() => setSelectedRecent(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="modal-body">
              <div className="flex justify-between items-center">
                <span className="modal-tag" style={{ color: selectedRecent.color, borderColor: `${selectedRecent.color}30`, backgroundColor: `${selectedRecent.color}10` }}>
                  {selectedRecent.tool}
                </span>
                <span className="modal-date">{selectedRecent.date}</span>
              </div>
              <h4 className="text-white text-lg font-bold mt-2">{selectedRecent.title}</h4>
              <div className="modal-block">{selectedRecent.content}</div>
              <div className="flex gap-3 justify-end mt-4">
                <button 
                  className="btn btn-outline text-xs py-2 px-4 rounded-lg"
                  onClick={() => { navigator.clipboard.writeText(selectedRecent.content); toast.success("Copied!"); }}
                >
                  Copy
                </button>
                <button className="btn btn-primary text-xs py-2 px-4 rounded-lg" onClick={() => setSelectedRecent(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
