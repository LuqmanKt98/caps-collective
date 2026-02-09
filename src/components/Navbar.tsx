"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

export default function Navbar() {
  const { user, userData, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = userData?.isAdmin
    ? [
      { href: "/admin", label: "Admin", icon: "⚙️" },
      { href: "/needs", label: "Needs Board", icon: "📋" },
      { href: "/search", label: "Search", icon: "🔍" },
    ]
    : [
      { href: "/dashboard", label: "Dashboard", icon: "📊" },
      { href: "/needs", label: "Needs Board", icon: "📋" },
      { href: "/search", label: "Search", icon: "🔍" },
    ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#D4C4A8] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          <div className="flex items-center">
            <Link
              href={userData?.isAdmin ? "/admin" : "/dashboard"}
              className="group"
            >
              <Logo
                size="header"
                showText={true}
                className="group-hover:scale-105 transition-transform"
              />
            </Link>
            <div className="hidden md:flex ml-10 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive(link.href)
                    ? "bg-[#00245D] text-white"
                    : "text-[#00245D] hover:text-[#00245D] hover:bg-[#99D6EA]/30"
                    }`}
                >
                  <span className="mr-1.5">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#00245D] hover:bg-[#99D6EA]/30"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    mobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[#99D6EA]/20 transition-colors"
              >
                <div className="w-9 h-9 bg-[#00245D] rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-[#00245D]/20 overflow-hidden">
                  {userData?.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userData.profilePhoto} alt={userData?.displayName || "Profile"} className="w-full h-full object-cover" />
                  ) : (
                    userData?.displayName?.[0] ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-[#00245D]">
                    {userData?.displayName || "User"}
                  </div>
                  <div className="text-xs text-[#00245D]/60 truncate max-w-[120px]">
                    {user?.email}
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-[#00245D]/60 hidden md:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 z-50 border border-[#D4C4A8] animate-fadeIn">
                  <div className="px-4 py-3 border-b border-[#D4C4A8]">
                    <div className="text-sm font-medium text-[#00245D]">
                      {userData?.displayName || "User"}
                    </div>
                    <div className="text-xs text-[#00245D]/60 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#00245D] hover:bg-[#99D6EA]/20 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>👤</span> Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span>🚪</span> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#D4C4A8] animate-fadeIn">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${isActive(link.href)
                  ? "bg-[#00245D] text-white"
                  : "text-[#00245D] hover:bg-[#99D6EA]/30"
                  }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
