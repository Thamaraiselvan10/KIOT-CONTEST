const RegistrationSidebar = ({ contest }) => {
    if (!contest) return null;

    const now = new Date();
    const regDeadline = new Date(contest.registration_deadline);
    const subDeadline = new Date(contest.submission_deadline);
    const isOpen = regDeadline > now;
    const isEnded = subDeadline < now;

    const formatDeadline = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    // Calculate total prizes
    const totalPrizes = contest.prizes?.reduce((sum, p) => {
        const amount = p.amount?.replace(/[^\d]/g, '');
        return sum + (parseInt(amount) || 0);
    }, 0);

    const formatAmount = (num) => {
        if (!num) return '-';
        return '₹ ' + num.toLocaleString('en-IN');
    };

    return (
        <aside className="registration-sidebar">
            <div className="sidebar-card">
                <h3 className="sidebar-title">Registration Info</h3>

                <div className="sidebar-info-rows">
                    <div className="sidebar-row">
                        <span className="sidebar-label">Deadline</span>
                        <span className="sidebar-value">{formatDeadline(contest.registration_deadline)}</span>
                    </div>
                    <div className="sidebar-row">
                        <span className="sidebar-label">Mode</span>
                        <span className="sidebar-value">{contest.mode || 'Offline'}</span>
                    </div>
                    <div className="sidebar-row">
                        <span className="sidebar-label">Participation</span>
                        <span className="sidebar-value">{contest.participation_type || (contest.is_team_based ? 'Team' : 'Individual')}</span>
                    </div>
                    <div className="sidebar-row">
                        <span className="sidebar-label">Industry</span>
                        <span className="sidebar-value">{contest.industry || 'Technology'}</span>
                    </div>
                    <div className="sidebar-row">
                        <span className="sidebar-label">Total Themes</span>
                        <span className="sidebar-value accent">{contest.themes?.length || 0} theme{(contest.themes?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="sidebar-row">
                        <span className="sidebar-label">Total Prizes</span>
                        <span className="sidebar-value prize-highlight">{formatAmount(totalPrizes)}</span>
                    </div>
                </div>

                {isEnded ? (
                    <button className="sidebar-cta disabled" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        Event Ended
                    </button>
                ) : isOpen ? (
                    <button className="sidebar-cta">Register Now</button>
                ) : (
                    <button className="sidebar-cta disabled" disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        Registration Closed
                    </button>
                )}
            </div>
        </aside>
    );
};

export default RegistrationSidebar;
