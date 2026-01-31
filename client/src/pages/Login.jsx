import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password, role);
            // Navigate based on role
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
        { id: 'student', label: 'Student', icon: '🎓' },
        { id: 'coordinator', label: 'Coordinator', icon: '👔' },
        { id: 'mentor', label: 'Mentor', icon: '👨‍🏫' }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                        <span className="text-3xl font-bold text-white">K</span>
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to KIOT Contest Portal</p>
                </div>

                {/* Login Card */}
                <div className="card p-8 animate-fade-in">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                Login as
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {roles.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRole(r.id)}
                                        className={`p-4 rounded-xl border-2 transition-all text-center ${role === r.id
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <span className="text-2xl block mb-1">{r.icon}</span>
                                        <span className="text-xs font-medium">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Quick Demo Login */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-xs text-center text-gray-400 mb-4 font-medium uppercase tracking-wide">
                            Quick Demo Login
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => handleDemoLogin('student@kiot.edu', 'student123', 'student')}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-gray-300 transition-colors"
                            >
                                Demo Student
                            </button>
                            <button
                                onClick={() => handleDemoLogin('admin@kiot.edu', 'admin123', 'coordinator')}
                                className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-xs font-medium text-indigo-300 transition-colors"
                            >
                                Demo Admin
                            </button>
                            <button
                                onClick={() => handleDemoLogin('mentor@kiot.edu', 'mentor123', 'mentor')}
                                className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-medium text-amber-300 transition-colors"
                            >
                                Demo Mentor
                            </button>
                        </div>
                    </div>

                    {/* Register Link */}
                    {role === 'student' && (
                        <p className="mt-6 text-center text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                                Register here
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
