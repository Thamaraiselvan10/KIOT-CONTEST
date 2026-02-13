import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { chatAPI, contestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ContestChat = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [contest, setContest] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const messagesEndRef = useRef(null);
    const pollInterval = useRef(null);

    useEffect(() => {
        loadData();

        // Poll for new messages every 3 seconds
        pollInterval.current = setInterval(() => {
            loadMessages();
        }, 3000);

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Mark chat as seen whenever messages update
    useEffect(() => {
        if (messages.length > 0 && user) {
            const lastMsg = messages[messages.length - 1];
            const seenKey = `chat_seen_${user.id || user.email}`;
            const seen = JSON.parse(localStorage.getItem(seenKey) || '{}');
            seen[id] = lastMsg.message_id;
            localStorage.setItem(seenKey, JSON.stringify(seen));
        }
    }, [messages, id, user]);

    const handleRemoveGroup = () => {
        const dismissedKey = `chat_dismissed_${user.id || user.email}`;
        const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
        if (!dismissed.includes(Number(id))) {
            dismissed.push(Number(id));
            localStorage.setItem(dismissedKey, JSON.stringify(dismissed));
        }
        setShowRemoveConfirm(false);
        navigate('/contests');
    };

    const loadData = async () => {
        try {
            const [contestRes, chatRes] = await Promise.all([
                contestAPI.getOne(id),
                chatAPI.getMessages(id)
            ]);
            setContest(contestRes.data);
            setMessages(chatRes.data.messages || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        try {
            const res = await chatAPI.getMessages(id);
            setMessages(res.data.messages || []);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await chatAPI.sendMessage(id, { message_text: newMessage.trim() });
            setNewMessage('');
            await loadMessages();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'coordinator': return 'text-amber-600';
            case 'mentor': return 'text-emerald-600';
            default: return 'text-teal-600';
        }
    };

    const isMyMessage = (msg) => {
        switch (user.role) {
            case 'student': return msg.sender_student_id === user.student_id;
            case 'mentor': return msg.sender_mentor_id === user.mentor_id;
            case 'coordinator': return msg.sender_coordinator_id === user.coordinator_id;
            default: return false;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-4 h-screen flex flex-col">
            {/* Header */}
            <div className="card p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Link to={`/contests/${id}`} className="mr-4 text-stone-500 hover:text-teal-600">
                            ←
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-stone-900">{contest?.title}</h1>
                            <p className="text-sm text-stone-500">Contest Chat</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-500">{messages.length} messages</span>
                        <button
                            onClick={() => setShowRemoveConfirm(true)}
                            className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all font-medium"
                        >
                            Remove Group
                        </button>
                    </div>
                </div>
            </div>

            {/* Remove Confirmation Modal */}
            {showRemoveConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                    <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '24px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-stone-900">Remove this group?</h3>
                            <p className="text-sm text-stone-500 mt-2">This chat will be removed from your Messages list. You can rejoin by visiting the contest chat again.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowRemoveConfirm(false)}
                                className="px-5 py-2 text-sm font-medium rounded-lg text-stone-600 hover:bg-stone-100 transition-all"
                                style={{ border: '1px solid #e7e5e4' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveGroup}
                                className="px-5 py-2 text-sm font-medium rounded-lg text-white transition-all"
                                style={{ background: '#ef4444' }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="card flex-1 overflow-y-auto p-4 mb-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-stone-500">
                        <div className="text-center">
                            <span className="text-4xl block mb-2">💬</span>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, index) => {
                            const isMine = isMyMessage(msg);
                            const showDate = index === 0 ||
                                formatDate(msg.sent_at) !== formatDate(messages[index - 1].sent_at);

                            return (
                                <div key={msg.message_id}>
                                    {showDate && (
                                        <div className="text-center text-xs text-stone-400 my-4">
                                            {formatDate(msg.sent_at)}
                                        </div>
                                    )}
                                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] ${isMine ? 'order-2' : ''}`}>
                                            {!isMine && (
                                                <p className={`text-xs mb-1 ${getRoleColor(msg.sender_role)}`}>
                                                    {msg.sender_name}
                                                    <span className="text-stone-400 ml-1 capitalize">
                                                        ({msg.sender_role})
                                                    </span>
                                                </p>
                                            )}
                                            <div className={`rounded-2xl px-4 py-2 ${isMine
                                                ? 'bg-teal-600 text-white rounded-br-sm'
                                                : 'bg-stone-100 text-stone-900 rounded-bl-sm'
                                                }`}>
                                                <p className="break-words">{msg.message_text}</p>
                                            </div>
                                            <p className={`text-xs text-stone-400 mt-1 ${isMine ? 'text-right' : ''}`}>
                                                {formatTime(msg.sent_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="card p-4">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="input flex-1"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="btn-primary px-6"
                    >
                        {sending ? '...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ContestChat;
