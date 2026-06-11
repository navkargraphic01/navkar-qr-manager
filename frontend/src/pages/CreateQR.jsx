import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, Tag, QrCode, Save, Download, AlertCircle, ArrowLeft, CheckCircle, Copy, Printer } from 'lucide-react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { supabase, getQrUrl } from '../lib/supabase'
import PrintTagModal from '../components/PrintTagModal'
import { useAuth } from '../context/AuthContext'

// ─────────────────────────────────────────────────────────────
//  BUG FIX: FormField is defined HERE at MODULE level, NOT
//  inside the CreateQR component function.
//
//  Defining a component inside another component's render body
//  creates a NEW component type on every render. React then
//  sees a different component and unmounts/remounts the DOM
//  node — which destroys the focused <input> element and
//  causes the cursor to jump out after every character typed.
//
//  BEFORE (buggy):
//    function CreateQR() {
//      const k = ({ label, name, ... }) => <div>...</div>  // ❌ new type each render
//      return <form>...<k name="product_name" />...</form>
//    }
//
//  AFTER (fixed):
//    const FormField = ({ label, name, ... }) => <div>...</div>  // ✓ stable reference
//    function CreateQR() {
//      return <form>...<FormField name="product_name" />...</form>
//    }
// ─────────────────────────────────────────────────────────────

/**
 * A reusable form field wrapper — defined at module scope so its
 * component identity is stable across re-renders.
 */
