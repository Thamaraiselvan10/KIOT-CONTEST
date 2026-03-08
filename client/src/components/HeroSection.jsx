import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HeroSection = ({ contests = [] }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const featuredContests = contests.filter(c => c.featured);

    useEffect(() => {
        if (featuredContests.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % featuredContests.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [featuredContests.length]);

    const formatDateRange = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        const opts = { month: 'short', day: 'numeric' };
        return `${s.toLocaleDateString('en-US', opts)} - ${e.toLocaleDateString('en-US', opts)}`;
    };

    return (
        <section className="hero-section">
            <div className="hero-grid-overlay"></div>
            <div className="hero-content">
                <div className="hero-left">
                    <h1 className="hero-headline">
                        DISCOVER.<span className="hero-highlight">COMPETE</span>.<span className="hero-highlight-alt">CREATE</span>.
                    </h1>
                    <p className="hero-subtitle">
                        Discover amazing opportunities to showcase your talent and gain recognition. Explore hackathons, coding challenges, and innovation competitions.
                    </p>
                </div>
                <div className="hero-right">
                    {featuredContests.length > 0 && (
                        <div className="hero-carousel">
                            <div className="carousel-badge">★ FEATURED</div>
                            <Link to={`/contests/${featuredContests[currentSlide]?.contest_id}`} className="carousel-card">
                                <div className="carousel-image">
                                    <img
                                        src={featuredContests[currentSlide]?.image_url || 'https://images.unsplash.com/photo-1504384308090-c54be3855833?w=600'}
                                        alt={featuredContests[currentSlide]?.title}
                                    />
                                </div>
                                <div className="carousel-info">
                                    <h3>{featuredContests[currentSlide]?.title}</h3>
                                    <p className="carousel-desc">{featuredContests[currentSlide]?.description?.substring(0, 80)}...</p>
                                    <p className="carousel-meta">
                                        {formatDateRange(
                                            featuredContests[currentSlide]?.registration_deadline,
                                            featuredContests[currentSlide]?.submission_deadline
                                        )}
                                        {' • '}
                                        {featuredContests[currentSlide]?.organizer || featuredContests[currentSlide]?.coordinator_name}
                                    </p>
                                </div>
                            </Link>
                            {featuredContests.length > 1 && (
                                <div className="carousel-dots">
                                    {featuredContests.map((_, i) => (
                                        <button
                                            key={i}
                                            className={`dot ${i === currentSlide ? 'active' : ''}`}
                                            onClick={() => setCurrentSlide(i)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
