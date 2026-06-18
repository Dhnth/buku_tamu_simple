import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLogin from './components/AdminLogin'
import AdminList from './components/AdminList'
import GuestForm from './components/GuestForm'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminList />} />
        <Route path="/tamu" element={<GuestForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App