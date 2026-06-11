import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

function getDeviceType() {
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

function getBrowserAndOS() {
  const ua = navigator.userAgent
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  // Simple browser detection
  if (ua.indexOf('Firefox') > -1) browser = 'Firefox'
  else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Browser'
  else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera'
  else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer'
  else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Edge'
  else if (ua.indexOf('Chrome') > -1) browser = 'Chrome'
  else if (ua.indexOf('Safari') > -1) browser = 'Safari'

  // Simple OS detection
  if (ua.indexOf('Win') > -1) os = 'Windows'
  else if (ua.indexOf('Mac') > -1) os = 'MacOS'
  else if (ua.indexOf('X11') > -1) os = 'Linux'
  else if (ua.indexOf('Android') > -1) os = 'Android'
  else if (ua.indexOf('like Mac') > -1) os = 'iOS'

  return { browser, os }
}

export default function QRRedirect() {
  const { qrId } = useParams()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!qrId) return

    const performRedirect = async () => {
      try {
        const normalizedId = qrId.toUpperCase()

        // 1. Fetch destination URL from Supabase
        const { data: qrCode, error: fetchErr } = await supabase
          .from('qr_codes')
          .select('id, destination_url, status, product_name')
          .eq('qr_id', normalizedId)
          .single()

        if (fetchErr || !qrCode) {
          setError(`QR Code "${normalizedId}" not found.`)
          setLoading(false)
          return
        }

        if (qrCode.status !== 'active') {
          setError(`This QR Code (${qrCode.product_name}) is currently inactive.`)
          setLoading(false)
          return
        }

        // 2. Track scan (insert scan record, triggers database function to increment scan count)
        const deviceType = getDeviceType()
        const { browser, os } = getBrowserAndOS()
        const userAgent = navigator.userAgent
        const referrer = document.referrer || null

        // Fire scan insertion (asynchronously, do not block redirect)
        supabase.from('scans').insert({
          qr_code_id: qrCode.id,
          qr_id: normalizedId,
          destination_url: qrCode.destination_url,
          device_type: deviceType,
          browser,
          os,
          user_agent: userAgent.substring(0, 500),
          referrer: referrer ? referrer.substring(0, 500) : null
        }).then(({ error: insertErr }) => {
          if (insertErr) console.error('Failed to log scan:', insertErr.message)
        })

        // 3. Perform redirect
        window.location.replace(qrCode.destination_url)

      } catch (err) {
        console.error('Redirect error:', err)
        setError('An unexpected error occurred during redirection.')
        setLoading(false)
      }
    }

    performRedirect()
  }, [qrId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 size={40} className="animate-spin text-navkar-700 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-foreground">Redirecting...</h2>
            <p className="text-sm text-muted-foreground mt-1">Please wait while we connect you to your product.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center space-y-5 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center mx-auto text-red-600">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Redirection Failed</h2>
          <p className="text-sm text-muted-foreground">{error || 'Unable to load link.'}</p>
        </div>
        <div className="pt-2">
          <a
            href="https://navkarplywood.com"
            className="inline-block px-5 py-2.5 bg-navkar-700 hover:bg-navkar-800 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
          >
            Visit navkarplywood.com
          </a>
        </div>
      </div>
    </div>
  )
}
