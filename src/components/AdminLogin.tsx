import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, BookOpen } from 'lucide-react'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === 'iya' && password === 'bntr') {
      localStorage.setItem('isAdmin', 'true')
      navigate('/admin')
    } else {
      setError('Username atau password salah!')
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-edge-margin bg-surface">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-container rounded-full">
              <BookOpen className="w-8 h-8 text-on-primary-container" />
            </div>
          </div>
          <h1 className="text-display-mobile text-on-surface mb-2">Admin Buku Tamu</h1>
          <p className="text-body-md text-on-surface-variant">Masuk untuk mengelola daftar tamu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-label-sm text-on-surface-variant">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-outline-variant"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-label-sm text-on-surface-variant">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-outline-variant"
              placeholder="Masukkan password"
              required
            />
          </div>

          {error && (
            <div className="text-error text-label-sm text-center bg-error-container/20 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <LogIn className="w-5 h-5" />
            Masuk
          </button>
        </form>
      </div>
    </div>
  )
}