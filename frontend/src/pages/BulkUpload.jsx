// ============================================================
// BULK UPLOAD PAGE
// Export this as default from BulkUpload.jsx
// ============================================================
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle,
  Download, Loader2, AlertCircle, QrCode
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function BulkUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setResults(null);
    parseFile(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  });

  const parseFile = (f) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (rows.length > 0) {
        setHeaders(rows[0] || []);
        setPreview(rows.slice(1, 6));
      }
    };
    reader.readAsBinaryString(f);
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Product Name', 'Product Code', 'Destination URL', 'Category', 'Description'],
      ['Navkar Premium Plywood 18mm', 'NPL-18MM', 'https://navkarplywood.com/npl-18mm', 'Plywood', 'High quality plywood'],
      ['BWR 710 Plywood', 'BWR-710', 'https://navkarplywood.com/bwr-710', 'Plywood', 'Boiling water resistant'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 55 }, { wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'navkar_bulk_template.xlsx');
    toast.success('Template downloaded!');
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const dataRows = rows.slice(1).filter(r => r.some(c => c));
        const hdrs = (rows[0] || []).map(h => String(h).toLowerCase().trim());

        const getIdx = (names) => names.map(n => hdrs.findIndex(h => h.includes(n))).find(i => i !== -1);
        const nameCol = getIdx(['product name', 'name', 'product_name']);
        const codeCol = getIdx(['code', 'sku', 'product_code']);
        const urlCol = getIdx(['url', 'link', 'destination']);

        if (nameCol === undefined || urlCol === undefined) {
          toast.error('Missing required columns: Product Name, Destination URL');
          setProcessing(false);
          return;
        }

        let success = 0, errors = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const product_name = String(row[nameCol] || '').trim();
          const destination_url = String(row[urlCol] || '').trim();
          const product_code = codeCol !== undefined ? String(row[codeCol] || '').trim().toUpperCase() : `AUTO-${i + 1}`;

          if (!product_name || !destination_url || !destination_url.startsWith('http')) {
            errors.push({ row: i + 2, product_name, error: 'Missing or invalid data' });
            continue;
          }

          try {
            const { data: qrId } = await supabase.rpc('generate_qr_id');
            const { error } = await supabase.from('qr_codes').insert({
              qr_id: qrId,
              product_name,
              product_code: product_code || `AUTO-${i + 1}`,
              destination_url,
              status: 'active',
              created_by: user.id,
              updated_by: user.id,
            });
            if (error) throw error;
            success++;
          } catch (err) {
            errors.push({ row: i + 2, product_name, error: err.message });
          }

          setProgress(Math.round(((i + 1) / dataRows.length) * 100));
        }

        setResults({ success, errors, total: dataRows.length });
        if (success > 0) toast.success(`${success} QR codes created!`);
        if (errors.length > 0) toast.error(`${errors.length} rows had errors`);
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      toast.error('Processing failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Download template */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={20} className="text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-foreground">Download Excel Template</p>
            <p className="text-xs text-muted-foreground">Use this template to prepare your data correctly</p>
          </div>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Download size={13} /> Download
        </button>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-navkar-700 bg-navkar-50 dark:bg-navkar-900/20' : 'border-border hover:border-navkar-700/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? 'text-navkar-700' : 'text-muted-foreground/40'}`} />
        <p className="text-sm font-medium text-foreground">
          {isDragActive ? 'Drop your file here!' : 'Drop Excel or CSV file here'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">or click to browse · .xlsx, .xls, .csv · Max 10MB</p>
        {file && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 px-3 py-1.5 rounded-full">
            <FileSpreadsheet size={13} /> {file.name} ({Math.round(file.size / 1024)}KB)
          </div>
        )}
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">File Preview (first 5 rows)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border bg-muted/50">
                {headers.map((h, i) => (
                  <th key={i} className="py-2 px-3 text-left font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {preview.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    {row.map((cell, j) => (
                      <td key={j} className="py-2 px-3 text-foreground">{String(cell || '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Progress */}
      {processing && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 size={15} className="animate-spin text-navkar-700" />
            <p className="text-sm font-medium text-foreground">Processing QR codes... {progress}%</p>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-navkar-700 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Upload Results</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{results.total}</p>
              <p className="text-xs text-muted-foreground">Total Rows</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{results.success}</p>
              <p className="text-xs text-muted-foreground">Created</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{results.errors.length}</p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </div>
          {results.errors.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {results.errors.map((e, i) => (
                <div key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                  <XCircle size={11} className="mt-0.5 flex-shrink-0" />
                  Row {e.row}: {e.product_name} — {e.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Process button */}
      {file && !processing && !results && (
        <button
          onClick={handleProcess}
          className="w-full flex items-center justify-center gap-2 py-3 bg-navkar-700 hover:bg-navkar-800 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <QrCode size={15} /> Generate All QR Codes
        </button>
      )}
    </div>
  );
}
