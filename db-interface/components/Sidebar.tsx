"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useTheme } from "./ThemeProvider";

const navigation = [
  { name: "Dashboard", href: "/", icon: "📊" },
  { name: "Modules", href: "/modules", icon: "📚" },
  { name: "Questions", href: "/questions", icon: "❓" },
  { name: "Historique", href: "/history", icon: "📜" },
  { name: "Ressources", href: "/resources", icon: "📁" },
  { name: "Santé Données", href: "/data-health", icon: "🩺" },
];

const ownerOnlyNavigation = [
  { name: "Statistiques", href: "/statistics", icon: "📈", badge: "Owner" },
  { name: "Tendance", href: "/tendance", icon: "🔥", badge: "Owner" },
  { name: "Utilisateurs", href: "/users", icon: "👥", badge: "Owner" },
  { name: "Courses", href: "/courses", icon: "📝", badge: "Owner" },
  {
    name: "Codes d'Activation",
    href: "/activation-codes",
    icon: "🔑",
    badge: "Owner",
  },
  { name: "Paiements", href: "/payments", icon: "💳", badge: "Owner" },
  { name: "Renouvellements", href: "/renewals", icon: "🔄", badge: "Owner" },
  { name: "Revenus", href: "/revenue", icon: "📈", badge: "Owner" },
  { name: "Contributions", href: "/contributions", icon: "💰", badge: "Owner" },
  { name: "Signalements", href: "/reports", icon: "🚩", badge: "Owner" },
  { name: "Feedbacks", href: "/feedbacks", icon: "💬", badge: "Owner" },
  {
    name: "Visualiseur de Backup",
    href: "/backup-viewer",
    icon: "💾",
    badge: "Owner",
  },
  { name: "Export JSON", href: "/export", icon: "📤", badge: "Owner" },
  { name: "AI Chat", href: "/ai-chat", icon: "🤖", badge: "AI" },
  { name: "AI Analytics", href: "/ai-analytics", icon: "📊", badge: "AI" },
  { name: "Knowledge Base", href: "/knowledge", icon: "📚", badge: "RAG" },
  { name: "Paramètres", href: "/settings", icon: "⚙️", badge: "Owner" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: user } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (user) {
          setUserRole(user.role);
        }
      }
    };

    fetchUserRole();
  }, []);

  // Fetch maintenance mode status
  useEffect(() => {
    const fetchMaintenanceMode = async () => {
      const { data } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      if (data) {
        setMaintenanceMode(data.value === "true");
      }
    };

    fetchMaintenanceMode();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("app_config_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_config",
          filter: "key=eq.maintenance_mode",
        },
        (payload) => {
          setMaintenanceMode(payload.new.value === "true");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Toggle maintenance mode
  const toggleMaintenanceMode = useCallback(async () => {
    if (isTogglingMaintenance) return;

    const newValue = !maintenanceMode;
    const confirmMessage = newValue
      ? "⚠️ Activer le mode maintenance ?\n\nLes utilisateurs ne pourront plus accéder à l'application mobile."
      : "✅ Désactiver le mode maintenance ?\n\nLes utilisateurs pourront à nouveau accéder à l'application.";

    if (!confirm(confirmMessage)) return;

    setIsTogglingMaintenance(true);
    try {
      const { error } = await supabase
        .from("app_config")
        .update({
          value: newValue ? "true" : "false",
          updated_at: new Date().toISOString(),
        })
        .eq("key", "maintenance_mode");

      if (error) {
        alert("Erreur: " + error.message);
      } else {
        setMaintenanceMode(newValue);
      }
    } catch (err) {
      console.error("Failed to toggle maintenance mode:", err);
    } finally {
      setIsTogglingMaintenance(false);
    }
  }, [maintenanceMode, isTogglingMaintenance]);

  return (
    <>
      {/* Mobile Header */}
      <div
        className={`md:hidden bg-theme-card border-b border-theme p-4 flex items-center justify-between sticky top-0 z-50 transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image
              src="/logo.png"
              alt="FMC APP Logo"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700">
              FMC APP
            </h1>
            <p
              className={`${isDark ? "text-slate-400" : "text-slate-500"} text-[10px] uppercase tracking-wider font-semibold`}
            >
              Admin Panel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 hover:bg-theme-secondary rounded-lg transition-colors border border-theme shadow-sm`}
            aria-label="Toggle theme"
          >
            {isDark ? "🌙" : "☀️"}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 hover:bg-theme-secondary rounded-lg transition-colors border border-theme shadow-sm`}
            aria-label="Toggle menu"
          >
            <svg
              className={`w-6 h-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:sticky top-0 md:left-0 z-50
          w-72 h-[100dvh] md:h-screen bg-theme-card border-r border-theme p-6
          transform transition-transform duration-300 ease-in-out
          md:transform-none shadow-xl md:shadow-none flex flex-col overflow-y-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Desktop Header */}
        <div className="mb-10 hidden md:flex items-center gap-4">
          <div
            className={`relative w-12 h-12 bg-primary/10 p-2 rounded-xl border border-primary/20 shadow-sm`}
          >
            <Image
              src="/logo.png"
              alt="FMC APP Logo"
              fill
              className="object-contain p-2"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary-700">
              FMC APP
            </h1>
            <p className="text-theme-muted text-xs uppercase tracking-widest font-bold">
              Admin Panel
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 mt-4 md:mt-0 flex-1 overflow-y-auto min-h-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? isDark
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(9,178,172,0.1)]"
                      : "bg-primary/10 text-primary shadow-sm border border-primary/20"
                    : "text-theme-secondary hover:bg-theme-secondary hover:text-primary"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`text-xl transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-semibold tracking-tight">
                    {item.name}
                  </span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(9,178,172,0.6)]"></div>
                )}
              </Link>
            );
          })}

          {/* Owner-only navigation */}
          {userRole === "owner" && (
            <>
              <div className="pt-6 pb-2 px-4">
                <span
                  className={`text-[10px] font-bold ${isDark ? "text-slate-500" : "text-slate-400"} uppercase tracking-[0.2em]`}
                >
                  Management
                </span>
              </div>
              {ownerOnlyNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "text-theme-secondary hover:bg-theme-secondary hover:text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`text-xl transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                      >
                        {item.icon}
                      </span>
                      <span className="font-semibold tracking-tight">
                        {item.name}
                      </span>
                    </div>
                    {item.badge && !isActive && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 bg-theme-secondary text-theme-muted rounded-full uppercase tracking-tighter border border-theme`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Theme Toggle */}
        <div className={`mt-4 pt-4 border-t border-theme flex-shrink-0`}>
          {/* Maintenance Mode Toggle - Owner Only */}
          {userRole === "owner" && (
            <button
              onClick={toggleMaintenanceMode}
              disabled={isTogglingMaintenance}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl mb-3 transition-all duration-300 group shadow-sm hover:shadow-md ${
                maintenanceMode
                  ? "bg-red-500/10 text-red-500 border-2 border-red-500/50"
                  : "bg-theme-secondary text-theme-secondary border border-theme"
              } ${isTogglingMaintenance ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`text-xl transition-all duration-300 ${maintenanceMode ? "animate-pulse" : ""}`}
                >
                  🔧
                </span>
                <div className="text-left">
                  <span className="font-bold text-sm block">
                    Mode Maintenance
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider ${maintenanceMode ? "text-red-400" : "text-theme-muted"}`}
                  >
                    {maintenanceMode ? "🔴 Actif" : "⚪ Inactif"}
                  </span>
                </div>
              </div>
              <div
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                  maintenanceMode
                    ? "bg-red-500"
                    : "bg-neutral-light border border-theme"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform duration-300 ${
                    maintenanceMode ? "translate-x-4" : "translate-x-0"
                  }`}
                ></div>
              </div>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-theme-secondary text-theme-secondary border border-theme transition-all duration-300 group shadow-sm hover:shadow-md`}
          >
            <div className="flex items-center gap-4">
              <span className="text-xl transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-125">
                {isDark ? "🌙" : "☀️"}
              </span>
              <span className="font-bold text-sm uppercase tracking-widest px-1">
                {isDark ? "Nuit" : "Jour"}
              </span>
            </div>
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${isDark ? "bg-primary" : "bg-neutral-light border border-theme"}`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform duration-300 ${isDark ? "translate-x-4" : "translate-x-0"}`}
              ></div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
