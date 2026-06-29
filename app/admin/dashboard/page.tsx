"use client";

import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, FileText, Users, Search, Plus, Eye, Trash2, Calendar as CalendarIcon, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(() => import("@/components/PDFViewer").then(mod => mod.PDFViewer), { ssr: false });

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'patients' | 'doctors' | 'appointments'>('patients');
  
  // Patients State
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<'image' | 'pdf' | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Doctors State
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: "", designation: "", availableSlots: "" });

  // Appointments State
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
      setDoctors(data);
    } catch (err) {
      toast.error("Failed to load doctors");
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments/admin");
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      toast.error("Failed to load appointments");
    }
  };

  const handleAddDoctor = async () => {
    if (!newDoctor.name || !newDoctor.designation || !newDoctor.availableSlots) {
      return toast.error("Please fill all fields");
    }
    const slots = newDoctor.availableSlots.split(",").map(s => s.trim());
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDoctor.name, designation: newDoctor.designation, availableSlots: slots })
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Doctor added!");
      setIsDoctorModalOpen(false);
      setNewDoctor({ name: "", designation: "", availableSlots: "" });
      fetchDoctors();
    } catch (err) {
      toast.error("Failed to add doctor");
    }
  };

  const handleAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const res = await fetch("/api/appointments/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status })
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Appointment ${status.toLowerCase()}`);
      fetchAppointments();
    } catch (err) {
      toast.error("Error updating appointment");
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
      setSelectedReportType('pdf');
    }
  };

  const handleDelete = async () => {
    if (!deletingReportId || !deletePassword) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reports/${deletingReportId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword })
      });
      if (!res.ok) throw new Error("Failed to delete report");
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
      <DashboardNavbar />

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 font-medium">Manage patients, doctors, and appointments.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button onClick={() => setActiveTab('patients')} className={`pb-2 font-bold ${activeTab === 'patients' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500'}`}>Patients</button>
          <button onClick={() => setActiveTab('doctors')} className={`pb-2 font-bold ${activeTab === 'doctors' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500'}`}>Doctors</button>
          <button onClick={() => setActiveTab('appointments')} className={`pb-2 font-bold ${activeTab === 'appointments' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500'}`}>Appointments</button>
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
            {isLoading ? <div className="text-center py-16 animate-pulse">Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Reports</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono text-violet-600 font-medium">{patient.patientId || "—"}</TableCell>
                      <TableCell className="font-bold">{patient.firstName} {patient.lastName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {patient.reports?.map((r: any) => (
                            <div key={r.id} className="flex gap-1.5">
                              <button onClick={() => handleView(r.id)} className="text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded">View</button>
                              <button onClick={() => setDeletingReportId(r.id)} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* DOCTORS TAB */}
        {activeTab === 'doctors' && (
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-extrabold flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-600" /> Doctors
              </h2>
              <Button onClick={() => setIsDoctorModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><UserPlus className="w-4 h-4 mr-2"/> Add Doctor</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Available Slots</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-bold">{d.name}</TableCell>
                    <TableCell>{d.designation}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {d.availableSlots.map((s: string) => <span key={s} className="bg-gray-100 px-2 py-1 text-xs rounded">{s}</span>)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-extrabold flex items-center gap-3 mb-6">
              <CalendarIcon className="w-5 h-5 text-amber-600" /> Appointments
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-bold">{a.patient.firstName} {a.patient.lastName}</TableCell>
                    <TableCell>{a.doctor.name} ({a.doctor.designation})</TableCell>
                    <TableCell>{a.date} at {a.timeSlot}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded font-bold ${a.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : a.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {a.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAppointmentStatus(a.id, 'CONFIRMED')} className="bg-emerald-500 hover:bg-emerald-600 h-8">Approve</Button>
                          <Button size="sm" onClick={() => handleAppointmentStatus(a.id, 'REJECTED')} variant="destructive" className="h-8">Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* View Document Dialog */}
        <Dialog open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
          <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>View Document</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
              {selectedReportId && selectedReportType === 'image' && <img src={`/api/reports/${selectedReportId}`} className="max-w-full max-h-full object-contain" />}
              {selectedReportId && selectedReportType === 'pdf' && <PDFViewer url={`/api/reports/${selectedReportId}`} />}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Doctor Dialog */}
        <Dialog open={isDoctorModalOpen} onOpenChange={setIsDoctorModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Input placeholder="Dr. Name" value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} />
              <Input placeholder="Designation (e.g., Cardiologist)" value={newDoctor.designation} onChange={e => setNewDoctor({...newDoctor, designation: e.target.value})} />
              <Input placeholder="Slots (comma separated, e.g., 10:00 AM, 11:30 AM)" value={newDoctor.availableSlots} onChange={e => setNewDoctor({...newDoctor, availableSlots: e.target.value})} />
              <Button onClick={handleAddDoctor}>Save Doctor</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
