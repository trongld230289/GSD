import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useStore'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'

export default function App() {
  const { user } = useAuthStore()

  return (
    <BrowserRouter basename="/finance-tracker">
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={user ? <HomePage /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
