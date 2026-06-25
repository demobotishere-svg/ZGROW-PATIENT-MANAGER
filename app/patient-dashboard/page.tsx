"use client";

import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, FileDown, Plus, Calendar, MapPin, UserSquare2, Camera, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PatientDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientData, setPatientData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        
        if (!data.authenticated || data.session.role !== "patient") {
          router.push("/patient-login");
          return;
        }
        
        setPatientData(data.session);
        fetchReports(data.session.id);
      } catch (e) {
        router.push("/patient-login");
      }
    };
    
    checkSession();
  }, []);

  const fetchReports = async (patientDbId: string) => {
    try {
      const res = await fetch(`/api/reports?patientId=${patientDbId}`);
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (err) {
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientData) return;

    setIsUploading(true);
    toast.info("Uploading your medical report...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", patientData.id);
    formData.append("reportName", file.name.split(".")[0]);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast.success("Medical report uploaded successfully!");
      fetchReports(patientData.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!patientData) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-cyan-500/30 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-cyan-100/50 blur-[80px] sm:blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px] sm:bg-[size:64px_64px] pointer-events-none" />

      <DashboardNavbar />

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-gray-900">
              Welcome back, {patientData.firstName}!
            </h1>
            <p className="text-sm text-gray-500 font-medium">Manage your medical records and upload new reports.</p>
          </div>
          
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="file" 
              id="upload-report" 
              className="hidden" 
              accept=".pdf,image/*" 
              onChange={handleFileUpload} 
            />
            <input 
              type="file" 
              id="capture-report" 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileUpload} 
            />
            <Button 
              onClick={() => document.getElementById("upload-report")?.click()}
              disabled={isUploading}
              className="w-full md:w-auto bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 text-sm font-bold h-12 px-6 shadow-sm rounded-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span>{isUploading ? "Uploading..." : "Upload File"}</span>
            </Button>
            <Button 
              onClick={() => document.getElementById("capture-report")?.click()}
              disabled={isUploading}
              className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-sm font-bold h-12 px-6 shadow-xl shadow-emerald-500/20 border-0 rounded-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <Camera className="w-5 h-5 mr-2" />
              <span>{isUploading ? "Uploading..." : "Take Photo"}</span>
            </Button>
          </div>
        </div>

        {/* Patient Profile Card (Mobile Responsive) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 mb-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-4 w-full sm:w-auto sm:border-r border-gray-100 sm:pr-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 flex flex-shrink-0 items-center justify-center border border-emerald-100 shadow-sm">
              <UserSquare2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{patientData.firstName} {patientData.lastName}</h3>
              <p className="text-sm font-mono text-emerald-600 font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-1">
                {patientData.patientId}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 w-full sm:pl-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Date of Birth</p>
                <p className="text-sm font-semibold text-gray-900">{patientData.dob || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Address</p>
                <p className="text-sm font-semibold text-gray-900">{patientData.address || "Not provided"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="px-5 sm:px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-extrabold flex items-center gap-3 text-gray-900">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              Your Reports
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-gray-500 text-sm animate-pulse">Loading your records...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 px-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1">Your vault is empty</p>
              <p className="text-sm text-gray-500">Upload your PDF medical reports to keep them safe.</p>
            </div>
          ) : (
            <div className="w-full">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead className="text-gray-500 text-sm font-semibold px-6">Report Name</TableHead>
                      <TableHead className="text-gray-500 text-sm font-semibold">Date</TableHead>
                      <TableHead className="text-gray-500 text-sm font-semibold text-right px-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                              <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                            <span className="font-bold text-gray-900">{report.reportName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 font-medium">
                          {new Date(report.uploadDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right px-6 flex justify-end gap-2">
                          <Button onClick={() => setSelectedReportId(report.id)} variant="outline" size="sm" className="h-9 px-4 border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 shadow-sm rounded-lg font-bold transition-colors">
                            <Eye className="w-4 h-4 mr-2" /> View
                          </Button>
                          <a href={`/api/reports/${report.id}`} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="h-9 px-4 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 shadow-sm rounded-lg font-bold transition-colors">
                              <FileDown className="w-4 h-4 mr-2" /> Download
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden flex flex-col divide-y divide-gray-100">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 flex flex-col gap-3 active:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 flex-shrink-0">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{report.reportName}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(report.uploadDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full mt-2">
                      <Button onClick={() => setSelectedReportId(report.id)} variant="outline" size="sm" className="flex-1 h-10 border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 shadow-sm rounded-lg font-bold">
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                      <a href={`/api/reports/${report.id}`} target="_blank" rel="noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full h-10 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 shadow-sm rounded-lg font-bold">
                          <FileDown className="w-4 h-4 mr-2" /> Download
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Report Viewer Dialog */}
        <Dialog open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
          <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b bg-white flex-shrink-0">
              <DialogTitle>View Document</DialogTitle>
            </DialogHeader>
            <div className="flex-1 w-full bg-gray-100 relative">
              {selectedReportId && (
                <iframe 
                  src={`/api/reports/${selectedReportId}`} 
                  className="absolute inset-0 w-full h-full border-0"
                  title="Document Viewer"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
