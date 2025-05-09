import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useClientContext } from '@/context/ClientContext';
import { Button } from '@/components/ui/button';
import { User } from '@shared/schema';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DownloadCloud,
  FileSpreadsheet,
  FileJson,
  FileText,
  Printer,
  Info
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
// No need to import apiBaseUrl, just use '/api' directly

export function ExportDataPanel() {
  const apiBaseUrl = '/api'; // API base URL is just the /api route
  const { user } = useAuth();
  const { viewingClientId, viewingClientName, isViewingClient } = useClientContext();
  const [exportType, setExportType] = useState<string>("all");
  const [exportFormat, setExportFormat] = useState<string>("json");
  const [isExporting, setIsExporting] = useState(false);
  const [isPDFExporting, setIsPDFExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Check if we're a therapist viewing a client's data
  const isTherapistWithClient = (user?.role === 'therapist' || user?.role === 'admin') && isViewingClient;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);

      let url = `${apiBaseUrl}/export`;
      if (exportFormat === 'csv') {
        url = `${apiBaseUrl}/export/csv`;
      } else if (exportFormat === 'pdf') {
        url = `${apiBaseUrl}/export/pdf`;
      }

      // Add query parameters
      url += `?type=${exportType}`;
      
      // If the user is a therapist/admin and a client is selected, include the clientId
      if (isTherapistWithClient && viewingClientId) {
        url += `&clientId=${viewingClientId}`;
      }

      // Create a hidden anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', ''); // The filename will be provided by the server
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      setExportError('Failed to export data. Please try again later.');
    } finally {
      setIsExporting(false);
    }
  };

  // HTML to PDF alternative approach
  const handlePrintablePDF = async () => {
    try {
      setIsPDFExporting(true);
      setExportError(null);

      // Determine the URL to fetch HTML data
      let url = `${apiBaseUrl}/export/html`;
      
      // Add query parameters
      url += `?type=${exportType}`;
      
      // If the user is a therapist/admin and a client is selected, include the clientId
      if (isTherapistWithClient && viewingClientId) {
        url += `&clientId=${viewingClientId}`;
      }

      // Fetch the HTML content
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch printable data');
      }
      
      const htmlContent = await response.text();
      
      // Create a new window with the HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
      }
      
      // Write the HTML content to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>CBT Export - ${exportType}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1, h2 { color: #333; }
              table { border-collapse: collapse; width: 100%; margin: 20px 0; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f2f2f2; }
              .print-only { display: none; }
              @media print {
                .no-print { display: none; }
                .print-only { display: block; }
                body { margin: 0; padding: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="background: #f2f2f2; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
              <h3>Print Instructions</h3>
              <p>To save as PDF: Use your browser's Print feature (Ctrl+P or Cmd+P) and select "Save as PDF" as the destination.</p>
              <p>This method avoids antivirus concerns with downloaded PDF files.</p>
              <button onclick="window.print();" style="background: #4F46E5; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">
                Print / Save as PDF
              </button>
            </div>
            ${htmlContent}
          </body>
        </html>
      `);
      
      // Close the document writing
      printWindow.document.close();
      
    } catch (error) {
      console.error('Printable PDF error:', error);
      setExportError('Failed to generate printable view. Please try again or use CSV export.');
    } finally {
      setIsPDFExporting(false);
    }
  };

  const getExportTypeLabel = (type: string): string => {
    switch (type) {
      case 'emotions': return 'Emotion Records';
      case 'thoughts': return 'Thought Records';
      case 'journals': return 'Journal Entries';
      case 'goals': return 'Goals';
      case 'all': return 'All Data';
      default: return type;
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DownloadCloud className="mr-2" size={20} />
          Export Data
        </CardTitle>
        <CardDescription>
          Download your data in your preferred format
          {isTherapistWithClient && viewingClientName && (
            <span className="font-medium text-primary"> for client: {viewingClientName}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {exportError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Export Failed</AlertTitle>
            <AlertDescription>{exportError}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="export-type" className="flex items-center">
            Data Type 
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={16} className="ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select what kind of data you want to export</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Select 
            value={exportType} 
            onValueChange={setExportType}
          >
            <SelectTrigger id="export-type">
              <SelectValue placeholder="Select data to export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Data</SelectItem>
              <SelectItem value="emotions">Emotion Records</SelectItem>
              <SelectItem value="thoughts">Thought Records</SelectItem>
              <SelectItem value="journals">Journal Entries</SelectItem>
              <SelectItem value="goals">Goals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="export-format" className="flex items-center">
            Export Format
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={16} className="ml-1 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>JSON contains complete data for technical use. CSV works with spreadsheets like Excel. PDF creates a nicely formatted document you can print or share.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Select 
            value={exportFormat} 
            onValueChange={setExportFormat}
          >
            <SelectTrigger id="export-format">
              <SelectValue placeholder="Select export format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">
                <div className="flex items-center">
                  <FileJson className="mr-2" size={16} />
                  JSON (Complete Data)
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center">
                  <FileSpreadsheet className="mr-2" size={16} />
                  CSV (Spreadsheet)
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center">
                  <FileText className="mr-2" size={16} />
                  PDF (Document)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {exportFormat === 'pdf' && (
            <div className="text-xs text-amber-600 mt-1 flex items-center">
              <Info size={12} className="mr-1" />
              Note: If your antivirus blocks PDF downloads, please use CSV format instead.
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <DownloadCloud className="mr-2 h-4 w-4" />
              Export {getExportTypeLabel(exportType)}
            </>
          )}
        </Button>
        
        {/* Add a special Print-friendly PDF button that avoids antivirus issues */}
        <div className="w-full text-center mt-2">
          <Button
            onClick={handlePrintablePDF}
            disabled={isPDFExporting}
            variant="outline"
            className="w-full"
          >
            {isPDFExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Print View...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print-friendly PDF (Avoids Antivirus Issues)
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}