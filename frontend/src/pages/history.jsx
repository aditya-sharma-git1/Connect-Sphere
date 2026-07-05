import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // history failed to load; leave the list empty
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    return (
        <div className="min-h-screen bg-ink font-body text-ink_text">
            <nav className="flex items-center gap-4 px-8 py-6 md:px-16">
                <button
                    onClick={() => navigate("/home")}
                    className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:border-signal/50 hover:text-signal transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Home
                </button>
                <h2 className="font-display font-semibold text-xl">Call history</h2>
            </nav>

            <main className="px-8 md:px-16 pb-16 max-w-3xl mx-auto">
                {loading ? (
                    <p className="text-ink_text-muted text-sm">Loading...</p>
                ) : meetings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
                        <p className="text-ink_text-muted">No calls yet — your joined meetings will show up here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {meetings.slice().reverse().map((e, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between rounded-xl bg-ink-raised border border-white/5 px-5 py-4 hover:border-signal/30 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-9 w-9 rounded-full bg-signal/10 border border-signal/25 flex items-center justify-center">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal">
                                            <path d="M15 10l4.5-3v10L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className="font-mono text-sm">{e.meetingCode}</span>
                                </div>
                                <span className="text-sm text-ink_text-muted">{formatDate(e.date)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}