import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
        navigate('/login');
    };

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

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
        { path: '/student', label: 'Home', roles: ['student'] },
        { path: '/student/my-contests', label: 'My Contests', roles: ['student'] },
        { path: '/student/profile', label: 'Profile', roles: ['student'] },
        { path: '/coordinator', label: 'Dashboard', roles: ['coordinator'] },
        { path: '/mentor', label: 'Dashboard', roles: ['mentor'] }
    ];

    return (
        <nav className="glass sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to={user ? getDashboardLink() : '/'} className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
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
                                                : 'text-gray-400 hover:text-indigo-400 hover:bg-white/5'
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
                            <div className="navbar-profile-menu" ref={menuRef}>
                                <button
                                    className="navbar-avatar-btn"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                >
                                    <div className="navbar-avatar">
                                        <span>{user.name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="navbar-user-info">
                                        <p className="navbar-user-name">{user.name}</p>
                                        <p className="navbar-user-role">{user.role}</p>
                                    </div>
                                    <svg className="navbar-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none' }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                {menuOpen && (
                                    <div className="navbar-dropdown">
                                        <div className="navbar-dropdown-header">
                                            <p className="navbar-dropdown-name">{user.name}</p>
                                            <p className="navbar-dropdown-email">{user.email}</p>
                                        </div>
                                        <div className="navbar-dropdown-divider" />

                                        {user.role === 'student' && (
                                            <>
                                                <Link to="/student/my-contests" className="navbar-dropdown-item">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                                    My Teams
                                                </Link>
                                                <Link to="/student/profile" className="navbar-dropdown-item">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                    My Profile
                                                </Link>
                                            </>
                                        )}

                                        <Link to={getDashboardLink()} className="navbar-dropdown-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                                            Settings
                                        </Link>
                                        <a href="mailto:support@kiot.edu" className="navbar-dropdown-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                            Help
                                        </a>
                                        <div className="navbar-dropdown-divider" />
                                        <button className="navbar-dropdown-item danger" onClick={handleLogout}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
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
