import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { contestAPI, mentorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CoordinatorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [contests, setContests] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, participants: 0 });
    const [activeTab, setActiveTab] = useState('active');
    const [searchQuery, setSearchQuery] = useState('');

    // Add Mentor modal state
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [mentorForm, setMentorForm] = useState({ name: '', department: '', email: '', password: '' });
    const [mentorError, setMentorError] = useState('');
    const [mentorSuccess, setMentorSuccess] = useState('');
    const [creatingMentor, setCreatingMentor] = useState(false);

    const handleCreateMentor = async (e) => {
        e.preventDefault();
        setMentorError('');
        setMentorSuccess('');
        setCreatingMentor(true);
        try {
            await mentorAPI.create(mentorForm);
            setMentorSuccess('Mentor created successfully!');
            setMentorForm({ name: '', department: '', email: '', password: '' });
            // Refresh mentors list
            const mentorRes = await mentorAPI.getAll();
            setMentors(mentorRes.data);
            setTimeout(() => {
                setShowMentorModal(false);
                setMentorSuccess('');
            }, 1500);
        } catch (err) {
            setMentorError(err.response?.data?.error || 'Failed to create mentor');
        } finally {
            setCreatingMentor(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [contestRes, mentorRes] = await Promise.all([
                contestAPI.getAll(),
                mentorAPI.getAll()
            ]);

            const myContests = contestRes.data.filter(c => c.created_by === user.coordinator_id);
            setContests(myContests);
            setMentors(mentorRes.data);

            // Calculate stats
            const now = new Date();
            const active = myContests.filter(c => {
                const deadline = new Date(c.submission_deadline);
                return deadline > now;
            }).length;

            const totalParticipants = myContests.reduce((sum, c) => sum + (c.registration_count || 0), 0);

            setStats({
                total: myContests.length,
                active,
                participants: totalParticipants
            });
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatus = (contest) => {
        const now = new Date();
        const regDeadline = new Date(contest.registration_deadline);
        const subDeadline = new Date(contest.submission_deadline);

        if (now < regDeadline) return { label: 'Open', class: 'badge-success' };
        if (now < subDeadline) return { label: 'Ongoing', class: 'badge-warning' };
        return { label: 'Ended', class: 'badge-danger' };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    // Filter contests based on active tab and search query
    const filteredContests = contests
        .filter(c => {
            const now = new Date();
            const deadline = new Date(c.submission_deadline);
            if (activeTab === 'active') {
                return deadline > now;
            } else {
                return deadline <= now;
            }
        })
        .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 mb-2">
                        Coordinator Dashboard
                    </h1>
                    <p className="text-stone-500">Manage contests and monitor registrations</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setShowMentorModal(true); setMentorError(''); setMentorSuccess(''); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 font-semibold text-sm hover:bg-teal-100 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        Add Mentor
                    </button>
                    <Link to="/coordinator/contests/new" className="btn-primary">
                        + Add Contest
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card p-6">
                    <p className="text-stone-500 text-sm">Total Contests</p>
                    <p className="text-3xl font-bold text-stone-900 mt-1">{stats.total}</p>
                </div>
                <div className="card p-6">
                    <p className="text-stone-500 text-sm">Active Contests</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.active}</p>
                </div>
                <div className="card p-6">
                    <p className="text-stone-500 text-sm">Total Participants</p>
                    <p className="text-3xl font-bold text-teal-600 mt-1">{stats.participants}</p>
                </div>
                <div className="card p-6">
                    <p className="text-stone-500 text-sm">Available Mentors</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{mentors.length}</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-4 mb-6 border-b border-stone-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'active'
                        ? 'text-stone-900'
                        : 'text-stone-500 hover:text-teal-600'
                        }`}
                >
                    Active Contests
                    {activeTab === 'active' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('ended')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'ended'
                        ? 'text-stone-900'
                        : 'text-stone-500 hover:text-teal-600'
                        }`}
                >
                    Past Contests
                    {activeTab === 'ended' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full"></div>
                    )}
                </button>
            </div>

            {/* Contest Table */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-stone-900">
                        {activeTab === 'active' ? 'Active Contests' : 'Past Contests'}
                    </h2>
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-48">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-9 w-full py-1.5 text-sm"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                            🔍
                        </span>
                    </div>
                </div>

                {filteredContests.length === 0 ? (
                    <div className="p-12 text-center text-stone-500">
                        <p className="mb-4">No {activeTab === 'active' ? 'active' : 'past'} contests found.</p>
                        {activeTab === 'active' && (
                            <Link to="/coordinator/contests/new" className="btn-primary">
                                Create New Contest
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-stone-200">
                                    <th className="text-left p-3 text-stone-500 font-medium text-sm">Contest</th>
                                    <th className="text-left p-3 text-stone-500 font-medium text-sm">Status</th>
                                    <th className="text-left p-3 text-stone-500 font-medium text-sm">Type</th>
                                    <th className="text-left p-3 text-stone-500 font-medium text-sm">Deadline</th>
                                    <th className="text-left p-3 text-stone-500 font-medium text-sm">Participants</th>
                                    <th className="text-right p-3 text-stone-500 font-medium text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContests.map((contest) => {
                                    const status = getStatus(contest);
                                    return (
                                        <tr key={contest.contest_id} className="border-b border-stone-100 hover:bg-stone-50">
                                            <td className="p-3">
                                                <Link
                                                    to={`/contests/${contest.contest_id}`}
                                                    className="font-medium text-stone-900 hover:text-teal-600 text-sm"
                                                >
                                                    {contest.title}
                                                </Link>
                                            </td>
                                            <td className="p-3">
                                                <span className={`badge ${status.class}`}>{status.label}</span>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-stone-600 text-sm">
                                                    {contest.is_team_based ? 'Team' : 'Individual'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-stone-500 text-sm">
                                                {formatDate(contest.registration_deadline)}
                                            </td>
                                            <td className="p-3 text-stone-900 font-medium text-sm">
                                                {contest.registration_count || 0}
                                            </td>
                                            <td className="p-3 text-right">
                                                <Link
                                                    to={`/contests/${contest.contest_id}`}
                                                    className="text-teal-600 hover:text-teal-700 text-sm"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Add Mentor Modal */}
            {showMentorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="card p-6 w-full max-w-md mx-4 relative" style={{ animation: 'navDropIn 0.2s ease-out' }}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-stone-900">Add New Mentor</h3>
                            <button
                                onClick={() => setShowMentorModal(false)}
                                className="text-stone-400 hover:text-stone-600 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {mentorError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm mb-4">
                                {mentorError}
                            </div>
                        )}
                        {mentorSuccess && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm mb-4">
                                {mentorSuccess}
                            </div>
                        )}

                        <form onSubmit={handleCreateMentor} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={mentorForm.name}
                                    onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                                    className="input w-full"
                                    placeholder="Dr. John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-1">Department</label>
                                <select
                                    value={mentorForm.department}
                                    onChange={(e) => setMentorForm({ ...mentorForm, department: e.target.value })}
                                    className="input w-full"
                                    required
                                >
                                    <option value="">Select Department</option>
                                    <option value="CSE">CSE</option>
                                    <option value="IT">IT</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option>
                                    <option value="MECH">MECH</option>
                                    <option value="CIVIL">CIVIL</option>
                                    <option value="AIDS">AIDS</option>
                                    <option value="AIML">AIML</option>
                                    <option value="CSD">CSD</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={mentorForm.email}
                                    onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
                                    className="input w-full"
                                    placeholder="mentor@kiot.edu"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={mentorForm.password}
                                    onChange={(e) => setMentorForm({ ...mentorForm, password: e.target.value })}
                                    className="input w-full"
                                    placeholder="Set a secure password"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowMentorModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingMentor}
                                    className="flex-1 btn-primary"
                                >
                                    {creatingMentor ? 'Creating...' : 'Create Mentor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoordinatorDashboard;
