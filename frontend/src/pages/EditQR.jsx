import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Link2, Save, Download, Copy, Loader2, AlertCircle, Printer } from 'lucide-react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { supabase, getQrUrl } from '../lib/supabase'
import PrintTagModal from '../components/PrintTagModal'
import { useAuth } from '../context/AuthContext'

function isValidUrl(url) {
  try { return Boolean(new URL(url)) } catch { return false }
}

export default function EditQR() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [qr, setQr] = useState(null)
  const [form, setForm] = useState({})
  const [categories, setCategories] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [urlHistory, setUrlHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [qrPreviewUrl, setQrPreviewUrl] = useState(null)
  const [changeReason, setChangeReason] = useState('')
  const [printModalOpen, setPrintModalOpen] = useState(false)

  useEffect(() => { fetchData() }, [id])

  useEffect(() => {
    if (qr?.qr_id) {
      QRCode.toDataURL(getQrUrl(qr.qr_id), {
        errorCorrectionLevel: 'H', width: 200, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      }).then(setQrPreviewUrl)
    }
  }, [qr?.qr_id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [qrRes, catRes, histRes, tplRes] = await Promise.all([
        supabase.from('qr_codes').select('*, categories(id,name,color)').eq('id', id).single(),
        supabase.from('categories').select('id,name,color').order('name'),
        supabase.from('url_history').select('*, profiles(full_name)').eq('qr_code_id', id).order('changed_at', { ascending: false }).limit(10),
        supabase.from('qr_templates').select('id, name').order('created_at', { ascending: false }),
      ])
      if (qrRes.error || !qrRes.data) { toast.error('QR code not found'); navigate('/qr-codes'); return }
      
      const presets = [
        { id: 'classic', name: 'Classic White (Preset)' },
        { id: 'wood-premium', name: 'Champagne Gold (Preset)' },
        { id: 'industrial-dark', name: 'Industrial Dark (Preset)' }
      ]
      const dbTemplates = (tplRes.data || []).map(t => ({ id: t.id, name: t.name }))
      setTemplates([...presets, ...dbTemplates])

      const qrData = qrRes.data
      setQr(qrData)
      setForm({
        product_name: qrData.product_name,
        product_code: qrData.product_code,
        destination_url: qrData.destination_url,
        category_id: qrData.category_id ?? '',
        description: qrData.description ?? '',
        batch_number: qrData.batch_number ?? '',
        warranty_pdf_url: qrData.warranty_pdf_url ?? '',
        installation_pdf_url: qrData.installation_pdf_url ?? '',
        status: qrData.status,
      })
      setSelectedTemplateId(qrData.template_id || qrData.metadata?.preset_template_id || '')
      setCategories(catRes.data || [])
      setUrlHistory(histRes.data || [])
    } catch { toast.error('Error loading QR code') } finally { setLoading(false) }
  }

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!form.product_name?.trim()) { toast.error('Product name is required'); return }
    if (!form.destination_url?.trim()) { toast.error('Destination URL is required'); return }
    if (!isValidUrl(form.destination_url)) { toast.error('Enter a valid URL (include https://)'); return }
    setSaving(true)
    try {
      const urlChanged = form.destination_url !== qr.destination_url
      if (urlChanged) {
        await supabase.from('url_history').insert({
          qr_code_id: id,
          old_url: qr.destination_url,
          new_url: form.destination_url,
          change_reason: changeReason || null,
          changed_by: user.id,
        })
      }
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedTemplateId)
      const { error } = await supabase.from('qr_codes').update({
        product_name: form.product_name.trim(),
        product_code: form.product_code.trim().toUpperCase(),
        destination_url: form.destination_url.trim(),
        category_id: form.category_id || null,
        description: form.description || null,
        batch_number: form.batch_number || null,
        warranty_pdf_url: form.warranty_pdf_url || null,
        installation_pdf_url: form.installation_pdf_url || null,
        status: form.status,
        template_id: isUUID ? selectedTemplateId : null,
        metadata: {
          ...(qr.metadata || {}),
          preset_template_id: selectedTemplateId && !isUUID ? selectedTemplateId : null
        },
        updated_by: user.id,
      }).eq('id', id)
      if (error) throw error
      toast.success(urlChanged ? `✅ URL updated! QR code ${qr.qr_id} now redirects to the new URL.` : 'Changes saved!')
      setChangeReason('')
      fetchData()
    } catch (err) {
      toast.error('Save failed: ' + err.message)
    } finally { setSaving(false) }
  }

  const handleDownload = async () => {
    const dataUrl = await QRCode.toDataURL(getQrUrl(qr.qr_id), {
      errorCorrectionLevel: 'H', width: 600, margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${qr.qr_id}.png`
    a.click()
    toast.success('Downloaded!')
  }

  const urlChanged = form.destination_url !== qr?.destination_url

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/qr-codes')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to QR Codes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* URL Section */}
          <div className={`bg-card border-2 rounded-xl p-5 space-y-4 transition-colors ${urlChanged ? 'border-navkar-700' : 'border-border'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Link2 size={16} className="text-navkar-700" />
                Destination URL
                <span className="text-xs bg-navkar-50 dark:bg-navkar-900/30 text-navkar-700 px-2 py-0.5 rounded-full">
                  Dynamic - change anytime
                </span>
              </h3>
              {urlChanged && (
                <span className="text-xs font-medium text-navkar-700 flex items-center gap-1">
                  <AlertCircle size={12} /> Unsaved change
                </span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">New Destination URL</label>
              <input
                type="url"
                value={form.destination_url}
                onChange={e => updateField('destination_url', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
              />
            </div>
            {urlChanged && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Change Reason (optional)</label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={e => setChangeReason(e.target.value)}
                  placeholder="e.g. Updated product page"
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
                />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Product Information</h3>
            {[
              { label: 'Product Name', field: 'product_name', type: 'text' },
              { label: 'Product Code', field: 'product_code', type: 'text' },
              { label: 'Description', field: 'description', type: 'text' },
              { label: 'Batch Number', field: 'batch_number', type: 'text' },
              { label: 'Warranty PDF URL', field: 'warranty_pdf_url', type: 'url' },
              { label: 'Installation PDF URL', field: 'installation_pdf_url', type: 'url' },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[field] ?? ''}
                  onChange={e => updateField(field, e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <select
                value={form.category_id}
                onChange={e => updateField('category_id', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
              >
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Design Template</label>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
              >
                <option value="">No Template (Use Default Classic White)</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => updateField('status', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-navkar-700 hover:bg-navkar-800
              text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-70"
          >
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save Changes</>}
          </button>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {qrPreviewUrl && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-4">QR Code</h3>
              <div className="bg-white rounded-xl p-4 text-center border border-border">
                <img src={qrPreviewUrl} alt="QR" className="w-36 h-36 mx-auto" />
                <code className="text-xs text-navkar-700 font-mono mt-2 block">{qr?.qr_id}</code>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <button onClick={() => setPrintModalOpen(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-navkar-700 hover:bg-navkar-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
                  <Printer size={13} /> Print Designed Tag
                </button>
                <div className="flex gap-2">
                  <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border hover:bg-muted text-foreground text-xs rounded-lg transition-colors">
                    <Download size={13} /> Download
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(getQrUrl(qr.qr_id)).then(() => toast.success('Copied!'))}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs rounded-lg transition-colors">
                    <Copy size={13} /> Copy URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* URL History */}
          {urlHistory.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3">URL History</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {urlHistory.map((h, i) => (
                  <div key={i} className="text-xs border-b border-border pb-2 last:border-0">
                    <p className="text-muted-foreground line-through truncate">{h.old_url}</p>
                    <p className="text-foreground truncate">{h.new_url}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {new Date(h.changed_at).toLocaleDateString('en-IN')}
                      {h.change_reason && ` · ${h.change_reason}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <PrintTagModal qrCode={qr} isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} />
    </div>
  )
}
