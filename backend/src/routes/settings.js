const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { data, error } = await supabase.from('settings').select('*');
  if (error) return res.status(500).json({ error: error.message });
  const settings = {};
  data.forEach(s => { settings[s.key] = s.value; });
  res.json({ data: settings });
});

router.put('/:key', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { value } = req.body;
  const { data, error } = await supabase.from('settings')
    .upsert({ key: req.params.key, value, updated_by: req.user.id })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

module.exports = router;
