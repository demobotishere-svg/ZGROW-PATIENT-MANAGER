"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, FileDown, Plus, Eye, Trash2, CalendarIcon, Send, Bot, User, X } from "lucide-react";
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
      if (!data.authenticated || data.session?.role !== "patient") {
        return router.push("/patient-login");
      }
      setPatientData({ id: data.session.id, firstName: data.session.firstName, lastName: data.session.lastName || "" });
      fetchReports(data.session.id);
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
      const data = await res.json();
      if (Array.isArray(data)) setDoctors(data);
    } catch (err) {}
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (Array.isArray(data)) setMyAppointments(data);
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
      const res = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast.success("Report uploaded successfully!");
      fetchReports(patientData.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = async (reportId: string) => {
    setSelectedReportId(reportId);
    setChatOpen(false); // reset chat state when opening a new report
    try {
      const res = await fetch(`/api/reports/${reportId}/meta`);
      const data = await res.json();
      if (data.isImage) {
        setSelectedReportType('image');
      } else {
        setSelectedReportType('pdf');
      }
      
      // Load chat history for this report
      const chatRes = await fetch(`/api/chat/${reportId}`);
      if (chatRes.ok) {
        const history = await chatRes.json();
        setChatMessages(Array.isArray(history) ? history : []);
      }
    } catch (e) {
      setSelectedReportType('pdf'); // fallback
    }
  };

  const handleBook = async () => {
    if (!booking.doctorId || !booking.date || !booking.timeSlot) {
      return toast.error("Please fill all booking fields");
    }
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking)
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Appointment booked successfully!");
      setBooking({ doctorId: "", date: "", timeSlot: "" });
      setActiveTab('appointments');
      fetchAppointments();
    } catch (err) {
      toast.error("Failed to book appointment");
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedReportId) return;
    const msg = chatInput.trim();
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
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-violet-500/30 relative overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[400px] rounded-full bg-violet-100/50 blur-[80px] sm:blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px] sm:bg-[size:64px_64px] pointer-events-none" />

      <DashboardNavbar />

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-gray-900">Welcome, {patientData.firstName}!</h1>
          <p className="text-sm text-gray-500 font-medium">Manage your medical records and appointments.</p>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-6 mb-8 border-b border-gray-200">
          <button onClick={() => setActiveTab('records')} className={`pb-3 font-bold text-sm sm:text-base transition-colors ${activeTab === 'records' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-900'}`}>My Records</button>
          <button onClick={() => setActiveTab('book')} className={`pb-3 font-bold text-sm sm:text-base transition-colors ${activeTab === 'book' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-900'}`}>Book Appointment</button>
          <button onClick={() => setActiveTab('appointments')} className={`pb-3 font-bold text-sm sm:text-base transition-colors ${activeTab === 'appointments' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-900'}`}>My Appointments</button>
        </div>

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-extrabold flex items-center gap-3">
                <FileText className="w-5 h-5 text-violet-600" /> My Medical Reports
              </h2>
              <div>
                <input
                  type="file"
                  id="patient-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="application/pdf,image/*"
                />
                <Button 
                  onClick={() => document.getElementById('patient-upload')?.click()}
                  disabled={isUploading}
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md font-semibold h-11 px-5"
                >
                  {isUploading ? "Uploading..." : <><Plus className="w-4 h-4 mr-2" /> Upload Record</>}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-900">Report Name</TableHead>
                    <TableHead className="font-semibold text-gray-900">Date Uploaded</TableHead>
                    <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                        You haven't uploaded any reports yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map(r => (
                      <TableRow key={r.id} className="hover:bg-violet-50/50 transition-colors">
                        <TableCell className="font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-violet-500" />
                          {r.reportName}
                        </TableCell>
                        <TableCell className="text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="bg-white border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 rounded-lg shadow-sm font-semibold" onClick={() => handleView(r.id)}>
                              <Eye className="w-4 h-4 mr-1.5" /> View / Ask AI
                            </Button>
                            <a href={r.fileUrl} download target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg shadow-sm font-semibold">
                                <FileDown className="w-4 h-4 mr-1.5" /> Download
                              </Button>
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* BOOK APPOINTMENT TAB */}
        {activeTab === 'book' && (
          <div className="rounded-2xl bg-white border border-gray-100 p-6 sm:p-8 shadow-sm transition-all duration-300 max-w-xl mx-auto hover:shadow-md">
            <h2 className="text-xl font-extrabold flex items-center gap-3 mb-6">
              <CalendarIcon className="w-6 h-6 text-violet-600" /> Book an Appointment
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Select Doctor</label>
                <select 
                  className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-violet-500 focus:ring-violet-500 font-medium"
                  value={booking.doctorId} 
                  onChange={e => {
                    setBooking({...booking, doctorId: e.target.value, timeSlot: ""});
                  }}
                >
                  <option value="">Choose a specialist...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.designation})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Select Date</label>
                <Input 
                  type="date" 
                  value={booking.date} 
                  onChange={e => setBooking({...booking, date: e.target.value})} 
                  className="h-11 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-500 font-medium" 
                />
              </div>

              {booking.doctorId && booking.date && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Available Time Slots</label>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const selectedDoctor = doctors.find(d => d.id === booking.doctorId);
                      if (!selectedDoctor) return null;
                      
                      const datePrefix = `${booking.date} at `;
                      
                      const slotsForDate = selectedDoctor.availableSlots
                        .filter((s: string) => s.startsWith(datePrefix))
                        .map((s: string) => s.replace(datePrefix, ''));
                        
                      const availableTimeSlots = slotsForDate.filter((time: string) => {
                        const isBooked = selectedDoctor.appointments?.some((apt: any) => 
                          apt.date === booking.date && 
                          apt.timeSlot === time && 
                          apt.status !== 'REJECTED'
                        );
                        return !isBooked;
                      });

                      if (availableTimeSlots.length === 0) {
                        return <span className="text-sm text-gray-500 font-medium">No available slots on this date.</span>;
                      }

                      return availableTimeSlots.map((time: string) => (
                        <button 
                          key={time}
                          onClick={() => setBooking({...booking, timeSlot: time})}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${booking.timeSlot === time ? 'bg-violet-600 text-white shadow-md' : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100'}`}
                        >
                          {time}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}

              <Button onClick={handleBook} disabled={!booking.doctorId || !booking.date || !booking.timeSlot} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl shadow-md shadow-emerald-500/20 font-bold h-12 mt-4 transition-transform hover:scale-[1.02]">
                Confirm Booking
              </Button>
            </div>
          </div>
        )}

        {/* MY APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
            <h2 className="text-lg font-extrabold flex items-center gap-3 mb-6">
              <CalendarIcon className="w-5 h-5 text-violet-600" /> My Scheduled Appointments
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-900">Doctor</TableHead>
                  <TableHead className="font-semibold text-gray-900">Specialty</TableHead>
                  <TableHead className="font-semibold text-gray-900">Date</TableHead>
                  <TableHead className="font-semibold text-gray-900">Time</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAppointments.map(apt => (
                  <TableRow key={apt.id} className="hover:bg-violet-50/50">
                    <TableCell className="font-bold">{apt.doctor.name}</TableCell>
                    <TableCell className="text-gray-600">{apt.doctor.designation}</TableCell>
                    <TableCell className="font-medium">{apt.date}</TableCell>
                    <TableCell className="font-medium text-violet-600">{apt.timeSlot}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                        apt.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {apt.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {myAppointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No appointments scheduled.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* View Document & Chat Modal */}
      <Dialog open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
        <DialogContent showCloseButton={false} className="max-w-6xl sm:max-w-6xl w-[95vw] lg:w-[90vw] h-[90vh] p-0 rounded-2xl border-0 shadow-2xl overflow-hidden flex flex-col lg:flex-row gap-0">
          
          {/* Left Side: Document Viewer */}
          <div className={`flex-1 bg-gray-50 flex flex-col relative transition-all duration-300 ${chatOpen ? 'hidden lg:flex' : 'flex'}`}>
            <DialogHeader className="p-4 border-b border-gray-100 bg-white shadow-sm shrink-0 flex flex-row items-center justify-between">
              <DialogTitle className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-600" />
                Document Viewer
              </DialogTitle>
              <div className="flex items-center gap-2">
                {!chatOpen && (
                  <Button 
                    onClick={() => setChatOpen(true)} 
                    className="bg-violet-100 text-violet-700 hover:bg-violet-200 border-0 shadow-sm rounded-lg font-bold"
                  >
                    <Bot className="w-4 h-4 mr-2" /> Ask AI
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedReportId(null)}
                  className="text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden relative p-4">
              {selectedReportId && selectedReportType && (
                selectedReportType === 'image' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200/50 rounded-xl overflow-hidden">
                    <img src={`/api/reports/${selectedReportId}`} alt="Report" className="max-w-full max-h-full object-contain rounded-lg shadow-sm bg-white" />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <PDFViewer url={`/api/reports/${selectedReportId}`} />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Side: Chat Panel */}
          {chatOpen && (
            <div className="w-full lg:w-[400px] xl:w-[450px] bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col h-full shrink-0">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 truncate">
                  <Bot className="w-5 h-5 text-violet-600 shrink-0" /> <span className="truncate">Medical AI Assistant</span>
                </h3>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)} className="text-gray-500 hover:bg-gray-200 rounded-lg shrink-0">Hide Chat</Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedReportId(null)} className="text-gray-500 hover:bg-gray-200 rounded-lg shrink-0 h-8 w-8">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-sm text-sm text-gray-700 shadow-sm min-w-0 break-words whitespace-pre-wrap">
                    Hello! I'm your AI Medical Assistant. I have read this document. What would you like to know about it?
                  </div>
                </div>
                
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-emerald-100' : 'bg-violet-100'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-emerald-600" /> : <Bot className="w-4 h-4 text-violet-600" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm max-w-[85%] min-w-0 break-words whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-emerald-500 text-white rounded-tr-sm border border-emerald-600' 
                        : 'bg-white text-gray-700 rounded-tl-sm border border-gray-100'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-sm text-sm text-gray-500 shadow-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2 relative">
                  <Input 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ask about blood pressure, diagnosis..."
                    disabled={isChatting}
                    className="pr-12 rounded-xl h-11 border-gray-200 focus:border-violet-500 focus:ring-violet-500"
                  />
                  <Button 
                    size="icon" 
                    onClick={sendChatMessage} 
                    disabled={isChatting || !chatInput.trim()}
                    className="absolute right-1 top-1 bottom-1 h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
