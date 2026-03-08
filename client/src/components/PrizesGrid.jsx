const trophyIcons = ['🏆', '🥈', '🥉', '🏅'];

const PrizesGrid = ({ prizes = [] }) => {
    if (prizes.length === 0) {
        return (
            <div className="prizes-section">
                <h2>Prizes</h2>
                <p className="empty-state">No prizes have been announced yet.</p>
            </div>
        );
    }

    // Calculate total
    const totalPrizes = prizes.reduce((sum, p) => {
        const amount = p.amount?.replace(/[^\d]/g, '');
        return sum + (parseInt(amount) || 0);
    }, 0);

    return (
        <div className="prizes-section">
            <div className="prizes-header">
                <h2>Prizes</h2>
                {totalPrizes > 0 && (
                    <span className="total-prize-badge">Total Worth ₹ {totalPrizes.toLocaleString('en-IN')}</span>
                )}
            </div>

            <div className="prizes-grid">
                {prizes.map((prize, index) => (
                    <div key={prize.prize_id || index} className="prize-card">
                        <div className="prize-icon">{trophyIcons[index] || '🏅'}</div>
                        <div className="prize-info">
                            <h4 className="prize-title">{prize.title}</h4>
                            {prize.amount && (
                                <span className="prize-amount">{prize.amount}</span>
                            )}
                            {prize.description && (
                                <p className="prize-description">{prize.description}</p>
                            )}
                            <div className="prize-tags">
                                <span className="prize-type-tag">{prize.prize_type || 'Cash Prize'}</span>
                                <span className="prize-winner-tag">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                    {prize.winner_count || 1} Winner{(prize.winner_count || 1) > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrizesGrid;
