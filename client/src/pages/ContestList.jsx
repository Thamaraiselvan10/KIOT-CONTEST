import { useState, useEffect, useMemo } from 'react';
import { contestAPI, registrationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import HeroSection from '../components/HeroSection';
import FilterBar from '../components/FilterBar';
import ContestCard from '../components/ContestCard';

const ContestList = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(8);
    const { user } = useAuth();

    useEffect(() => {
        loadContests();
    }, []);

    const loadContests = async () => {
        try {
            setLoading(true);
            const res = await contestAPI.getAll();
            setContests(res.data);
        } catch (err) {
            setError('Failed to load contests');
        } finally {
            setLoading(false);
        }
    };

    const filteredContests = useMemo(() => {
        const now = new Date();
        let result = [...contests];

        // Filter
        if (activeFilter === 'active') {
            result = result.filter(c => new Date(c.registration_deadline) > now);
        } else if (activeFilter === 'past') {
            result = result.filter(c => new Date(c.submission_deadline) < now);
        } else if (activeFilter === 'featured') {
            result = result.filter(c => c.featured);
        }

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.title.toLowerCase().includes(q) ||
                c.description?.toLowerCase().includes(q) ||
                c.organizer?.toLowerCase().includes(q) ||
                c.department?.toLowerCase().includes(q)
            );
        }

        // Sort
        if (sortBy === 'date') {
            result.sort((a, b) => new Date(b.registration_deadline) - new Date(a.registration_deadline));
        } else if (sortBy === 'title') {
            result.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === 'participants') {
            result.sort((a, b) => (b.registration_count || 0) - (a.registration_count || 0));
        }

        return result;
    }, [contests, activeFilter, sortBy, searchQuery]);

    if (loading) {
        return (
            <div className="page-loading">
                <div className="loading-spinner"></div>
                <p>Loading contests...</p>
            </div>
        );
    }

    return (
        <div className="programs-page">
            <HeroSection contests={contests} />

            <div className="programs-content">
                <FilterBar
                    contests={contests}
                    activeFilter={activeFilter}
                    onFilter={setActiveFilter}
                    sortBy={sortBy}
                    onSort={setSortBy}
                    searchQuery={searchQuery}
                    onSearch={setSearchQuery}
                />

                {error && <div className="error-banner">{error}</div>}

                {filteredContests.length === 0 ? (
                    <div className="empty-state-card">
                        <h3>No contests found</h3>
                        <p>Try adjusting your filters or check back later.</p>
                    </div>
                ) : (
                    <>
                        <div className="contest-grid">
                            {filteredContests.slice(0, visibleCount).map(contest => (
                                <ContestCard key={contest.contest_id} contest={contest} />
                            ))}
                        </div>

                        {visibleCount < filteredContests.length && (
                            <div className="view-more-wrapper">
                                <button
                                    className="view-more-btn"
                                    onClick={() => setVisibleCount(prev => prev + 8)}
                                >
                                    View More
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ContestList;
