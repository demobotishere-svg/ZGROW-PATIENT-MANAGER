"use client";

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error("PDF load error:", error);
    setError("Failed to load PDF document.");
  }

  return (
    <div className="flex flex-col items-center w-full">
      {error && (
        <div className="text-red-500 font-bold p-4 bg-red-50 rounded-lg border border-red-200 mt-4">
          {error}
          <div className="mt-2 text-sm">
            <a href={url} target="_blank" rel="noreferrer" className="underline">Click here to open externally</a>
          </div>
        </div>
      )}
      
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<div className="animate-pulse p-8 text-gray-500">Loading document...</div>}
        className="flex flex-col items-center w-full"
      >
        {numPages && Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} className="mb-4 shadow-md bg-white w-full flex justify-center">
            <Page 
              pageNumber={index + 1} 
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="max-w-full"
              width={window.innerWidth > 768 ? 800 : window.innerWidth - 64}
            />
          </div>
        ))}
      </Document>
    </div>
  );
}
