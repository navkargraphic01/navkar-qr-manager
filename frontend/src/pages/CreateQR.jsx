import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  QrCode, Save, ArrowLeft, Loader2, Link2, Package,
  Tag, FileText, AlertCircle, CheckCircle, Copy, Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { isValidUrl, copyToClipboard, getQRUrl } from '../lib/utils';
import QRCodeLib from 'qrcode';

export default function CreateQR() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qrPreviewRef = useRef(null);

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
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewQR, setPreviewQR] = useState(null);
  const [savedQR, setSavedQR] = useState(null);

  useEffect(() => {
    supabase.from('categories').select('id, name, color').order('name')
      .then(({ data }) => setCategories(data || []));
  }, []);

  // Live QR preview when URL is typed
  useEffect(() => {
    if (isValidUrl(form.destination_url)) {
      // Show preview with placeholder ID
      const previewUrl = `${import.meta.env.VITE_QR_BASE_URL || 'https://qr.navkarplywood.com'}/p/PREVIEW`;
      QRCodeLib.toDataURL(previewUrl, {
        errorCorrectionLevel: 'H', width: 200, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      }).then(setPreviewQR);
    } else {
      setPreviewQR(null);
    }
  }, [form.destination_url]);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.product_name.trim()) e.product_name = 'Product name is required';
    if (!form.product_code.trim()) e.product_code = 'Product code is required';
    if (!form.destination_url.trim()) e.destination_url = 'Destination URL is required';
    else if (!isValidUrl(form.destination_url)) e.destination_url = 'Enter a valid URL (include https://)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors below');
      return;
    }
    setLoading(true);
    try {
      // Get next QR ID
      const { data: qrId, error: idErr } = await supabase.rpc('generate_qr_id');
      if (idErr) throw idErr;

      // Insert QR code
      const { data, error } = await supabase.from('qr_codes').insert({
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
        created_by: user.id,
        updated_by: user.id,
      }).select().single();

      if (error) throw error;

      // Generate final QR image
      const qrUrl = getQRUrl(data.qr_id);
      const qrImage = await QRCodeLib.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H', width: 400, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      setSavedQR({ ...data, qr_image: qrImage, qr_url: qrUrl });
      toast.success(`QR Code ${data.qr_id} created successfully!`);

    } catch (err) {
      toast.error('Failed to create QR: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!savedQR?.qr_image) return;
    const a = document.createElement('a');
    a.href = savedQR.qr_image;
    a.download = `${savedQR.qr_id}-${savedQR.product_code}.png`;
    a.click();
    toast.success('QR downloaded!');
  };

  const InputField = ({ label, name, required, type = 'text', placeholder, hint }) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-navkar-700">*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={e => update(name, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-sm bg-background border rounded-lg transition-all
                   focus:outline-none focus:ring-2 focus:ring-navkar-700 focus:border-transparent
                   ${errors[name] ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10' : 'border-border'}`}
      />
      {errors[name] && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> {errors[name]}
        </p>
      )}
      {hint && !errors[name] && (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );

  // If QR was saved, show success screen
  if (savedQR) {
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
            <p className="text-muted-foreground text-sm mt-1">
              Your dynamic QR code is ready to print and use.
            </p>
          </div>

          {/* QR Preview */}
          <div className="bg-white rounded-xl p-6 inline-block mx-auto shadow-sm border border-border">
            <img src={savedQR.qr_image} alt="QR Code" className="w-48 h-48 mx-auto" />
            <div className="mt-3 text-center">
              <p className="font-bold text-foreground">{savedQR.product_name}</p>
              <code className="text-xs text-navkar-700 font-mono">{savedQR.qr_id}</code>
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">QR ID</span>
              <code className="font-mono font-bold text-navkar-700">{savedQR.qr_id}</code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">QR URL</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-foreground truncate max-w-[200px]">{savedQR.qr_url}</span>
                <button onClick={() => copyToClipboard(savedQR.qr_url)} className="text-navkar-700">
                  <Copy size={13} />
                </button>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Destination</span>
              <span className="text-xs text-foreground truncate max-w-[200px]">{savedQR.destination_url}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            💡 <strong>You can change the destination URL anytime</strong> — the printed QR code will still work.
            Go to QR Codes → Edit to update the URL.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={downloadQR}
              className="flex items-center gap-2 px-5 py-2.5 bg-navkar-700 hover:bg-navkar-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={15} /> Download PNG
            </button>
            <button
              onClick={() => { setSavedQR(null); setForm({ product_name:'',product_code:'',destination_url:'',category_id:'',description:'',batch_number:'',warranty_pdf_url:'',installation_pdf_url:'',status:'active' }); }}
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
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/qr-codes')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Back to QR Codes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          {/* Required fields */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Package size={16} className="text-navkar-700" />
              Product Information
              <span className="text-xs text-muted-foreground font-normal">Required</span>
            </h3>
            <InputField
              label="Product Name" name="product_name" required
              placeholder="e.g. Navkar Premium Plywood 18mm"
            />
            <InputField
              label="Product Code" name="product_code" required
              placeholder="e.g. NPL-18MM-004"
              hint="Will be stored in UPPERCASE automatically"
            />
            <InputField
              label="Destination URL" name="destination_url" required type="url"
              placeholder="https://navkarplywood.com/products/npl-18mm"
              hint="This is where customers will land when they scan. You can change this anytime later."
            />
          </div>

          {/* Optional fields */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Tag size={16} className="text-navkar-700" />
              Additional Details
              <span className="text-xs text-muted-foreground font-normal">Optional</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <select
                value={form.category_id}
                onChange={e => update('category_id', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Short product description..."
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Batch Number" name="batch_number" placeholder="BATCH-2024-01" />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => update('status', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <InputField
              label="Warranty PDF URL" name="warranty_pdf_url" type="url"
              placeholder="https://navkarplywood.com/warranty.pdf"
            />
            <InputField
              label="Installation Guide PDF URL" name="installation_pdf_url" type="url"
              placeholder="https://navkarplywood.com/installation.pdf"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6
                     bg-navkar-700 hover:bg-navkar-800 text-white font-semibold
                     rounded-xl text-sm transition-colors shadow-sm disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Generating QR Code...</>
            ) : (
              <><Save size={15} /> Save & Generate QR Code</>
            )}
          </button>
        </form>

        {/* Live Preview Panel */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-4">
            <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <QrCode size={15} className="text-navkar-700" /> QR Preview
            </h3>

            <div className="bg-white rounded-xl p-4 text-center border border-border min-h-[200px] flex flex-col items-center justify-center">
              {previewQR ? (
                <>
                  <img src={previewQR} alt="QR Preview" className="w-36 h-36 mx-auto" />
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

            {/* Info box */}
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
                    You can <strong>change the URL anytime</strong> — QR stays the same!
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
