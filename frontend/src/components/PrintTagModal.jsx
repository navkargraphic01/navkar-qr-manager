import { useState, useEffect } from 'react'
import { X, Printer, Download, Eye, Layout, ShieldAlert } from 'lucide-react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { supabase, getQrUrl } from '../lib/supabase'

const PRESET_TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic White',
    canvas: { width: 400, height: 500, background: '#FFFFFF', border_color: '#E8DCC4', border_radius: 12, border_width: 2 },
    elements: {
      logo: { x: 150, y: 30, width: 100, height: 50, visible: true, content: 'https://placehold.co/100x50/8b5326/ffffff?text=NAVKAR' },
      qr: { x: 100, y: 100, size: 200, fgColor: '#000000', bgColor: '#FFFFFF', visible: true },
      product_name: { x: 20, y: 320, width: 360, fontSize: 18, fontWeight: '700', color: '#111827', align: 'center', visible: true, content: '{{product_name}}' },
      product_code: { x: 20, y: 360, width: 360, fontSize: 13, fontWeight: '500', color: '#6B7280', align: 'center', visible: true, content: 'Code: {{product_code}}' },
      qr_id: { x: 20, y: 390, width: 360, fontSize: 12, fontWeight: '700', color: '#8B5326', align: 'center', visible: true, content: 'ID: {{qr_id}}' },
      website: { x: 20, y: 440, width: 360, fontSize: 11, fontWeight: '400', color: '#9CA3AF', align: 'center', visible: true, content: 'navkarplywood.com' }
    }
  },
  {
    id: 'wood-premium',
    name: 'Champagne Gold',
    canvas: { width: 400, height: 520, background: '#FAF8F5', border_color: '#8B5326', border_radius: 16, border_width: 3 },
    elements: {
      logo: { x: 150, y: 30, width: 100, height: 50, visible: true, content: 'https://placehold.co/100x50/8b5326/ffffff?text=NAVKAR' },
      qr: { x: 100, y: 110, size: 200, fgColor: '#6F3E1B', bgColor: '#FAF8F5', visible: true },
      product_name: { x: 20, y: 330, width: 360, fontSize: 19, fontWeight: '800', color: '#4C2910', align: 'center', visible: true, content: '{{product_name}}' },
      product_code: { x: 20, y: 370, width: 360, fontSize: 14, fontWeight: '600', color: '#AA6E3B', align: 'center', visible: true, content: '{{product_code}}' },
      qr_id: { x: 20, y: 405, width: 360, fontSize: 12, fontWeight: '700', color: '#8B5326', align: 'center', visible: true, content: '· {{qr_id}} ·' },
      website: { x: 20, y: 460, width: 360, fontSize: 12, fontWeight: '500', color: '#AA6E3B', align: 'center', visible: true, content: 'www.navkarplywood.com' }
    }
  },
  {
    id: 'industrial-dark',
    name: 'Industrial Dark',
    canvas: { width: 400, height: 480, background: '#111111', border_color: '#8B5326', border_radius: 8, border_width: 2 },
    elements: {
      logo: { x: 20, y: 20, width: 80, height: 40, visible: true, content: 'https://placehold.co/80x40/8b5326/ffffff?text=NAVKAR' },
      qr: { x: 100, y: 80, size: 200, fgColor: '#FFFFFF', bgColor: '#111111', visible: true },
      product_name: { x: 20, y: 300, width: 360, fontSize: 20, fontWeight: '900', color: '#FFFFFF', align: 'left', visible: true, content: '{{product_name}}' },
      product_code: { x: 20, y: 340, width: 360, fontSize: 12, fontWeight: '500', color: '#9CA3AF', align: 'left', visible: true, content: 'SKU: {{product_code}}' },
      qr_id: { x: 20, y: 370, width: 360, fontSize: 12, fontWeight: '700', color: '#8B5326', align: 'left', visible: true, content: 'QR: {{qr_id}}' },
      website: { x: 20, y: 425, width: 360, fontSize: 11, fontWeight: '400', color: '#6B7280', align: 'right', visible: true, content: 'navkarplywood.com' }
    }
  }
]

