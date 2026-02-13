import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ContestList = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { user } = useAuth();

    useEffect(() => {
        loadContests();
    }, []);

    const loadContests = async () => {
        try {
            const res = await contestAPI.getAll();
            setContests(res.data);
        } catch (error) {
            console.error('Failed to load contests:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (contest) => {
        const now = new Date();
        const regDeadline = new Date(contest.registration_deadline);
        const subDeadline = new Date(contest.submission_deadline);

        if (now < regDeadline) return { label: 'Open', class: 'badge-success' };
        if (now < subDeadline) return { label: 'Ongoing', class: 'badge-warning' };
        return { label: 'Ended', class: 'badge-danger' };
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredContests = contests.filter((c) => {
        const status = getStatus(c).label.toLowerCase();
        if (filter === 'all') return true;
        return status === filter;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Contests</h1>
                    <p className="text-stone-500 mt-1">Explore and participate in technical contests</p>
                </div>

                {user?.role === 'coordinator' && (
                    <Link to="/coordinator/contests/new" className="btn-primary">
                        + Create Contest
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['all', 'open', 'ongoing', 'ended'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === f
                            ? 'bg-teal-600 text-white'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Contest Grid */}
            {filteredContests.length === 0 ? (
                <div className="card p-12 text-center">
                    <p className="text-stone-500 text-lg">No contests found</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredContests.map((contest) => {
                        const status = getStatus(contest);
                        return (
                            <Link
                                key={contest.contest_id}
                                to={`/contests/${contest.contest_id}`}
                                className="card p-6 block"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`badge ${status.class}`}>
                                        {status.label}
                                    </div>
                                    {contest.is_team_based ? (
                                        <span className="badge badge-primary">Team</span>
                                    ) : (
                                        <span className="badge bg-stone-100 text-stone-600">Individual</span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-stone-900 mb-2 line-clamp-2">
                                    {contest.title}
                                </h3>

                                {contest.description && (
                                    <p className="text-stone-500 text-sm mb-4 line-clamp-2">
                                        {contest.description}
                                    </p>
                                )}

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-stone-500">
                                        <span className="mr-2">📍</span>
                                        {contest.location || 'TBD'}
                                    </div>
                                    <div className="flex items-center text-stone-500">
                                        <span className="mr-2">🗓️</span>
                                        {formatDate(contest.registration_deadline)}
                                    </div>
                                    <div className="flex items-center text-stone-500">
                                        <span className="mr-2">👥</span>
                                        {contest.registration_count || 0} registered
                                    </div>
                                </div>

                                {contest.is_team_based && (
                                    <div className="mt-4 pt-4 border-t border-stone-200">
                                        <p className="text-xs text-stone-400">
                                            Max team size: {contest.max_team_size}
                                        </p>
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ContestList;
