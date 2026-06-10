import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Loader2, Link2, AlertCircle,
  Clock, QrCode, CheckCircle, Download, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDate, isValidUrl, getQRUrl } from '../lib/utils';
import QRCodeLib from 'qrcode';

export default function EditQR() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [urlHistory, setUrlHistory] = useState([]);
  const [qrImage, setQrImage] = useState(null);
  const [changeReason, setChangeReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  // Regenerate QR preview when qr_id is known
  useEffect(() => {
    if (original?.qr_id) {
      QRCodeLib.toDataURL(getQRUrl(original.qr_id), {
        errorCorrectionLevel: 'H', width: 200, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      }).then(setQrImage);
    }
  }, [original?.qr_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qrResult, catsResult, historyResult] = await Promise.all([
        supabase.from('qr_codes').select('*, categories(id,name,color)').eq('id', id).single(),
        supabase.from('categories').select('id,name,color').order('name'),
        supabase.from('url_history')
          .select('*, profiles(full_name)')
          .eq('qr_code_id', id)
          .order('changed_at', { ascending: false })
          .limit(10)
      ]);

      if (qrResult.error || !qrResult.data) {
        toast.error('QR code not found');
        navigate('/qr-codes');
        return;
      }

      setOriginal(qrResult.data);
      setForm({
        product_name: qrResult.data.product_name,
        product_code: qrResult.data.product_code,
        destination_url: qrResult.data.destination_url,
        category_id: qrResult.data.category_id || '',
        description: qrResult.data.description || '',
        batch_number: qrResult.data.batch_number || '',
        warranty_pdf_url: qrResult.data.warranty_pdf_url || '',
        installation_pdf_url: qrResult.data.installation_pdf_url || '',
        status: qrResult.data.status,
      });
      setCategories(catsResult.data || []);
      setUrlHistory(historyResult.data || []);
    } catch (err) {
      toast.error('Error loading QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.product_name?.trim()) return toast.error('Product name is required');
    if (!form.destination_url?.trim()) return toast.error('Destination URL is required');
    if (!isValidUrl(form.destination_url)) return toast.error('Enter a valid URL (include https://)');

    setSaving(true);
    try {
      const urlChanged = form.destination_url !== original.destination_url;

      // If URL changed, record history first
      if (urlChanged) {
        await supabase.from('url_history').insert({
          qr_code_id: id,
          old_url: original.destination_url,
          new_url: form.destination_url,
          change_reason: changeReason || null,
          changed_by: user.id
        });
      }

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
        updated_by: user.id,
      }).eq('id', id);

      if (error) throw error;

      toast.success(urlChanged
        ? `✅ URL updated! QR code ${original.qr_id} now redirects to the new URL.`
        : 'Changes saved!'
      );
      setChangeReason('');
      fetchData(); // Refresh
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadQR = async () => {
    const url = getQRUrl(original.qr_id);
    const dataUrl = await QRCodeLib.toDataURL(url, {
      errorCorrectionLevel: 'H', width: 600, margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${original.qr_id}.png`;
    a.click();
    toast.success('Downloaded!');
  };

  const urlChanged = form.destination_url !== original?.destination_url;

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
      </div>
    );
  }

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
        <div className="lg:col-span-2 space-y-4">
          {/* URL Update - Most Important Section */}
          <div className={`bg-card border-2 rounded-xl p-5 space-y-4 transition-colors ${
            urlChanged ? 'border-navkar-700' : 'border-border'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Link2 size={16} className="text-navkar-700" />
                Destination URL
                <span className="text-xs bg-navkar-50 dark:bg-navkar-900/30 text-navkar-700 px-2 py-0.5 rounded-full">
                  Dynamic — change anytime
                </span>
              </h3>
              {urlChanged && (
                <span className="text-xs font-medium text-navkar-700 flex items-center gap-1">
                  <AlertCircle size={12} /> URL will be updated
                </span>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Current live URL (what customers see when scanning)
              </label>
              <input
                type="url"
                value={form.destination_url}
                onChange={e => setForm(p => ({ ...p, destination_url: e.target.value }))}
                placeholder="https://navkarplywood.com/products/..."
                className={`w-full px-3.5 py-2.5 text-sm bg-background border rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-navkar-700 focus:border-transparent
                           ${urlChanged ? 'border-navkar-700' : 'border-border'}`}
              />
              {urlChanged && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-400">URL Change Preview:</p>
                  <p className="text-amber-700 dark:text-amber-300 line-through">{original.destination_url}</p>
                  <p className="text-green-700 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle size={11} /> {form.destination_url}
                  </p>
                </div>
              )}
            </div>

            {urlChanged && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Reason for URL change (optional, for history)
                </label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={e => setChangeReason(e.target.value)}
                  placeholder="e.g. New product page launched"
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
                />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Product Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Product Name *</label>
                <input type="text" value={form.product_name}
                  onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Product Code</label>
                <input type="text" value={form.product_code}
                  onChange={e => setForm(p => ({ ...p, product_code: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
                <select value={form.category_id}
                  onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
                >
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
                <select value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
              <textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700 resize-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-navkar-700 hover:bg-navkar-800 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-70"
          >
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save Changes</>}
          </button>

          {/* URL History */}
          {urlHistory.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" /> URL Change History
              </h3>
              <div className="space-y-3">
                {urlHistory.map((h) => (
                  <div key={h.id} className="flex gap-3 text-xs">
                    <div className="w-1 bg-navkar-200 dark:bg-navkar-800 rounded-full flex-shrink-0" />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-muted-foreground">{formatDate(h.changed_at, 'long')}</p>
                      <p className="text-red-400 line-through truncate">{h.old_url}</p>
                      <p className="text-green-600 truncate">{h.new_url}</p>
                      {h.change_reason && <p className="text-muted-foreground italic">"{h.change_reason}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - QR Info */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 text-center space-y-3">
            <div className="bg-white rounded-xl p-4 inline-block border border-border">
              {qrImage && <img src={qrImage} alt="QR Code" className="w-36 h-36" />}
            </div>
            <div>
              <code className="text-lg font-mono font-bold text-navkar-700">{original?.qr_id}</code>
              <p className="text-xs text-muted-foreground mt-0.5">{original?.product_name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadQR}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-navkar-700 hover:bg-navkar-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Download size={13} /> Download
              </button>
              <a
                href={getQRUrl(original?.qr_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition-colors"
              >
                <ExternalLink size={13} /> Test Scan
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stats</h4>
            {[
              { label: 'Total Scans', value: original?.scan_count || 0 },
              { label: 'Created', value: formatDate(original?.created_at) },
              { label: 'Last Scanned', value: original?.last_scanned_at ? formatDate(original.last_scanned_at) : 'Never' },
              { label: 'URL Changes', value: urlHistory.length },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
