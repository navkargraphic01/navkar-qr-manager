// ============================================================
// ANALYTICS ROUTES
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/analytics/dashboard - Dashboard stats
router.get('/dashboard', async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/daily - Daily scan chart (last N days)
router.get('/daily', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { days = 30 } = req.query;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const { data, error } = await supabase
      .from('scans')
      .select('scanned_at')
      .gte('scanned_at', startDate.toISOString())
      .order('scanned_at', { ascending: true });

    if (error) throw error;

    // Group by day
    const grouped = {};
    for (let i = 0; i < parseInt(days); i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      grouped[key] = 0;
    }

    data.forEach(scan => {
      const day = scan.scanned_at.split('T')[0];
      if (grouped[day] !== undefined) grouped[day]++;
    });

    const result = Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/monthly - Monthly scan chart
router.get('/monthly', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { months = 12 } = req.query;

  try {
    const { data, error } = await supabase
      .from('monthly_scans')
      .select('*')
      .limit(parseInt(months));

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/top-products - Top scanned products
router.get('/top-products', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { limit = 10 } = req.query;

  try {
    const { data, error } = await supabase
      .from('top_scanned_qr')
      .select('*')
      .limit(parseInt(limit));

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/devices - Device breakdown
router.get('/devices', async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { data, error } = await supabase
      .from('device_breakdown')
      .select('*');
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/countries - Country breakdown
router.get('/countries', async (req, res) => {
  const supabase = req.app.get('supabase');
  try {
    const { data, error } = await supabase
      .from('country_breakdown')
      .select('*');
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/recent-scans - Recent scan activity
router.get('/recent-scans', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { limit = 20 } = req.query;

  try {
    const { data, error } = await supabase
      .from('scans')
      .select(`
        id, scanned_at, device_type, country, city, browser,
        qr_id,
        qr_codes(product_name, product_code)
      `)
      .order('scanned_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
