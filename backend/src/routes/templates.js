const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { data, error } = await supabase.from('qr_templates').select('*').order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

router.get('/:id', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { data, error } = await supabase.from('qr_templates').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });
  res.json({ data });
});

router.post('/', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, description, template_data, category } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  const { data, error } = await supabase.from('qr_templates')
    .insert({ name, slug, description, template_data, category: category || 'custom', created_by: req.user.id })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ data });
});

router.put('/:id', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, description, template_data, category } = req.body;
  const { data, error } = await supabase.from('qr_templates')
    .update({ name, description, template_data, category, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).eq('is_system', false).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

router.delete('/:id', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { error } = await supabase.from('qr_templates').delete().eq('id', req.params.id).eq('is_system', false);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

module.exports = router;
