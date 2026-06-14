"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Zap, 
  LayoutDashboard, 
  FileText, 
  Palette, 
  TrendingUp, 
  Mail, 
  Globe, 
  ImageIcon,
  History,
  Settings
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.success("Successfully logged out!");
    router.push("/");
  };

  return (
    <div className="dashboard-wrapper">
      
      {/* Sidebar Navigation */}
      <aside className="dash-sidebar">
        <div className="flex flex-col gap-6">
          <Link href="/" className="dash-logo">
            <Zap className="w-5.5 h-5.5 text-purple-500 fill-purple-500" />
            <span>SellForge</span>
          </Link>

          <nav className="dash-nav">
            <Link 
              href="/dashboard" 
              className={`dash-nav-item ${pathname === "/dashboard" ? "active" : ""}`}
            >
              <LayoutDashboard className="dash-nav-item-icon" />
              <span>Dashboard</span>
            </Link>
            
            <div className="dash-nav-divider"></div>
            
            <Link 
              href="/dashboard/product-desc" 
              className={`dash-nav-item ${pathname === "/dashboard/product-desc" ? "active" : ""}`}
            >
              <FileText className="dash-nav-item-icon" />
              <span>Product desc.</span>
            </Link>

            <Link 
              href="/dashboard/brand-kit" 
              className={`dash-nav-item ${pathname === "/dashboard/brand-kit" ? "active" : ""}`}
            >
              <Palette className="dash-nav-item-icon" />
              <span>Brand kit</span>
            </Link>

            <Link 
              href="/dashboard/listing-opt" 
              className={`dash-nav-item ${pathname === "/dashboard/listing-opt" ? "active" : ""}`}
            >
              <TrendingUp className="dash-nav-item-icon" />
              <span>Listing opt.</span>
            </Link>

            <button 
              className={`dash-nav-item ${pathname === "/dashboard/email-seq" ? "active" : ""}`}
              onClick={() => toast.info("Email Sequence Generator requires Pro plan! Select a tool below or upgrade.")}
            >
              <Mail className="dash-nav-item-icon" />
              <span>Email seq.</span>
            </button>

            <button 
              className={`dash-nav-item ${pathname === "/dashboard/coming-soon" ? "active" : ""}`}
              onClick={() => toast.info("One-Page Coming Soon Builder requires Pro plan! Select a tool below or upgrade.")}
            >
              <Globe className="dash-nav-item-icon" />
              <span>Coming soon</span>
            </button>

            <button 
              className={`dash-nav-item ${pathname === "/dashboard/photo-tool" ? "active" : ""}`}
              onClick={() => toast.info("Product Photo Background Remover requires Pro plan! Select a tool below or upgrade.")}
            >
              <ImageIcon className="dash-nav-item-icon" />
              <span>Photo tool</span>
            </button>

            <div className="dash-nav-divider"></div>

            <button 
              className="dash-nav-item"
              onClick={() => toast.info("Generation logs will load here. Connect your Supabase table in Settings.")}
            >
              <History className="dash-nav-item-icon" />
              <span>History</span>
            </button>

            <button 
              className="dash-nav-item"
              onClick={() => toast.info("Settings panel configuration loading...")}
            >
              <Settings className="dash-nav-item-icon" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-3 mt-8">
          <div className="text-xs text-[var(--text-muted)] text-center">
            Logged in as Alex J.
          </div>
          <button onClick={handleLogout} className="btn btn-outline text-xs py-2 w-full text-center rounded-lg">
            Log out
          </button>
        </div>
      </aside>

      {/* Child Route Container */}
      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
