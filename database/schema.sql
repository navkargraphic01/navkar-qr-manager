-- ============================================================
-- NAVKAR DYNAMIC QR MANAGER - Complete Database Schema
-- Supabase PostgreSQL
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  company TEXT DEFAULT 'Navkar Plywood',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO public.settings (key, value, description) VALUES
  ('brand_name', '"Navkar Plywood"', 'Company brand name'),
  ('brand_logo_url', 'null', 'Brand logo URL'),
  ('qr_base_url', '"https://qr.navkarplywood.com"', 'Base URL for QR codes'),
  ('qr_prefix', '"NP"', 'QR ID prefix'),
  ('default_theme', '"light"', 'Default UI theme'),
  ('analytics_enabled', 'true', 'Enable scan analytics'),
  ('email_notifications', 'false', 'Enable email notifications')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 3. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#C62828',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default categories
INSERT INTO public.categories (name, slug, description, color) VALUES
  ('Plywood', 'plywood', 'Plywood products', '#C62828'),
  ('Laminates', 'laminates', 'Laminate products', '#B71C1C'),
  ('Veneers', 'veneers', 'Veneer products', '#EF5350'),
  ('Hardware', 'hardware', 'Hardware products', '#FF7043'),
  ('Accessories', 'accessories', 'Accessory products', '#5C6BC0')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 4. QR CODES / PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  qr_id TEXT UNIQUE NOT NULL,           -- NP001, NP002, etc.
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  qr_image_url TEXT,                    -- Stored QR code image
  category_id UUID REFERENCES public.categories(id),
  description TEXT,
  batch_number TEXT,
  warranty_pdf_url TEXT,
  installation_pdf_url TEXT,
  product_image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  template_id UUID,                     -- Reference to QR template
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast QR ID lookups (redirect performance)
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_id ON public.qr_codes(qr_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_product_code ON public.qr_codes(product_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON public.qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON public.qr_codes(created_at DESC);

-- ============================================================
-- 5. QR COUNTER TABLE (for sequential NP001, NP002...)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.qr_counter (
  id INTEGER DEFAULT 1 PRIMARY KEY CHECK (id = 1),  -- Single row
  current_value INTEGER DEFAULT 0,
  prefix TEXT DEFAULT 'NP',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.qr_counter (current_value, prefix) VALUES (0, 'NP')
ON CONFLICT (id) DO NOTHING;

-- Function to generate next QR ID (self-healing if counter row is missing)
CREATE OR REPLACE FUNCTION generate_qr_id()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
  prefix_val TEXT;
  qr_id TEXT;
BEGIN
  -- Attempt to update the counter
  UPDATE public.qr_counter
  SET current_value = current_value + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING current_value, prefix INTO next_val, prefix_val;

  -- If no row was updated (table is empty), initialize it
  IF next_val IS NULL THEN
    INSERT INTO public.qr_counter (id, current_value, prefix)
    VALUES (1, 1, 'NP')
    RETURNING current_value, prefix INTO next_val, prefix_val;
  END IF;

  qr_id := prefix_val || LPAD(next_val::TEXT, 3, '0');
  RETURN qr_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. URL CHANGE HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.url_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  old_url TEXT NOT NULL,
  new_url TEXT NOT NULL,
  change_reason TEXT,
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_url_history_qr_code_id ON public.url_history(qr_code_id);

-- ============================================================
-- 7. SCANS / ANALYTICS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  qr_id TEXT NOT NULL,                  -- Denormalized for performance
  destination_url TEXT,                 -- URL at time of scan
  scanned_at TIMESTAMPTZ DEFAULT NOW(),

  -- Device info
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  browser TEXT,
  os TEXT,
  user_agent TEXT,

  -- Location info
  ip_address INET,
  country TEXT,
  country_code TEXT,
  city TEXT,
  region TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),

  -- Referrer
  referrer TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_scans_qr_code_id ON public.scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scans_qr_id ON public.scans(qr_id);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON public.scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_country ON public.scans(country);
CREATE INDEX IF NOT EXISTS idx_scans_device_type ON public.scans(device_type);

-- Partitioning by month for large-scale analytics (optional)
-- CREATE TABLE scans_2024_01 PARTITION OF scans FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ============================================================
-- 8. QR TEMPLATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.qr_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',  -- Full template config
  is_default BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,           -- System templates can't be deleted
  category TEXT DEFAULT 'custom' CHECK (category IN ('classic', 'premium', 'industrial', 'minimal', 'custom')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default templates
INSERT INTO public.qr_templates (name, slug, description, is_system, is_default, category, template_data) VALUES
(
  'Classic',
  'classic',
  'Clean and professional template with logo and product details',
  TRUE,
  TRUE,
  'classic',
  '{
    "canvas": {"width": 400, "height": 500, "background": "#FFFFFF", "border": "1px solid #E5E7EB", "borderRadius": "8px", "padding": 20},
    "elements": [
      {"id": "logo", "type": "logo", "x": 160, "y": 20, "width": 80, "height": 80, "visible": true},
      {"id": "qr", "type": "qr", "x": 100, "y": 120, "size": 200, "fgColor": "#1A1A1A", "bgColor": "#FFFFFF", "visible": true},
      {"id": "product_name", "type": "text", "x": 20, "y": 345, "width": 360, "content": "{{product_name}}", "fontSize": 18, "fontWeight": "bold", "color": "#111827", "align": "center", "visible": true},
      {"id": "product_code", "type": "text", "x": 20, "y": 380, "width": 360, "content": "Code: {{product_code}}", "fontSize": 13, "color": "#6B7280", "align": "center", "visible": true},
      {"id": "qr_id", "type": "text", "x": 20, "y": 405, "width": 360, "content": "ID: {{qr_id}}", "fontSize": 12, "color": "#9CA3AF", "align": "center", "visible": true},
      {"id": "website", "type": "text", "x": 20, "y": 460, "width": 360, "content": "navkarplywood.com", "fontSize": 11, "color": "#C62828", "align": "center", "visible": true}
    ]
  }'
),
(
  'Premium',
  'premium',
  'Luxury template with gradient header and premium styling',
  TRUE,
  FALSE,
  'premium',
  '{
    "canvas": {"width": 400, "height": 520, "background": "#FFFFFF", "border": "none", "borderRadius": "12px", "padding": 0},
    "header": {"background": "linear-gradient(135deg, #C62828, #B71C1C)", "height": 80, "visible": true},
    "elements": [
      {"id": "brand", "type": "text", "x": 20, "y": 25, "width": 360, "content": "NAVKAR PLYWOOD", "fontSize": 16, "fontWeight": "bold", "color": "#FFFFFF", "align": "center", "visible": true},
      {"id": "logo", "type": "logo", "x": 160, "y": 70, "width": 80, "height": 80, "visible": true, "borderRadius": "50%", "border": "3px solid #FFFFFF"},
      {"id": "qr", "type": "qr", "x": 100, "y": 165, "size": 200, "fgColor": "#1A1A1A", "bgColor": "#FFFFFF", "visible": true},
      {"id": "product_name", "type": "text", "x": 20, "y": 385, "width": 360, "content": "{{product_name}}", "fontSize": 18, "fontWeight": "bold", "color": "#111827", "align": "center", "visible": true},
      {"id": "product_code", "type": "text", "x": 20, "y": 415, "width": 360, "content": "{{product_code}}", "fontSize": 13, "color": "#6B7280", "align": "center", "visible": true},
      {"id": "warranty", "type": "badge", "x": 150, "y": 445, "content": "WARRANTY INCLUDED", "bgColor": "#FEF2F2", "color": "#C62828", "visible": true},
      {"id": "website", "type": "text", "x": 20, "y": 490, "width": 360, "content": "navkarplywood.com", "fontSize": 11, "color": "#9CA3AF", "align": "center", "visible": true}
    ]
  }'
),
(
  'Industrial',
  'industrial',
  'Bold industrial design for warehouse and logistics use',
  TRUE,
  FALSE,
  'industrial',
  '{
    "canvas": {"width": 400, "height": 480, "background": "#1A1A1A", "border": "2px solid #C62828", "borderRadius": "4px", "padding": 20},
    "elements": [
      {"id": "header_line", "type": "divider", "x": 0, "y": 50, "color": "#C62828", "thickness": 2, "visible": true},
      {"id": "brand", "type": "text", "x": 20, "y": 15, "width": 360, "content": "NAVKAR PLYWOOD", "fontSize": 14, "fontWeight": "bold", "color": "#C62828", "align": "left", "letterSpacing": 3, "visible": true},
      {"id": "qr", "type": "qr", "x": 100, "y": 70, "size": 200, "fgColor": "#FFFFFF", "bgColor": "#1A1A1A", "visible": true},
      {"id": "product_name", "type": "text", "x": 20, "y": 290, "width": 360, "content": "{{product_name}}", "fontSize": 20, "fontWeight": "900", "color": "#FFFFFF", "align": "left", "visible": true},
      {"id": "product_code", "type": "text", "x": 20, "y": 325, "width": 360, "content": "SKU: {{product_code}}", "fontSize": 12, "color": "#9CA3AF", "align": "left", "letterSpacing": 2, "visible": true},
      {"id": "qr_id", "type": "text", "x": 20, "y": 350, "width": 360, "content": "QR: {{qr_id}}", "fontSize": 12, "fontFamily": "monospace", "color": "#C62828", "align": "left", "visible": true},
      {"id": "footer_line", "type": "divider", "x": 0, "y": 430, "color": "#333333", "thickness": 1, "visible": true},
      {"id": "website", "type": "text", "x": 20, "y": 445, "width": 360, "content": "navkarplywood.com", "fontSize": 11, "color": "#6B7280", "align": "right", "visible": true}
    ]
  }'
),
(
  'Minimal',
  'minimal',
  'Ultra-clean minimal design, maximum whitespace',
  TRUE,
  FALSE,
  'minimal',
  '{
    "canvas": {"width": 350, "height": 420, "background": "#FAFAFA", "border": "none", "borderRadius": "0px", "padding": 30},
    "elements": [
      {"id": "qr", "type": "qr", "x": 75, "y": 30, "size": 200, "fgColor": "#111827", "bgColor": "#FAFAFA", "visible": true},
      {"id": "line", "type": "divider", "x": 30, "y": 250, "color": "#E5E7EB", "thickness": 1, "visible": true},
      {"id": "product_name", "type": "text", "x": 0, "y": 270, "width": 350, "content": "{{product_name}}", "fontSize": 16, "fontWeight": "600", "color": "#111827", "align": "center", "visible": true},
      {"id": "qr_id", "type": "text", "x": 0, "y": 300, "width": 350, "content": "{{qr_id}}", "fontSize": 11, "fontFamily": "monospace", "color": "#9CA3AF", "align": "center", "letterSpacing": 2, "visible": true},
      {"id": "website", "type": "text", "x": 0, "y": 385, "width": 350, "content": "navkarplywood.com", "fontSize": 10, "color": "#D1D5DB", "align": "center", "visible": true}
    ]
  }'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 9. BULK UPLOAD JOBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bulk_upload_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename TEXT NOT NULL,
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  errors JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. TIMESTAMPS TRIGGER (auto-update updated_at)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.qr_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_upload_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles: users see their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- QR Codes: authenticated users (admins) full access
CREATE POLICY "Admins can manage QR codes" ON public.qr_codes
  FOR ALL USING (auth.role() = 'authenticated');

