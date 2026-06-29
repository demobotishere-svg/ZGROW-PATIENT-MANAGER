"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, FileDown, Plus, Eye, Trash2, CalendarIcon, Send, Bot, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(() => import("@/components/PDFViewer").then(mod => mod.PDFViewer), { ssr: false });

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState<'records' | 'book' | 'appointments'>('records');
  const [patientData, setPatientData] = useState<any>(null);
  
  // Records State
  const [reports, setReports] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<'image' | 'pdf' | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  // Appointments State
  const [doctors, setDoctors] = useState<any[]>([]);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [booking, setBooking] = useState({ doctorId: "", date: "", timeSlot: "" });

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    fetchSession();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (!data.authenticated || data.role !== "patient") {
        return router.push("/patient-login");
      }
      setPatientData({ id: data.id, firstName: data.name.split(" ")[0], lastName: data.name.split(" ")[1] || "" });
      fetchReports(data.id);
      fetchAppointments();
    } catch (err) {
      router.push("/patient-login");
    }
  };

  const fetchReports = async (patientId: string) => {
    try {
      const res = await fetch(`/api/patients?id=${patientId}`);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      toast.error("Failed to load reports");
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/doctors");
      setDoctors(await res.json());
    } catch (err) {}
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      setMyAppointments(await res.json());
    } catch (err) {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientData) return;
    setIsUploading(true);
    toast.info("Uploading report...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", patientData.id);
    formData.append("reportName", file.name.split(".")[0]);

    try {
      const res = await fetch("/api/reports", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      toast.success("Report uploaded successfully!");
      fetchReports(patientData.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!booking.doctorId || !booking.date || !booking.timeSlot) {
      return toast.error("Please fill all booking details");
    }
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking)
      });
      if (!res.ok) throw new Error("Booking failed");
      toast.success("Appointment booked successfully! Waiting for admin approval.");
      setBooking({ doctorId: "", date: "", timeSlot: "" });
      setActiveTab('appointments');
      fetchAppointments();
    } catch (err) {
      toast.error("Failed to book appointment");
    }
  };

  const loadChatHistory = async (reportId: string) => {
    try {
      const res = await fetch(`/api/chat/${reportId}`);
      if (res.ok) {
        setChatMessages(await res.json());
      }
    } catch (e) {}
  };

  const handleView = async (reportId: string) => {
    setSelectedReportId(reportId);
    setChatOpen(false);
    setChatMessages([]);
    loadChatHistory(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}/meta`);
      const data = await res.json();
      setSelectedReportType(data.isImage ? 'image' : 'pdf');
    } catch (e) {
      setSelectedReportType('pdf');
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedReportId) return;
    const msg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setIsChatting(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: selectedReportId, message: msg })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { role: "ai", content: data.response }]);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setIsChatting(false);
    }
  };

  if (!patientData) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <DashboardNavbar />
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8 text-gray-900">Welcome, {patientData.firstName}!</h1>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button onClick={() => setActiveTab('records')} className={`pb-2 font-bold ${activeTab === 'records' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500'}`}>My Records</button>
          <button onClick={() => setActiveTab('book')} className={`pb-2 font-bold ${activeTab === 'book' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500'}`}>Book Appointment</button>
          <button onClick={() => setActiveTab('appointments')} className={`pb-2 font-bold ${activeTab === 'appointments' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500'}`}>My Appointments</button>
        </div>

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-extrabold flex items-center gap-3"><FileText className="w-5 h-5 text-violet-600"/> Reports</h2>
              <input type="file" id="upload-report" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
              <Button onClick={() => document.getElementById('upload-report')?.click()} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Report"}
              </Button>
            </div>
            {reports.length === 0 ? <p className="text-gray-500">No reports uploaded yet.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {reports.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold">{r.reportName}</TableCell>
                      <TableCell>{new Date(r.uploadDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleView(r.id)}><Eye className="w-4 h-4 mr-2"/> View & Chat</Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeletingReportId(r.id)}><Trash2 className="w-4 h-4 mr-2"/> Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* BOOK APPOINTMENT TAB */}
        {activeTab === 'book' && (
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm max-w-lg">
            <h2 className="text-lg font-extrabold mb-6">Book an Appointment</h2>
            <div className="flex flex-col gap-4">
              <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm" value={booking.doctorId} onChange={e => setBooking({...booking, doctorId: e.target.value, timeSlot: ""})}>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.designation})</option>)}
              </select>
              <Input type="date" value={booking.date} onChange={e => setBooking({...booking, date: e.target.value})} />
              {booking.doctorId && (
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={booking.timeSlot} onChange={e => setBooking({...booking, timeSlot: e.target.value})}>
                  <option value="">Select Time Slot</option>
                  {doctors.find(d => d.id === booking.doctorId)?.availableSlots.map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <Button onClick={handleBookAppointment} className="w-full">Book Now</Button>
            </div>
          </div>
        )}

        {/* MY APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-extrabold mb-6"><CalendarIcon className="w-5 h-5 text-amber-600 inline mr-2"/> My Appointments</h2>
            {myAppointments.length === 0 ? <p className="text-gray-500">No appointments found.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Doctor</TableHead><TableHead>Date & Time</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {myAppointments.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-bold">{a.doctor.name} ({a.doctor.designation})</TableCell>
                      <TableCell>{a.date} at {a.timeSlot}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded font-bold ${a.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : a.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {a.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Report Viewer & Chat Dialog */}
        <Dialog open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
          <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 flex flex-col sm:flex-row overflow-hidden">
            
            {/* Viewer Section */}
            <div className={`flex-1 bg-gray-100 relative flex items-center justify-center ${chatOpen ? 'hidden sm:flex' : 'flex'}`}>
              <Button variant="outline" size="sm" className="absolute top-4 left-4 z-10 shadow-md bg-white sm:hidden" onClick={() => setSelectedReportId(null)}>Close</Button>
              {selectedReportId && selectedReportType === 'image' && <img src={`/api/reports/${selectedReportId}`} className="max-w-full max-h-full object-contain" />}
              {selectedReportId && selectedReportType === 'pdf' && <div className="w-full h-full overflow-y-auto"><PDFViewer url={`/api/reports/${selectedReportId}`} /></div>}
              {!chatOpen && (
                <Button onClick={() => setChatOpen(true)} className="absolute bottom-6 right-6 shadow-xl rounded-full px-6 py-6 bg-violet-600 hover:bg-violet-700 text-white font-bold animate-bounce">
                  <Bot className="w-5 h-5 mr-2" /> Ask AI about this document
                </Button>
              )}
            </div>

            {/* Chat Section */}
            {chatOpen && (
              <div className="w-full sm:w-[400px] bg-white border-l border-gray-200 flex flex-col h-full shadow-2xl z-20">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold flex items-center gap-2 text-violet-700"><Bot className="w-5 h-5" /> Medical AI Assistant</h3>
                  <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>Hide</Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50/50">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">
                      <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Ask any questions about this document. I'll analyze it and explain it to you!</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                        {msg.role === 'user' ? <User className="w-4 h-4"/> : <Bot className="w-4 h-4"/>}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border shadow-sm rounded-tl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatting && (
                    <div className="flex gap-3 self-start max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-violet-700"/></div>
                      <div className="p-3 rounded-2xl bg-white border shadow-sm text-sm rounded-tl-none animate-pulse flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div><div className="w-2 h-2 bg-gray-400 rounded-full"></div><div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <Input placeholder="Type your question..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} disabled={isChatting} className="rounded-xl border-gray-300" />
                    <Button onClick={sendChatMessage} disabled={isChatting || !chatInput.trim()} className="rounded-xl bg-violet-600 hover:bg-violet-700 px-3">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
