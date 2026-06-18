import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, User, Building2, Send } from 'lucide-react'

export default function GuestForm() {
  const [nama, setNama] = useState('')
  const [instansi, setInstansi] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nama.trim() || !instansi.trim()) {
      setError('Semua field harus diisi')
      setTimeout(() => setError(''), 3000)
      return
    }

    setLoading(true)
    setError('')

    const { error: supabaseError } = await supabase
      .from('tamu')
      .insert([{ nama: nama.trim(), instansi: instansi.trim() }])

    setLoading(false)

    if (supabaseError) {
      setError('Gagal mengirim data. Silakan coba lagi.')
      console.error(supabaseError)
      return
    }

    setSuccess(true)
    setNama('')
    setInstansi('')
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-surface-variant flex items-center justify-between px-4 h-14 max-w-container-max mx-auto left-0 right-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-headline-md text-primary font-bold">Buku Tamu</h1>
        </div>
        <span className="text-label-xs text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
          Literasi Sekolah
        </span>
      </header>

      {/* Content */}
      <main className="pt-20 pb-6 px-4 max-w-container-max mx-auto">
        {/* Welcome Header */}
        <div className="mb-5 text-center space-y-2">
          <h2 className="text-display-mobile text-on-surface leading-tight">
            Kegiatan
            <br />
            <span className="text-primary">Pengimbasan dan Donasi Literasi SMKN 1 Banjar</span>
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-xs mx-auto">
            Silakan isi data kunjungan Anda di bawah ini.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-5 shadow-sm">
          {success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-on-primary-container">✓</span>
              </div>
              <h3 className="text-headline-md text-on-surface mb-2">Terima Kasih!</h3>
              <p className="text-body-md text-on-surface-variant">
                Data Anda berhasil dikirim.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nama */}
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

              {/* Instansi */}
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

              {/* Error */}
              {error && (
                <div className="text-error text-label-sm text-center bg-error-container/10 py-2 rounded-lg border border-error/20">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Visual Context */}
        <div className="mt-stack-gap">
          <div className="relative h-48 rounded-md overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
            <div
              className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDy_8wVFyEUiGV9T74WO2SLn3dkJ7qPQHg_fJanoTV1PfTxIGQkz9CWq4UK1nIf7dNvtUxfc3E1SL7X94w3bCclbZzCZ1iVjVxCotJ5y0QfO8XhWPRDjIL80wYQJ6SN-60562Yt9SF8jbJfmZF34sbf7yC2w6pBJy9D4M6oGU2VQLBqwxuES7XK3_2FU6-IJh5yi8wQfvjLsdspQbwdIAIx8W4IOXvMYKZI_h0zy9oFr583_rxJDdlELTOLUCDjAee5LJLLTHJVUto')`
              }}
            ></div>
            <div className="absolute bottom-4 left-4 z-20">
              <p className="text-white text-label-sm opacity-90">
                Terima kasih atas kunjungan Anda.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}