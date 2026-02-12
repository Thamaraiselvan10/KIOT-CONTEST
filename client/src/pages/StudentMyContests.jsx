import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationAPI, teamAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StudentMyContests = () => {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [teams, setTeams] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [regRes, teamRes] = await Promise.all([
                registrationAPI.getMy(),
                teamAPI.getMy()
            ]);
            setRegistrations(regRes.data);
            setTeams(teamRes.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getContestStatus = (reg) => {
        const now = new Date();
        const regDeadline = new Date(reg.registration_deadline);
        const subDeadline = new Date(reg.submission_deadline);

        if (now < regDeadline) return { label: 'Registration Open', class: 'status-open', icon: '🟢' };
        if (now < subDeadline) return { label: 'Ongoing', class: 'status-ongoing', icon: '🟡' };
        return { label: 'Completed', class: 'status-completed', icon: '✅' };
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const filteredRegistrations = registrations.filter(reg => {
        if (filter === 'all') return true;
        const status = getContestStatus(reg);
        if (filter === 'active') return status.class === 'status-open' || status.class === 'status-ongoing';
        if (filter === 'completed') return status.class === 'status-completed';
        return true;
    });

    // Get team info for a contest
    const getTeamForContest = (contestId) => {
        return teams.find(t => t.contest_id === contestId);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const filters = [
        { id: 'all', label: 'All', count: registrations.length },
        { id: 'active', label: 'Active', count: registrations.filter(r => { const s = getContestStatus(r); return s.class !== 'status-completed'; }).length },
        { id: 'completed', label: 'Completed', count: registrations.filter(r => getContestStatus(r).class === 'status-completed').length }
    ];

    return (
        <div className="student-page">
            {/* Header */}
            <div className="student-page-header">
                <div>
                    <h1 className="student-page-title">My Contests</h1>
                    <p className="student-page-subtitle">Track your registered contests and their progress</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="student-filter-tabs">
                {filters.map(f => (
                    <button
                        key={f.id}
                        className={`student-filter-tab ${filter === f.id ? 'active' : ''}`}
                        onClick={() => setFilter(f.id)}
                    >
                        {f.label}
                        <span className="student-filter-count">{f.count}</span>
                    </button>
                ))}
            </div>

            {/* Contest List */}
            {filteredRegistrations.length === 0 ? (
                <div className="student-empty-state">
                    <div className="student-empty-icon">📋</div>
                    <h3>{filter === 'all' ? "You haven't registered for any contests yet" : `No ${filter} contests`}</h3>
                    <p>
                        {filter === 'all'
                            ? 'Browse open contests and start participating!'
                            : 'Try changing the filter to see other contests.'}
                    </p>
                    {filter === 'all' && (
                        <Link to="/student" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                            Browse Contests
                        </Link>
                    )}
                </div>
            ) : (
                <div className="student-mycontest-list">
                    {filteredRegistrations.map((reg) => {
                        const status = getContestStatus(reg);
                        const team = reg.is_team_based ? getTeamForContest(reg.contest_id) : null;

                        return (
                            <div key={reg.registration_id} className="student-mycontest-card">
                                <div className="student-mycontest-top">
                                    {/* Left: Info */}
                                    <div className="student-mycontest-info">
                                        <div className="student-mycontest-tags">
                                            <span className={`student-status-badge ${status.class}`}>
                                                {status.icon} {status.label}
                                            </span>
                                            <span className={`student-tag ${reg.is_team_based ? 'team' : 'solo'}`}>
                                                {reg.is_team_based ? '👥 Team' : '👤 Solo'}
                                            </span>
                                        </div>
                                        <h3 className="student-mycontest-title">
                                            <Link to={`/contests/${reg.contest_id}`}>{reg.title}</Link>
                                        </h3>
                                        <div className="student-mycontest-meta">
                                            {reg.organizer && (
                                                <span>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                                                    {reg.organizer}
                                                </span>
                                            )}
                                            {reg.platform && (
                                                <span>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                                                    {reg.platform}
                                                </span>
                                            )}
                                            {team && (
                                                <span>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                                    Team: {team.team_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Dates */}
                                    <div className="student-mycontest-dates">
                                        <div className="student-date-item">
                                            <span className="student-date-label">Registered</span>
                                            <span className="student-date-value">{formatDate(reg.registered_at)}</span>
                                        </div>
                                        <div className="student-date-item">
                                            <span className="student-date-label">Deadline</span>
                                            <span className="student-date-value">{formatDate(reg.submission_deadline)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="student-mycontest-actions">
                                    <Link to={`/contests/${reg.contest_id}`} className="student-action-btn primary">
                                        View Details
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                    </Link>
                                    {reg.external_reg_link && (
                                        <a href={reg.external_reg_link} target="_blank" rel="noopener noreferrer" className="student-action-btn secondary">
                                            External Link
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                        </a>
                                    )}
                                    {reg.submission_link && status.class === 'status-ongoing' && (
                                        <a href={reg.submission_link} target="_blank" rel="noopener noreferrer" className="student-action-btn success">
                                            Submit
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentMyContests;
