import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Download, Edit2, Trash2, Eye,
  QrCode, Copy, ExternalLink, ChevronLeft, ChevronRight,
  ScanLine, CheckCircle, XCircle, Clock, MoreHorizontal,
  FileDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  formatDate, formatNumber, statusColors,
  copyToClipboard, getQRUrl, truncate
} from '../lib/utils';
import QRCodeLib from 'qrcode';

export default function QRCodes() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const LIMIT = 15;

  useEffect(() => {
    fetchQRCodes();
  }, [page, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchQRCodes(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchQRCodes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('qr_codes')
        .select('*, categories(name, color)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * LIMIT, page * LIMIT - 1);

      if (search) {
        query = query.or(
          `product_name.ilike.%${search}%,product_code.ilike.%${search}%,qr_id.ilike.%${search}%`
        );
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setQrCodes(data || []);
      setTotal(count || 0);
    } catch (err) {
      toast.error('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('qr_codes').delete().eq('id', id);
      if (error) throw error;
      toast.success('QR code deleted');
      fetchQRCodes();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Status changed to ${newStatus}`);
      fetchQRCodes();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const downloadQR = async (qrCode, format = 'png') => {
    try {
      const url = getQRUrl(qrCode.qr_id);
      if (format === 'png') {
        const dataUrl = await QRCodeLib.toDataURL(url, {
          errorCorrectionLevel: 'H',
          width: 600,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${qrCode.qr_id}-${qrCode.product_code}.png`;
        a.click();
        toast.success('QR PNG downloaded!');
      }
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleCopyUrl = async (qrId) => {
    await copyToClipboard(getQRUrl(qrId));
    toast.success('QR URL copied!');
  };

  const totalPages = Math.ceil(total / LIMIT);

  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      {status}
    </span>
  );

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {formatNumber(total)} QR code{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          to="/qr-codes/create"
          className="flex items-center gap-2 bg-navkar-700 hover:bg-navkar-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} strokeWidth={2.5} />
          Create QR Code
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, code or QR ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-navkar-700 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  QR ID
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Destination URL
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Scans
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Created
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="py-3.5 px-4">
                        <div className="h-4 skeleton rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : qrCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <QrCode size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">No QR codes found</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      {search ? 'Try a different search term' : 'Create your first QR code to get started'}
                    </p>
                    {!search && (
                      <Link
                        to="/qr-codes/create"
                        className="mt-4 inline-flex items-center gap-1.5 text-navkar-700 text-sm hover:underline"
                      >
                        <Plus size={14} /> Create QR Code
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                qrCodes.map((qr) => (
                  <motion.tr
                    key={qr.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-navkar-50 dark:bg-navkar-900/20 flex items-center justify-center flex-shrink-0">
                          <QrCode size={13} className="text-navkar-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate max-w-[180px]">
                            {qr.product_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{qr.product_code}</p>
                        </div>
                      </div>
                    </td>

                    {/* QR ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono font-bold text-navkar-700 bg-navkar-50 dark:bg-navkar-900/20 px-2 py-0.5 rounded">
                          {qr.qr_id}
                        </code>
                        <button
                          onClick={() => handleCopyUrl(qr.qr_id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground transition-all"
                          title="Copy QR URL"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </td>

                    {/* URL */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 max-w-[220px]">
                        <span className="text-xs text-muted-foreground truncate" title={qr.destination_url}>
                          {truncate(qr.destination_url, 40)}
                        </span>
                        <a
                          href={qr.destination_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-navkar-700 transition-all flex-shrink-0"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </td>

                    {/* Scans */}
                    <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <ScanLine size={13} />
                        <span className="text-sm font-medium text-foreground">
                          {formatNumber(qr.scan_count)}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <button onClick={() => handleStatusToggle(qr.id, qr.status)}>
                        <StatusBadge status={qr.status} />
                      </button>
                    </td>

                    {/* Created */}
                    <td className="py-3.5 px-4 text-xs text-muted-foreground hidden lg:table-cell">
                      {formatDate(qr.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/qr-codes/${qr.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-navkar-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => downloadQR(qr, 'png')}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-blue-600 transition-colors"
                          title="Download PNG"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(qr.id, qr.product_name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {formatNumber(total)}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs px-3 py-1.5 bg-muted rounded-lg font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
