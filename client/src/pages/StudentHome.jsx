import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contestAPI, registrationAPI, teamAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StudentHome = () => {
    const { user } = useAuth();
    const [contests, setContests] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [teams, setTeams] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);


    const loadData = async () => {
        try {
            const [contestRes, regRes, teamRes] = await Promise.all([
                contestAPI.getAll(),
                registrationAPI.getMy(),
                teamAPI.getMy()
            ]);

            const now = new Date();
            const open = contestRes.data.filter(c => new Date(c.registration_deadline) > now);
            setContests(open);
            setRegistrations(regRes.data);
            setTeams(teamRes.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Compute stats from registrations
    const now = new Date();
    const activeCount = registrations.filter(r => new Date(r.submission_deadline) > now).length;
    const completedCount = registrations.filter(r => new Date(r.submission_deadline) <= now).length;

    const filtered = contests.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.organizer && c.organizer.toLowerCase().includes(search.toLowerCase())) ||
        (c.platform && c.platform.toLowerCase().includes(search.toLowerCase()))
    );

    const getTimeLeft = (deadline) => {
        const now = new Date();
        const end = new Date(deadline);
        const diff = end - now;
        if (diff <= 0) return 'Closed';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h left`;
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${mins}m left`;
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="student-page">
            {/* Header */}
            <div className="student-page-header">
                <h1 className="student-page-title">
                    Welcome back, <span className="gradient-text">{user.name}</span>
                </h1>
                <p className="student-page-subtitle">
                    {user.department} • Year {user.year} • Section {user.section}
                </p>
            </div>

            {/* Quick Stats */}
            <div className="student-home-stats">
                <div className="student-home-stat active">
                    <div className="student-home-stat-icon">🔥</div>
                    <div className="student-home-stat-info">
                        <span className="student-home-stat-value">{activeCount}</span>
                        <span className="student-home-stat-label">Active</span>
                    </div>
                </div>
                <div className="student-home-stat completed">
                    <div className="student-home-stat-icon">✅</div>
                    <div className="student-home-stat-info">
                        <span className="student-home-stat-value">{completedCount}</span>
                        <span className="student-home-stat-label">Completed</span>
                    </div>
                </div>
                <div className="student-home-stat teams">
                    <div className="student-home-stat-icon">👥</div>
                    <div className="student-home-stat-info">
                        <span className="student-home-stat-value">{teams.length}</span>
                        <span className="student-home-stat-label">Teams</span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="student-search-bar">
                <svg className="student-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    className="student-search-input"
                    placeholder="Search contests by title, organizer, or platform..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Section header */}
            <div className="student-section-header">
                <h2>Open for Registration</h2>
                <span className="student-count-badge">{filtered.length}</span>
            </div>

            {/* Contest Grid */}
            {filtered.length === 0 ? (
                <div className="student-empty-state">
                    <div className="student-empty-icon">🏆</div>
                    <h3>No open contests right now</h3>
                    <p>Check back later for new contests to participate in!</p>
                </div>
            ) : (
                <div className="student-contest-grid">
                    {filtered.map((contest) => {
                        const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                        return (
                            <Link
                                key={contest.contest_id}
                                to={`/contests/${contest.contest_id}`}
                                className="student-contest-card"
                            >
                                {/* Banner */}
                                {contest.image_url && (
                                    <div className="student-card-banner">
                                        <img src={contest.image_url} alt="" />
                                    </div>
                                )}

                                <div className="student-card-body">
                                    {/* Tags row */}
                                    <div className="student-card-tags">
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
                                            {getTimeLeft(contest.registration_deadline)}
                                        </div>
                                        {contest.registration_count !== undefined && (
                                            <span className="student-card-registrants">
                                                {contest.registration_count} registered
                                            </span>
                                        )}
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

export default StudentHome;
