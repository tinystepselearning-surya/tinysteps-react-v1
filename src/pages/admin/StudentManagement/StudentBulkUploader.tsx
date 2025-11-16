import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Card } from '@components/ui/card';
import { toast } from '@components/hooks/use-toast';
import * as Papa from 'papaparse';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';

interface MappingColumns {
  kidId?: string;
  kidEmail?: string;
  parentId?: string;
  parentEmail?: string;
  teacherId?: string;
  teacherEmail?: string;
  sessionId?: string;
}

function parseCSV(csv: string): string[][] {
  const parsed = Papa.parse(csv, { skipEmptyLines: true });
  const rows = parsed.data as string[][];
  return rows.map(r => r.map(c => c?.toString().trim()));
}

export default function StudentBulkUploader() {
  const [open, setOpen] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<MappingColumns>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setCsvContent(text);
  const parsed = Papa.parse(text, { skipEmptyLines: true });
  const rows = parsed.data as string[][];
  setParseErrors(parsed.errors || []);
    if (rows.length > 0) {
      setHeaders(rows[0]);
      setPreviewRows(rows.slice(1, 6));
      // Try to auto-populate mapping heuristics
      const h = rows[0].map(x => x.toLowerCase());
      const autoMap: MappingColumns = {};
      const findHeader = (candidates: string[]) => {
        for (const cand of candidates) {
          const i = h.findIndex(x => x.includes(cand));
          if (i >= 0) return rows[0][i];
        }
        return undefined;
      };
      autoMap.kidId = findHeader(['kid id', 'student id', 'kidid', 'studentid', 'uid']);
      autoMap.kidEmail = findHeader(['kid email', 'student email', 'email']);
      autoMap.parentId = findHeader(['parent id', 'parentid']);
      autoMap.parentEmail = findHeader(['parent email']);
      autoMap.teacherId = findHeader(['teacher id', 'teacherid']);
      autoMap.teacherEmail = findHeader(['teacher email']);
      autoMap.sessionId = findHeader(['session id', 'sessionid', 'session']);
      setMapping(autoMap);
    }
  };

  const runValidate = async () => {
    if (!csvContent) return toast({ title: 'No CSV', description: 'Please upload a CSV first' });
    if (!headers.length) return toast({ title: 'Invalid CSV', description: 'CSV is missing header' });
    setIsValidating(true);
    try {
      const fn = httpsCallable(functions, 'adminProcessEnrollmentCSV');
  const res = await fn({ csv: csvContent, mapping, validateOnly: true });
  const d = res.data as any;
  setValidationResults(d.results || []);
  if (d.parseErrors) setParseErrors(d.parseErrors || []);
  toast({ title: 'Validation complete', description: `Found ${d.rowCount} rows` });
    } catch (err: any) {
      toast({ title: 'Validation error', description: err?.message || String(err) });
    } finally {
      setIsValidating(false);
    }
  };

  const runProcess = async () => {
    if (!csvContent) return toast({ title: 'No CSV', description: 'Please upload a CSV first' });
    if (!headers.length) return toast({ title: 'Invalid CSV', description: 'CSV is missing header' });
    setIsProcessing(true);
    try {
      const fn = httpsCallable(functions, 'adminProcessEnrollmentCSV');
  const res = await fn({ csv: csvContent, mapping, validateOnly: false });
  const d = res.data as any;
  toast({ title: 'Processed', description: `Processed ${d.rowCount} rows` });
  setValidationResults(d.results || []);
  if (d.jobId) setJobId(d.jobId);
  if (d.parseErrors) setParseErrors(d.parseErrors || []);
    } catch (err: any) {
      toast({ title: 'Processing error', description: err?.message || String(err) });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Bulk Enroll CSV</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Enrollment CSV</DialogTitle>
          <DialogDescription>Upload a CSV to bulk create or update enrollments. Use the header mapping to map CSV columns to expected fields.</DialogDescription>
        </DialogHeader>

        <Card className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">CSV File</label>
            <input type="file" accept=".csv" onChange={onFileSelected} className="mt-2" />
            <div className="mt-2 text-xs text-gray-500">CSV should contain headers: kidId/kidEmail, parentId/parentEmail, teacherId/teacherEmail, sessionId</div>
          </div>
          {parseErrors && parseErrors.length > 0 && (
            <div className="text-xs text-red-600 mt-1">CSV parse errors: {parseErrors.length} issue(s). Please check header/format.</div>
          )}

          {headers.length > 0 && (
            <div>
              <div className="text-sm font-medium">Header mapping</div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {['kidId','kidEmail','parentId','parentEmail','teacherId','teacherEmail','sessionId'].map(h => (
                  <div key={h}>
                    <label className="text-xs text-gray-600">{h}</label>
                    <Select
                      value={(mapping as any)[h] || 'unmapped'}
                      onValueChange={(val) =>
                        setMapping(prev => ({
                          ...prev,
                          [h]: val === 'unmapped' ? undefined : val,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Unmapped" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmapped">Unmapped</SelectItem>
                        {headers.map((col, i) => (
                          <SelectItem key={col + i} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewRows.length > 0 && (
            <div>
              <div className="text-sm font-medium">Preview</div>
              <div className="mt-2 text-xs overflow-x-auto border rounded p-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr>
                      {headers.map((h, i) => <th className="pr-2" key={h + i}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((c, cIdx) => <td key={cIdx} className="pr-2">{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={runValidate} disabled={isValidating}>{isValidating ? 'Validating...' : 'Validate'}</Button>
            <Button onClick={runProcess} disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Apply'}</Button>
          </div>

          {validationResults && validationResults.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium">Results</div>
              <div className="mt-2 text-xs overflow-y-auto max-h-40 bg-gray-50 p-2 rounded">
                {validationResults.map((r:any, idx:number) => (
                  <div key={idx} className={r.success ? 'text-green-700' : 'text-red-600'}>
                    Row {r.rowIndex}: {r.success ? 'OK' : r.message}
                  </div>
                ))}
              </div>
              {(jobId || (validationResults && validationResults.length > 0)) && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600">Job ID: <span className="font-mono">{jobId || 'validation'}</span></div>
                  <div className="mt-1">
                    <Button size="sm" variant="outline" onClick={() => {
                      // Download results as CSV
                      const csvRows = [['rowIndex','success','message'], ...validationResults.map(r => [String(r.rowIndex), r.success ? 'OK' : 'FAILED', r.message || ''])];
                      const csvText = csvRows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
                      const blob = new Blob([csvText], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `bulk-upload-results-${jobId || 'validation'}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>Download Results</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </DialogContent>
    </Dialog>
  );
}