function FormField({ label, name, required, type = 'text', placeholder, hint, value, onChange, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-navkar-700">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-sm bg-background border rounded-lg transition-all
          focus:outline-none focus:ring-2 focus:ring-navkar-700 focus:border-transparent
          ${error ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10' : 'border-border'}`}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  )
}

function isValidUrl(url) {
  try { return Boolean(new URL(url)) } catch { return false }
}

export default function CreateQR() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    product_name: '',
    product_code: '',
    destination_url: '',
    category_id: '',
    description: '',
    batch_number: '',
    warranty_pdf_url: '',
    installation_pdf_url: '',
    status: 'active',
  })
  const [categories, setCategories] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [previewDataUrl, setPreviewDataUrl] = useState(null)
  const [created, setCreated] = useState(null)
  const [printModalOpen, setPrintModalOpen] = useState(false)

  // Fetch categories and templates once
  useEffect(() => {
    supabase.from('categories').select('id, name, color').order('name')
      .then(({ data }) => setCategories(data || []))

    supabase.from('qr_templates').select('id, name').order('created_at', { ascending: false })
      .then(({ data }) => {
        const presets = [
          { id: 'classic', name: 'Classic White (Preset)' },
          { id: 'wood-premium', name: 'Champagne Gold (Preset)' },
          { id: 'industrial-dark', name: 'Industrial Dark (Preset)' }
        ]
        const dbTemplates = (data || []).map(t => ({ id: t.id, name: t.name }))
        setTemplates([...presets, ...dbTemplates])
      })
  }, [])

  // Update QR preview when URL changes
  useEffect(() => {
    if (isValidUrl(form.destination_url)) {
      QRCode.toDataURL('https://qr.navkarplywood.com/p/PREVIEW', {
        errorCorrectionLevel: 'H', width: 200, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      }).then(setPreviewDataUrl)
    } else {
      setPreviewDataUrl(null)
    }
  }, [form.destination_url])

  const updateField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const errs = {}
    if (!form.product_name.trim()) errs.product_name = 'Product name is required'
    if (!form.product_code.trim()) errs.product_code = 'Product code is required'
    if (!form.destination_url.trim()) {
      errs.destination_url = 'Destination URL is required'
    } else if (!isValidUrl(form.destination_url)) {
      errs.destination_url = 'Enter a valid URL (include https://)'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) { toast.error('Please fix the errors below'); return }
    setSaving(true)
    try {
      const { data: qrId, error: rpcErr } = await supabase.rpc('generate_qr_id')
      if (rpcErr) throw rpcErr

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedTemplateId)

      const { data: qr, error: insertErr } = await supabase
        .from('qr_codes')
        .insert({
          qr_id: qrId,
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
          metadata: selectedTemplateId && !isUUID ? { preset_template_id: selectedTemplateId } : {},
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      const qrUrl = getQrUrl(qr.qr_id)
      const qrImage = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H', width: 400, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
      setCreated({ ...qr, qr_image: qrImage, qr_url: qrUrl })
      toast.success(`QR Code ${qr.qr_id} created successfully!`)
    } catch (err) {
      toast.error('Failed to create QR: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    if (!created?.qr_image) return
    const a = document.createElement('a')
    a.href = created.qr_image
    a.download = `${created.qr_id}-${created.product_code}.png`
    a.click()
    toast.success('QR downloaded!')
  }

  const handleCreateAnother = () => {
    setCreated(null)
    setForm({
      product_name: '', product_code: '', destination_url: '',
      category_id: '', description: '', batch_number: '',
      warranty_pdf_url: '', installation_pdf_url: '', status: 'active',
    })
  }

  // ─── Success Screen ───
  if (created) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-8 text-center space-y-6"
        >
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">QR Code Created!</h2>
            <p className="text-muted-foreground text-sm mt-1">Your dynamic QR code is ready to print and use.</p>
          </div>
          <div className="bg-white rounded-xl p-6 inline-block mx-auto shadow-sm border border-border">
            <img src={created.qr_image} alt="QR Code" className="w-48 h-48 mx-auto" />
            <div className="mt-3 text-center">
              <p className="font-bold text-foreground">{created.product_name}</p>
              <code className="text-xs text-navkar-700 font-mono">{created.qr_id}</code>
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">QR ID</span>
              <code className="font-mono font-bold text-navkar-700">{created.qr_id}</code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">QR URL</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-foreground truncate max-w-[200px]">{created.qr_url}</span>
                <button onClick={() => navigator.clipboard.writeText(created.qr_url)} className="text-navkar-700">
                  <Copy size={13} />
                </button>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Destination</span>
              <span className="text-xs text-foreground truncate max-w-[200px]">{created.destination_url}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            💡 <strong>You can change the destination URL anytime</strong> — the printed QR code will still work.
            Go to QR Codes → Edit to update the URL.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setPrintModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-navkar-700 hover:bg-navkar-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Printer size={15} /> Print Designed Tag
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 border border-border hover:bg-muted text-foreground rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={15} /> Download PNG
            </button>
            <button
              onClick={handleCreateAnother}
              className="flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors"
            >
              <QrCode size={15} /> Create Another
            </button>
            <button
              onClick={() => navigate('/qr-codes')}
              className="flex items-center gap-2 px-5 py-2.5 border border-border hover:bg-muted text-foreground rounded-lg text-sm font-medium transition-colors"
            >
              View All QR Codes
            </button>
          </div>
        </motion.div>
        <PrintTagModal qrCode={created} isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} />
      </div>
    )
  }

  // ─── Create Form ───
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/qr-codes')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Back to QR Codes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          {/* Product Info */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Package size={16} className="text-navkar-700" />
              Product Information
              <span className="text-xs text-muted-foreground font-normal">Required</span>
            </h3>
            {/* ✅ FormField is defined at MODULE scope — stable reference, no remounting */}
            <FormField
              label="Product Name" name="product_name" required
              placeholder="e.g. Navkar Premium Plywood 18mm"
              value={form.product_name} onChange={updateField} error={errors.product_name}
            />
            <FormField
              label="Product Code" name="product_code" required
              placeholder="e.g. NPL-18MM-004"
              hint="Will be stored in UPPERCASE automatically"
              value={form.product_code} onChange={updateField} error={errors.product_code}
            />
            <FormField
              label="Destination URL" name="destination_url" required type="url"
              placeholder="https://navkarplywood.com/products/npl-18mm"
              hint="This is where customers will land when they scan. You can change this anytime later."
              value={form.destination_url} onChange={updateField} error={errors.destination_url}
            />
          </div>

          {/* Additional Details */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Tag size={16} className="text-navkar-700" />
              Additional Details
              <span className="text-xs text-muted-foreground font-normal">Optional</span>
            </h3>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <select
                value={form.category_id}
                onChange={e => updateField('category_id', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
              >
                <option value="">No Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Design Template */}
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

            <FormField
              label="Description" name="description"
              placeholder="Brief product description..."
              value={form.description} onChange={updateField} error={errors.description}
            />
            <FormField
              label="Batch Number" name="batch_number"
              placeholder="e.g. BATCH-2024-001"
              value={form.batch_number} onChange={updateField} error={errors.batch_number}
            />
            <FormField
              label="Warranty PDF URL" name="warranty_pdf_url" type="url"
              placeholder="https://..."
              value={form.warranty_pdf_url} onChange={updateField} error={errors.warranty_pdf_url}
            />
            <FormField
              label="Installation Guide URL" name="installation_pdf_url" type="url"
              placeholder="https://..."
              value={form.installation_pdf_url} onChange={updateField} error={errors.installation_pdf_url}
            />

            {/* Status */}
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
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4
              bg-navkar-700 hover:bg-navkar-800 text-white font-semibold
              rounded-xl text-sm transition-colors shadow-sm disabled:opacity-70"
          >
            {saving ? (
              <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Generating QR Code...</>
            ) : (
              <><Save size={15} /> Save &amp; Generate QR Code</>
            )}
          </button>
        </form>

        {/* Preview panel */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-4">
            <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <QrCode size={15} className="text-navkar-700" /> QR Preview
            </h3>
            <div className="bg-white rounded-xl p-4 text-center border border-border min-h-[200px] flex flex-col items-center justify-center">
              {previewDataUrl ? (
                <>
                  <img src={previewDataUrl} alt="QR Preview" className="w-36 h-36 mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">Preview (actual ID assigned on save)</p>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-24 h-24 mx-auto border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                    <QrCode size={32} className="text-muted-foreground/30" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a valid destination URL<br />to preview the QR code
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">How it works:</p>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-none">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-navkar-700 text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    QR code contains a <strong>fixed</strong> Navkar URL (e.g. /p/NP001)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-navkar-700 text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    Customer scans → our server looks up the destination
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-navkar-700 text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    You can <strong>change the URL anytime</strong> - QR stays the same!
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
