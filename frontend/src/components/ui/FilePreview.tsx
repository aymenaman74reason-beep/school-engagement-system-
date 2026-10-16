import React, { useState } from "react";
import { FileText, Eye, Download, X } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface FilePreviewProps {
  url: string;
  filename?: string;
  className?: string;
}

export function FilePreview({ url, filename, className }: FilePreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Basic file type detection based on URL/extension
  const isPdf = url.toLowerCase().endsWith(".pdf") || url.includes("/raw/upload/");
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || url.includes("/image/upload/");

  if (isImage) {
    return (
      <>
        <div className={`relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 ${className || "h-20 w-20"}`} onClick={() => setIsPreviewOpen(true)}>
          <img src={url} alt={filename || "Attachment"} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Eye className="text-white h-5 w-5" />
          </div>
        </div>
        
        <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={filename || "Image Preview"} className="max-w-4xl">
          <div className="flex flex-col items-center gap-4">
            <img src={url} alt={filename || "Preview"} className="max-h-[70vh] w-auto rounded shadow-sm" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
                <Download className="h-4 w-4 mr-2" /> Download Original
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  if (isPdf) {
    return (
      <>
        <div 
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors ${className || "h-20 w-20"}`}
          onClick={() => setIsPreviewOpen(true)}
        >
          <FileText className="h-8 w-8 text-red-500" />
          <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center px-1">
            {filename || "PDF Document"}
          </span>
        </div>

        <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={filename || "PDF Preview"} className="max-w-5xl">
          <div className="flex flex-col h-[80vh]">
            <iframe 
              src={`${url}#toolbar=0`} 
              className="w-full flex-grow rounded border border-gray-100"
              title="PDF Viewer"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
                <Download className="h-4 w-4 mr-2" /> Open in New Tab
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // Fallback for unknown types
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors ${className || "h-20 w-20"}`}
    >
      <Download className="h-6 w-6 text-gray-400" />
      <span className="text-[8px] text-gray-500 truncate w-full text-center">Download</span>
    </a>
  );
}
