const EventHero = ({ contest }) => {
    const formatDateRange = () => {
        if (!contest) return '';
        const s = new Date(contest.registration_deadline);
        const e = new Date(contest.submission_deadline);
        const opts = { month: 'short', day: 'numeric', year: 'numeric' };
        return `${s.toLocaleDateString('en-US', opts)} - ${e.toLocaleDateString('en-US', opts)}`;
    };

    const now = new Date();
    const regDeadline = new Date(contest?.registration_deadline);
    const subDeadline = new Date(contest?.submission_deadline);
    const isOpen = regDeadline > now;
    const isEnded = subDeadline < now;

    if (!contest) return null;

    return (
        <section className="event-hero">
            <div className="event-hero-grid-overlay"></div>
            <div className="event-hero-content">
                <div className="event-hero-left">
                    <div className="event-hero-stats">
                        <span className="stat-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            {contest.views_count || 0} Views
                        </span>
                        <span className="stat-divider">|</span>
                        <span className="stat-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                            {contest.registration_count || 0} Registered
                        </span>
                    </div>

                    <h1 className="event-hero-title">{contest.title}</h1>
                    <p className="event-hero-subtitle">{contest.description?.substring(0, 120)}</p>

                    <div className="event-hero-chips">
                        <div className="info-chip">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            <div>
                                <span className="chip-label">Event Duration</span>
                                <span className="chip-value">{formatDateRange()}</span>
                            </div>
                        </div>
                        <div className="info-chip">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                            <div>
                                <span className="chip-label">Participation</span>
                                <span className="chip-value">{contest.participation_type || (contest.is_team_based ? 'Team' : 'Individual')}</span>
                            </div>
                        </div>
                        <div className="info-chip">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                            <div>
                                <span className="chip-label">Organized by</span>
                                <span className="chip-value">{contest.organizer || contest.coordinator_name || 'KIOT'}</span>
                            </div>
                        </div>
                        <div className="info-chip">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                            <div>
                                <span className="chip-label">Mode</span>
                                <span className="chip-value">{contest.mode || 'Offline'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="event-hero-actions">
                        {isEnded ? (
                            <button className="btn-register disabled" disabled>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                Event Ended
                            </button>
                        ) : isOpen ? (
                            <button className="btn-register" onClick={() => { }}>
                                Register Now
                            </button>
                        ) : (
                            <button className="btn-register disabled" disabled>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                Registration Closed
                            </button>
                        )}
                        <button className="btn-share" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                            Share
                        </button>
                    </div>
                </div>

                <div className="event-hero-right">
                    <div className="event-poster-card">
                        <img
                            src={contest.image_url || 'https://images.unsplash.com/photo-1504384308090-c54be3855833?w=600'}
                            alt={contest.title}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EventHero;