-- Scans: authenticated users can read all, insert is open (for redirect tracking)
CREATE POLICY "Authenticated users can view scans" ON public.scans
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone can insert scans" ON public.scans
  FOR INSERT WITH CHECK (TRUE);  -- Public insert for scan tracking

-- Templates: authenticated users
CREATE POLICY "Authenticated users manage templates" ON public.qr_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Categories: authenticated users
CREATE POLICY "Authenticated users manage categories" ON public.categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Settings: authenticated users
CREATE POLICY "Authenticated users manage settings" ON public.settings
  FOR ALL USING (auth.role() = 'authenticated');

-- URL History: authenticated users
CREATE POLICY "Authenticated users view history" ON public.url_history
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users insert history" ON public.url_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Bulk jobs: authenticated users
CREATE POLICY "Authenticated users manage bulk jobs" ON public.bulk_upload_jobs
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 12. ANALYTICS VIEWS
-- ============================================================

-- Daily scan counts
CREATE OR REPLACE VIEW public.daily_scans AS
SELECT
  DATE_TRUNC('day', scanned_at) AS scan_date,
  COUNT(*) AS scan_count,
  COUNT(DISTINCT qr_code_id) AS unique_qr_count,
  COUNT(DISTINCT ip_address) AS unique_visitors
