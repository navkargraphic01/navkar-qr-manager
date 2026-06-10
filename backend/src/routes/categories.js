const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

router.post('/', async (req, res) => {
  const supabase = req.app.get('supabase');
  const { name, description, color } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const { data, error } = await supabase.from('categories')
    .insert({ name, slug, description, color: color || '#C62828', created_by: req.user.id })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ data });
});

module.exports = router;
