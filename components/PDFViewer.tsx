"use client";

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Load worker from CDN to avoid Next.js bundling issues that break react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [width, setWidth] = useState<number>(800);

  useEffect(() => {
    const updateWidth = () => {
      const isMobile = window.innerWidth < 768;
      // On mobile, take up 95% of width. On desktop, cap at 800px.
      setWidth(isMobile ? window.innerWidth * 0.95 : 800);
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div className="w-full h-full flex flex-col items-center bg-gray-900 overflow-y-auto">
      <div className="py-4 sm:py-8 w-full flex flex-col items-center">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-violet-300 font-medium animate-pulse">Loading Document...</p>
            </div>
          }
          error={<div className="text-rose-400 p-8 font-bold">Failed to load PDF.</div>}
        >
          {Array.from(new Array(numPages || 0), (_, index) => (
            <div key={`page_container_${index}`} className="mb-6 rounded-lg overflow-hidden shadow-2xl bg-white flex justify-center">
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={width}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
