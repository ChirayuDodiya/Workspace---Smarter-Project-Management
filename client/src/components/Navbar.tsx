import { Link } from 'react-router-dom';
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
    <header className="w-full bg-[#121212] border-b border-[#2d2d2d] px-4 sm:px-8 py-3 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 min-h-16 sm:h-16 text-white select-none">
      {/* Navigation links on the left */}
      <nav className="flex items-center gap-4 sm:gap-6">
        <Link
          to="/"
          className="text-sm sm:text-base font-semibold hover:text-emerald-400 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          to="/change-role"
          className="text-sm sm:text-base font-semibold hover:text-emerald-400 transition-colors"
        >
          Change Role
        </Link>
      </nav>

      {/* User info and logout on the right */}
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          onClick={handleLogout}
          className="px-4 sm:px-6 py-1 bg-[#4c1c1c] border border-white hover:bg-[#682525] rounded-xl text-white text-sm sm:text-base font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Logout
        </button>

        <div className="flex flex-col text-right">
          <span className="text-white text-sm sm:text-base font-semibold leading-tight">
            {user?.name}
          </span>
          <span className="text-gray-400 text-[10px] sm:text-xs font-semibold capitalize mt-0.5">
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
