import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-piano-700 font-bold text-lg">PianoRep</Link>
          {user && (
            <Link to="/catalog" className="text-sm text-gray-600 hover:text-piano-600">
              Catalog
            </Link>
          )}
          {isAdmin && (
            <>
              <Link to="/admin/catalog" className="text-sm text-piano-600 font-medium hover:text-piano-800">
                Admin
              </Link>
              <Link to="/admin/users" className="text-sm text-piano-600 font-medium hover:text-piano-800">
                Users
              </Link>
              <Link to="/admin/bulk-upload" className="text-sm text-piano-600 font-medium hover:text-piano-800">
                Bulk Upload
              </Link>
            </>
          )}
          <Link to="/pricing" className="text-sm text-gray-600 hover:text-piano-600">
            Pricing
          </Link>
        </div>

        <div className="relative">
          {user ? (
            <>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2"
              >
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">{user.displayName}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile & Subscription
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
