import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Download, Copy, Trash2, Pencil, CheckCircle, XCircle, Printer } from 'lucide-react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { supabase, getQrUrl } from '../lib/supabase'
import PrintTagModal from '../components/PrintTagModal'

const STATUS_STYLES = {
  active:   'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-red-50 text-red-600 dark:bg-red-900/20',
  draft:    'bg-muted text-muted-foreground',
}

// StatusBadge defined at module scope
function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.draft}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      {status}
    </span>
  )
}

const PAGE_SIZE = 15

export default function QRCodes() {
  const [qrCodes, setQrCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [printingQr, setPrintingQr] = useState(null)

  useEffect(() => { fetchQRCodes() }, [page, statusFilter])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchQRCodes() }, 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchQRCodes = async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('qr_codes')
        .select('*, categories(name, color)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      if (search) {
        const cleanSearch = search.trim().replace(/"/g, '\\"')
        if (cleanSearch) {
          q = q.or(`product_name.ilike."%${cleanSearch}%",product_code.ilike."%${cleanSearch}%",qr_id.ilike."%${cleanSearch}%"`)
        }
      }
      if (statusFilter !== 'all') q = q.eq('status', statusFilter)

      const { data, error, count } = await q
      if (error) throw error
      setQrCodes(data || [])
      setTotal(count || 0)
    } catch {
      toast.error('Failed to load QR codes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      const { error } = await supabase.from('qr_codes').delete().eq('id', id)
      if (error) throw error
      toast.success('QR code deleted')
      fetchQRCodes()
    } catch (err) {
      toast.error('Delete failed: ' + err.message)
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const next = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase.from('qr_codes').update({ status: next }).eq('id', id)
      if (error) throw error
      toast.success(`Status changed to ${next}`)
      fetchQRCodes()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDownload = async (qr) => {
    try {
      const url = getQrUrl(qr.qr_id)
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H', width: 600, margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${qr.qr_id}-${qr.product_code}.png`
      a.click()
      toast.success('QR PNG downloaded!')
    } catch {
      toast.error('Download failed')
    }
  }

  const handleCopyUrl = async (qr) => {
    await navigator.clipboard.writeText(getQrUrl(qr.qr_id))
    toast.success('QR URL copied!')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} QR code{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          to="/qr-codes/create"
          className="flex items-center gap-2 bg-navkar-700 hover:bg-navkar-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} strokeWidth={2.5} />Create QR Code
        </Link>
      </div>

      {/* Filters */}
      <form
        onSubmit={e => {
          e.preventDefault()
          setPage(1)
          fetchQRCodes()
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="qr-search"
              type="text"
              placeholder="Search by name, code or QR ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-navkar-700 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-navkar-700 hover:bg-navkar-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Search size={14} /> Search
          </button>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
      </form>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Product', 'QR ID', 'Destination URL', 'Scans', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? [...Array(6)].map((_, r) => (
                  <tr key={r}>
                    {[...Array(7)].map((__, c) => (
                      <td key={c} className="py-3.5 px-4">
                        <div className="h-4 skeleton rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
                : qrCodes.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <p className="text-muted-foreground font-medium">No QR codes found</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {search ? 'Try a different search term' : 'Create your first QR code to get started'}
                        </p>
                      </td>
                    </tr>
                  )
                  : qrCodes.map(qr => (
                    <tr key={qr.id} className="table-row-hover">
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-foreground text-xs leading-tight">{qr.product_name}</p>
                        <p className="text-muted-foreground text-[11px] font-mono">{qr.product_code}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <code className="text-xs text-navkar-700 font-mono">{qr.qr_id}</code>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <a
                          href={qr.destination_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate block max-w-[220px]"
                        >
                          {qr.destination_url}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                        <span className="text-xs font-medium">{qr.scan_count ?? 0}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={qr.status} />
                      </td>
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {new Date(qr.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setPrintingQr(qr)} title="Print Design Tag" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Printer size={14} />
                          </button>
                          <button onClick={() => handleCopyUrl(qr)} title="Copy URL" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Copy size={14} />
                          </button>
                          <button onClick={() => handleDownload(qr)} title="Download PNG" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Download size={14} />
                          </button>
                          <button onClick={() => handleToggleStatus(qr.id, qr.status)} title="Toggle status" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            {qr.status === 'active' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          </button>
                          <Link to={`/qr-codes/${qr.id}/edit`} title="Edit" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-navkar-700 transition-colors">
                            <Pencil size={14} />
                          </Link>
                          <button onClick={() => handleDelete(qr.id, qr.product_name)} title="Delete" className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded text-xs font-medium transition-colors
                    ${page === i + 1 ? 'bg-navkar-700 text-white' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <PrintTagModal qrCode={printingQr} isOpen={!!printingQr} onClose={() => setPrintingQr(null)} />
    </div>
  )
}
