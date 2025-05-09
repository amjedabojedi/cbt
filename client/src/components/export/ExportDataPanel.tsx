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
      }

      // Add query parameters
      url += `?type=${exportType}`;
      
      // If the user is a therapist/admin and a client is selected, include the clientId
      if (isTherapistWithClient && viewingClientId) {
        url += `&clientId=${viewingClientId}`;
      }

      // We now support 'all' data type in CSV format directly on the server side
      // No need for special handling here anymore

      // First check if the endpoint will return an error
      const checkResponse = await fetch(url, { method: 'HEAD' });
      if (!checkResponse.ok) {
        if (checkResponse.status === 400) {
          // Try to parse the error message
          const errorText = await checkResponse.text();
          try {
            const errorObj = JSON.parse(errorText);
            setExportError(errorObj.message || 'Invalid export request');
          } catch {
            setExportError('The server could not process your export request.');
          }
        } else {
          setExportError('Failed to export data. Please try again later.');
        }
        return;
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
                  <p>JSON format contains complete data in a developer-friendly format. CSV is better for viewing in spreadsheets like Excel. Both formats support exporting all data types.</p>
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
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
}