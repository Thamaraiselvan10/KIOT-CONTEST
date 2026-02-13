import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contestAPI, registrationAPI, mentorAPI, chatAPI } from '../services/api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatGroups, setChatGroups] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const menuRef = useRef(null);
    const chatRef = useRef(null);

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
        navigate('/login');
    };

    // Load chat groups based on user role
    useEffect(() => {
        if (!user) return;
        const loadChatGroups = async () => {
            setChatLoading(true);
            try {
                let contests = [];

                // 1. Fetch role-based contests
                if (user.role === 'student') {
                    const res = await registrationAPI.getMy();
                    contests = res.data.map(r => ({
                        contest_id: r.contest_id,
                        title: r.title || `Contest #${r.contest_id}`,
                    }));
                } else if (user.role === 'mentor') {
                    const res = await mentorAPI.getMyContests();
                    contests = res.data.map(c => ({
                        contest_id: c.contest_id,
                        title: c.title,
                    }));
                } else if (user.role === 'coordinator') {
                    const res = await contestAPI.getAll();
                    contests = res.data.map(c => ({
                        contest_id: c.contest_id,
                        title: c.title,
                    }));
                }

                // 2. Fetch contests where user has sent messages (auto-add)
                try {
                    const msgRes = await chatAPI.getMyGroups();
                    const msgGroups = msgRes.data.map(g => ({
                        contest_id: g.contest_id,
                        title: g.title,
                    }));
                    contests = [...contests, ...msgGroups];
                } catch { /* ignore */ }

                // 3. Deduplicate
                const unique = Array.from(new Map(contests.map(c => [c.contest_id, c])).values());

                // 4. Filter out dismissed groups
                const dismissedKey = `chat_dismissed_${user.id || user.email}`;
                const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
                const filtered = unique.filter(c => !dismissed.includes(c.contest_id));

                // 5. Get seen data for unread tracking
                const seenKey = `chat_seen_${user.id || user.email}`;
                const seen = JSON.parse(localStorage.getItem(seenKey) || '{}');

                // 6. Fetch latest message for each group (in parallel)
                const withMessages = await Promise.all(
                    filtered.map(async (group) => {
                        try {
                            const res = await chatAPI.getMessages(group.contest_id, { limit: 1 });
                            const msgs = res.data.messages || [];
                            const last = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                            const lastSeenId = seen[group.contest_id];
                            const hasUnread = last ? last.message_id !== lastSeenId : false;
                            return {
                                ...group,
                                lastMessage: last ? last.message_text : null,
                                lastSender: last ? last.sender_name : null,
                                lastTime: last ? last.sent_at : null,
                                hasMessages: !!last,
                                hasUnread,
                            };
                        } catch {
                            return { ...group, lastMessage: null, lastSender: null, lastTime: null, hasMessages: false, hasUnread: false };
                        }
                    })
                );

                // Sort: unread first, then by latest time
                withMessages.sort((a, b) => {
                    if (a.hasUnread && !b.hasUnread) return -1;
                    if (!a.hasUnread && b.hasUnread) return 1;
                    if (a.hasMessages && !b.hasMessages) return -1;
                    if (!a.hasMessages && b.hasMessages) return 1;
                    if (a.lastTime && b.lastTime) return new Date(b.lastTime) - new Date(a.lastTime);
                    return 0;
                });

                setChatGroups(withMessages);
            } catch (err) {
                console.error('Failed to load chat groups:', err);
            } finally {
                setChatLoading(false);
            }
        };
        loadChatGroups();
    }, [user]);


    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
            if (chatRef.current && !chatRef.current.contains(e.target)) {
                setChatOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close menus on route change
    useEffect(() => {
        setMenuOpen(false);
        setChatOpen(false);
    }, [location.pathname]);

    const formatChatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        const days = Math.floor(diff / 86400);
        if (days === 1) return 'Yesterday';
        if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const getDashboardLink = () => {
        switch (user?.role) {
            case 'coordinator':
                return '/coordinator';
            case 'mentor':
                return '/mentor';
            case 'student':
            default:
                return '/student';
        }
    };

    const navLinks = [
        { path: '/contests', label: 'Contests', all: true },
        { path: '/student/my-contests', label: 'My Contests', roles: ['student'] },
        { path: '/student/profile', label: 'Profile', roles: ['student'] },
        { path: '/coordinator', label: 'Dashboard', roles: ['coordinator'] },
        { path: '/mentor', label: 'Dashboard', roles: ['mentor'] }
    ];

    return (
        <nav className="glass sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to={user ? getDashboardLink() : '/'} className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
                            <span className="text-xl font-bold text-white">K</span>
                        </div>
                        <span className="text-xl font-bold gradient-text">KIOT Contest</span>
                    </Link>

                    {/* Navigation Links */}
                    {user && (
                        <div className="hidden md:flex items-center space-x-1">
                            {navLinks.map((link) => {
                                if (link.all || (link.roles && link.roles.includes(user.role))) {
                                    const isActive = location.pathname === link.path;
                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                                ? 'bg-teal-50 text-teal-700'
                                                : 'text-stone-500 hover:text-teal-600 hover:bg-stone-50'
                                                }`}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    )}

                    {/* User Menu */}
                    <div className="flex items-center space-x-3">
                        {user ? (
                            <>
                                {/* Chat Groups Icon */}
                                <div className="relative" ref={chatRef}>
                                    <button
                                        onClick={() => setChatOpen(!chatOpen)}
                                        className="relative p-2 rounded-lg text-stone-500 hover:text-teal-600 hover:bg-stone-50 transition-all"
                                        title="Chat Groups"
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        {chatGroups.filter(g => g.hasUnread).length > 0 && (
                                            <span style={{ position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', background: '#14b8a6', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, border: '2px solid white' }}>
                                                {chatGroups.filter(g => g.hasUnread).length}
                                            </span>
                                        )}
                                    </button>

                                    {/* Chat Groups Dropdown */}
                                    {chatOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 8px)',
                                            right: '-16px',
                                            width: '340px',
                                            background: '#fff',
                                            borderRadius: '16px',
                                            boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                                            border: '1px solid #e7e5e4',
                                            overflow: 'hidden',
                                            zIndex: 99,
                                            animation: 'navDropIn 0.2s ease-out',
                                        }}>
                                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f4' }}>
                                                <p style={{ fontWeight: 700, color: '#1c1917', fontSize: '15px', margin: 0 }}>Messages</p>
                                                <p style={{ fontSize: '12px', color: '#a8a29e', marginTop: '2px' }}>Your contest discussions</p>
                                            </div>

                                            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                                {chatLoading ? (
                                                    <div style={{ padding: '32px', textAlign: 'center', color: '#a8a29e', fontSize: '14px' }}>Loading...</div>
                                                ) : chatGroups.length === 0 ? (
                                                    <div style={{ padding: '32px', textAlign: 'center' }}>
                                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d6d3d1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px' }}>
                                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                        </svg>
                                                        <p style={{ fontSize: '14px', color: '#a8a29e', margin: 0 }}>No chat groups yet</p>
                                                        <p style={{ fontSize: '12px', color: '#d6d3d1', marginTop: '4px' }}>Register for a contest to join</p>
                                                    </div>
                                                ) : (
                                                    chatGroups.map((group) => (
                                                        <Link
                                                            key={group.contest_id}
                                                            to={`/contests/${group.contest_id}/chat`}
                                                            onClick={() => setChatOpen(false)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px',
                                                                padding: '12px 18px',
                                                                textDecoration: 'none',
                                                                borderBottom: '1px solid #fafaf9',
                                                                transition: 'background 0.15s',
                                                                background: group.hasUnread ? '#f0fdfa' : 'transparent',
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f4'}
                                                            onMouseLeave={e => e.currentTarget.style.background = group.hasUnread ? '#f0fdfa' : 'transparent'}
                                                        >
                                                            {/* Chat icon with unread dot */}
                                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                                <div style={{
                                                                    width: '42px', height: '42px', borderRadius: '12px',
                                                                    background: group.hasUnread ? '#ccfbf1' : '#f5f5f4',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                }}>
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={group.hasMessages ? '#0d9488' : '#a8a29e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                                    </svg>
                                                                </div>
                                                                {group.hasUnread && (
                                                                    <span style={{
                                                                        position: 'absolute', bottom: '-1px', right: '-1px',
                                                                        width: '11px', height: '11px', borderRadius: '50%',
                                                                        background: '#22c55e', border: '2px solid #fff',
                                                                    }} />
                                                                )}
                                                            </div>

                                                            {/* Content */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                                                    <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#1c1917', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                        {group.title}
                                                                    </p>
                                                                    {group.lastTime && (
                                                                        <span style={{ fontSize: '11px', color: '#a8a29e', flexShrink: 0 }}>
                                                                            {formatChatTime(group.lastTime)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p style={{
                                                                    fontSize: '12px', color: '#78716c', margin: '2px 0 0',
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                }}>
                                                                    {group.lastMessage
                                                                        ? <><span style={{ fontWeight: 500, color: '#57534e' }}>{group.lastSender}:</span> {group.lastMessage}</>
                                                                        : <span style={{ color: '#a8a29e' }}>No messages yet</span>
                                                                    }
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Profile Dropdown */}
                                <div className="navbar-profile-menu" ref={menuRef}>
                                    <button
                                        className="navbar-avatar-btn"
                                        onClick={() => setMenuOpen(!menuOpen)}
                                    >
                                        <div className="navbar-avatar">
                                            <span>{user.name?.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="navbar-user-info">
                                            <p className="navbar-user-name">{user.name}</p>
                                            <p className="navbar-user-role">{user.role}</p>
                                        </div>
                                        <svg className="navbar-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none' }}>
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>

                                    {menuOpen && (
                                        <div className="navbar-dropdown">
                                            <div className="navbar-dropdown-header">
                                                <p className="navbar-dropdown-name">{user.name}</p>
                                                <p className="navbar-dropdown-email">{user.email}</p>
                                            </div>
                                            <div className="navbar-dropdown-divider" />

                                            {user.role === 'student' && (
                                                <>
                                                    <Link to="/student/my-contests" className="navbar-dropdown-item">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                                        My Teams
                                                    </Link>
                                                    <Link to="/student/profile" className="navbar-dropdown-item">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                        My Profile
                                                    </Link>
                                                </>
                                            )}

                                            <Link to={getDashboardLink()} className="navbar-dropdown-item">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                                                Settings
                                            </Link>
                                            <a href="mailto:support@kiot.edu" className="navbar-dropdown-item">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                Help
                                            </a>
                                            <div className="navbar-dropdown-divider" />
                                            <button className="navbar-dropdown-item danger" onClick={handleLogout}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Link to="/login" className="btn-primary text-sm py-2">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
