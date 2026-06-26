"use client";

import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, FileText, Users, Scan, Search, Upload, FileDown, Plus, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(() => import("@/components/PDFViewer").then(mod => mod.PDFViewer), { ssr: false });

export default function AdminDashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<'image' | 'pdf' | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (data.patients) setPatients(data.patients);
    } catch (err) {
      toast.error("Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (patientId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFor(patientId);
    toast.info("Uploading report...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", patientId);
    formData.append("reportName", file.name.split(".")[0]);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast.success("Report uploaded successfully!");
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingFor(null);
    }
  };

  const handleView = async (reportId: string) => {
    setSelectedReportId(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}/meta`);
      const data = await res.json();
      if (data.isImage) {
        setSelectedReportType('image');
      } else {
        setSelectedReportType('pdf');
      }
    } catch (e) {
      setSelectedReportType('pdf'); // fallback
    }
  };

  const handleDelete = async () => {
    if (!deletingReportId || !deletePassword) return;
    setIsDeleting(true);
    toast.info("Deleting report...");

    try {
      const res = await fetch(`/api/reports/${deletingReportId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete report");
      }
      
      toast.success("Report deleted successfully");
      setDeletingReportId(null);
      setDeletePassword("");
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    (p.patientId || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.firstName + " " + p.lastName).toLowerCase().includes(search.toLowerCase())
  );

  const verified = patients.filter((p) => p.verificationStatus === "Verified").length;
  const pending = patients.filter((p) => p.verificationStatus === "Pending").length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-violet-500/30 relative overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[400px] rounded-full bg-violet-100/50 blur-[80px] sm:blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px] sm:bg-[size:64px_64px] pointer-events-none" />

      <DashboardNavbar />

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 font-medium">Manage patients and medical records.</p>
          </div>
          <Link href="/scan" className="w-full md:w-auto">
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-sm font-bold h-12 px-6 shadow-xl shadow-emerald-500/20 border-0 rounded-xl transition-all duration-300 hover:scale-[1.02]">
              <Scan className="w-5 h-5 mr-2" />
              Scan New Patient
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
              <span className="text-sm text-gray-600 font-bold">Total Patients</span>
            </div>
            <p className="text-4xl font-black tracking-tight text-gray-900">{patients.length}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-600 font-bold">Verified Cards</span>
            </div>
            <p className="text-4xl font-black tracking-tight text-gray-900">{verified}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm text-gray-600 font-bold">Pending Reviews</span>
            </div>
            <p className="text-4xl font-black tracking-tight text-gray-900">{pending}</p>
          </div>
        </div>

        {/* Search & Records */}
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="px-5 sm:px-6 pt-6 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100">
            <h2 className="text-lg font-extrabold flex items-center gap-3 text-gray-900">
              <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              Patient Records
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search ID or Name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm h-10 pl-10 focus:border-violet-500/50 rounded-xl" 
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-gray-500 text-sm animate-pulse">Loading records...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">No patients found.</div>
          ) : (
            <div className="w-full">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead className="text-gray-500 text-sm font-semibold px-6 py-4">Patient ID</TableHead>
                      <TableHead className="text-gray-500 text-sm font-semibold py-4">Name</TableHead>
                      <TableHead className="text-gray-500 text-sm font-semibold py-4">Reports</TableHead>
                      <TableHead className="text-gray-500 text-sm font-semibold text-right px-6 py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="px-6 py-4 text-sm font-mono text-violet-600 font-medium">{patient.patientId || "—"}</TableCell>
                        <TableCell className="py-4 text-sm font-bold text-gray-900">{patient.firstName} {patient.lastName}</TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1.5">
                            {patient.reports && patient.reports.length > 0 ? (
                              patient.reports.map((r: any) => (
                                <div key={r.id} className="flex gap-1.5 w-fit">
                                  <button onClick={() => handleView(r.id)} className="text-xs text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-1.5 bg-cyan-50 px-2 py-1 rounded-md">
                                    <Eye className="w-3.5 h-3.5" /> View
                                  </button>
                                  <a href={`/api/reports/${r.id}`} target="_blank" className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md">
                                    <FileDown className="w-3.5 h-3.5" /> DL
                                  </a>
                                  <button onClick={() => setDeletingReportId(r.id)} className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">No reports</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <div className="flex justify-end items-center gap-2">
                            <input 
                              type="file" 
                              id={`upload-${patient.id}`} 
                              className="hidden" 
                              accept=".pdf" 
                              onChange={(e) => handleFileUpload(patient.id, e)} 
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => document.getElementById(`upload-${patient.id}`)?.click()}
                              disabled={uploadingFor === patient.id}
                              className="text-xs h-9 px-4 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm rounded-lg font-bold transition-all"
                            >
                              {uploadingFor === patient.id ? "Uploading..." : <><Plus className="w-4 h-4 mr-1.5" /> Upload PDF</>}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden flex flex-col divide-y divide-gray-100">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base mb-1">{patient.firstName} {patient.lastName}</h4>
                        <p className="text-xs font-mono text-violet-600 font-medium bg-violet-50 inline-block px-2 py-0.5 rounded-md">
                          {patient.patientId || "No ID"}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-2">Reports:</p>
                      <div className="flex flex-wrap gap-2">
                        {patient.reports && patient.reports.length > 0 ? (
                          patient.reports.map((r: any) => (
                            <div key={r.id} className="flex flex-col gap-1 w-full bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <span className="text-xs font-bold text-gray-700 truncate">{r.reportName}</span>
                              <div className="flex gap-1 w-full">
                                <button onClick={() => handleView(r.id)} className="flex-1 text-xs text-cyan-700 font-bold flex items-center justify-center gap-1 bg-cyan-50/80 border border-cyan-100 px-2 py-1.5 rounded-md shadow-sm">
                                  <Eye className="w-3 h-3" /> View
                                </button>
                                <a href={`/api/reports/${r.id}`} target="_blank" className="flex-1 text-xs text-emerald-700 font-bold flex items-center justify-center gap-1 bg-emerald-50/80 border border-emerald-100 px-2 py-1.5 rounded-md shadow-sm">
                                  <FileDown className="w-3 h-3" /> DL
                                </a>
                                <button onClick={() => setDeletingReportId(r.id)} className="flex-1 text-xs text-red-700 font-bold flex items-center justify-center gap-1 bg-red-50/80 border border-red-100 px-2 py-1.5 rounded-md shadow-sm">
                                  <Trash2 className="w-3 h-3" /> Del
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">None uploaded</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-1">
                      <input 
                        type="file" 
                        id={`upload-mobile-${patient.id}`} 
                        className="hidden" 
                        accept=".pdf" 
                        onChange={(e) => handleFileUpload(patient.id, e)} 
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById(`upload-mobile-${patient.id}`)?.click()}
                        disabled={uploadingFor === patient.id}
                        className="w-full text-sm h-10 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm rounded-lg font-bold"
                      >
                        {uploadingFor === patient.id ? "Uploading..." : <><Plus className="w-4 h-4 mr-2" /> Upload New PDF</>}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Report Viewer Dialog */}
        <Dialog open={!!selectedReportId} onOpenChange={(open) => {
          if (!open) {
            setSelectedReportId(null);
            setSelectedReportType(null);
          }
        }}>
          <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b bg-white flex-shrink-0">
              <DialogTitle>View Document</DialogTitle>
            </DialogHeader>
            <div className="flex-1 w-full bg-gray-100 relative overflow-auto flex items-center justify-center p-4">
              {selectedReportId && selectedReportType === 'image' && (
                <img 
                  src={`/api/reports/${selectedReportId}`} 
                  className="max-w-full max-h-full object-contain rounded-md shadow-sm"
                  alt="Document Viewer"
                />
              )}
              {selectedReportId && selectedReportType === 'pdf' && (
                <div className="w-full h-full overflow-y-auto">
                  <PDFViewer url={`/api/reports/${selectedReportId}`} />
                </div>
              )}
              {selectedReportId && !selectedReportType && (
                <div className="animate-pulse text-gray-500 font-medium">Loading document...</div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingReportId} onOpenChange={(open) => !open && setDeletingReportId(null)}>
          <DialogContent className="max-w-sm w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Report?</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">Please enter your password to confirm permanent deletion of this report.</p>
              <Input 
                type="password" 
                placeholder="Password" 
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full border-gray-200"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingReportId(null)} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || !deletePassword}>
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
