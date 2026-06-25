"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function DashboardNavbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(data.authenticated);
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-white/80 border-b border-gray-200 shadow-sm transition-all duration-300">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
          <div className="relative bg-gradient-to-br from-emerald-400 to-cyan-500 p-2.5 rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105">
            <Activity className="w-5 h-5 text-white" />
          </div>
        </div>
        <span className="text-xl font-extrabold text-gray-900 tracking-tight transition-colors duration-300 group-hover:text-emerald-600 hidden sm:inline-block">
          Zgrow <span className="text-emerald-500">Patient Manager</span>
        </span>
      </Link>
      
      <div className="flex items-center gap-3">
        {isAuthenticated && (
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="text-gray-600 hover:text-red-600 hover:bg-red-50 font-bold text-sm h-10 px-4 sm:px-5 rounded-xl transition-all duration-300 hover:shadow-sm"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        )}
      </div>
    </nav>
  );
}
