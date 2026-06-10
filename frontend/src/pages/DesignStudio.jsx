// ============================================================
// DESIGN STUDIO PAGE
// ============================================================
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Palette, Download, Save, QrCode, LayoutTemplate, Eye } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { getQRUrl } from '../lib/utils';

const PRESET_TEMPLATES = [
  { id: 'classic', name: 'Classic', bg: '#FFFFFF', fg: '#000000', frame: 'rounded', accent: '#C62828' },
  { id: 'premium', name: 'Premium', bg: '#FFFFFF', fg: '#1A1A1A', frame: 'rounded', accent: '#C62828' },
  { id: 'dark', name: 'Dark', bg: '#1A1A1A', fg: '#FFFFFF', frame: 'square', accent: '#EF5350' },
  { id: 'minimal', name: 'Minimal', bg: '#FAFAFA', fg: '#111827', frame: 'none', accent: '#6B7280' },
];

export default function DesignStudio() {
  const [config, setConfig] = useState({
    qr_id: 'NP001',
    product_name: 'Navkar Premium Plywood',
    product_code: 'NPL-001',
    fg_color: '#000000',
    bg_color: '#FFFFFF',
    frame_color: '#C62828',
    show_logo: true,
    show_product_name: true,
    show_product_code: true,
    show_website: true,
    show_qr_id: true,
    border_radius: 8,
    width: 300,
    website_text: 'navkarplywood.com',
    selected_template: 'classic',
  });
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generatePreview = async () => {
    setGenerating(true);
    try {
      const url = getQRUrl(config.qr_id);
      const dataUrl = await QRCodeLib.toDataURL(url, {
        errorCorrectionLevel: 'H',
        width: 200,
        margin: 1,
        color: { dark: config.fg_color, light: config.bg_color }
      });
      setQrDataUrl(dataUrl);
      toast.success('Preview generated!');
    } catch (e) {
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const applyTemplate = (tmpl) => {
    setConfig(p => ({
      ...p,
      fg_color: tmpl.fg,
      bg_color: tmpl.bg,
      frame_color: tmpl.accent,
      selected_template: tmpl.id
    }));
    setQrDataUrl(null);
  };

  const update = (key, val) => setConfig(p => ({ ...p, [key]: val }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-5">
          {/* Template presets */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <LayoutTemplate size={15} className="text-navkar-700" /> Start with a Template
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => applyTemplate(tmpl)}
                  className={`p-3 rounded-xl border-2 text-center text-xs font-medium transition-all ${
                    config.selected_template === tmpl.id
                      ? 'border-navkar-700 bg-navkar-50 dark:bg-navkar-900/20 text-navkar-700'
                      : 'border-border hover:border-navkar-700/50 text-muted-foreground'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg mx-auto mb-1.5 border border-border"
                    style={{ background: tmpl.bg, borderColor: tmpl.accent }}
                  />
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* QR Content */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <QrCode size={15} className="text-navkar-700" /> QR Content
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'QR ID', key: 'qr_id', placeholder: 'NP001' },
                { label: 'Product Name', key: 'product_name', placeholder: 'Product Name' },
                { label: 'Product Code', key: 'product_code', placeholder: 'NPL-001' },
                { label: 'Website', key: 'website_text', placeholder: 'navkarplywood.com' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input
                    type="text" value={config[key]} placeholder={placeholder}
                    onChange={e => update(key, e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Palette size={15} className="text-navkar-700" /> Colors & Style
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'QR Code Color', key: 'fg_color' },
                { label: 'Background', key: 'bg_color' },
                { label: 'Frame / Accent', key: 'frame_color' },
              ].map(({ label, key }) => (
                <div key={key} className="text-center">
                  <label className="text-xs text-muted-foreground mb-2 block">{label}</label>
                  <input
                    type="color" value={config[key]}
                    onChange={e => update(key, e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer border border-border"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">{config[key]}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                Border Radius: {config.border_radius}px
              </label>
              <input
                type="range" min={0} max={24} value={config.border_radius}
                onChange={e => update('border_radius', parseInt(e.target.value))}
                className="w-full accent-navkar-700"
              />
            </div>
          </div>

          {/* Show/hide elements */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Show Elements</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'show_logo', label: 'Logo' },
                { key: 'show_product_name', label: 'Product Name' },
                { key: 'show_product_code', label: 'Product Code' },
                { key: 'show_qr_id', label: 'QR ID' },
                { key: 'show_website', label: 'Website URL' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                  <input
                    type="checkbox" checked={config[key]}
                    onChange={e => update(key, e.target.checked)}
                    className="accent-navkar-700 w-4 h-4 rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={generatePreview}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-navkar-700 hover:bg-navkar-800 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            <Eye size={15} /> {generating ? 'Generating...' : 'Generate Preview'}
          </button>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-4">
            <h3 className="font-semibold text-foreground text-sm mb-4">Live Preview</h3>
            <div className="flex items-center justify-center min-h-[320px]"
              style={{ background: config.bg_color, borderRadius: config.border_radius, border: `2px solid ${config.frame_color}`, padding: '24px' }}>
              <div className="text-center space-y-2">
                {config.show_logo && (
                  <div className="w-10 h-10 rounded-lg bg-navkar-700 flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                )}
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR" className="w-32 h-32 mx-auto" />
                ) : (
                  <div className="w-32 h-32 mx-auto border-2 border-dashed flex items-center justify-center"
                    style={{ borderColor: config.fg_color, borderRadius: 4 }}>
                    <QrCode size={40} style={{ color: config.fg_color, opacity: 0.3 }} />
                  </div>
                )}
                {config.show_product_name && (
                  <p className="font-bold text-sm" style={{ color: config.fg_color }}>{config.product_name}</p>
                )}
                {config.show_product_code && (
                  <p className="text-xs" style={{ color: config.fg_color, opacity: 0.7 }}>{config.product_code}</p>
                )}
                {config.show_qr_id && (
                  <p className="text-xs font-mono font-bold" style={{ color: config.frame_color }}>{config.qr_id}</p>
                )}
                {config.show_website && (
                  <p className="text-[10px]" style={{ color: config.fg_color, opacity: 0.5 }}>{config.website_text}</p>
                )}
              </div>
            </div>

            {qrDataUrl && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrDataUrl;
                  a.download = `${config.qr_id}-custom.png`;
                  a.click();
                  toast.success('Downloaded!');
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-lg transition-colors"
              >
                <Download size={14} /> Download PNG
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
