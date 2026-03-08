import { Link } from 'react-router-dom';

const ContestCard = ({ contest }) => {
    const now = new Date();
    const regDeadline = new Date(contest.registration_deadline);
    const subDeadline = new Date(contest.submission_deadline);

    const getStatus = () => {
        if (subDeadline < now) return { text: 'Event Ended', className: 'status-ended' };
        if (regDeadline < now) return { text: 'Registration Closed', className: 'status-closed' };
        return { text: 'Open for Registration', className: 'status-open' };
    };

    const status = getStatus();

    const formatDateRange = () => {
        const opts = { month: 'short', day: 'numeric' };
        return `${regDeadline.toLocaleDateString('en-US', opts)} - ${subDeadline.toLocaleDateString('en-US', opts)}`;
    };

    return (
        <Link to={`/contests/${contest.contest_id}`} className="contest-card">
            <div className="card-image-wrapper">
                <img
                    src={contest.image_url || 'https://images.unsplash.com/photo-1504384308090-c54be3855833?w=400'}
                    alt={contest.title}
                    className="card-image"
                    loading="lazy"
                />
                <div className="card-date-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    {formatDateRange()}
                </div>
                {contest.featured ? (
                    <div className="card-featured-badge">
                        <span>★ Featured</span>
                    </div>
                ) : null}
            </div>

            <div className="card-body">
                <h3 className="card-title">{contest.title}</h3>
                <div className="card-meta">
                    <span className="card-meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        {contest.organizer || contest.coordinator_name || 'KIOT'}
                    </span>
                    <span className="card-meta-item">
                        {contest.mode === 'Online' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        )}
                        {contest.mode === 'Online' ? 'Online' : (contest.location || contest.mode || 'On-site')}
                    </span>
                </div>
            </div>

            <div className="card-footer">
                <span className="card-participants">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                    {contest.registration_count || 0} Participants
                </span>
                <span className={`card-status ${status.className}`}>
                    {status.text}
                </span>
            </div>
        </Link>
    );
};

export default ContestCard;
