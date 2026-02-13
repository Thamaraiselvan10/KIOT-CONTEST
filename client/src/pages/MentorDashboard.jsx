import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mentorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MentorDashboard = () => {
    const { user } = useAuth();
    const [contests, setContests] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [contestRes, teamRes] = await Promise.all([
                mentorAPI.getMyContests(),
                mentorAPI.getMyTeams()
            ]);

            setContests(contestRes.data);
            setTeams(teamRes.data);
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-stone-900 mb-2">
                    Welcome, <span className="gradient-text">{user.name}</span>
                </h1>
                <p className="text-stone-500">{user.department} • Mentor</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-stone-500 text-sm">Assigned Contests</p>
                            <p className="text-3xl font-bold text-stone-900 mt-1">{contests.length}</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
                            <span className="text-2xl">🏆</span>
                        </div>
                    </div>
                </div>
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-stone-500 text-sm">Assigned Teams</p>
                            <p className="text-3xl font-bold text-stone-900 mt-1">{teams.length}</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <span className="text-2xl">👥</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assigned Contests */}
            <div className="card p-6 mb-8">
                <h2 className="text-xl font-bold text-stone-900 mb-4">My Contests</h2>

                {contests.length === 0 ? (
                    <div className="text-center py-8 text-stone-500">
                        <p>No contests assigned to you yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {contests.map((contest) => (
                            <Link
                                key={contest.contest_id}
                                to={`/contests/${contest.contest_id}`}
                                className="p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors"
                            >
                                <h3 className="font-bold text-stone-900 mb-2">{contest.title}</h3>
                                <p className="text-sm text-stone-500">
                                    Deadline: {formatDate(contest.submission_deadline)}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Assigned Teams */}
            <div className="card p-6">
                <h2 className="text-xl font-bold text-stone-900 mb-4">My Teams</h2>

                {teams.length === 0 ? (
                    <div className="text-center py-8 text-stone-500">
                        <p>No teams assigned to you yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {teams.map((team) => (
                            <Link
                                key={team.team_id}
                                to={`/contests/${team.contest_id}`}
                                className="p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-stone-900">{team.team_name}</h3>
                                    <span className="text-sm text-stone-500">{team.member_count} members</span>
                                </div>
                                <p className="text-sm text-stone-500">{team.contest_title}</p>
                                <p className="text-xs text-stone-400 mt-1">Leader: {team.leader_name}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentorDashboard;