FROM public.scans
GROUP BY DATE_TRUNC('day', scanned_at)
ORDER BY scan_date DESC;

-- Monthly scan counts
CREATE OR REPLACE VIEW public.monthly_scans AS
SELECT
  DATE_TRUNC('month', scanned_at) AS scan_month,
  COUNT(*) AS scan_count,
  COUNT(DISTINCT qr_code_id) AS unique_qr_count
FROM public.scans
GROUP BY DATE_TRUNC('month', scanned_at)
ORDER BY scan_month DESC;

-- Top scanned QR codes
CREATE OR REPLACE VIEW public.top_scanned_qr AS
SELECT
  q.qr_id,
  q.product_name,
  q.product_code,
  q.status,
  COUNT(s.id) AS scan_count,
  MAX(s.scanned_at) AS last_scanned_at
FROM public.qr_codes q
LEFT JOIN public.scans s ON s.qr_code_id = q.id
GROUP BY q.id, q.qr_id, q.product_name, q.product_code, q.status
ORDER BY scan_count DESC;

-- Device breakdown
CREATE OR REPLACE VIEW public.device_breakdown AS
SELECT
  device_type,
  COUNT(*) AS scan_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS percentage
FROM public.scans
GROUP BY device_type
ORDER BY scan_count DESC;

-- Country breakdown
CREATE OR REPLACE VIEW public.country_breakdown AS
SELECT
  country,
  country_code,
  COUNT(*) AS scan_count
FROM public.scans
WHERE country IS NOT NULL
GROUP BY country, country_code
ORDER BY scan_count DESC
LIMIT 20;

-- ============================================================
-- 13. DASHBOARD STATS FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_qr_codes', (SELECT COUNT(*) FROM public.qr_codes),
    'active_qr_codes', (SELECT COUNT(*) FROM public.qr_codes WHERE status = 'active'),
    'total_scans', (SELECT COUNT(*) FROM public.scans),
    'scans_today', (SELECT COUNT(*) FROM public.scans WHERE scanned_at >= CURRENT_DATE),
    'scans_this_week', (SELECT COUNT(*) FROM public.scans WHERE scanned_at >= CURRENT_DATE - INTERVAL '7 days'),
    'scans_this_month', (SELECT COUNT(*) FROM public.scans WHERE scanned_at >= DATE_TRUNC('month', NOW())),
    'top_qr', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT qr_id, product_name, scan_count
        FROM public.top_scanned_qr
        LIMIT 5
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 14. FUNCTION: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT INSERT ON public.scans TO anon;  -- Allow anonymous scan tracking
