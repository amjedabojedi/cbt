import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useClientContext } from '@/context/ClientContext';
import { Button } from '@/components/ui/button';
import { downloadPDF, openPDF, pdfExportUrl } from '@/lib/pdf-download';
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

      if (exportFormat === 'pdf') {
        await downloadPDF(pdfExportUrl(exportType, "all", isTherapistWithClient ? viewingClientId : undefined));
        return;
      }

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
    } catch {
      setExportError('Failed to export data. Please try again later.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintablePDF = async () => {
    try {
      setIsPDFExporting(true);
      setExportError(null);
      await openPDF(pdfExportUrl(exportType, "all", isTherapistWithClient ? viewingClientId : undefined));
    } catch {
      setExportError('Failed to open PDF. Please allow pop-ups and try again.');
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
                  <div>Select what kind of data you want to export</div>
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
                  <div>JSON contains complete data for technical use. CSV works with spreadsheets like Excel. PDF creates a nicely formatted document you can print or share.</div>
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
          
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button
          onClick={handleExport}
          disabled={isExporting || isPDFExporting}
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
        
        <div className="w-full text-center mt-2">
          <Button
            onClick={handlePrintablePDF}
            disabled={isPDFExporting || isExporting}
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
                Open PDF to print
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}