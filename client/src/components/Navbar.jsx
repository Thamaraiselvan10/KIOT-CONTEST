import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getDashboardLink = () => {
        switch (user?.role) {
            case 'coordinator':
                return '/coordinator';
            case 'mentor':
                return '/mentor';
            case 'student':
            default:
                return '/student';
        }
    };

    const navLinks = [
        { path: '/contests', label: 'Contests', all: true },
        { path: '/student', label: 'Dashboard', roles: ['student'] },
        { path: '/coordinator', label: 'Dashboard', roles: ['coordinator'] },
        { path: '/mentor', label: 'Dashboard', roles: ['mentor'] }
    ];

    return (
        <nav className="glass sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to={user ? getDashboardLink() : '/'} className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">K</span>
                        </div>
                        <span className="text-xl font-bold gradient-text">KIOT Contest</span>
                    </Link>

                    {/* Navigation Links */}
                    {user && (
                        <div className="hidden md:flex items-center space-x-1">
                            {navLinks.map((link) => {
                                if (link.all || (link.roles && link.roles.includes(user.role))) {
                                    const isActive = location.pathname === link.path;
                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                                    ? 'bg-indigo-500/20 text-indigo-400'
                                                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    )}

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <div className="hidden sm:flex items-center space-x-3">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-white">{user.name}</p>
                                        <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-sm font-bold text-white">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="btn-primary text-sm py-2">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
