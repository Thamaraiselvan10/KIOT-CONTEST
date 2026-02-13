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

    useEffect(() => {
        loadContest();
        if (user?.role === 'student') {
            checkRegistration();
        }
        if (user?.role === 'coordinator' || user?.role === 'mentor') {
            loadRegistrations();
        }
    }, [id, user]);

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

            {/* Contest Header */}
            <div className="card p-8 mb-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`badge ${status.class}`}>{status.label}</span>
                            {contest.is_team_based ? (
                                <span className="badge badge-primary">Team Based</span>
                            ) : (
                                <span className="badge bg-stone-100 text-stone-600">Individual</span>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-stone-900">{contest.title}</h1>
                    </div>

                    {user?.role === 'student' && isRegistrationOpen() && !myRegistration && !myTeam && (
                        <div className="flex gap-3">
                            {contest.is_team_based ? (
                                <button
                                    onClick={() => setShowTeamForm(true)}
                                    className="btn-primary"
                                >
                                    Create Team
                                </button>
                            ) : (
                                <button
                                    onClick={handleRegister}
                                    disabled={registering}
                                    className="btn-primary"
                                >
                                    {registering ? 'Registering...' : 'Register Now'}
                                </button>
                            )}
                        </div>
                    )}

                    {(myRegistration || myTeam) && (
                        <div className="badge badge-success text-base px-4 py-2">
                            ✓ Registered
                        </div>
                    )}
                </div>

                {/* Contest Image */}
                {contest.image_url && (
                    <div className="mb-8 rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                        <img
                            src={contest.image_url}
                            alt={contest.title}
                            className="w-full h-auto object-contain max-h-[500px] mx-auto"
                        />
                    </div>
                )}

                {/* Messages */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 mb-4">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 mb-4">
                        {success}
                    </div>
                )}

                {/* Description */}
                {contest.description && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-stone-900 mb-2">About the Contest</h3>
                        <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{contest.description}</p>
                    </div>
                )}

                {/* External Links */}
                {(contest.external_reg_link || contest.submission_link) && (
                    <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {contest.organizer && (
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">🏆</span>
                                <div>
                                    <p className="text-xs text-stone-400 uppercase tracking-wide">Organizer</p>
                                    <p className="text-stone-900 font-medium">{contest.organizer}</p>
                                </div>
                            </div>
                        )}
                        {contest.platform && (
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">🌐</span>
                                <div>
                                    <p className="text-xs text-stone-400 uppercase tracking-wide">Platform</p>
                                    <p className="text-stone-900 font-medium">{contest.platform}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">📍</span>
                            <div>
                                <p className="text-xs text-stone-400 uppercase tracking-wide">Location</p>
                                <p className="text-stone-900 font-medium">{contest.location || 'Online / External'}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🏢</span>
                            <div>
                                <p className="text-xs text-stone-400 uppercase tracking-wide">Department</p>
                                <p className="text-stone-900 font-medium">{contest.department || 'All Departments'}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">👤</span>
                            <div>
                                <p className="text-xs text-stone-400 uppercase tracking-wide">Added By</p>
                                <p className="text-stone-900 font-medium">{contest.coordinator_name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🗓️</span>
                            <div>
                                <p className="text-xs text-stone-400 uppercase tracking-wide">Registration Deadline</p>
                                <p className="text-stone-900 font-medium">{formatDate(contest.registration_deadline)}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">⏰</span>
                            <div>
                                <p className="text-xs text-stone-400 uppercase tracking-wide">Submission Deadline</p>
                                <p className="text-stone-900 font-medium">{formatDate(contest.submission_deadline)}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">👥</span>
                            <div>
                                <p className="text-xs text-stone-400 uppercase tracking-wide">Registrations</p>
                                <p className="text-stone-900 font-medium">{contest.registration_count} participants</p>
                            </div>
                        </div>
                    </div>
                </div>

                {contest.is_team_based && (
                    <div className="mt-6 pt-6 border-t border-stone-200">
                        <p className="text-stone-500">
                            <strong className="text-stone-900">Team Size:</strong> Up to {contest.max_team_size} members
                        </p>
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
            {contest.is_team_based && contest.teams && contest.teams.length > 0 && (
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

            {/* Registered Students Table - For Coordinators/Mentors */}
            {(user?.role === 'coordinator' || user?.role === 'mentor') && (
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
                                        <th className="text-left p-3 text-stone-500 font-medium">Department</th>
                                        <th className="text-left p-3 text-stone-500 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map((reg) => (
                                        <tr key={reg.registration_id} className="border-b border-stone-100 hover:bg-stone-50">
                                            <td className="p-3 text-stone-900">{reg.student_name}</td>
                                            <td className="p-3 text-stone-600">{reg.register_no || 'N/A'}</td>
                                            <td className="p-3 text-stone-600">{reg.department || 'N/A'}</td>
                                            <td className="p-3">
                                                <span className={`badge ${reg.submitted ? 'badge-success' : 'badge-warning'}`}>
                                                    {reg.submitted ? 'Submitted' : 'Registered'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
                            onClick={handleRegister}
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
