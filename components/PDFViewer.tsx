"use client";

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 overflow-hidden relative">
      <iframe 
        src={`${url}#toolbar=0&view=FitH`} 
        title="PDF Document Viewer"
        className="w-full h-full border-0 min-h-[60vh] md:min-h-[80vh]"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
