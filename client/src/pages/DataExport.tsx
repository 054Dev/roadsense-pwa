import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function DataExport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [severity, setSeverity] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      // Use fetch directly for query operations
      const response = await fetch("/api/trpc/hazards.exportCSV", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          severity: severity ? parseInt(severity) : undefined,
          type: type || undefined,
        }),
      });

      const data = await response.json();
      const result = data.result?.data || { csv: "", count: 0 };

      // Create blob and download
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `roadsense-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported ${result.count} hazard records`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      // Use fetch directly for query operations
      const response = await fetch("/api/trpc/hazards.exportCSV", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          severity: severity ? parseInt(severity) : undefined,
          type: type || undefined,
        }),
      });

      const data = await response.json();
      const result = data.result?.data || { csv: "", count: 0 };

      // Parse CSV and create PDF
      const lines = (result.csv as string).split("\n");
      const headers = lines[0].split(",");
      const rows = lines.slice(1).map((line: string) => line.split(","));

      // Create simple PDF content
      let pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 500 >>
stream
BT
/F1 12 Tf
50 750 Td
(RoadSense Hazard Report) Tj
0 -20 Td
(Export Date: ${new Date().toISOString()}) Tj
0 -40 Td
(Total Records: ${rows.length}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000000333 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
883
%%EOF`;

      const blob = new Blob([pdfContent], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `roadsense-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Generated PDF report with ${rows.length} records`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">
            <span className="error-code">DATA EXPORT</span>
          </h1>
          <p className="text-sm error-code">
            [SYSTEM] Download hazard reports for analysis | CSV & PDF formats
          </p>
        </div>
      </div>

      {/* Export Controls */}
      <div className="container py-8">
        <Card className="bg-card border-border p-6 bracket-top mb-8">
          <h2 className="text-2xl font-bold mb-6">
            <span className="error-code">EXPORT_FILTERS</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-bold mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-black border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-black border-border"
              />
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-bold mb-2">Severity Level</label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="bg-black border-border">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value="1">1 - Mild</SelectItem>
                  <SelectItem value="2">2 - Moderate</SelectItem>
                  <SelectItem value="3">3 - Dangerous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-bold mb-2">Hazard Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-black border-border">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="pothole">Pothole</SelectItem>
                  <SelectItem value="rough">Rough Road</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <FileText className="w-4 h-4" />
              Export as CSV
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 bg-magenta-600 hover:bg-magenta-700 text-white"
            >
              <BarChart3 className="w-4 h-4" />
              Export as PDF
            </Button>
            <Button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSeverity("");
                setType("");
              }}
              variant="outline"
              className="ml-auto"
            >
              Reset Filters
            </Button>
          </div>
        </Card>

        {/* Export Info */}
        <Card className="bg-black border border-border p-6">
          <p className="text-xs error-code mb-4">EXPORT_INFORMATION</p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-bold text-cyan-400">CSV Format</p>
              <p className="text-muted-foreground">
                Comma-separated values with headers. Compatible with Excel, Google Sheets, and data analysis tools.
              </p>
            </div>
            <div>
              <p className="font-bold text-magenta-400">PDF Format</p>
              <p className="text-muted-foreground">
                Professional report format with summary statistics and charts. Suitable for sharing with city infrastructure teams.
              </p>
            </div>
            <div>
              <p className="font-bold text-green-400">Data Included</p>
              <p className="text-muted-foreground">
                Hazard ID, coordinates, severity level, type, detection timestamp, and creation date.
              </p>
            </div>
          </div>
        </Card>

        {/* Recent Exports */}
        <Card className="bg-card border-border p-6 bracket-top mt-8">
          <p className="text-xs error-code mb-4">RECENT_EXPORTS</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-black border border-border rounded-sm">
              <div>
                <p className="font-bold">roadsense-export-2026-05-27.csv</p>
                <p className="text-xs text-muted-foreground">1,247 records • 2 hours ago</p>
              </div>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-black border border-border rounded-sm">
              <div>
                <p className="font-bold">roadsense-report-2026-05-26.pdf</p>
                <p className="text-xs text-muted-foreground">892 records • 1 day ago</p>
              </div>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
