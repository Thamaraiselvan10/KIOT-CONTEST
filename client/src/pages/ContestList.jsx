import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contestAPI, registrationAPI, teamAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ContestList = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('open');
    const [searchQuery, setSearchQuery] = useState('');
    const [myRegistrations, setMyRegistrations] = useState(new Set());
    const { user } = useAuth();

    useEffect(() => {
        loadContests();
        if (user && user.role === 'student') {
            checkRegistrations();
        }
    }, [user]);

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

    const checkRegistrations = async () => {
        try {
            const [regRes, teamRes] = await Promise.all([
                registrationAPI.getMy(),
                teamAPI.getMy()
            ]);

            const regIds = new Set();
            regRes.data.forEach(r => regIds.add(r.contest_id));
            teamRes.data.forEach(t => regIds.add(t.contest_id));

            setMyRegistrations(regIds);
        } catch (error) {
            console.error('Failed to load registrations:', error);
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

    const filteredContests = contests
        .filter((c) => {
            const status = getStatus(c).label.toLowerCase();
            return status === filter;
        })
        .filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

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

            {/* Search Bar */}
            <div className="relative mb-6">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contests..."
                    className="input w-full pl-11"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['open', 'ongoing', 'ended'].map((f) => (
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
                        const isRegistered = myRegistrations.has(contest.contest_id);

                        return (
                            <Link
                                key={contest.contest_id}
                                to={`/contests/${contest.contest_id}`}
                                className={`student-contest-card block transition-all ${isRegistered ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}
                            >
                                {/* Banner */}
                                {contest.image_url && (
                                    <div className="student-card-banner">
                                        <img src={contest.image_url} alt="" />
                                        {isRegistered && (
                                            <div className="absolute top-2 right-2 badge badge-success shadow-md">
                                                ✓ Registered
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="student-card-body">
                                    {/* Tags row */}
                                    <div className="student-card-tags">
                                        {/* Status Badge */}
                                        <span className={`student-status-badge ${getStatus(contest).class.replace('badge-', 'status-').toLowerCase()}`}>
                                            {getStatus(contest).label}
                                        </span>

                                        {contest.organizer && (
                                            <span className="student-tag organizer">{contest.organizer}</span>
                                        )}
                                        {contest.platform && (
                                            <span className="student-tag platform">{contest.platform}</span>
                                        )}
                                        <span className={`student-tag ${contest.is_team_based ? 'team' : 'solo'}`}>
                                            {contest.is_team_based ? `👥 Team (max ${contest.max_team_size})` : '👤 Solo'}
                                        </span>
                                        {contest.department && (
                                            <span className="student-tag dept">{contest.department}</span>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <h3 className="student-card-title">{contest.title}</h3>

                                    {/* Description */}
                                    {contest.description && (
                                        <p className="student-card-desc">{contest.description}</p>
                                    )}

                                    {/* Meta info row */}
                                    <div className="student-card-meta">
                                        {contest.location && (
                                            <span className="student-card-meta-item">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                {contest.location}
                                            </span>
                                        )}
                                        <span className="student-card-meta-item">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                            Reg: {formatDate(contest.registration_deadline)}
                                        </span>
                                        <span className="student-card-meta-item">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            Due: {formatDate(contest.submission_deadline)}
                                        </span>
                                    </div>

                                    {/* Footer */}
                                    <div className="student-card-footer">
                                        <div className="student-card-deadline">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            {/* We don't have getTimeLeft in this component scope, so we use formatted date or similar. 
                                                Actually StudentHome calculates time left or similar. 
                                                Let's stick to 'Due' date or just remove if not needed.
                                                StudentHome uses: <span>{getTimeLeft(contest.registration_deadline)}</span>
                                                I need to add the helper or just use a simple label.
                                            */}
                                            <span>Deadline: {formatDate(contest.registration_deadline).split(',')[0]}</span>
                                        </div>
                                        <div className="student-card-registrants">
                                            {contest.registration_count || 0} registered
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ContestList;
