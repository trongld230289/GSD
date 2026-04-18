import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 z-30 flex">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
            isActive ? 'text-green-600' : 'text-gray-400'
          }`
        }
      >
        <span className="text-xl mb-0.5">🏠</span>
        Home
      </NavLink>
      <NavLink
        to="/budget"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
            isActive ? 'text-green-600' : 'text-gray-400'
          }`
        }
      >
        <span className="text-xl mb-0.5">💰</span>
        Budget
      </NavLink>
      <NavLink
        to="/reports"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
            isActive ? 'text-green-600' : 'text-gray-400'
          }`
        }
      >
        <span className="text-xl mb-0.5">📊</span>
        Reports
      </NavLink>
    </nav>
  )
}
