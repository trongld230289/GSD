import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useStore'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ReportsPage from './pages/ReportsPage'
import BudgetPage from './pages/BudgetPage'

export default function App() {
  const { user } = useAuthStore()

  return (
    <BrowserRouter basename="/GSD">
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/reports"
          element={user ? <ReportsPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/budget"
          element={user ? <BudgetPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/*"
          element={user ? <HomePage /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
