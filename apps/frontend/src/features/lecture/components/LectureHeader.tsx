import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LectureMetadata } from './LectureMetadata';

interface LectureHeaderProps {
  lecture: any;
}

import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { api } from '../../../infrastructure/api';

export const LectureHeader: React.FC<LectureHeaderProps> = ({ lecture }) => {
  const navigate = useNavigate();
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const handleExport = async () => {
    try {
      const response = await api.get(`/api/lectures/${lecture._id}/export?format=markdown`, {
        responseType: 'blob', // Important for file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${lecture.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export lecture', err);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const response = await api.get(`/api/lectures/${lecture._id}/export-study-pack`, {
        responseType: 'blob', // Important for file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${lecture.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_study_pack.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to export Study Pack PDF', err);
      alert('Failed to generate Study Pack. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <header className="flex flex-col gap-4 pb-4 border-b border-border shrink-0">
      <div>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="group inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </button>
        
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {lecture.title}
          </h1>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-transparent bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2 disabled:opacity-50"
            >
              {isExportingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              {isExportingPdf ? 'Generating...' : 'Generate Study Pack'}
            </button>
            <button 
              onClick={handleExport}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border bg-transparent hover:bg-surfaceHover h-9 px-4 py-2"
              title="Export as Markdown"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <LectureMetadata lecture={lecture} />
    </header>
  );
};
