import { useState } from 'react'
import { Palette, QrCode, Download } from 'lucide-react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { getQrUrl } from '../lib/supabase'

const TEMPLATES = [
  { id: 'classic', name: 'Classic', fg: '#000000', bg: '#FFFFFF', accent: '#C62828' },
  { id: 'navkar',  name: 'Navkar',  fg: '#000000', bg: '#FFF5F5', accent: '#C62828' },
  { id: 'dark',    name: 'Dark',    fg: '#FFFFFF', bg: '#111111', accent: '#ef5350' },
  { id: 'minimal', name: 'Minimal', fg: '#333333', bg: '#FAFAFA', accent: '#666666' },
]

export default function DesignStudio() {
  const [settings, setSettings] = useState({
    qr_id: 'NP001',
    product_name: 'Navkar Premium Plywood',
    product_code: 'NPL-001',
    fg_color: '#000000',
    bg_color: '#FFFFFF',
    frame_color: '#C62828',
    show_product_name: true,
    show_product_code: true,
    show_qr_id: true,
    show_website: true,
    website_text: 'navkarplywood.com',
    selected_template: 'classic',
  })
  const [previewUrl, setPreviewUrl] = useState(null)
  const [generating, setGenerating] = useState(false)

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }))

  const applyTemplate = (tpl) => {
    setSettings(prev => ({
      ...prev,
      fg_color: tpl.fg,
      bg_color: tpl.bg,
      frame_color: tpl.accent,
      selected_template: tpl.id,
    }))
    setPreviewUrl(null)
  }

  const generatePreview = async () => {
    setGenerating(true)
    try {
      const url = getQrUrl(settings.qr_id)
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H', width: 200, margin: 1,
        color: { dark: settings.fg_color, light: settings.bg_color },
      })
      setPreviewUrl(dataUrl)
      toast.success('Preview generated!')
    } catch {
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `${settings.qr_id}-custom.png`
    a.click()
    toast.success('Downloaded!')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-5">
          {/* Templates */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Palette size={15} className="text-navkar-700" /> Templates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className={`p-3 rounded-xl border-2 text-center text-xs font-medium transition-all
                    ${settings.selected_template === tpl.id
                      ? 'border-navkar-700 bg-navkar-50 dark:bg-navkar-900/20 text-navkar-700'
                      : 'border-border hover:border-navkar-700/50 text-muted-foreground'}`}
                >
                  <div className="w-8 h-8 rounded-lg mx-auto mb-1.5 border border-border"
                    style={{ background: tpl.bg, borderColor: tpl.accent }} />
                  {tpl.name}
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
                    type="text"
                    value={settings[key]}
                    placeholder={placeholder}
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
              <Palette size={15} className="text-navkar-700" /> Colors &amp; Style
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'QR Code Color', key: 'fg_color' },
                { label: 'Background', key: 'bg_color' },
                { label: 'Frame Color', key: 'frame_color' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings[key]}
                      onChange={e => update(key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings[key]}
                      onChange={e => update(key, e.target.value)}
                      className="flex-1 px-2 py-1.5 text-xs font-mono bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'show_product_name', label: 'Show Product Name' },
                { key: 'show_product_code', label: 'Show Product Code' },
                { key: 'show_qr_id', label: 'Show QR ID' },
                { key: 'show_website', label: 'Show Website' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={e => update(key, e.target.checked)}
                    className="accent-navkar-700"
                  />
                  <span className="text-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={generatePreview}
            disabled={generating}
            className="w-full py-2.5 bg-navkar-700 hover:bg-navkar-800 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-70"
          >
            {generating ? 'Generating...' : 'Generate Preview'}
          </button>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-4">
            <h3 className="font-semibold text-foreground text-sm mb-4">Preview</h3>
            <div
              className="rounded-xl p-6 flex flex-col items-center gap-3 border"
              style={{ background: settings.bg_color, borderColor: settings.frame_color }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="QR" className="w-40 h-40" />
              ) : (
                <div className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center"
                  style={{ borderColor: settings.frame_color }}>
                  <QrCode size={48} style={{ color: settings.fg_color, opacity: 0.3 }} />
                </div>
              )}
              {settings.show_product_name && (
                <p className="text-sm font-bold text-center" style={{ color: settings.fg_color }}>{settings.product_name}</p>
              )}
              {settings.show_product_code && (
                <p className="text-xs" style={{ color: settings.fg_color, opacity: 0.7 }}>{settings.product_code}</p>
              )}
              {settings.show_qr_id && (
                <p className="text-xs font-mono font-bold" style={{ color: settings.frame_color }}>{settings.qr_id}</p>
              )}
              {settings.show_website && (
                <p className="text-[10px]" style={{ color: settings.fg_color, opacity: 0.5 }}>{settings.website_text}</p>
              )}
            </div>

            {previewUrl && (
              <button
                onClick={handleDownload}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-lg transition-colors"
              >
                <Download size={14} /> Download PNG
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
