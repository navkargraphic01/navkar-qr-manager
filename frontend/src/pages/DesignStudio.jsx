import { useState, useEffect } from 'react'
import { Palette, QrCode, Download, Save, Image, Type, Settings, ChevronRight, LayoutGrid, CheckCircle, Upload } from 'lucide-react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { supabase, getQrUrl } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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

const normalizeElements = (dbElements) => {
  if (!dbElements) return {}
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
    return obj
  }
  return dbElements
}

export default function DesignStudio() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('canvas') // canvas, layers, element
  const [selectedElementId, setSelectedElementId] = useState(null)
  
  // Design state
  const [canvas, setCanvas] = useState(PRESET_TEMPLATES[0].canvas)
  const [elements, setElements] = useState(PRESET_TEMPLATES[0].elements)
  const [previewQrUrl, setPreviewQrUrl] = useState('')
  const [templateName, setTemplateName] = useState('My Custom Template')
  
  // Database templates list
  const [dbTemplates, setDbTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [unit, setUnit] = useState('px')

  const pxToIn = (px) => Number((px / 96).toFixed(2))
  const inToPx = (inch) => Math.round(inch * 96)

  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size too large (max 2MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      callback(reader.result)
      toast.success('Image loaded successfully!')
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Update dynamic QR preview image when properties change
  useEffect(() => {
    if (elements.qr) {
      QRCode.toDataURL('https://qr.navkarplywood.com/p/PREVIEW', {
        errorCorrectionLevel: 'H',
        width: elements.qr.size,
        margin: 1,
        color: {
          dark: elements.qr.fgColor || '#000000',
          light: elements.qr.bgColor || '#FFFFFF'
        }
      }).then(setPreviewQrUrl).catch(console.error)
    }
  }, [elements.qr.size, elements.qr.fgColor, elements.qr.bgColor])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const { data } = await supabase
        .from('qr_templates')
        .select('*')
        .order('created_at', { ascending: false })
      setDbTemplates(data || [])
    } catch {
      toast.error('Failed to load templates from database')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const applyPreset = (tpl) => {
    setCanvas(tpl.canvas)
    setElements(tpl.elements)
    toast.success(`Applied ${tpl.name}`)
  }

  const updateElement = (id, fields) => {
    setElements(prev => ({
      ...prev,
      [id]: { ...prev[id], ...fields }
    }))
  }

  const updateCanvas = (fields) => {
    setCanvas(prev => ({ ...prev, ...fields }))
  }

  // Mouse/Touch Drag Handlers
  const handleDragStart = (e, id) => {
    e.preventDefault()
    setSelectedElementId(id)
    setActiveTab('element')

    const startX = e.clientX
    const startY = e.clientY
    const initialX = elements[id].x
    const initialY = elements[id].y

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      updateElement(id, {
        x: Math.max(0, Math.round(initialX + deltaX)),
        y: Math.max(0, Math.round(initialY + deltaY))
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleTouchStart = (e, id) => {
    setSelectedElementId(id)
    setActiveTab('element')

    const touch = e.touches[0]
    const startX = touch.clientX
    const startY = touch.clientY
    const initialX = elements[id].x
    const initialY = elements[id].y

    const handleTouchMove = (moveEvent) => {
      const moveTouch = moveEvent.touches[0]
      const deltaX = moveTouch.clientX - startX
      const deltaY = moveTouch.clientY - startY

      updateElement(id, {
        x: Math.max(0, Math.round(initialX + deltaX)),
        y: Math.max(0, Math.round(initialY + deltaY))
      })
    }

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd)
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    try {
      const slug = templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const { error } = await supabase
        .from('qr_templates')
        .upsert({
          name: templateName,
          slug,
          template_data: { canvas, elements },
          category: 'custom',
          created_by: user?.id || null
        }, { onConflict: 'slug' })

      if (error) throw error
      toast.success('Template saved successfully!')
      fetchTemplates()
    } catch (err) {
      toast.error('Failed to save template: ' + err.message)
    }
  }

  const elementDisplayNames = {
    logo: 'Brand Logo',
    qr: 'QR Code Image',
    product_name: 'Product Name Text',
    product_code: 'Product Code Text',
    qr_id: 'Unique QR ID',
    website: 'Website URL Label'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Visual Design Studio</h2>
          <p className="text-xs text-muted-foreground">Reposition and style all elements of your printed tags interactively.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            className="px-3.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navkar-700"
            placeholder="Template Name"
          />
          <button
            onClick={handleSaveTemplate}
            className="flex items-center gap-1.5 bg-navkar-700 hover:bg-navkar-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Save size={15} /> Save Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDE CONTROLS PANEL */}
        <div className="lg:col-span-4 bg-card border border-border rounded-xl overflow-hidden flex flex-col min-h-[500px]">
          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/40 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === 'canvas' ? 'border-navkar-700 text-navkar-700 bg-card' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Canvas Setting
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === 'layers' ? 'border-navkar-700 text-navkar-700 bg-card' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Layers / Elements
            </button>
            <button
              onClick={() => setActiveTab('element')}
              className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === 'element' ? 'border-navkar-700 text-navkar-700 bg-card' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Element Editor
            </button>
          </div>

          <div className="p-5 flex-1 space-y-4 text-sm">
            {/* Tab 1: Canvas Settings */}
            {activeTab === 'canvas' && (
              <div className="space-y-4">
                {/* Presets */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Presets</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_TEMPLATES.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => applyPreset(tpl)}
                        className="p-2 border border-border hover:border-navkar-700 hover:bg-navkar-50/20 rounded-lg text-left transition-all text-xs"
                      >
                        <p className="font-bold text-foreground truncate">{tpl.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{tpl.canvas.width}x{tpl.canvas.height}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Unit Selector */}
                <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-lg border border-border">
                  <span className="text-xs font-semibold text-muted-foreground">Dimension Unit:</span>
                  <div className="flex bg-card border border-border rounded-lg overflow-hidden text-[10px]">
                    <button
                      type="button"
                      onClick={() => setUnit('px')}
                      className={`px-2.5 py-1 font-medium transition-colors ${unit === 'px' ? 'bg-navkar-700 text-white' : 'hover:bg-muted text-muted-foreground'}`}
                    >
                      Pixels (px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('in')}
                      className={`px-2.5 py-1 font-medium transition-colors ${unit === 'in' ? 'bg-navkar-700 text-white' : 'hover:bg-muted text-muted-foreground'}`}
                    >
                      Inches (in)
                    </button>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Canvas Width ({unit})</label>
                    <input
                      type="number"
                      value={unit === 'in' ? pxToIn(canvas.width) : canvas.width}
                      min={unit === 'in' ? pxToIn(200) : 200}
                      max={unit === 'in' ? pxToIn(600) : 600}
                      step={unit === 'in' ? 0.05 : 1}
                      onChange={e => updateCanvas({ width: unit === 'in' ? inToPx(Number(e.target.value)) : Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Canvas Height ({unit})</label>
                    <input
                      type="number"
                      value={unit === 'in' ? pxToIn(canvas.height) : canvas.height}
                      min={unit === 'in' ? pxToIn(300) : 300}
                      max={unit === 'in' ? pxToIn(800) : 800}
                      step={unit === 'in' ? 0.05 : 1}
                      onChange={e => updateCanvas({ height: unit === 'in' ? inToPx(Number(e.target.value)) : Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-sm"
                    />
                  </div>
                </div>

                {/* Colors & Border */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={canvas.background}
                        onChange={e => updateCanvas({ background: e.target.value })}
                        className="w-8 h-8 rounded border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={canvas.background}
                        onChange={e => updateCanvas({ background: e.target.value })}
                        className="flex-1 px-3 py-1 border border-border rounded-lg bg-background font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Background Image</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={canvas.backgroundImage || ''}
                          onChange={e => updateCanvas({ backgroundImage: e.target.value })}
                          placeholder="Image URL or upload below..."
                          className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-background text-xs font-mono"
                        />
                        {canvas.backgroundImage && (
                          <button
                            type="button"
                            onClick={() => updateCanvas({ backgroundImage: '' })}
                            className="px-2 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <label className="flex w-full items-center justify-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-lg text-xs font-medium cursor-pointer transition-colors text-foreground">
                        <Upload size={13} className="text-navkar-700" />
                        <span>Upload Background Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleImageUpload(e, (base64) => updateCanvas({ backgroundImage: base64 }))}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Border Width</label>
                      <input
                        type="number"
                        value={canvas.border_width}
                        min={0}
                        max={10}
                        onChange={e => updateCanvas({ border_width: Number(e.target.value) })}
                        className="w-full px-3 py-1 border border-border rounded-lg bg-background text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Border Radius</label>
                      <input
                        type="number"
                        value={canvas.border_radius}
                        min={0}
                        max={30}
                        onChange={e => updateCanvas({ border_radius: Number(e.target.value) })}
                        className="w-full px-3 py-1 border border-border rounded-lg bg-background text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Border Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={canvas.border_color}
                        onChange={e => updateCanvas({ border_color: e.target.value })}
                        className="w-8 h-8 rounded border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={canvas.border_color}
                        onChange={e => updateCanvas({ border_color: e.target.value })}
                        className="flex-1 px-3 py-1 border border-border rounded-lg bg-background font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Saved database templates */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <LayoutGrid size={12} /> Saved Custom Designs
                  </label>
                  {loadingTemplates ? (
                    <p className="text-xs text-muted-foreground">Loading designs...</p>
                  ) : dbTemplates.length === 0 ? (
                    <p className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg p-3 text-center">
                      No custom designs saved yet. Fill out a name at the top to save one!
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {dbTemplates.map(tpl => (
                        <div key={tpl.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg border border-border">
                          <span className="text-xs font-medium text-foreground truncate max-w-[180px]">{tpl.name}</span>
                          <button
                            onClick={() => {
                              const canvasData = tpl.template_data.canvas || {}
                              setCanvas({
                                width: Number(canvasData.width || 400),
                                height: Number(canvasData.height || 500),
                                background: canvasData.background || '#FFFFFF',
                                backgroundImage: canvasData.backgroundImage || '',
                                border_color: canvasData.border_color || '#E8DCC4',
                                border_radius: Number(canvasData.border_radius || 12),
                                border_width: Number(canvasData.border_width || 2)
                              })
                              setElements(normalizeElements(tpl.template_data.elements))
                              setTemplateName(tpl.name)
                              toast.success(`Loaded custom design ${tpl.name}`)
                            }}
                            className="text-[10px] text-navkar-700 hover:underline font-bold"
                          >
                            Load
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Layers / Elements list */}
            {activeTab === 'layers' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Select Layer to Edit</label>
                {Object.entries(elements).map(([id, item]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setSelectedElementId(id)
                      setActiveTab('element')
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left
                      ${selectedElementId === id
                        ? 'border-navkar-700 bg-navkar-50/20 text-navkar-700 font-semibold shadow-sm'
                        : 'border-border hover:border-navkar-700/50 hover:bg-muted/40 text-foreground'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {id === 'logo' && <Image size={15} />}
                      {id === 'qr' && <QrCode size={15} />}
                      {id !== 'logo' && id !== 'qr' && <Type size={15} />}
                      <span className="text-xs">{elementDisplayNames[id]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono">X:{item.x} Y:{item.y}</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 3: Active Element Properties */}
            {activeTab === 'element' && (
              <div className="space-y-4">
                {!selectedElementId ? (
                  <p className="text-xs text-muted-foreground text-center bg-muted/30 border border-border rounded-lg p-5">
                    Click on any element in the preview canvas or select from the Layers tab to begin editing.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5 uppercase tracking-wider text-navkar-700">
                        {selectedElementId === 'logo' && <Image size={14} />}
                        {selectedElementId === 'qr' && <QrCode size={14} />}
                        {selectedElementId !== 'logo' && selectedElementId !== 'qr' && <Type size={14} />}
                        {elementDisplayNames[selectedElementId]}
                      </h4>
                      <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={elements[selectedElementId].visible}
                          onChange={e => updateElement(selectedElementId, { visible: e.target.checked })}
                          className="accent-navkar-700"
                        />
                        Visible
                      </label>
                    </div>

                    {/* Position Sliders */}
                    <div className="space-y-3.5">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>X Position (Horizontal)</span>
                          <span className="font-mono font-bold text-foreground">{elements[selectedElementId].x}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={canvas.width - 20}
                          value={elements[selectedElementId].x}
                          onChange={e => updateElement(selectedElementId, { x: Number(e.target.value) })}
                          className="w-full accent-navkar-700"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Y Position (Vertical)</span>
                          <span className="font-mono font-bold text-foreground">{elements[selectedElementId].y}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={canvas.height - 20}
                          value={elements[selectedElementId].y}
                          onChange={e => updateElement(selectedElementId, { y: Number(e.target.value) })}
                          className="w-full accent-navkar-700"
                        />
                      </div>
                    </div>

                    <hr className="border-border" />

                    {/* Dimension / Size controls */}
                    {selectedElementId === 'qr' && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>QR Image Size</span>
                          <span className="font-mono font-bold text-foreground">{elements.qr.size}px</span>
                        </div>
                        <input
                          type="range"
                          min={80}
                          max={300}
                          value={elements.qr.size}
                          onChange={e => updateElement('qr', { size: Number(e.target.value) })}
                          className="w-full accent-navkar-700"
                        />
                      </div>
                    )}

                    {selectedElementId === 'logo' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Width</label>
                          <input
                            type="number"
                            value={elements.logo.width}
                            onChange={e => updateElement('logo', { width: Number(e.target.value) })}
                            className="w-full px-3 py-1 border border-border rounded-lg bg-background text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Height</label>
                          <input
                            type="number"
                            value={elements.logo.height}
                            onChange={e => updateElement('logo', { height: Number(e.target.value) })}
                            className="w-full px-3 py-1 border border-border rounded-lg bg-background text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {selectedElementId !== 'qr' && selectedElementId !== 'logo' && (
                      <div className="space-y-3.5">
                        {/* Text Label Template */}
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Label Content Template</label>
                          <input
                            type="text"
                            value={elements[selectedElementId].content}
                            onChange={e => updateElement(selectedElementId, { content: e.target.value })}
                            className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-xs font-mono"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Use tokens: <code className="bg-muted px-1 rounded">{"{{product_name}}"}</code>, <code className="bg-muted px-1 rounded">{"{{product_code}}"}</code>, or <code className="bg-muted px-1 rounded">{"{{qr_id}}"}</code>.
                          </p>
                        </div>

                        {/* Font size */}
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Font Size</span>
                            <span className="font-mono font-bold text-foreground">{elements[selectedElementId].fontSize}px</span>
                          </div>
                          <input
                            type="range"
                            min={8}
                            max={32}
                            value={elements[selectedElementId].fontSize}
                            onChange={e => updateElement(selectedElementId, { fontSize: Number(e.target.value) })}
                            className="w-full accent-navkar-700"
                          />
                        </div>

                        {/* Alignment and Font Weight */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-muted-foreground mb-1">Text Alignment</label>
                            <select
                              value={elements[selectedElementId].align}
                              onChange={e => updateElement(selectedElementId, { align: e.target.value })}
                              className="w-full px-2 py-1.5 border border-border rounded-lg bg-background"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-muted-foreground mb-1">Font Weight</label>
                            <select
                              value={elements[selectedElementId].fontWeight}
                              onChange={e => updateElement(selectedElementId, { fontWeight: e.target.value })}
                              className="w-full px-2 py-1.5 border border-border rounded-lg bg-background font-mono"
                            >
                              <option value="400">Regular (400)</option>
                              <option value="500">Medium (500)</option>
                              <option value="600">Semibold (600)</option>
                              <option value="700">Bold (700)</option>
                              <option value="800">Extra Bold (800)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    <hr className="border-border" />

                    {/* Element Colors */}
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Colors</label>
                      {selectedElementId === 'qr' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-muted-foreground mb-1 block">QR Color</span>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={elements.qr.fgColor}
                                onChange={e => updateElement('qr', { fgColor: e.target.value })}
                                className="w-8 h-8 rounded border border-border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={elements.qr.fgColor}
                                onChange={e => updateElement('qr', { fgColor: e.target.value })}
                                className="w-full px-2 py-1 border border-border rounded-lg bg-background text-[11px] font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground mb-1 block">QR Background</span>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={elements.qr.bgColor}
                                onChange={e => updateElement('qr', { bgColor: e.target.value })}
                                className="w-8 h-8 rounded border border-border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={elements.qr.bgColor}
                                onChange={e => updateElement('qr', { bgColor: e.target.value })}
                                className="w-full px-2 py-1 border border-border rounded-lg bg-background text-[11px] font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ) : selectedElementId !== 'logo' ? (
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={elements[selectedElementId].color}
                            onChange={e => updateElement(selectedElementId, { color: e.target.value })}
                            className="w-8 h-8 rounded border border-border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={elements[selectedElementId].color}
                            onChange={e => updateElement(selectedElementId, { color: e.target.value })}
                            className="flex-1 px-3 py-1 border border-border rounded-lg bg-background text-xs font-mono"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-[10px] text-muted-foreground">Logo URL</label>
                          <input
                            type="text"
                            value={elements.logo.content}
                            onChange={e => updateElement('logo', { content: e.target.value })}
                            className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-xs font-mono"
                          />
                          <label className="flex w-full items-center justify-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-lg text-xs font-medium cursor-pointer transition-colors text-foreground mt-1">
                            <Upload size={13} className="text-navkar-700" />
                            <span>Upload Logo Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleImageUpload(e, (base64) => updateElement('logo', { content: base64 }))}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DRAG AND DROP VISUAL CANVAS SCREEN */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-muted/30 border border-border rounded-xl p-8 min-h-[550px] relative overflow-hidden select-none">
          {/* Helper Guidelines */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-muted-foreground no-print bg-background/80 backdrop-blur-sm border border-border rounded-lg px-4 py-2 z-10">
            <span className="flex items-center gap-1.5">💡 <strong>Interactive Canvas:</strong> Click &amp; drag elements to design by hand.</span>
            {selectedElementId && (
              <span className="text-navkar-700 font-semibold uppercase tracking-wider text-[10px]">
                Editing: {elementDisplayNames[selectedElementId]}
              </span>
            )}
          </div>

          {/* Interactive Canvas tag wrapper */}
          <div
            className="relative shadow-xl transition-all duration-100 ease-out border border-border select-none bg-white"
            style={{
              width: `${canvas.width}px`,
              height: `${canvas.height}px`,
              background: canvas.background,
              backgroundImage: canvas.backgroundImage ? `url(${canvas.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderColor: canvas.border_color,
              borderWidth: `${canvas.border_width}px`,
              borderRadius: `${canvas.border_radius}px`
            }}
          >
            {/* 1. Brand Logo */}
            {elements.logo.visible && (
              <div
                onMouseDown={e => handleDragStart(e, 'logo')}
                onTouchStart={e => handleTouchStart(e, 'logo')}
                className={`absolute cursor-move overflow-hidden flex items-center justify-center p-1.5 transition-all
                  ${selectedElementId === 'logo' ? 'border border-dashed border-navkar-700 bg-navkar-50/20' : 'border border-transparent hover:border-border/60 hover:bg-muted/10'}`}
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

            {/* 2. QR Code Image */}
            {elements.qr.visible && (
              <div
                onMouseDown={e => handleDragStart(e, 'qr')}
                onTouchStart={e => handleTouchStart(e, 'qr')}
                className={`absolute cursor-move flex flex-col items-center justify-center p-2 transition-all
                  ${selectedElementId === 'qr' ? 'border border-dashed border-navkar-700 bg-navkar-50/20' : 'border border-transparent hover:border-border/60 hover:bg-muted/10'}`}
                style={{
                  left: `${elements.qr.x}px`,
                  top: `${elements.qr.y}px`,
                  width: `${elements.qr.size}px`,
                  height: `${elements.qr.size}px`
                }}
              >
                {previewQrUrl ? (
                  <img
                    src={previewQrUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full bg-muted border border-border rounded flex items-center justify-center text-xs">
                    QR Preview
                  </div>
                )}
              </div>
            )}

            {/* 3. Product Name Text */}
            {elements.product_name.visible && (
              <div
                onMouseDown={e => handleDragStart(e, 'product_name')}
                onTouchStart={e => handleTouchStart(e, 'product_name')}
                className={`absolute cursor-move py-1 px-1.5 transition-all text-ellipsis select-none
                  ${selectedElementId === 'product_name' ? 'border border-dashed border-navkar-700 bg-navkar-50/20' : 'border border-transparent hover:border-border/60 hover:bg-muted/10'}`}
                style={{
                  left: `${elements.product_name.x}px`,
                  top: `${elements.product_name.y}px`,
                  width: `${elements.product_name.width}px`,
                  fontSize: `${elements.product_name.fontSize}px`,
                  fontWeight: elements.product_name.fontWeight,
                  color: elements.product_name.color,
                  textAlign: elements.product_name.align,
                  lineHeight: 1.2
                }}
              >
                Navkar Premium 18mm
              </div>
            )}

            {/* 4. Product Code Text */}
            {elements.product_code.visible && (
              <div
                onMouseDown={e => handleDragStart(e, 'product_code')}
                onTouchStart={e => handleTouchStart(e, 'product_code')}
                className={`absolute cursor-move py-1 px-1.5 transition-all text-ellipsis select-none
                  ${selectedElementId === 'product_code' ? 'border border-dashed border-navkar-700 bg-navkar-50/20' : 'border border-transparent hover:border-border/60 hover:bg-muted/10'}`}
                style={{
                  left: `${elements.product_code.x}px`,
                  top: `${elements.product_code.y}px`,
                  width: `${elements.product_code.width}px`,
                  fontSize: `${elements.product_code.fontSize}px`,
                  fontWeight: elements.product_code.fontWeight,
                  color: elements.product_code.color,
                  textAlign: elements.product_code.align,
                  lineHeight: 1.2
                }}
              >
                Code: NPL-18MM-001
              </div>
            )}

            {/* 5. Unique QR ID Text */}
            {elements.qr_id.visible && (
              <div
                onMouseDown={e => handleDragStart(e, 'qr_id')}
                onTouchStart={e => handleTouchStart(e, 'qr_id')}
                className={`absolute cursor-move py-1 px-1.5 transition-all text-ellipsis font-mono select-none
                  ${selectedElementId === 'qr_id' ? 'border border-dashed border-navkar-700 bg-navkar-50/20' : 'border border-transparent hover:border-border/60 hover:bg-muted/10'}`}
                style={{
                  left: `${elements.qr_id.x}px`,
                  top: `${elements.qr_id.y}px`,
                  width: `${elements.qr_id.width}px`,
                  fontSize: `${elements.qr_id.fontSize}px`,
                  fontWeight: elements.qr_id.fontWeight,
                  color: elements.qr_id.color,
                  textAlign: elements.qr_id.align,
                  lineHeight: 1.2
                }}
              >
                ID: NP001
              </div>
            )}

            {/* 6. Website URL Label */}
            {elements.website.visible && (
              <div
                onMouseDown={e => handleDragStart(e, 'website')}
                onTouchStart={e => handleTouchStart(e, 'website')}
                className={`absolute cursor-move py-1 px-1.5 transition-all text-ellipsis select-none
                  ${selectedElementId === 'website' ? 'border border-dashed border-navkar-700 bg-navkar-50/20' : 'border border-transparent hover:border-border/60 hover:bg-muted/10'}`}
                style={{
                  left: `${elements.website.x}px`,
                  top: `${elements.website.y}px`,
                  width: `${elements.website.width}px`,
                  fontSize: `${elements.website.fontSize}px`,
                  fontWeight: elements.website.fontWeight,
                  color: elements.website.color,
                  textAlign: elements.website.align,
                  lineHeight: 1.2
                }}
              >
                navkarplywood.com
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
