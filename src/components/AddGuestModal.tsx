import { useState } from 'react'
import { supabase, type Tamu } from '../lib/supabase'
import { X, User, Building2, Send, Loader2 } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (tamu: Tamu) => void
}

export default function AddGuestModal({ isOpen, onClose, onSuccess }: Props) {
  const [nama, setNama] = useState('')
  const [instansi, setInstansi] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nama.trim() || !instansi.trim()) {
      setError('Semua field harus diisi')
      setTimeout(() => setError(''), 3000)
      return
    }

    setLoading(true)
    setError('')

    const { data, error: supabaseError } = await supabase
      .from('tamu')
      .insert([{ nama: nama.trim(), instansi: instansi.trim() }])
      .select()
      .single()

    setLoading(false)

    if (supabaseError) {
      setError('Gagal menambahkan tamu. Silakan coba lagi.')
      console.error(supabaseError)
      return
    }

    if (data) {
      onSuccess(data)
      setNama('')
      setInstansi('')
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-headline-md text-on-surface">Tambah Tamu</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors active:scale-95 cursor-pointer touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-label-sm text-on-surface-variant flex items-center gap-1.5">
              <User className="w-4 h-4" />
              Nama Lengkap
              <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-body-md placeholder:text-outline-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Masukkan nama lengkap"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-label-sm text-on-surface-variant flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              Asal Instansi/Organisasi
              <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={instansi}
                onChange={(e) => setInstansi(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-body-md placeholder:text-outline-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Masukkan asal instansi/organisasi"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="text-error text-label-sm text-center bg-error-container/10 py-2 rounded-lg border border-error/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-label-sm font-medium hover:bg-primary/90 active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-manipulation"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Simpan</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}