import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationAPI, teamAPI, contestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [teams, setTeams] = useState([]);
    const [upcomingContests, setUpcomingContests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [regRes, teamRes, contestRes] = await Promise.all([
                registrationAPI.getMy(),
                teamAPI.getMy(),
                contestAPI.getAll()
            ]);

            setRegistrations(regRes.data);
            setTeams(teamRes.data);

            // Filter upcoming contests
            const now = new Date();
            const upcoming = contestRes.data.filter(
                c => new Date(c.registration_deadline) > now
            ).slice(0, 5);
            setUpcomingContests(upcoming);
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
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back, <span className="gradient-text">{user.name}</span>
                </h1>
                <p className="text-gray-400">
                    {user.department} • Year {user.year} • Section {user.section}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">My Registrations</p>
                            <p className="text-3xl font-bold text-white mt-1">{registrations.length}</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                            <span className="text-2xl">🎯</span>
                        </div>
                    </div>
                </div>
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">My Teams</p>
                            <p className="text-3xl font-bold text-white mt-1">{teams.length}</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                            <span className="text-2xl">👥</span>
                        </div>
                    </div>
                </div>
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Open Contests</p>
                            <p className="text-3xl font-bold text-white mt-1">{upcomingContests.length}</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                            <span className="text-2xl">🏆</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* My Contests */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">My Contests</h2>
                        <Link to="/contests" className="text-indigo-400 hover:text-indigo-300 text-sm">
                            View all →
                        </Link>
                    </div>

                    {registrations.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>You haven't registered for any contests yet.</p>
                            <Link to="/contests" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
                                Browse contests
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {registrations.slice(0, 5).map((reg) => (
                                <Link
                                    key={reg.registration_id}
                                    to={`/contests/${reg.contest_id}`}
                                    className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-white">{reg.title}</h3>
                                            <p className="text-sm text-gray-400">
                                                Deadline: {formatDate(reg.submission_deadline)}
                                            </p>
                                        </div>
                                        <span className={`badge ${reg.is_team_based ? 'badge-primary' : 'bg-white/10 text-gray-300'}`}>
                                            {reg.is_team_based ? 'Team' : 'Solo'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Contests */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Open for Registration</h2>
                    </div>

                    {upcomingContests.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>No open contests at the moment.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingContests.map((contest) => (
                                <Link
                                    key={contest.contest_id}
                                    to={`/contests/${contest.contest_id}`}
                                    className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-white">{contest.title}</h3>
                                            <p className="text-sm text-gray-400">
                                                Closes: {formatDate(contest.registration_deadline)}
                                            </p>
                                        </div>
                                        <span className="badge badge-success">Open</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* My Teams */}
                {teams.length > 0 && (
                    <div className="card p-6 lg:col-span-2">
                        <h2 className="text-xl font-bold text-white mb-4">My Teams</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {teams.map((team) => (
                                <Link
                                    key={team.team_id}
                                    to={`/contests/${team.contest_id}`}
                                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-white">{team.team_name}</h3>
                                        <span className="text-sm text-gray-400">
                                            {team.member_count} members
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">{team.contest_title}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
