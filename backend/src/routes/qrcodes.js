// ============================================================
// QR CODES API ROUTES
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { body, query, param, validationResult } = require('express-validator');
const QRCode = require('qrcode');

// All routes require authentication
router.use(authenticate);

// ============================================================
// GET /api/qrcodes - List all QR codes with pagination/search
// ============================================================
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(['active', 'inactive', 'draft']),
  query('category_id').optional().isUUID()
], async (req, res) => {
  const supabase = req.app.get('supabase');
  const { page = 1, limit = 20, search, status, category_id, sort = 'created_at', order = 'desc' } = req.query;
  const offset = (page - 1) * limit;

  try {
    let queryBuilder = supabase
      .from('qr_codes')
      .select(`
        *,
        categories(id, name, color)
      `, { count: 'exact' })
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      queryBuilder = queryBuilder.or(
        `product_name.ilike.%${search}%,product_code.ilike.%${search}%,qr_id.ilike.%${search}%`
      );
    }
    if (status) queryBuilder = queryBuilder.eq('status', status);
    if (category_id) queryBuilder = queryBuilder.eq('category_id', category_id);

    const { data, error, count } = await queryBuilder;

    if (error) throw error;

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/qrcodes/:id - Get single QR code with history
// ============================================================
router.get('/:id', async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select(`
        *,
        categories(id, name, color),
        url_history(id, old_url, new_url, change_reason, changed_at, profiles(full_name))
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'QR code not found' });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/qrcodes - Create new QR code
// ============================================================
router.post('/', [
  body('product_name').notEmpty().trim(),
  body('product_code').notEmpty().trim(),
  body('destination_url').isURL({ require_protocol: true }),
  body('status').optional().isIn(['active', 'inactive', 'draft']),
  body('category_id').optional().isUUID()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const supabase = req.app.get('supabase');
  const {
    product_name, product_code, destination_url, category_id,
    description, batch_number, warranty_pdf_url, installation_pdf_url,
    product_image_url, status = 'active', template_id, metadata
  } = req.body;

  try {
    // Generate next QR ID (NP001, NP002, ...)
    const { data: qrIdData, error: idError } = await supabase.rpc('generate_qr_id');
    if (idError) throw idError;
    const qr_id = qrIdData;

    // Generate QR code image URL
    const qrUrl = `${process.env.QR_BASE_URL}/p/${qr_id}`;

    // Generate QR as base64 PNG
    const qrImageBase64 = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      width: 400
    });

    // Insert QR code
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        qr_id,
        product_name: product_name.trim(),
        product_code: product_code.trim().toUpperCase(),
        destination_url,
        category_id: category_id || null,
        description: description || null,
        batch_number: batch_number || null,
        warranty_pdf_url: warranty_pdf_url || null,
        installation_pdf_url: installation_pdf_url || null,
        product_image_url: product_image_url || null,
        status,
        template_id: template_id || null,
        metadata: metadata || {},
        created_by: req.user.id,
        updated_by: req.user.id
      })
      .select(`*, categories(id, name, color)`)
      .single();

    if (error) throw error;

    res.status(201).json({
      data: { ...data, qr_image_base64: qrImageBase64, qr_url: qrUrl }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// PUT /api/qrcodes/:id - Full update
// ============================================================
router.put('/:id', [
  body('product_name').optional().notEmpty().trim(),
  body('destination_url').optional().isURL({ require_protocol: true }),
  body('status').optional().isIn(['active', 'inactive', 'draft'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const supabase = req.app.get('supabase');
  try {
    // Get existing record
    const { data: existing, error: fetchError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Not found' });

    const updateData = { ...req.body, updated_by: req.user.id };
    delete updateData.qr_id; // QR ID is immutable
    delete updateData.id;

    // If URL is changing, record history
    if (req.body.destination_url && req.body.destination_url !== existing.destination_url) {
      await supabase.from('url_history').insert({
        qr_code_id: req.params.id,
        old_url: existing.destination_url,
        new_url: req.body.destination_url,
        change_reason: req.body.change_reason || null,
        changed_by: req.user.id
      });
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`*, categories(id, name, color)`)
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DELETE /api/qrcodes/:id
// ============================================================
router.delete('/:id', async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'QR code deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/qrcodes/:id/generate-image - Generate QR image
// ============================================================
router.get('/:id/generate-image', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { format = 'png', size = 400, dark = '#000000', light = '#FFFFFF' } = req.query;

  try {
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select('qr_id, product_name')
      .eq('id', req.params.id)
      .single();

    if (error || !qrCode) return res.status(404).json({ error: 'Not found' });

    const qrUrl = `${process.env.QR_BASE_URL}/p/${qrCode.qr_id}`;

    if (format === 'svg') {
      const svg = await QRCode.toString(qrUrl, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        color: { dark, light },
        width: parseInt(size)
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }

    // PNG
    const buffer = await QRCode.toBuffer(qrUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      color: { dark, light },
      width: parseInt(size)
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${qrCode.qr_id}.png"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/qrcodes/:id/scans - Get scan history for a QR code
// ============================================================
router.get('/:id/scans', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { data, error, count } = await supabase
      .from('scans')
      .select('*', { count: 'exact' })
      .eq('qr_code_id', req.params.id)
      .order('scanned_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;
    res.json({
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
