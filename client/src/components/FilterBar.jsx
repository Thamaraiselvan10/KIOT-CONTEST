import { useState } from 'react';

const FilterBar = ({ contests = [], onFilter, activeFilter = 'all', onSort, sortBy = 'date', searchQuery = '', onSearch }) => {
    const [showSearch, setShowSearch] = useState(false);
    const now = new Date();

    const counts = {
        all: contests.length,
        active: contests.filter(c => new Date(c.registration_deadline) > now).length,
        past: contests.filter(c => new Date(c.submission_deadline) < now).length,
        featured: contests.filter(c => c.featured).length
    };

    return (
        <div className="filter-bar">
            <div className="filter-pills">
                <button
                    className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => onFilter('all')}
                >
                    All Contests <span className="pill-count">{counts.all}</span>
                </button>
                <button
                    className={`filter-pill ${activeFilter === 'active' ? 'active' : ''}`}
                    onClick={() => onFilter('active')}
                >
                    Active <span className="pill-count">{counts.active}</span>
                </button>
                <button
                    className={`filter-pill ${activeFilter === 'past' ? 'active' : ''}`}
                    onClick={() => onFilter('past')}
                >
                    Past Contests <span className="pill-count">{counts.past}</span>
                </button>
            </div>

            <div className="filter-actions">
                <select
                    className="filter-sort-select"
                    value={sortBy}
                    onChange={(e) => onSort(e.target.value)}
                >
                    <option value="date">Start Date</option>
                    <option value="title">Title</option>
                    <option value="participants">Participants</option>
                </select>

                <button className="filter-icon-btn" title="Filter" onClick={() => { }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                </button>

                <button className="filter-icon-btn" title="Search" onClick={() => setShowSearch(!showSearch)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </button>

                <span className="filter-event-count">{counts[activeFilter]} events</span>
            </div>

            {showSearch && (
                <div className="filter-search-bar">
                    <input
                        type="text"
                        placeholder="Search contests..."
                        value={searchQuery}
                        onChange={(e) => onSearch(e.target.value)}
                        autoFocus
                    />
                </div>
            )}
        </div>
    );
};

export default FilterBar;
