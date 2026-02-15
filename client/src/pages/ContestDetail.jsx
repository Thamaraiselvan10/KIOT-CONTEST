import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { contestAPI, registrationAPI, teamAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ContestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [showTeamForm, setShowTeamForm] = useState(false);
    const [myRegistration, setMyRegistration] = useState(null);
    const [myTeam, setMyTeam] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copied, setCopied] = useState(false);
    const [registrations, setRegistrations] = useState([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);
    const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

    useEffect(() => {
        loadContest();
        if (user?.role === 'student') {
            checkRegistration();
            loadRegistrations(); // Load registrations for students too
        }
        if (user?.role === 'coordinator' || user?.role === 'mentor') {
            loadRegistrations();
        }
    }, [id, user]);

    // ... (rest of the file until the return statement)



    const loadContest = async () => {
        try {
            const res = await contestAPI.getOne(id);
            setContest(res.data);
        } catch (error) {
            console.error('Failed to load contest:', error);
            navigate('/contests');
        } finally {
            setLoading(false);
        }
    };

    const checkRegistration = async () => {
        try {
            const [regRes, teamRes] = await Promise.all([
                registrationAPI.getMy(),
                teamAPI.getMy()
            ]);

            const reg = regRes.data.find(r => r.contest_id === parseInt(id));
            setMyRegistration(reg);

            const team = teamRes.data.find(t => t.contest_id === parseInt(id));
            setMyTeam(team);
        } catch (error) {
            console.error('Failed to check registration:', error);
        }
    };

    const loadRegistrations = async () => {
        setLoadingRegistrations(true);
        try {
            const res = await registrationAPI.getByContest(id);
            setRegistrations(res.data);
        } catch (error) {
            console.error('Failed to load registrations:', error);
        } finally {
            setLoadingRegistrations(false);
        }
    };

    const handleRegisterClick = () => {
        setShowRegisterConfirm(true);
    };

    const handleRegister = async () => {
        setError('');
        setSuccess('');
        setRegistering(true);

        try {
            await registrationAPI.register({ contest_id: parseInt(id) });
            setSuccess('Successfully registered!');
            await checkRegistration();
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setRegistering(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setRegistering(true);

        try {
            await teamAPI.create({
                contest_id: parseInt(id),
                team_name: teamName
            });
            setSuccess('Team created successfully!');
            setShowTeamForm(false);
            setTeamName('');
            await checkRegistration();
            await loadContest();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create team');
        } finally {
            setRegistering(false);
        }
    };

    const handleJoinTeam = async (teamId) => {
        setError('');
        setSuccess('');
        setRegistering(true);

        try {
            await teamAPI.join(teamId);
            setSuccess('Joined team successfully!');
            await checkRegistration();
            await loadContest();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to join team');
        } finally {
            setRegistering(false);
        }
    };

    const getStatus = () => {
        if (!contest) return { label: 'Loading', class: 'badge-primary' };
        const now = new Date();
        const regDeadline = new Date(contest.registration_deadline);
        const subDeadline = new Date(contest.submission_deadline);

        if (now < regDeadline) return { label: 'Registration Open', class: 'badge-success' };
        if (now < subDeadline) return { label: 'Contest Ongoing', class: 'badge-warning' };
        return { label: 'Contest Ended', class: 'badge-danger' };
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isRegistrationOpen = () => {
        if (!contest) return false;
        return new Date() < new Date(contest.registration_deadline);
    };

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

    const handleShareURL = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    const status = getStatus();

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-6">
                <Link to="/contests" className="inline-flex items-center text-stone-500 hover:text-teal-600 transition-colors">
                    ← Back to Contests
                </Link>
                <div className="flex items-center gap-3">
                    {(myRegistration || myTeam) && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-sm font-semibold">
                            ✓ Registered
                        </div>
                    )}
                    {(user?.role === 'coordinator' || user?.role === 'mentor') && contest && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-sm font-semibold">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            {contest.registration_count || 0} Registered
                        </div>
                    )}
                    <button
                        onClick={handleShareURL}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-teal-600 transition-colors text-sm"
                    >
                        {copied ? '✓ Copied!' : '🔗 Share URL'}
                    </button>
                </div>
            </div>

            {/* Registration Confirmation Modal */}
            {showRegisterConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                    <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '24px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-stone-900">Confirm Registration</h3>
                            <p className="text-sm text-stone-500 mt-2">Are you sure you want to register for <b>{contest.title}</b>?</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowRegisterConfirm(false)}
                                className="px-5 py-2 text-sm font-medium rounded-lg text-stone-600 hover:bg-stone-100 transition-all"
                                style={{ border: '1px solid #e7e5e4' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setShowRegisterConfirm(false); handleRegister(); }}
                                className="px-5 py-2 text-sm font-medium rounded-lg text-white transition-all bg-teal-600 hover:bg-teal-700"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contest Header - Redesigned */}
            <div className="card p-6 mb-6">
                {/* Banner */}
                {contest.image_url && (
                    <div className="contest-detail-banner">
                        <img src={contest.image_url} alt={contest.title} />
                    </div>
                )}

                <div className="contest-detail-header-content">
                    {/* Tags */}
                    <div className="contest-detail-tags">
                        {contest.organizer && (
                            <span className="contest-detail-tag organizer">{contest.organizer}</span>
                        )}
                        {contest.platform && (
                            <span className="contest-detail-tag platform">{contest.platform}</span>
                        )}
                        <span className={`contest-detail-tag ${contest.is_team_based ? 'team' : 'solo'}`}>
                            {contest.is_team_based ? `👥 Team (max ${contest.max_team_size})` : '👤 Solo'}
                        </span>
                        {contest.department && (
                            <span className="contest-detail-tag dept">{contest.department}</span>
                        )}
                        {(myRegistration || myTeam) && (
                            <span className="contest-detail-tag" style={{ background: '#d1fae5', color: '#065f46' }}>
                                ✓ Registered
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="contest-detail-title">{contest.title}</h1>

                    {/* Meta */}
                    <div className="contest-detail-meta">
                        {contest.location && (
                            <span className="contest-detail-meta-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                {contest.location}
                            </span>
                        )}
                        <span className="contest-detail-meta-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            Reg: {formatDate(contest.registration_deadline)}
                        </span>
                        <span className="contest-detail-meta-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            Due: {formatDate(contest.submission_deadline)}
                        </span>
                    </div>

                    {/* Timer & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="contest-detail-timer">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {getTimeLeft(contest.registration_deadline)}
                            </div>

                            {(user?.role === 'coordinator' || user?.role === 'mentor') && (
                                <div className="text-stone-500 font-medium text-sm">
                                    {contest.registration_count || 0} registered
                                </div>
                            )}
                        </div>

                        {user?.role === 'student' && isRegistrationOpen() && !myRegistration && !myTeam && (
                            <div className="flex gap-3">
                                {contest.is_team_based ? (
                                    <button
                                        onClick={() => setShowTeamForm(true)}
                                        className="btn-primary px-6 py-2.5"
                                    >
                                        Create Team
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRegisterClick}
                                        disabled={registering}
                                        className="btn-primary px-6 py-2.5"
                                    >
                                        {registering ? 'Registering...' : 'Register Now'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Description - Moved below header content but inside card */}
                {contest.description && (
                    <div className="pt-6 border-t border-stone-200">
                        <h3 className="text-lg font-bold text-stone-900 mb-2">About the Contest</h3>
                        <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{contest.description}</p>
                    </div>
                )}

                {/* External Links */}
                {(contest.external_reg_link || contest.submission_link) && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {contest.external_reg_link && (
                            <a
                                href={contest.external_reg_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 rounded-xl bg-teal-50 border border-teal-200 hover:bg-teal-50 flex items-center gap-3 transition-colors group"
                            >
                                <span className="text-2xl">📝</span>
                                <div>
                                    <p className="text-xs text-teal-700 uppercase tracking-wide font-medium">Registration Link</p>
                                    <p className="text-stone-900 group-hover:text-teal-700 font-medium truncate">Click to Register External</p>
                                </div>
                            </a>
                        )}
                        {contest.submission_link && (
                            <a
                                href={contest.submission_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-50 flex items-center gap-3 transition-colors group"
                            >
                                <span className="text-2xl">📤</span>
                                <div>
                                    <p className="text-xs text-emerald-700 uppercase tracking-wide font-medium">Submission Link</p>
                                    <p className="text-stone-900 group-hover:text-emerald-700 font-medium truncate">Click to Submit Project</p>
                                </div>
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Chat Link - Right after contest details */}
            {(myRegistration || myTeam || user?.role !== 'student') && (
                <div className="mt-6 mb-6">
                    <Link
                        to={`/contests/${id}/chat`}
                        className="card p-6 flex items-center justify-between hover:border-teal-300"
                    >
                        <div className="flex items-center">
                            <span className="text-3xl mr-4">💬</span>
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">Contest Chat</h3>
                                <p className="text-sm text-stone-500">Discuss with participants and mentors</p>
                            </div>
                        </div>
                        <span className="text-stone-500">→</span>
                    </Link>
                </div>
            )}

            {/* Registered Students Table */}
            <div className="card p-6 mt-6">
                <h3 className="text-xl font-bold text-stone-900 mb-4">Registered Students ({registrations.length})</h3>
                {loadingRegistrations ? (
                    <p className="text-stone-500">Loading registrations...</p>
                ) : registrations.length === 0 ? (
                    <p className="text-stone-500">No students registered yet.</p>
                ) : (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white">
                                <tr className="border-b border-stone-200">
                                    <th className="text-left p-3 text-stone-500 font-medium">Name</th>
                                    <th className="text-left p-3 text-stone-500 font-medium">Register No</th>
                                    <th className="text-left p-3 text-stone-500 font-medium">Year</th>
                                    <th className="text-left p-3 text-stone-500 font-medium">Department</th>
                                    <th className="text-left p-3 text-stone-500 font-medium">Section</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map((reg) => (
                                    <tr key={reg.registration_id} className="border-b border-stone-100 hover:bg-stone-50">
                                        <td className="p-3 text-stone-900 font-medium">{reg.student_name}</td>
                                        <td className="p-3 text-stone-600">{reg.register_no || '-'}</td>
                                        <td className="p-3 text-stone-600">{reg.year || '-'}</td>
                                        <td className="p-3 text-stone-600">{reg.department || '-'}</td>
                                        <td className="p-3 text-stone-600">{reg.section || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Team Form */}
            {showTeamForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="text-xl font-bold text-stone-900 mb-4">Create Your Team</h3>
                    <form onSubmit={handleCreateTeam} className="flex gap-4">
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Enter team name"
                            className="input flex-1"
                            required
                        />
                        <button type="submit" disabled={registering} className="btn-primary">
                            {registering ? 'Creating...' : 'Create'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowTeamForm(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {/* Teams Section */}
            {Boolean(contest.is_team_based) && contest.teams && contest.teams.length > 0 && (
                <div className="card p-6">
                    <h3 className="text-xl font-bold text-stone-900 mb-4">Teams ({contest.teams.length})</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {contest.teams.map((team) => (
                            <div key={team.team_id} className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-stone-900">{team.team_name}</h4>
                                    <span className="text-sm text-stone-500">
                                        {team.member_count}/{contest.max_team_size}
                                    </span>
                                </div>
                                <p className="text-sm text-stone-500 mb-3">
                                    Leader: {team.leader_name}
                                </p>
                                {user?.role === 'student' &&
                                    isRegistrationOpen() &&
                                    !myTeam &&
                                    team.member_count < contest.max_team_size && (
                                        <button
                                            onClick={() => handleJoinTeam(team.team_id)}
                                            disabled={registering}
                                            className="btn-secondary text-sm py-2 px-4"
                                        >
                                            Join Team
                                        </button>
                                    )}
                            </div>
                        ))}
                    </div>
                </div>
            )}



            {/* Mark as Registered Button - For students who are not yet registered */}
            {user?.role === 'student' && isRegistrationOpen() && !myRegistration && !myTeam && !contest.is_team_based && (
                <div className="mt-6 p-6 card bg-teal-50 border-teal-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-stone-900">Ready to Participate?</h3>
                            <p className="text-stone-500 text-sm">Register now to join this contest</p>
                        </div>
                        <button
                            onClick={handleRegisterClick}
                            disabled={registering}
                            className="btn-primary px-8 py-3 text-base"
                        >
                            {registering ? 'Registering...' : 'Mark as Registered'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContestDetail;
