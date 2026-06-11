// ============================================================
// AUTH ROUTES - /api/auth
// ============================================================
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authLimiter } = require('../middleware/rateLimit');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid credentials format' });
  }

  const { email, password } = req.body;
  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid email or password' });

    // Update last login
    const supabase = req.app.get('supabase');
    await supabase.from('profiles').update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    const { data: profile } = await supabase.from('profiles').select('*')
      .eq('id', data.user.id).single();

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { ...data.user, profile }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    await supabaseAuth.auth.signOut();
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  const supabase = req.app.get('supabase');
  const { full_name, avatar_url } = req.body;
  try {
    const { data, error } = await supabase.from('profiles')
      .update({ full_name, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select().single();
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
