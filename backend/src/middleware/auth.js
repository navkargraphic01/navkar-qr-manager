// ============================================================
// Auth Middleware - Verify Supabase JWT
// ============================================================
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user profile
    const serviceSupabase = req.app.get('supabase');
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    req.user = { ...user, profile };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
