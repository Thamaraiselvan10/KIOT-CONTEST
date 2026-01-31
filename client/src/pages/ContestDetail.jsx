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

    useEffect(() => {
        loadContest();
        if (user?.role === 'student') {
            checkRegistration();
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const status = getStatus();

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Back Button */}
            <Link to="/contests" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
                ← Back to Contests
            </Link>

            {/* Contest Header */}
            <div className="card p-8 mb-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`badge ${status.class}`}>{status.label}</span>
                            {contest.is_team_based ? (
                                <span className="badge badge-primary">Team Based</span>
                            ) : (
                                <span className="badge bg-white/10 text-gray-300">Individual</span>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-white">{contest.title}</h1>
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
                    <div className="mb-8 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                        <img
                            src={contest.image_url}
                            alt={contest.title}
                            className="w-full h-auto object-contain max-h-[500px] mx-auto"
                        />
                    </div>
                )}

                {/* Messages */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 mb-4">
                        {success}
                    </div>
                )}

                {/* Description */}
                {contest.description && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white mb-2">About the Contest</h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{contest.description}</p>
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
                                className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 flex items-center gap-3 transition-colors group"
                            >
                                <span className="text-2xl">📝</span>
                                <div>
                                    <p className="text-xs text-indigo-300 uppercase tracking-wide font-medium">Registration Link</p>
                                    <p className="text-white group-hover:text-indigo-300 font-medium truncate">Click to Register External</p>
                                </div>
                            </a>
                        )}
                        {contest.submission_link && (
                            <a
                                href={contest.submission_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 flex items-center gap-3 transition-colors group"
                            >
                                <span className="text-2xl">📤</span>
                                <div>
                                    <p className="text-xs text-green-300 uppercase tracking-wide font-medium">Submission Link</p>
                                    <p className="text-white group-hover:text-green-300 font-medium truncate">Click to Submit Project</p>
                                </div>
                            </a>
                        )}
                    </div>
                )}

                {/* Contest Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">📍</span>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                                <p className="text-white font-medium">{contest.location || 'To be announced'}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🏢</span>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
                                <p className="text-white font-medium">{contest.department || 'All Departments'}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">👤</span>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Coordinator</p>
                                <p className="text-white font-medium">{contest.coordinator_name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🗓️</span>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Registration Deadline</p>
                                <p className="text-white font-medium">{formatDate(contest.registration_deadline)}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">⏰</span>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Submission Deadline</p>
                                <p className="text-white font-medium">{formatDate(contest.submission_deadline)}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">👥</span>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Registrations</p>
                                <p className="text-white font-medium">{contest.registration_count} participants</p>
                            </div>
                        </div>
                    </div>
                </div>

                {contest.is_team_based && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-gray-400">
                            <strong className="text-white">Team Size:</strong> Up to {contest.max_team_size} members
                        </p>
                    </div>
                )}
            </div>

            {/* Create Team Form */}
            {showTeamForm && (
                <div className="card p-6 mb-6 animate-fade-in">
                    <h3 className="text-xl font-bold text-white mb-4">Create Your Team</h3>
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
                    <h3 className="text-xl font-bold text-white mb-4">Teams ({contest.teams.length})</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {contest.teams.map((team) => (
                            <div key={team.team_id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-white">{team.team_name}</h4>
                                    <span className="text-sm text-gray-400">
                                        {team.member_count}/{contest.max_team_size}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 mb-3">
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

            {/* Chat Link */}
            {(myRegistration || myTeam || user?.role !== 'student') && (
                <div className="mt-6">
                    <Link
                        to={`/contests/${id}/chat`}
                        className="card p-6 flex items-center justify-between hover:border-indigo-500/50"
                    >
                        <div className="flex items-center">
                            <span className="text-3xl mr-4">💬</span>
                            <div>
                                <h3 className="text-lg font-bold text-white">Contest Chat</h3>
                                <p className="text-sm text-gray-400">Discuss with participants and mentors</p>
                            </div>
                        </div>
                        <span className="text-gray-400">→</span>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ContestDetail;
