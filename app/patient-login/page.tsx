"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Key, Lock, UserCheck } from "lucide-react";

export default function PatientLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/auth/patient-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login failed");

      toast.success(`Welcome back, ${result.patient.firstName}!`);
      router.push("/patient-dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-emerald-500/30 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-100 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <Navbar />

      <main className="relative z-10 pt-28 pb-16 px-6 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-2xl bg-white border border-gray-200 p-7 shadow-sm">
            <div className="text-center mb-7">
              <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Patient Portal</h1>
              <p className="text-xs text-gray-500 mt-1 font-light">
                Sign in with your Patient ID and Password
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="patientId" className="text-xs text-gray-600 font-medium">Patient ID</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <Input id="patientId" name="patientId" required placeholder="e.g. AK-9101" className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm h-9 pl-9 focus:border-emerald-500/50" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-gray-600 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <Input id="password" name="password" type="password" required placeholder="••••••••" className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm h-9 pl-9 focus:border-emerald-500/50" />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 border-0 mt-2">
                {isLoading ? "Signing in..." : "Access Portal"}
              </Button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
