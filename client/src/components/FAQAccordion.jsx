import { useState } from 'react';

const FAQAccordion = ({ faqs = [] }) => {
    const [openIndex, setOpenIndex] = useState(null);

    if (faqs.length === 0) {
        return (
            <div className="faq-section">
                <h2>Frequently Asked Questions</h2>
                <p className="empty-state">No FAQs have been added yet.</p>
            </div>
        );
    }

    return (
        <div className="faq-section">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
                {faqs.map((faq, index) => (
                    <div
                        key={faq.faq_id || index}
                        className={`faq-item ${openIndex === index ? 'open' : ''}`}
                    >
                        <button
                            className="faq-question"
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        >
                            <span className="faq-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            </span>
                            <span className="faq-text">{faq.question}</span>
                            <span className="faq-chevron">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            </span>
                        </button>
                        <div className="faq-answer">
                            <p>{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQAccordion;
