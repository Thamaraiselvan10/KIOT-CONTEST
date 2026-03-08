import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contestAPI, registrationAPI, teamAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EventHero from '../components/EventHero';
import TabNavigation from '../components/TabNavigation';
import RegistrationSidebar from '../components/RegistrationSidebar';
import PrizesGrid from '../components/PrizesGrid';
import ScheduleTimeline from '../components/ScheduleTimeline';
import FAQAccordion from '../components/FAQAccordion';

const ContestDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [isRegistered, setIsRegistered] = useState(false);
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        loadContest();
        checkRegistration();
    }, [id]);

    const loadContest = async () => {
        try {
            setLoading(true);
            const res = await contestAPI.getOne(id);
            setContest(res.data);
            if (res.data.teams) setTeams(res.data.teams);
        } catch (err) {
            setError('Failed to load contest details');
        } finally {
            setLoading(false);
        }
    };

    const checkRegistration = async () => {
        try {
            const res = await registrationAPI.getMy();
            const registered = res.data.some(r => r.contest_id === parseInt(id));
            setIsRegistered(registered);
        } catch (err) {
            // Not logged in or error
        }
    };

    const handleRegister = async () => {
        try {
            await registrationAPI.register({ contest_id: parseInt(id) });
            setIsRegistered(true);
            loadContest(); // Refresh count
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="loading-spinner"></div>
                <p>Loading contest details...</p>
            </div>
        );
    }

    if (error && !contest) {
        return (
            <div className="error-page">
                <h2>Error</h2>
                <p>{error}</p>
                <Link to="/contests" className="btn-primary">Back to Contests</Link>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="tab-content-overview">
                        <div className="overview-about">
                            <h3>About</h3>
                            <div className="about-text">
                                {contest.description || 'No description available.'}
                            </div>
                        </div>

                        {contest.prizes?.length > 0 && (
                            <PrizesGrid prizes={contest.prizes} />
                        )}
                    </div>
                );

            case 'themes':
                return (
                    <div className="tab-content-themes">
                        <h3>Problem Statements / Themes</h3>
                        {contest.themes?.length > 0 ? (
                            <div className="themes-list">
                                {contest.themes.map((theme, i) => (
                                    <div key={theme.theme_id || i} className="theme-card">
                                        <div className="theme-number">{i + 1}</div>
                                        <div className="theme-info">
                                            <h4>{theme.title}</h4>
                                            {theme.description && <p>{theme.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-state">No themes have been announced yet.</p>
                        )}
                    </div>
                );

            case 'prizes':
                return <PrizesGrid prizes={contest.prizes} />;

            case 'schedule':
                return <ScheduleTimeline schedule={contest.schedule} />;

            case 'rules':
                return (
                    <div className="tab-content-rules">
                        <div className="rules-card">
                            <h3>Eligibility Criteria</h3>
                            <div className="rules-content">
                                {contest.is_team_based ? (
                                    <ul>
                                        <li>Team-based participation with max {contest.max_team_size} members</li>
                                        <li>All team members must be currently enrolled students</li>
                                        <li>Each participant can only be in one team</li>
                                        <li>Department: {contest.department || 'Open to all departments'}</li>
                                    </ul>
                                ) : (
                                    <ul>
                                        <li>Individual participation only</li>
                                        <li>Must be a currently enrolled student</li>
                                        <li>Department: {contest.department || 'Open to all departments'}</li>
                                    </ul>
                                )}
                            </div>

                            {contest.submission_link && (
                                <div className="rules-submission">
                                    <h4>Submission</h4>
                                    <p>Submit your project via: <a href={contest.submission_link} target="_blank" rel="noopener noreferrer">{contest.submission_link}</a></p>
                                </div>
                            )}

                            {contest.external_reg_link && (
                                <div className="rules-external">
                                    <h4>External Registration</h4>
                                    <p>Additional registration required: <a href={contest.external_reg_link} target="_blank" rel="noopener noreferrer">{contest.external_reg_link}</a></p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'support':
                return (
                    <div className="tab-content-support">
                        <FAQAccordion faqs={contest.faqs} />

                        <div className="support-contact">
                            <h3>Contact Organizer</h3>
                            <div className="contact-card">
                                <div className="contact-info">
                                    <p><strong>{contest.coordinator_name || 'Contest Coordinator'}</strong></p>
                                    {contest.coordinator_email && <p>📧 {contest.coordinator_email}</p>}
                                    {contest.mentor_name && <p>👨‍🏫 Mentor: {contest.mentor_name}</p>}
                                    {contest.mentor_email && <p>📧 {contest.mentor_email}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="event-detail-page">
            <EventHero contest={contest} />

            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="event-detail-body">
                <main className="event-main-content">
                    {renderTabContent()}
                </main>
                <RegistrationSidebar contest={contest} />
            </div>
        </div>
    );
};

export default ContestDetail;
