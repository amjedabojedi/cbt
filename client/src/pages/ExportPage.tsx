import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import AppLayout from '@/components/layout/AppLayout';
import { ExportDataPanel } from '@/components/export/ExportDataPanel';
import { CloudDownload } from 'lucide-react';

export default function ExportPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader
          heading="Export Your Data"
          subheading="Download your records for backup or analysis"
          icon={<CloudDownload size={30} className="text-primary" />}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Data Export Options</h2>
            <p className="text-muted-foreground">
              Choose what data you want to export and in which format. Your data belongs to you, and you can download it at any time.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">About the export formats:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-medium">JSON</span>: Contains all data fields, best for complete backups or technical use.</li>
                <li><span className="font-medium">CSV</span>: Simpler format that works with spreadsheet programs like Excel or Google Sheets. Some complex data might be simplified.</li>
              </ul>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Privacy Note:</h3>
              <p>
                Your data is downloaded directly to your device and is not shared with any third parties during this process.
              </p>
            </div>
          </div>
          
          <div>
            <ExportDataPanel />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}