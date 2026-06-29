"use client";

import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, FileText, Users, Scan, Search, Upload, FileDown, Plus, Eye, Trash2, CalendarIcon, Activity, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(() => import("@/components/PDFViewer").then(mod => mod.PDFViewer), { ssr: false });

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'patients' | 'doctors' | 'appointments'>('patients');
  
  // PATIENTS STATE
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<'image' | 'pdf' | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // DOCTORS STATE
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState<{name: string, designation: string, slots: string[]}>({ name: "", designation: "", slots: [] });
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");

  // APPOINTMENTS STATE
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchAppointments();
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

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/doctors");
      const data = await res.json();
      if (Array.isArray(data)) setDoctors(data);
    } catch (err) {
      toast.error("Failed to load doctors");
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments/admin");
      const data = await res.json();
      if (Array.isArray(data)) setAppointments(data);
    } catch (err) {
      toast.error("Failed to load appointments");
    }
  };

  const handleAddDoctor = async () => {
    if (!newDoctor.name || !newDoctor.designation || newDoctor.slots.length === 0) {
      return toast.error("Please fill all fields and add at least one slot");
    }
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDoctor.name, designation: newDoctor.designation, availableSlots: newDoctor.slots })
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Doctor added successfully!");
      setIsDoctorModalOpen(false);
      setNewDoctor({ name: "", designation: "", slots: [] });
      setSlotDate("");
      setSlotTime("");
      fetchDoctors();
    } catch (err) {
      toast.error("Failed to add doctor");
    }
  };

  const handleAddSlot = () => {
    if (!slotDate || !slotTime) return toast.error("Select both date and time");
    if (newDoctor.slots.length >= 12) return toast.error("Maximum 12 slots allowed");
    const formattedSlot = `${slotDate} at ${slotTime}`;
    if (newDoctor.slots.includes(formattedSlot)) return toast.error("Slot already exists");
    setNewDoctor({ ...newDoctor, slots: [...newDoctor.slots, formattedSlot] });
    setSlotTime("");
  };

  const handleRemoveSlot = (slotToRemove: string) => {
    setNewDoctor({ ...newDoctor, slots: newDoctor.slots.filter(s => s !== slotToRemove) });
  };

  const handleAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const res = await fetch("/api/appointments/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status })
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Appointment ${status.toLowerCase()}!`);
      fetchAppointments();
    } catch (err) {
      toast.error("Failed to update appointment");
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-violet-500/30 relative overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[400px] rounded-full bg-violet-100/50 blur-[80px] sm:blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px] sm:bg-[size:64px_64px] pointer-events-none" />

      <DashboardNavbar />

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 font-medium">Manage patients, doctors, and appointments.</p>
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
            <div className="text-3xl font-extrabold text-gray-900">{patients.length}</div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-600 font-bold">Verified</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">{patients.filter((p) => p.verificationStatus === "Verified").length}</div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm text-gray-600 font-bold">Pending</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">{patients.filter((p) => p.verificationStatus === "Pending").length}</div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-6 mb-8 border-b border-gray-200">
          <button onClick={() => setActiveTab('patients')} className={`pb-3 font-bold text-sm sm:text-base transition-colors ${activeTab === 'patients' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-900'}`}>Patients</button>
          <button onClick={() => setActiveTab('doctors')} className={`pb-3 font-bold text-sm sm:text-base transition-colors ${activeTab === 'doctors' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-900'}`}>Doctors</button>
          <button onClick={() => setActiveTab('appointments')} className={`pb-3 font-bold text-sm sm:text-base transition-colors ${activeTab === 'appointments' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-900'}`}>Appointments</button>
        </div>

        {/* PATIENTS TAB */}
        {activeTab === 'patients' && (
          <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 pt-6 pb-5 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100">
              <h2 className="text-lg font-extrabold flex items-center gap-3">
                <FileText className="w-5 h-5 text-violet-600" /> Patient Records
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input placeholder="Search ID or Name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-16 animate-pulse">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Loading patients...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-900">Patient ID</TableHead>
                      <TableHead className="font-semibold text-gray-900">Name</TableHead>
                      <TableHead className="font-semibold text-gray-900">DOB</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900">Reports</TableHead>
                      <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                          No patients found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPatients.map((patient) => (
                        <TableRow key={patient.id} className="hover:bg-violet-50/50 transition-colors">
                          <TableCell className="font-mono text-violet-600 font-medium">{patient.patientId || "—"}</TableCell>
                          <TableCell className="font-bold">{patient.firstName} {patient.lastName}</TableCell>
                          <TableCell className="text-gray-600">{patient.dob || "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              patient.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {patient.verificationStatus}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1.5">
                              {patient.reports?.map((r: any) => (
                                <div key={r.id} className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 group">
                                  <FileText className="w-3.5 h-3.5 text-violet-500" />
                                  <span className="font-medium text-gray-700 truncate max-w-[120px]">{r.reportName}</span>
                                  <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-violet-600 hover:text-violet-700 hover:bg-violet-100" onClick={() => handleView(r.id)}>
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                    <a href={r.fileUrl} download target="_blank" rel="noopener noreferrer">
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
                                        <FileDown className="w-3.5 h-3.5" />
                                      </Button>
                                    </a>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-600 hover:text-rose-700 hover:bg-rose-100" onClick={() => setDeletingReportId(r.id)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {(!patient.reports || patient.reports.length === 0) && (
                                <span className="text-xs text-gray-400 font-medium">No reports</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <input
                                type="file"
                                id={`file-${patient.id}`}
                                className="hidden"
                                onChange={(e) => handleFileUpload(patient.id, e)}
                                accept="application/pdf,image/*"
                              />
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-white border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 rounded-lg shadow-sm font-semibold"
                                onClick={() => document.getElementById(`file-${patient.id}`)?.click()}
                                disabled={uploadingFor === patient.id}
                              >
                                {uploadingFor === patient.id ? (
                                  <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"/> Uploading</span>
                                ) : (
                                  <span className="flex items-center gap-2"><Upload className="w-3.5 h-3.5" /> Upload</span>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* DOCTORS TAB */}
        {activeTab === 'doctors' && (
          <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 pt-6 pb-5 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-lg font-extrabold flex items-center gap-3">
                <Activity className="w-5 h-5 text-violet-600" /> Doctors Directory
              </h2>
              <Button onClick={() => setIsDoctorModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Add Doctor
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-900">Doctor Name</TableHead>
                  <TableHead className="font-semibold text-gray-900">Designation</TableHead>
                  <TableHead className="font-semibold text-gray-900">Available Slots</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map(doc => (
                  <TableRow key={doc.id} className="hover:bg-violet-50/50">
                    <TableCell className="font-bold">{doc.name}</TableCell>
                    <TableCell className="text-violet-600 font-medium">{doc.designation}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {doc.availableSlots.map((slot: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">
                            {slot}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {doctors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">No doctors added yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 pt-6 pb-5 border-b border-gray-100">
              <h2 className="text-lg font-extrabold flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-violet-600" /> Pending Appointments
              </h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-900">Patient</TableHead>
                  <TableHead className="font-semibold text-gray-900">Doctor</TableHead>
                  <TableHead className="font-semibold text-gray-900">Date & Time</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map(apt => (
                  <TableRow key={apt.id} className="hover:bg-violet-50/50">
                    <TableCell className="font-medium">{apt.patient.firstName} {apt.patient.lastName}</TableCell>
                    <TableCell className="text-violet-600 font-medium">{apt.doctor.name}</TableCell>
                    <TableCell className="text-gray-600">{apt.date} at {apt.timeSlot}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                        apt.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {apt.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {apt.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleAppointmentStatus(apt.id, 'CONFIRMED')} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm">
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAppointmentStatus(apt.id, 'REJECTED')} className="rounded-lg shadow-sm">
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No appointments found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingReportId} onOpenChange={(open) => !open && setDeletingReportId(null)}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-gray-900">Admin Authorization Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-600">Please enter your admin password to confirm deletion of this medical report. This action cannot be undone.</p>
            <Input 
              type="password" 
              placeholder="Admin Password" 
              value={deletePassword} 
              onChange={(e) => setDeletePassword(e.target.value)}
              className="h-11 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-500"
            />
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setDeletingReportId(null)} className="rounded-xl font-semibold">Cancel</Button>
              <Button onClick={handleDelete} disabled={isDeleting || !deletePassword} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md font-semibold">
                {isDeleting ? "Deleting..." : "Delete Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Document Modal */}
      <Dialog open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
        <DialogContent showCloseButton={false} className="max-w-4xl h-[90vh] p-0 rounded-2xl border-0 shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-4 border-b border-gray-100 bg-white shadow-sm z-10 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-violet-600" />
              Document Viewer
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedReportId(null)}
              className="text-gray-500 hover:bg-gray-100 rounded-lg shrink-0 h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          <div className="flex-1 bg-gray-50 overflow-hidden relative">
            {selectedReportId && selectedReportType && (
              selectedReportType === 'image' ? (
                <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900/5">
                  <img src={`/api/reports/${selectedReportId}`} alt="Report" className="max-w-full max-h-full object-contain rounded-lg shadow-sm bg-white" />
                </div>
              ) : (
                <div className="w-full h-full">
                  <PDFViewer url={`/api/reports/${selectedReportId}`} />
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Doctor Modal */}
      <Dialog open={isDoctorModalOpen} onOpenChange={setIsDoctorModalOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-gray-900">Add New Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="Doctor Name (e.g. Dr. Sarah)" value={newDoctor.name} onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})} className="rounded-xl border-gray-200" />
            <Input placeholder="Designation (e.g. Cardiologist)" value={newDoctor.designation} onChange={(e) => setNewDoctor({...newDoctor, designation: e.target.value})} className="rounded-xl border-gray-200" />
            
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              <label className="block text-sm font-bold text-gray-700 mb-2">Available Slots ({newDoctor.slots.length}/12)</label>
              <div className="flex gap-2 mb-3">
                <Input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="rounded-lg h-9 text-sm w-36" />
                <select value={slotTime} onChange={(e) => setSlotTime(e.target.value)} className="rounded-lg border border-gray-200 px-2 h-9 text-sm flex-1">
                  <option value="">Time...</option>
                  {["09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <Button onClick={handleAddSlot} disabled={newDoctor.slots.length >= 12} type="button" size="icon" className="h-9 w-9 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg shrink-0 border-0 shadow-sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                {newDoctor.slots.map(slot => (
                  <span key={slot} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded-md text-xs font-semibold shadow-sm">
                    {slot}
                    <button onClick={() => handleRemoveSlot(slot)} className="text-gray-400 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {newDoctor.slots.length === 0 && <span className="text-xs text-gray-400 font-medium">No slots added yet</span>}
              </div>
            </div>

            <Button onClick={handleAddDoctor} className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md font-semibold h-11">Save Doctor</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
