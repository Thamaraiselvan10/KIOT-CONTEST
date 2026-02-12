import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password, role);
            switch (user.role) {
                case 'coordinator':
                    navigate('/coordinator');
                    break;
                case 'mentor':
                    navigate('/mentor');
                    break;
                default:
                    navigate('/student');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (demoEmail, demoPassword, demoRole) => {
        setEmail(demoEmail);
        setPassword(demoPassword);
        setRole(demoRole);
        setError('');
        setLoading(true);

        try {
            await login(demoEmail, demoPassword, demoRole);
            switch (demoRole) {
                case 'coordinator':
                    navigate('/coordinator');
                    break;
                case 'mentor':
                    navigate('/mentor');
                    break;
                default:
                    navigate('/student');
            }
        } catch (err) {
            setError('Demo login failed. Please ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        {
            id: 'student',
            label: 'Student',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
                </svg>
            ),
        },
        {
            id: 'coordinator',
            label: 'Coordinator',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    <line x1="12" y1="12" x2="12" y2="12.01" />
                </svg>
            ),
        },
        {
            id: 'mentor',
            label: 'Mentor',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
        },
    ];

    return (
        <div className="login-page">
            {/* ===== LEFT: Branding Panel ===== */}
            <div className="login-brand-panel">
                {/* Floating orbs */}
                <div className="login-orb login-orb-1" />
                <div className="login-orb login-orb-2" />
                <div className="login-orb login-orb-3" />

                <div className="login-brand-content">
                    <div className="login-brand-logo">K</div>
                    <h1 className="login-brand-title">KIOT Contest Portal</h1>
                    <p className="login-brand-subtitle">
                        Your all-in-one platform for managing, participating, and excelling in contests.
                    </p>
                    <ul className="login-brand-features">
                        <li>
                            <span className="login-feature-icon">🏆</span>
                            Create &amp; manage contests seamlessly
                        </li>
                        <li>
                            <span className="login-feature-icon">👥</span>
                            Team collaboration &amp; mentorship
                        </li>
                        <li>
                            <span className="login-feature-icon">📊</span>
                            Real-time progress tracking
                        </li>
                    </ul>
                </div>
            </div>

            {/* ===== RIGHT: Form Panel ===== */}
            <div className="login-form-panel">
                <div className="login-card">
                    {/* Header */}
                    <div className="login-card-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Role Selector */}
                        <div className="login-role-selector">
                            {roles.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    className={`login-role-btn ${role === r.id ? 'active' : ''}`}
                                    onClick={() => setRole(r.id)}
                                >
                                    {r.icon}
                                    {r.label}
                                </button>
                            ))}
                        </div>

                        {/* Email */}
                        <div className="login-input-group">
                            <label htmlFor="login-email">Email</label>
                            <div className="login-input-wrapper">
                                <span className="login-input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </span>
                                <input
                                    id="login-email"
                                    type="email"
                                    className="login-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="login-input-group">
                            <label htmlFor="login-password">Password</label>
                            <div className="login-input-wrapper">
                                <span className="login-input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="login-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '48px' }}
                                />
                                <button
                                    type="button"
                                    className="login-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="login-error">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" disabled={loading} className="login-submit-btn">
                            {loading ? (
                                <div className="animate-spin rounded-full" style={{ width: 20, height: 20, borderTop: '2px solid #fff', borderBottom: '2px solid #fff', borderLeft: '2px solid transparent', borderRight: '2px solid transparent', borderRadius: '50%' }} />
                            ) : (
                                <>
                                    Sign In
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Login */}
                    <div className="login-divider">
                        <span>Quick Demo</span>
                    </div>
                    <div className="login-demo-grid">
                        <button
                            className="login-demo-btn student"
                            onClick={() => handleDemoLogin('student@kiot.edu', 'student123', 'student')}
                        >
                            🎓 Student
                        </button>
                        <button
                            className="login-demo-btn coordinator"
                            onClick={() => handleDemoLogin('admin@kiot.edu', 'admin123', 'coordinator')}
                        >
                            👔 Admin
                        </button>
                        <button
                            className="login-demo-btn mentor"
                            onClick={() => handleDemoLogin('mentor@kiot.edu', 'mentor123', 'mentor')}
                        >
                            👨‍🏫 Mentor
                        </button>
                    </div>

                    {/* Register Link */}
                    {role === 'student' && (
                        <p className="login-register-link">
                            Don't have an account?{' '}
                            <Link to="/register">Register here</Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