export default function PrintTagModal({ qrCode, isOpen, onClose }) {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(PRESET_TEMPLATES[0])
  const [loading, setLoading] = useState(false)
  const [previewQrUrl, setPreviewQrUrl] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  // Update dynamic QR preview image when properties change or template changes
  useEffect(() => {
    if (isOpen && qrCode && selectedTemplate?.elements?.qr) {
      const qrEl = selectedTemplate.elements.qr
      const redirectUrl = getQrUrl(qrCode.qr_id)
      
      QRCode.toDataURL(redirectUrl, {
        errorCorrectionLevel: 'H',
        width: qrEl.size || 200,
        margin: 1,
        color: {
          dark: qrEl.fgColor || '#000000',
          light: qrEl.bgColor || '#FFFFFF'
        }
      }).then(setPreviewQrUrl).catch(console.error)
    }
  }, [isOpen, qrCode, selectedTemplate])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('qr_templates')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Convert DB templates (which might have element arrays) to unified object-elements format
      const formattedTemplates = (data || []).map(t => {
        let canvas = t.template_data.canvas || {}
        let dbElements = t.template_data.elements || {}

        // If elements is array, normalize to object
        if (Array.isArray(dbElements)) {
          const obj = {}
          dbElements.forEach(el => {
            obj[el.id] = {
              x: el.x ?? 0,
              y: el.y ?? 0,
              width: el.width ?? 100,
              height: el.height ?? 50,
              size: el.size ?? 200,
              fgColor: el.fgColor ?? '#000000',
              bgColor: el.bgColor ?? '#FFFFFF',
              visible: el.visible !== false,
              content: el.content ?? '',
              fontSize: el.fontSize ?? 14,
              fontWeight: el.fontWeight ?? '400',
              color: el.color ?? '#000000',
              align: el.align ?? 'center'
            }
          })
          dbElements = obj
        }

        return {
          id: t.id,
          name: t.name,
          canvas: {
            width: Number(canvas.width || 400),
            height: Number(canvas.height || 500),
            background: canvas.background || '#FFFFFF',
            backgroundImage: canvas.backgroundImage || '',
            border_color: canvas.border_color || '#E8DCC4',
            border_radius: Number(canvas.border_radius || 12),
            border_width: Number(canvas.border_width || 2)
          },
          elements: dbElements
        }
      })

      const allTemplates = [...PRESET_TEMPLATES, ...formattedTemplates]
      setTemplates(allTemplates)

      // Auto pre-select template if qrCode template or preset matched
      if (qrCode) {
        let matched = null
        if (qrCode.template_id) {
          matched = allTemplates.find(t => t.id === qrCode.template_id)
        } else if (qrCode.metadata?.preset_template_id) {
          matched = allTemplates.find(t => t.id === qrCode.metadata.preset_template_id)
        }
        if (matched) {
          setSelectedTemplate(matched)
        }
      }
    } catch {
      setTemplates(PRESET_TEMPLATES)
    } finally {
      setLoading(false)
    }
  }

  const getElementText = (el) => {
    if (!el || !el.content) return ''
    let text = el.content
    text = text.replace('{{product_name}}', qrCode.product_name || '')
    text = text.replace('{{product_code}}', qrCode.product_code || '')
    text = text.replace('{{qr_id}}', qrCode.qr_id || '')
    return text
  }

  const handlePrint = () => {
    if (!qrCode || !selectedTemplate) return

    const { canvas, elements } = selectedTemplate
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(`
      <html>
        <head>
          <title>Print QR Tag - ${qrCode.qr_id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            @page {
              size: ${(canvas.width / 96).toFixed(2)}in ${(canvas.height / 96).toFixed(2)}in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              height: ${(canvas.height / 96).toFixed(2)}in;
              width: ${(canvas.width / 96).toFixed(2)}in;
              background: #fff;
            }
            .tag-canvas {
              position: relative;
              width: ${(canvas.width / 96).toFixed(2)}in;
              height: ${(canvas.height / 96).toFixed(2)}in;
              background-color: ${canvas.background};
              ${canvas.backgroundImage ? `background-image: url('${canvas.backgroundImage}'); background-size: cover; background-position: center;` : ''}
              border: ${(canvas.border_width / 96).toFixed(3)}in solid ${canvas.border_color};
              border-radius: ${(canvas.border_radius / 96).toFixed(3)}in;
              box-sizing: border-box;
              overflow: hidden;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .element {
              position: absolute;
              box-sizing: border-box;
            }
            .logo-img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .qr-img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .text-element {
              font-family: 'Inter', sans-serif;
              line-height: 1.2;
              white-space: normal;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <div class="tag-canvas">
            ${elements.logo?.visible ? `
              <div class="element" style="left: ${(elements.logo.x / 96).toFixed(3)}in; top: ${(elements.logo.y / 96).toFixed(3)}in; width: ${(elements.logo.width / 96).toFixed(3)}in; height: ${(elements.logo.height / 96).toFixed(3)}in;">
                <img class="logo-img" src="${elements.logo.content}" />
              </div>
            ` : ''}
            ${elements.qr?.visible ? `
              <div class="element" style="left: ${(elements.qr.x / 96).toFixed(3)}in; top: ${(elements.qr.y / 96).toFixed(3)}in; width: ${(elements.qr.size / 96).toFixed(3)}in; height: ${(elements.qr.size / 96).toFixed(3)}in;">
                <img class="qr-img" src="${previewQrUrl}" />
              </div>
            ` : ''}
            ${elements.product_name?.visible ? `
              <div class="element text-element" style="left: ${(elements.product_name.x / 96).toFixed(3)}in; top: ${(elements.product_name.y / 96).toFixed(3)}in; width: ${(elements.product_name.width / 96).toFixed(3)}in; font-size: ${(elements.product_name.fontSize / 96).toFixed(3)}in; font-weight: ${elements.product_name.fontWeight}; color: ${elements.product_name.color}; text-align: ${elements.product_name.align};">
                ${getElementText(elements.product_name)}
              </div>
            ` : ''}
            ${elements.product_code?.visible ? `
              <div class="element text-element" style="left: ${(elements.product_code.x / 96).toFixed(3)}in; top: ${(elements.product_code.y / 96).toFixed(3)}in; width: ${(elements.product_code.width / 96).toFixed(3)}in; font-size: ${(elements.product_code.fontSize / 96).toFixed(3)}in; font-weight: ${elements.product_code.fontWeight}; color: ${elements.product_code.color}; text-align: ${elements.product_code.align};">
                ${getElementText(elements.product_code)}
              </div>
            ` : ''}
            ${elements.qr_id?.visible ? `
              <div class="element text-element" style="left: ${(elements.qr_id.x / 96).toFixed(3)}in; top: ${(elements.qr_id.y / 96).toFixed(3)}in; width: ${(elements.qr_id.width / 96).toFixed(3)}in; font-size: ${(elements.qr_id.fontSize / 96).toFixed(3)}in; font-weight: ${elements.qr_id.fontWeight}; color: ${elements.qr_id.color}; text-align: ${elements.qr_id.align}; font-family: monospace;">
                ${getElementText(elements.qr_id)}
              </div>
            ` : ''}
            ${elements.website?.visible ? `
              <div class="element text-element" style="left: ${(elements.website.x / 96).toFixed(3)}in; top: ${(elements.website.y / 96).toFixed(3)}in; width: ${(elements.website.width / 96).toFixed(3)}in; font-size: ${(elements.website.fontSize / 96).toFixed(3)}in; font-weight: ${elements.website.fontWeight}; color: ${elements.website.color}; text-align: ${elements.website.align};">
                ${getElementText(elements.website)}
              </div>
            ` : ''}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.parent.document.body.removeChild(iframe);
                }, 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `)
    doc.close()
  }

  const handleDownloadImage = async () => {
    if (!qrCode || !selectedTemplate) return
    const { canvas, elements } = selectedTemplate
    const scale = 2.5 // high-res scaling factor
    
    toast.loading('Generating high-resolution tag image...', { id: 'canvas-gen' })

    try {
      const canvasElement = document.createElement('canvas')
      canvasElement.width = canvas.width * scale
      canvasElement.height = canvas.height * scale
      const ctx = canvasElement.getContext('2d')

      // Background drawing with rounded corners
      ctx.fillStyle = canvas.background
      const r = canvas.border_radius * scale
      const w = canvas.width * scale
      const h = canvas.height * scale
      const bWidth = canvas.border_width * scale

      ctx.beginPath()
      ctx.moveTo(r, 0)
      ctx.lineTo(w - r, 0)
      ctx.quadraticCurveTo(w, 0, w, r)
      ctx.lineTo(w, h - r)
      ctx.quadraticCurveTo(w, h, w - r, h)
      ctx.lineTo(r, h)
      ctx.quadraticCurveTo(0, h, 0, h - r)
      ctx.lineTo(0, r)
      ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
      ctx.fill()

      // 0. Draw Background Image
      if (canvas.backgroundImage) {
        try {
          const bgImg = new Image()
          bgImg.crossOrigin = 'anonymous'
          bgImg.src = canvas.backgroundImage
          await new Promise((resolve, reject) => {
            bgImg.onload = resolve
            bgImg.onerror = reject
          })
          ctx.drawImage(bgImg, 0, 0, w, h)
        } catch (bgErr) {
          console.warn('Could not render background image in canvas context (CORS limits likely)', bgErr)
        }
      }

      // Border drawing
      if (canvas.border_width > 0) {
        ctx.lineWidth = bWidth
        ctx.strokeStyle = canvas.border_color
        ctx.stroke()
      }

      // 1. Draw Logo
      if (elements.logo?.visible && elements.logo?.content) {
        try {
          const logoImg = new Image()
          logoImg.crossOrigin = 'anonymous'
          logoImg.src = elements.logo.content
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve
            logoImg.onerror = reject
          })
          ctx.drawImage(
            logoImg,
            elements.logo.x * scale,
            elements.logo.y * scale,
            elements.logo.width * scale,
            elements.logo.height * scale
          )
        } catch (logoErr) {
          console.warn('Could not render logo in canvas context (CORS limits likely)', logoErr)
        }
      }

      // 2. Draw QR Code
      if (elements.qr?.visible && previewQrUrl) {
        const qrImg = new Image()
        qrImg.src = previewQrUrl
        await new Promise((resolve, reject) => {
          qrImg.onload = resolve
          qrImg.onerror = reject
        })
        ctx.drawImage(
          qrImg,
          elements.qr.x * scale,
          elements.qr.y * scale,
          elements.qr.size * scale,
          elements.qr.size * scale
        )
      }

      // 3. Helper function for typography
      const drawText = (el) => {
        if (!el || !el.visible) return
        const textVal = getElementText(el)
        
        ctx.font = `${el.fontWeight || '400'} ${el.fontSize * scale}px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
        ctx.fillStyle = el.color || '#000000'
        ctx.textBaseline = 'top'

        let textX = el.x * scale
        if (el.align === 'center') {
          ctx.textAlign = 'center'
          textX = (el.x + el.width / 2) * scale
        } else if (el.align === 'right') {
          ctx.textAlign = 'right'
          textX = (el.x + el.width) * scale
        } else {
          ctx.textAlign = 'left'
        }

        ctx.fillText(textVal, textX, el.y * scale)
      }

      drawText(elements.product_name)
      drawText(elements.product_code)
      drawText(elements.qr_id)
      drawText(elements.website)

      // Convert to blob download
      const link = document.createElement('a')
      link.download = `Navkar-Tag-${qrCode.qr_id}.png`
      link.href = canvasElement.toDataURL('image/png')
      link.click()

      toast.success('High-resolution tag downloaded!', { id: 'canvas-gen' })
    } catch (err) {
      toast.error('Image generation failed: ' + err.message, { id: 'canvas-gen' })
    }
  }

  if (!isOpen || !qrCode) return null

  const { canvas, elements } = selectedTemplate

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Side: Customizer Layout list */}
        <div className="md:w-2/5 border-r border-border p-5 flex flex-col bg-muted/20">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Layout size={15} className="text-navkar-700" /> Choose Label Template
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground animate-pulse">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No templates available.</div>
            ) : (
              templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all
                    ${selectedTemplate.id === tpl.id
                      ? 'border-navkar-700 bg-navkar-50/20 text-navkar-700 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/30 text-foreground'
                    }`}
                >
                  <div>
                    <p className="font-bold text-xs">{tpl.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{tpl.canvas.width}x{tpl.canvas.height} px</p>
                  </div>
                  {selectedTemplate.id === tpl.id && (
                    <span className="bg-navkar-700 text-white rounded-full p-0.5">
                      <Eye size={10} />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border bg-navkar-50/10 p-3 rounded-xl border border-dashed border-navkar-200 flex gap-2 items-start text-[11px] text-muted-foreground">
            <ShieldAlert size={16} className="text-navkar-700 flex-shrink-0 mt-0.5" />
            <p>
              Adjust positioning, colors, or sizes of elements in the <strong>Design Studio</strong> page.
            </p>
          </div>
        </div>

        {/* Right Side: Visual Canvas preview & print controls */}
        <div className="md:w-3/5 p-6 flex flex-col items-center justify-between min-h-[400px]">
          {/* Modal Header */}
          <div className="w-full flex items-center justify-between border-b border-border pb-3 mb-4">
            <div>
              <h4 className="font-bold text-foreground">Print Label Preview</h4>
              <p className="text-[11px] text-muted-foreground">Showing QR Code: <code className="font-mono text-navkar-700 font-bold">{qrCode.qr_id}</code></p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Visual Canvas (Non-interactive display of current selected template layout) */}
          <div className="flex-1 w-full flex items-center justify-center py-4 bg-muted/40 rounded-xl border border-border/80 select-none overflow-auto max-h-[480px]">
            <div
              className="relative shadow-lg border border-border select-none bg-white flex-shrink-0"
              style={{
                width: `${canvas.width}px`,
                height: `${canvas.height}px`,
                background: canvas.background,
                backgroundImage: canvas.backgroundImage ? `url('${canvas.backgroundImage}')` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderColor: canvas.border_color,
                borderWidth: `${canvas.border_width}px`,
                borderRadius: `${canvas.border_radius}px`
              }}
            >
              {/* 1. Brand Logo */}
              {elements.logo?.visible && elements.logo?.content && (
                <div
                  className="absolute flex items-center justify-center p-1"
                  style={{
                    left: `${elements.logo.x}px`,
                    top: `${elements.logo.y}px`,
                    width: `${elements.logo.width}px`,
                    height: `${elements.logo.height}px`
                  }}
                >
                  <img
                    src={elements.logo.content}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain pointer-events-none"
                  />
                </div>
              )}

              {/* 2. QR Code */}
              {elements.qr?.visible && previewQrUrl && (
                <div
                  className="absolute flex items-center justify-center p-1"
                  style={{
                    left: `${elements.qr.x}px`,
                    top: `${elements.qr.y}px`,
                    width: `${elements.qr.size}px`,
                    height: `${elements.qr.size}px`
                  }}
                >
                  <img
                    src={previewQrUrl}
                    alt="QR"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>
              )}

              {/* 3. Product Name */}
              {elements.product_name?.visible && (
                <div
                  className="absolute px-1 select-none text-xs leading-snug"
                  style={{
                    left: `${elements.product_name.x}px`,
                    top: `${elements.product_name.y}px`,
                    width: `${elements.product_name.width}px`,
                    fontSize: `${elements.product_name.fontSize}px`,
                    fontWeight: elements.product_name.fontWeight,
                    color: elements.product_name.color,
                    textAlign: elements.product_name.align
                  }}
                >
                  {getElementText(elements.product_name)}
                </div>
              )}

              {/* 4. Product Code */}
              {elements.product_code?.visible && (
                <div
                  className="absolute px-1 select-none text-[11px] leading-snug"
                  style={{
                    left: `${elements.product_code.x}px`,
                    top: `${elements.product_code.y}px`,
                    width: `${elements.product_code.width}px`,
                    fontSize: `${elements.product_code.fontSize}px`,
                    fontWeight: elements.product_code.fontWeight,
                    color: elements.product_code.color,
                    textAlign: elements.product_code.align
                  }}
                >
                  {getElementText(elements.product_code)}
                </div>
              )}

              {/* 5. QR ID */}
              {elements.qr_id?.visible && (
                <div
                  className="absolute px-1 select-none text-xs font-mono leading-snug"
                  style={{
                    left: `${elements.qr_id.x}px`,
                    top: `${elements.qr_id.y}px`,
                    width: `${elements.qr_id.width}px`,
                    fontSize: `${elements.qr_id.fontSize}px`,
                    fontWeight: elements.qr_id.fontWeight,
                    color: elements.qr_id.color,
                    textAlign: elements.qr_id.align
                  }}
                >
                  {getElementText(elements.qr_id)}
                </div>
              )}

              {/* 6. Website */}
              {elements.website?.visible && (
                <div
                  className="absolute px-1 select-none text-[10px] leading-snug"
                  style={{
                    left: `${elements.website.x}px`,
                    top: `${elements.website.y}px`,
                    width: `${elements.website.width}px`,
                    fontSize: `${elements.website.fontSize}px`,
                    fontWeight: elements.website.fontWeight,
                    color: elements.website.color,
                    textAlign: elements.website.align
                  }}
                >
                  {getElementText(elements.website)}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-end gap-3 border-t border-border pt-4 mt-4">
            <button
              onClick={handleDownloadImage}
              className="flex items-center justify-center gap-1.5 px-4 py-2 border border-border text-foreground hover:bg-muted text-xs font-medium rounded-lg transition-colors"
            >
              <Download size={14} /> Download PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-4.5 py-2 bg-navkar-700 hover:bg-navkar-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Printer size={14} /> Print Tag Label
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
