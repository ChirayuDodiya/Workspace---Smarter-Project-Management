import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      //ignore logout error
    }
  };

  return (
    <header className="w-full bg-[#121212] border-b border-zinc-800 px-4 sm:px-8 py-3.5 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 min-h-16 sm:h-16 text-white select-none">
      {/* Logo & Navigation links on the left */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 select-none">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#098032] to-[#043314] flex items-center justify-center border border-[#098032]/30 shadow-md shrink-0">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight bg-linear-to-r from-white to-zinc-300 bg-clip-text text-transparent">
            Workspace
          </span>
        </div>

        {/* Divider (hidden on mobile) */}
        <div className="hidden sm:block h-5 w-px bg-zinc-800" />

        {/* Navigation links */}
        <nav className="flex items-center gap-4 sm:gap-5">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-xs sm:text-sm font-semibold transition-colors duration-150 ${
                isActive ? 'text-[#10b981] font-bold' : 'text-zinc-400 hover:text-white'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/change-role"
            className={({ isActive }) =>
              `text-xs sm:text-sm font-semibold transition-colors duration-150 ${
                isActive ? 'text-[#10b981] font-bold' : 'text-zinc-400 hover:text-white'
              }`
            }
          >
            Change Role
          </NavLink>
        </nav>
      </div>

      {/* User info and logout on the right */}
      <div className="flex items-center gap-3.5">
        {/* User profile details */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#098032]/20 to-[#043314]/30 border border-[#098032]/35 flex items-center justify-center text-xs font-semibold text-emerald-400 select-none shrink-0 shadow-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-white text-xs sm:text-sm font-semibold leading-tight">
              {user?.name}
            </span>
            <span className="text-zinc-500 text-[10px] font-semibold capitalize mt-0.5 select-none">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Divider (hidden on mobile) */}
        <div className="hidden sm:block h-5 w-px bg-zinc-800" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
