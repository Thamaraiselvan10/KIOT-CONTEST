const ScheduleTimeline = ({ schedule = [] }) => {
    if (schedule.length === 0) {
        return (
            <div className="schedule-section">
                <h2>Schedule</h2>
                <p className="empty-state">Schedule has not been announced yet.</p>
            </div>
        );
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return {};
        const d = new Date(dateStr);
        return {
            day: d.getDate(),
            month: d.toLocaleDateString('en-US', { month: 'short' }),
            full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
                ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        };
    };

    return (
        <div className="schedule-section">
            <h2>Schedule</h2>
            <div className="timeline">
                {schedule.map((item, index) => {
                    const startDate = formatDate(item.start_date);
                    return (
                        <div key={item.schedule_id || index} className="timeline-item">
                            <div className="timeline-date-chip">
                                <span className="date-day">{startDate.day}</span>
                                <span className="date-month">{startDate.month}</span>
                            </div>

                            <div className="timeline-connector">
                                <div className="timeline-dot"></div>
                                {index < schedule.length - 1 && <div className="timeline-line"></div>}
                            </div>

                            <div className="timeline-card">
                                <div className="timeline-card-header">
                                    <h4>{item.title}</h4>
                                    {item.round_type && (
                                        <span className="round-badge">{item.round_type}</span>
                                    )}
                                    {item.mode && (
                                        <span className={`mode-badge ${item.mode?.toLowerCase()}`}>
                                            {item.mode === 'Online' ? '🌐' : '📍'} {item.mode}
                                        </span>
                                    )}
                                </div>

                                {item.description && (
                                    <p className="timeline-card-desc">{item.description}</p>
                                )}

                                <div className="timeline-card-dates">
                                    <span className="timeline-date-label">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                        Start {formatDate(item.start_date).full}
                                    </span>
                                    <span className="timeline-date-label">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                        End {formatDate(item.end_date).full}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ScheduleTimeline;
