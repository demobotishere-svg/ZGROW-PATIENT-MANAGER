"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserCircle2, Activity } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-emerald-500/30 overflow-hidden relative flex flex-col">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-b from-emerald-100 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-100 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-50 blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <Navbar />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-24 px-6 max-w-4xl mx-auto w-full">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center w-full"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-emerald-500/10 flex items-center justify-center border border-emerald-100">
              <Activity className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          
          <h1 className="text-[3rem] md:text-[4rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-6 text-gray-900">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Zgrow Patient Manager</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-xl mx-auto leading-relaxed font-medium">
            Access your medical records, upload new reports, and manage your health information easily and securely.
          </p>

          <div className="flex flex-col items-center justify-center gap-6">
            <Link href="/scan" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white h-16 px-10 rounded-2xl text-xl font-bold shadow-xl shadow-emerald-500/25 border-0 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02] flex items-center justify-center gap-3">
                <UserCircle2 className="w-6 h-6" />
                I am a Patient
              </Button>
            </Link>
            
            <p className="text-gray-500 text-sm font-medium mt-4">
              Click the button above and hold your card up to the camera to enter.
            </p>
          </div>
        </motion.div>

      </main>

      {/* Footer / Staff Link */}
      <footer className="relative z-10 w-full py-8 text-center mt-auto">
        <Link href="/admin/login" className="inline-flex items-center text-xs font-semibold text-gray-400 hover:text-emerald-500 transition-colors">
          Hospital Staff Login <ArrowRight className="ml-1 w-3 h-3" />
        </Link>
      </footer>
    </div>
  );
}
