import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

const ProgressReports: React.FC = () => {
  const [selectedChild, setSelectedChild] = React.useState('');
  const [reportType, setReportType] = React.useState('monthly');

  // Do not ship demo child names; default to an empty list. Data should come from backend hooks.
  const children: { id: string; name: string }[] = [];

  const handleDownload = (type: string) => {
    // Implement PDF generation and download
    console.log(`Downloading ${type} report for child ${selectedChild}`);
  };

  const handleEmail = (type: string) => {
    // Implement email sending
    console.log(`Emailing ${type} report for child ${selectedChild}`);
  };

  const handlePrint = (type: string) => {
    // Implement print
    console.log(`Printing ${type} report for child ${selectedChild}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Progress Reports & Downloads</h1>

      {/* Selector */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger>
                <SelectValue placeholder="Select Child" />
              </SelectTrigger>
              <SelectContent>
                {children.map(child => (
                  <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Progress Report</SelectItem>
                <SelectItem value="quarterly">Quarterly Report</SelectItem>
                <SelectItem value="annual">Annual Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
        </CardHeader>
          <CardContent>
          <p>Child: {children.find(c => c.id === selectedChild)?.name || 'Select a child'}</p>
          <p>Type: {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</p>
          <p>Period: {new Date().toLocaleDateString()}</p>
          <p>Sessions: —</p>
          <p>Attendance: —</p>
          <p>Average Mastery: —</p>
          <p>Per-area breakdown: —</p>
          <p>Topics Mastered: —</p>
          <p>Teacher Comments: —</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={() => handleDownload(reportType)}>Download PDF</Button>
        <Button variant="outline" onClick={() => handleEmail(reportType)}>Email to Parents</Button>
        <Button variant="outline" onClick={() => handlePrint(reportType)}>Print</Button>
      </div>
    </div>
  );
};

export default ProgressReports;