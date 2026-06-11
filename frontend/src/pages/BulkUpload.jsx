import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { read, utils } from 'xlsx'
import { writeFile } from 'xlsx'
import { FileSpreadsheet, Upload, Download, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function BulkUpload() {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [headers, setHeaders] = useState([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((files) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    parsePreview(f)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const parsePreview = (f) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const wb = read(e.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = utils.sheet_to_json(ws, { header: 1 })
      if (rows.length > 0) {
        setHeaders(rows[0] || [])
        setPreview(rows.slice(1, 6))
      }
    }
    reader.readAsBinaryString(f)
  }

  const downloadTemplate = () => {
    const wb = utils.book_new()
    const data = [
      ['Product Name', 'Product Code', 'Destination URL', 'Category', 'Description'],
      ['Navkar Premium Plywood 18mm', 'NPL-18MM', 'https://navkarplywood.com/npl-18mm', 'Plywood', 'High quality plywood'],
      ['BWR 710 Plywood', 'BWR-710', 'https://navkarplywood.com/bwr-710', 'Plywood', 'Boiling water resistant'],
    ]
    const ws = utils.aoa_to_sheet(data)
    ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 55 }, { wch: 20 }, { wch: 40 }]
    utils.book_append_sheet(wb, ws, 'Products')
    writeFile(wb, 'navkar_bulk_template.xlsx')
    toast.success('Template downloaded!')
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const wb = read(e.target.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = utils.sheet_to_json(ws, { header: 1 })
        const headerRow = (rows[0] || []).map(h => String(h).toLowerCase().trim())
        const dataRows = rows.slice(1).filter(r => r.some(v => v))

        const findCol = (keys) => keys.map(k => headerRow.findIndex(h => h.includes(k))).find(i => i !== -1)
        const nameCol = findCol(['product name', 'name', 'product_name'])
        const codeCol = findCol(['code', 'sku', 'product_code'])
        const urlCol  = findCol(['url', 'link', 'destination'])

        if (nameCol === undefined || urlCol === undefined) {
          toast.error('Missing required columns: Product Name, Destination URL')
          setUploading(false)
          return
        }

        let success = 0
        const errors = []

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i]
          const name = String(row[nameCol] || '').trim()
          const url  = String(row[urlCol] || '').trim()
          const code = codeCol !== undefined ? String(row[codeCol] || '').trim().toUpperCase() : `AUTO-${i + 1}`

          if (!name || !url || !url.startsWith('http')) {
            errors.push({ row: i + 2, product_name: name, error: 'Missing or invalid data' })
            continue
          }
          try {
            const { data: qrId } = await supabase.rpc('generate_qr_id')
            const { error } = await supabase.from('qr_codes').insert({
              qr_id: qrId,
              product_name: name,
              product_code: code || `AUTO-${i + 1}`,
              destination_url: url,
              status: 'active',
              created_by: user.id,
              updated_by: user.id,
            })
            if (error) throw error
            success++
          } catch (err) {
            errors.push({ row: i + 2, product_name: name, error: err.message })
          }
          setProgress(Math.round((i + 1) / dataRows.length * 100))
        }

        setResult({ success, errors, total: dataRows.length })
        if (success > 0) toast.success(`${success} QR codes created!`)
        if (errors.length > 0) toast.error(`${errors.length} rows had errors`)
      }
      reader.readAsBinaryString(file)
    } catch (err) {
      toast.error('Processing failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={20} className="text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Bulk QR Code Import</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Upload an Excel or CSV file to create multiple QR codes at once.</p>
          </div>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
        >
          <Download size={13} /> Template
        </button>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-navkar-700 bg-navkar-50/50 dark:bg-navkar-900/10' : 'border-border hover:border-navkar-700/50 hover:bg-muted/30'}`}
      >
        <input {...getInputProps()} />
        <Upload size={36} className="mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-foreground font-medium">{isDragActive ? 'Drop the file here...' : 'Drag & drop your Excel or CSV file'}</p>
        <p className="text-muted-foreground text-sm mt-1">or click to browse · Max 10MB</p>
        <p className="text-xs text-muted-foreground mt-2">Supports .xlsx, .xls, .csv</p>
        {file && <p className="text-xs text-navkar-700 font-medium mt-3">📎 {file.name}</p>}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">File Preview (first 5 rows)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {headers.map((h, i) => (
                    <th key={i} className="text-left py-2 px-3 font-medium text-muted-foreground">{String(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, ri) => (
                  <tr key={ri} className="border-b border-border last:border-0">
                    {headers.map((_, ci) => (
                      <td key={ci} className="py-2 px-3 text-foreground">{String(row[ci] || '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-foreground font-medium">Uploading...</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-navkar-700 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Upload Result</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">{result.success} created</span>
            </div>
            {result.errors.length > 0 && (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle size={16} />
                <span className="text-sm font-medium">{result.errors.length} errors</span>
              </div>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded px-3 py-1.5">
                  <span className="font-medium">Row {e.row}:</span> {e.product_name || 'Unknown'} — {e.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload button */}
      {file && !uploading && (
        <button
          onClick={handleUpload}
          className="w-full py-2.5 bg-navkar-700 hover:bg-navkar-800 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Upload &amp; Create QR Codes
        </button>
      )}
    </div>
  )
}
