import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationAPI, teamAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StudentProfile = () => {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [teams, setTeams] = useState([]);
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

        if (now < regDeadline) return 'open';
        if (now < subDeadline) return 'ongoing';
        return 'completed';
    };

    const activeCount = registrations.filter(r => {
        const s = getContestStatus(r);
        return s === 'open' || s === 'ongoing';
    }).length;

    const completedCount = registrations.filter(r => getContestStatus(r) === 'completed').length;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    const stats = [
        { label: 'Total Registrations', value: registrations.length, icon: '🎯', color: 'indigo' },
        { label: 'Active Contests', value: activeCount, icon: '🔥', color: 'amber' },
        { label: 'Completed', value: completedCount, icon: '✅', color: 'green' },
        { label: 'Teams', value: teams.length, icon: '👥', color: 'purple' }
    ];

    const recentRegistrations = registrations.slice(0, 3);

    return (
        <div className="student-page">
            {/* Header */}
            <div className="student-page-header">
                <div>
                    <h1 className="student-page-title">My Profile</h1>
                    <p className="student-page-subtitle">Your personal information and participation summary</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="student-profile-card">
                <div className="student-profile-avatar">
                    <span>{user.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="student-profile-info">
                    <h2 className="student-profile-name">{user.name}</h2>
                    <p className="student-profile-email">{user.email}</p>
                    <div className="student-profile-details">
                        <div className="student-profile-detail">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" /></svg>
                            {user.department}
                        </div>
                        <div className="student-profile-detail">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            Year {user.year}
                        </div>
                        <div className="student-profile-detail">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                            Section {user.section}
                        </div>
                        {user.register_no && (
                            <div className="student-profile-detail">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                {user.register_no}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="student-section-header">
                <h2>Participation Summary</h2>
            </div>
            <div className="student-stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className={`student-stats-card ${stat.color}`}>
                        <div className="student-stats-icon">{stat.icon}</div>
                        <div className="student-stats-value">{stat.value}</div>
                        <div className="student-stats-label">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            {recentRegistrations.length > 0 && (
                <>
                    <div className="student-section-header" style={{ marginTop: '2rem' }}>
                        <h2>Recent Activity</h2>
                        <Link to="/student/my-contests" className="student-view-all">
                            View all →
                        </Link>
                    </div>
                    <div className="student-recent-list">
                        {recentRegistrations.map((reg) => {
                            const statusKey = getContestStatus(reg);
                            const statusMap = {
                                open: { label: 'Registration Open', class: 'status-open' },
                                ongoing: { label: 'Ongoing', class: 'status-ongoing' },
                                completed: { label: 'Completed', class: 'status-completed' }
                            };
                            const status = statusMap[statusKey];

                            return (
                                <Link
                                    key={reg.registration_id}
                                    to={`/contests/${reg.contest_id}`}
                                    className="student-recent-item"
                                >
                                    <div className="student-recent-left">
                                        <h4>{reg.title}</h4>
                                        <span className="student-recent-date">
                                            Registered on {formatDate(reg.registered_at)}
                                        </span>
                                    </div>
                                    <span className={`student-status-badge ${status.class}`}>
                                        {status.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentProfile;
