import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Check, Download, QrCode } from 'lucide-react'
import { useState, useRef } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function QRCodeModal({ isOpen, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const url = `${window.location.origin}/tamu`

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    if (!qrRef.current) return
    
    setDownloading(true)
    
    try {
      // Ambil elemen SVG dari dalam div
      const svgElement = qrRef.current.querySelector('svg')
      if (!svgElement) {
        throw new Error('SVG tidak ditemukan')
      }

      // Clone SVG untuk menghindari masalah rendering
      const clonedSvg = svgElement.cloneNode(true) as SVGElement
      
      // Set atribut SVG agar bisa di-render ke canvas
      const svgData = new XMLSerializer().serializeToString(clonedSvg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Canvas tidak didukung')
      }

      // Buat image dari SVG
      const img = new Image()
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      img.onload = () => {
        // Set canvas size dengan padding untuk include margin
        const padding = 20
        const size = 200 + (padding * 2)
        canvas.width = size
        canvas.height = size
        
        // Fill background putih
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        
        // Gambar QR code di tengah dengan padding
        ctx.drawImage(img, padding, padding, 200, 200)
        
        // Download
        const link = document.createElement('a')
        link.download = 'qr-code-buku-tamu.png'
        link.href = canvas.toDataURL('image/png', 1.0)
        link.click()
        
        URL.revokeObjectURL(url)
        setDownloading(false)
      }
      
      img.onerror = () => {
        setDownloading(false)
        console.error('Gagal memuat QR code')
      }
      
      img.src = url
    } catch (error) {
      console.error('Gagal download QR code:', error)
      setDownloading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-headline-md text-on-surface">QR Code</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors active:scale-95 touch-manipulation"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {/* QR Code dengan ref */}
          <div 
            ref={qrRef}
            className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30"
          >
            <QRCodeSVG
              value={url}
              size={200}
              level="H"
              includeMargin
            />
          </div>

          <p className="text-body-md text-on-surface-variant text-center">
            Scan QR code ini untuk mengisi buku tamu
          </p>

          {/* Action Buttons - lebih interaktif */}
          <div className="w-full flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 bg-primary text-on-primary px-4 py-2.5 rounded-lg font-label-sm font-medium hover:bg-primary/90 active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {downloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh PNG</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleCopy}
              className="flex-1 bg-surface-container-low text-on-surface-variant hover:bg-surface-container px-4 py-2.5 rounded-lg font-label-sm font-medium transition-all active:scale-[0.97] flex items-center justify-center gap-2 touch-manipulation border border-outline-variant/30"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-primary" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>

          {/* URL Display - lebih compact */}
          <div className="w-full bg-surface-container-low rounded-lg px-3 py-1.5 border border-outline-variant/20">
            <span className="text-label-xs text-on-surface-variant/60 truncate block text-center font-mono">
              {url}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}