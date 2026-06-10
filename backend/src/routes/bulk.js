// ============================================================
// BULK UPLOAD ROUTE
// ============================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const QRCode = require('qrcode');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowed.includes(file.mimetype) ||
        file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files allowed'));
    }
  }
});

// POST /api/bulk/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  const supabase = req.app.get('supabase');

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Parse Excel/CSV
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length < 2) {
      return res.status(400).json({ error: 'File is empty or has no data rows' });
    }

    // Parse header row (case-insensitive column matching)
    const headers = rows[0].map(h => String(h).toLowerCase().trim());
    const getColIndex = (names) =>
      names.map(n => headers.findIndex(h => h.includes(n)))
           .find(i => i !== -1);

    const nameCol = getColIndex(['product name', 'name', 'product_name']);
    const codeCol = getColIndex(['product code', 'code', 'sku', 'product_code']);
    const urlCol = getColIndex(['destination url', 'url', 'link', 'destination_url']);
    const categoryCol = getColIndex(['category']);
    const descCol = getColIndex(['description']);
    const batchCol = getColIndex(['batch', 'batch_number']);

    if (nameCol === undefined || codeCol === undefined || urlCol === undefined) {
      return res.status(400).json({
        error: 'Missing required columns',
        message: 'File must have: Product Name, Product Code, Destination URL',
        detected_columns: headers
      });
    }

    // Create job record
    const dataRows = rows.slice(1).filter(row => row.some(cell => cell));
    const { data: job, error: jobError } = await supabase
      .from('bulk_upload_jobs')
      .insert({
        filename: req.file.originalname,
        total_records: dataRows.length,
        status: 'processing',
        started_at: new Date().toISOString(),
        created_by: req.user.id
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Process asynchronously - return job ID immediately
    res.status(202).json({
      message: 'Upload started',
      job_id: job.id,
      total_records: dataRows.length
    });

    // Process in background
    processBulkUpload(supabase, job.id, dataRows, {
      nameCol, codeCol, urlCol, categoryCol, descCol, batchCol
    }, req.user.id).catch(console.error);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bulk/jobs/:jobId - Check job status
router.get('/jobs/:jobId', async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { data, error } = await supabase
      .from('bulk_upload_jobs')
      .select('*')
      .eq('id', req.params.jobId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Job not found' });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bulk/template - Download Excel template
router.get('/template', (req, res) => {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Product Name', 'Product Code', 'Destination URL', 'Category', 'Description', 'Batch Number'],
    ['Navkar Premium Plywood', 'NPL-001', 'https://navkarplywood.com/products/npl-001', 'Plywood', 'High quality plywood', 'BATCH-2024-01'],
    ['BWR Plywood 710', 'BWR-710', 'https://navkarplywood.com/products/bwr-710', 'Plywood', 'Boiling water resistant', 'BATCH-2024-02']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 30 }, { wch: 20 }, { wch: 50 }, { wch: 20 }, { wch: 40 }, { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="navkar_qr_upload_template.xlsx"');
  res.send(buffer);
});

// ============================================================
// Background processing function
// ============================================================
async function processBulkUpload(supabase, jobId, rows, cols, userId) {
  const errors = [];
  let successCount = 0;
  const BATCH_SIZE = 10;

  try {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        const rowNum = i + rows.indexOf(row) + 2; // +2 for header + 0-index
        try {
          const product_name = String(row[cols.nameCol] || '').trim();
          const product_code = String(row[cols.codeCol] || '').trim().toUpperCase();
          const destination_url = String(row[cols.urlCol] || '').trim();

          if (!product_name || !product_code || !destination_url) {
            errors.push({ row: rowNum, error: 'Missing required fields' });
            continue;
          }

          if (!destination_url.startsWith('http')) {
            errors.push({ row: rowNum, product_name, error: 'Invalid URL format' });
            continue;
          }

          // Generate QR ID
          const { data: qrIdData } = await supabase.rpc('generate_qr_id');

          await supabase.from('qr_codes').insert({
            qr_id: qrIdData,
            product_name,
            product_code,
            destination_url,
            description: cols.descCol !== undefined ? String(row[cols.descCol] || '') : null,
            batch_number: cols.batchCol !== undefined ? String(row[cols.batchCol] || '') : null,
            status: 'active',
            created_by: userId,
            updated_by: userId
          });

          successCount++;
        } catch (rowError) {
          errors.push({ row: rowNum, error: rowError.message });
        }
      }

      // Update progress
      await supabase.from('bulk_upload_jobs').update({
        processed_records: i + batch.length,
        success_count: successCount,
        error_count: errors.length
      }).eq('id', jobId);
    }

    // Complete job
    await supabase.from('bulk_upload_jobs').update({
      status: 'completed',
      processed_records: rows.length,
      success_count: successCount,
      error_count: errors.length,
      errors: errors.slice(0, 100), // Cap error list
      completed_at: new Date().toISOString()
    }).eq('id', jobId);

  } catch (error) {
    await supabase.from('bulk_upload_jobs').update({
      status: 'failed',
      errors: [{ error: error.message }],
      completed_at: new Date().toISOString()
    }).eq('id', jobId);
  }
}

module.exports = router;
