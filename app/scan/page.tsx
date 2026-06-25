"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Upload, CheckCircle, AlertCircle, ImagePlus, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [useCamera, setUseCamera] = useState(true);
  const [isExistingPatient, setIsExistingPatient] = useState(false);
  const router = useRouter();

  const processImage = async (base64Str: string) => {
    setIsProcessing(true);
    setRawOcrText("");
    toast("Analyzing with Gemini Vision AI...", { icon: <Sparkles className="w-4 h-4 text-emerald-400" /> });

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Str }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error === "RATE_LIMIT") {
          throw new Error("API Rate limit reached. Please wait a moment and try again.");
        }
        if (result.error === "NO_CARD") {
           throw new Error("No card detected. Please ensure the card is clearly visible.");
        }
        throw new Error(result.error || "Failed to process image");
      }

      setImgSrc(base64Str);
      setRawOcrText(JSON.stringify(result.data, null, 2));
      setExtractedData(result.data);
      
      // Check if patient already exists
      if (result.data.patientId) {
        const checkRes = await fetch(`/api/patients/check?patientId=${result.data.patientId}`);
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setIsExistingPatient(true);
          toast.info("Welcome back! Please enter your password to login.", { duration: 5000 });
        } else {
          toast.success(`Extracted successfully!`);
        }
      } else {
        toast.success(`Extracted successfully!`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      processImage(imageSrc);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      setImgSrc(resultStr);
      processImage(resultStr);
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setImgSrc(null);
    setExtractedData(null);
    setRawOcrText("");
    setIsExistingPatient(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };




  const handleSaveOrLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());
      
      if (isExistingPatient) {
        // Login Flow
        const response = await fetch("/api/auth/patient-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: data.patientId, password: data.password }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Incorrect password");
        }
        toast.success("Logged in successfully!");
        router.push("/patient-dashboard");
      } else {
        // Registration Flow
        const response = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to save patient");
        }
        
        // Auto login after registration
        await fetch("/api/auth/patient-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: data.patientId, password: data.password }),
        });
        
        toast.success("Patient registered and logged in!");
        router.push("/patient-dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-emerald-500/30 relative">
      {/* Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-100 blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <Navbar />

      <main className="relative z-10 pt-24 pb-16 px-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Patient Registration</h1>
          <p className="text-base text-gray-500 font-medium">Please hold your Patient Access Card steadily in front of the camera to register or log in automatically.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Left: Camera / Upload */}
          <div className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col shadow-sm">

            {!imgSrc && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUseCamera(true)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${useCamera ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent"}`}
                >
                  <Camera className="w-3.5 h-3.5" /> Camera
                </button>
                <button
                  onClick={() => setUseCamera(false)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${!useCamera ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent"}`}
                >
                  <ImagePlus className="w-3.5 h-3.5" /> Upload
                </button>
              </div>
            )}

            {!imgSrc ? (
              useCamera ? (
                <div className="flex flex-col flex-1">
                  <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-[1.58] border border-gray-200 mb-4">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      screenshotQuality={0.7}
                      videoConstraints={{ facingMode: "environment", aspectRatio: 1.58, width: { ideal: 1280 } }}
                      className="w-full h-full object-cover"
                    />
                    {/* Scan frame overlay */}
                    <div className="absolute inset-6 border-2 border-emerald-500/30 rounded-lg pointer-events-none">
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 mt-auto">
                    <button 
                      onClick={capture} 
                      disabled={isProcessing}
                      className="w-full h-16 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 hover:scale-[1.02] transition-transform text-white font-bold text-lg disabled:opacity-50"
                    >
                      <Camera className="w-6 h-6 text-white" />
                      {isProcessing ? "Scanning..." : "Tap to Scan Card"}
                    </button>
                    <button
                      onClick={() => setExtractedData({})}
                      disabled={isProcessing}
                      className="w-full h-12 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      Enter details manually
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:bg-gray-50 hover:border-emerald-400 transition-all min-h-[300px] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ImagePlus className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-gray-700 text-sm font-semibold mb-1">Click to upload slip image</p>
                  <p className="text-gray-500 text-xs">JPG, PNG — use a clear, well-lit photo</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>
              )
            ) : (
              <div className="flex flex-col flex-1">
                <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[1.58] mb-4 bg-gray-900">
                  <img src={imgSrc} alt="Captured slip" className="w-full h-full object-contain" />
                  {isProcessing && (
                    <>
                      <motion.div
                        initial={{ top: "0%" }} animate={{ top: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.8)] z-10"
                      />
                      <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="bg-white shadow-lg px-5 py-3 rounded-xl flex items-center gap-3 border border-gray-200">
                          <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                          <span className="text-xs font-semibold text-gray-700">Analyzing document...</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-center mt-auto">
                  <Button variant="outline" size="sm" onClick={retake} disabled={isProcessing} className="bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-xs h-9 px-4">
                    Retake
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Verification Form */}
          <div className="rounded-2xl bg-white border border-gray-200 p-6 flex flex-col shadow-sm">
            <h2 className="text-lg font-extrabold mb-6 flex items-center gap-3 text-gray-800">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              Is this your information?
            </h2>

            <AnimatePresence mode="wait">
              {isProcessing && !extractedData ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col gap-4 relative py-2"
                >
                  {/* Scanner overlay effect */}
                  <motion.div
                    initial={{ top: "0%" }} animate={{ top: "100%" }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,1)] z-20 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-emerald-50/30 z-10 pointer-events-none animate-pulse" />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-9 bg-gray-100 border border-gray-200 rounded relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-9 bg-gray-100 border border-gray-200 rounded relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-9 bg-gray-100 border border-gray-200 rounded relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-9 bg-gray-100 border border-gray-200 rounded relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    </div>
                  </div>
                  <div className="mt-8 text-center flex flex-col items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin mb-2" />
                    <p className="text-xs font-bold text-emerald-600 tracking-widest uppercase">Extracting Patient Data...</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">Connecting to Gemini Vision AI</p>
                  </div>
                </motion.div>
              ) : !extractedData ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-8"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
                    <Camera className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 max-w-[250px] leading-relaxed font-medium">
                    Waiting for camera... Once a card is detected, your details will appear here. Or, click &quot;Enter details manually&quot; to skip scanning.
                  </p>
                </motion.div>
              ) : (
                <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-3.5" onSubmit={handleSaveOrLogin}
                >
                  {isExistingPatient && (
                    <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 p-3 rounded-xl text-xs font-semibold mb-2">
                      👋 Patient ID {extractedData.patientId} is already registered! Enter your password to access your dashboard.
                    </div>
                  )}
                  
                  <div className={`grid grid-cols-2 gap-3 ${isExistingPatient ? "opacity-50 pointer-events-none" : ""}`}>
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs text-gray-800 font-bold">First Name</Label>
                      <Input id="firstName" name="firstName" defaultValue={extractedData.firstName || ""} readOnly={isExistingPatient} className="bg-white border-gray-300 text-gray-900 font-medium text-sm h-9 focus:border-emerald-500/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs text-gray-800 font-bold">Last Name</Label>
                      <Input id="lastName" name="lastName" defaultValue={extractedData.lastName || ""} readOnly={isExistingPatient} className="bg-white border-gray-300 text-gray-900 font-medium text-sm h-9 focus:border-emerald-500/50" />
                    </div>
                  </div>
                  <div className={`space-y-1.5 ${isExistingPatient ? "opacity-50 pointer-events-none" : ""}`}>
                    <Label htmlFor="dob" className="text-xs text-gray-800 font-bold">Date of Birth</Label>
                    <Input id="dob" name="dob" defaultValue={extractedData.dob || ""} readOnly={isExistingPatient} className="bg-white border-gray-300 text-gray-900 font-medium text-sm h-9 focus:border-emerald-500/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="patientId" className="text-xs text-gray-800 font-bold">Patient ID</Label>
                    <Input id="patientId" name="patientId" defaultValue={extractedData.patientId || ""} readOnly={isExistingPatient} className="bg-white border-gray-300 text-gray-900 font-medium text-sm h-9 focus:border-emerald-500/50" />
                  </div>
                  <div className={`space-y-1.5 ${isExistingPatient ? "hidden" : ""}`}>
                    <Label htmlFor="address" className="text-xs text-gray-800 font-bold">Address</Label>
                    <Input id="address" name="address" defaultValue={extractedData.address || ""} className="bg-white border-gray-300 text-gray-900 font-medium text-sm h-9 focus:border-emerald-500/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs text-gray-800 font-bold">{isExistingPatient ? "Enter Password" : "Create Password"}</Label>
                    <Input id="password" name="password" type="password" required placeholder={isExistingPatient ? "Enter your password to login" : "Choose a secure password"} className="bg-white border-gray-300 text-gray-900 font-medium placeholder:text-gray-400 text-sm h-9 focus:border-emerald-500/50" />
                  </div>
                  <div className="mt-auto pt-6 flex justify-end gap-3">
                    <Button type="button" variant="outline" size="lg" onClick={retake} className="text-gray-700 font-semibold border-gray-300">Try Again</Button>
                    <Button type="submit" size="lg" disabled={isProcessing} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold px-6 shadow-lg shadow-emerald-500/20 border-0">
                      {isProcessing ? "Processing..." : (isExistingPatient ? "Yes, Login" : "Yes, Register Me")}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
