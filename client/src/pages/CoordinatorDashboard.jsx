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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Coordinator Dashboard
                    </h1>
                    <p className="text-gray-400">Manage contests and monitor registrations</p>
                </div>
                <Link to="/coordinator/contests/new" className="btn-primary">
                    + Add Contest
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card p-6">
                    <p className="text-gray-400 text-sm">Total Contests</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="card p-6">
                    <p className="text-gray-400 text-sm">Active Contests</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">{stats.active}</p>
                </div>
                <div className="card p-6">
                    <p className="text-gray-400 text-sm">Total Participants</p>
                    <p className="text-3xl font-bold text-indigo-400 mt-1">{stats.participants}</p>
                </div>
                <div className="card p-6">
                    <p className="text-gray-400 text-sm">Available Mentors</p>
                    <p className="text-3xl font-bold text-amber-400 mt-1">{mentors.length}</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-4 mb-6 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'active'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Active Contests
                    {activeTab === 'active' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('ended')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'ended'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Past Contests
                    {activeTab === 'ended' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full"></div>
                    )}
                </button>
            </div>

            {/* Contest Table */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-white">
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            🔍
                        </span>
                    </div>
                </div>

                {filteredContests.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
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
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400 font-medium text-sm">Contest</th>
                                    <th className="text-left p-3 text-gray-400 font-medium text-sm">Status</th>
                                    <th className="text-left p-3 text-gray-400 font-medium text-sm">Type</th>
                                    <th className="text-left p-3 text-gray-400 font-medium text-sm">Deadline</th>
                                    <th className="text-left p-3 text-gray-400 font-medium text-sm">Participants</th>
                                    <th className="text-right p-3 text-gray-400 font-medium text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContests.map((contest) => {
                                    const status = getStatus(contest);
                                    return (
                                        <tr key={contest.contest_id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-3">
                                                <Link
                                                    to={`/contests/${contest.contest_id}`}
                                                    className="font-medium text-white hover:text-indigo-400 text-sm"
                                                >
                                                    {contest.title}
                                                </Link>
                                            </td>
                                            <td className="p-3">
                                                <span className={`badge ${status.class}`}>{status.label}</span>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-gray-300 text-sm">
                                                    {contest.is_team_based ? 'Team' : 'Individual'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-400 text-sm">
                                                {formatDate(contest.registration_deadline)}
                                            </td>
                                            <td className="p-3 text-white font-medium text-sm">
                                                {contest.registration_count || 0}
                                            </td>
                                            <td className="p-3 text-right">
                                                <Link
                                                    to={`/contests/${contest.contest_id}`}
                                                    className="text-indigo-400 hover:text-indigo-300 text-sm"
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
        </div>
    );
};

export default CoordinatorDashboard;
