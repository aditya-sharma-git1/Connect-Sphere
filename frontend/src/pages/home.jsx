import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    }

    return (
        <div className="min-h-screen bg-ink font-body text-ink_text">
            <nav className="flex items-center justify-between px-8 py-6 md:px-16">
                <h2 className="font-display font-semibold text-xl tracking-tight">
                    Connect<span className="text-signal">Sphere</span>
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate("/history")}
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink_text-muted hover:text-ink_text hover:bg-ink-raised transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 8v4l3 3M3.05 11a9 9 0 1 1 .5 4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3 5v6h6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        History
                    </button>
                    <button
                        onClick={() => { localStorage.removeItem("token"); navigate("/auth") }}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm hover:border-danger/50 hover:text-danger transition-colors"
                    >
                        Log out
                    </button>
                </div>
            </nav>

            <main className="flex flex-col md:flex-row items-center justify-between gap-12 px-8 md:px-16 py-16 max-w-6xl mx-auto">
                <div className="max-w-md">
                    <span className="inline-flex items-center gap-2 rounded-full border border-live/30 bg-live/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-live mb-6">
                        <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
                        Ready to connect
                    </span>

                    <h1 className="font-display font-semibold text-3xl md:text-4xl leading-tight mb-8">
                        Start or join a call in one step
                    </h1>

                    <div className="flex gap-3">
                        <input
                            value={meetingCode}
                            onChange={e => setMeetingCode(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleJoinVideoCall()}
                            placeholder="Enter meeting code"
                            className="flex-1 rounded-xl bg-ink-raised border border-white/10 px-4 py-3 text-sm font-mono placeholder:text-ink_text-muted placeholder:font-body focus:outline-none focus:ring-2 focus:ring-signal/60 focus:border-signal/60 transition-all"
                        />
                        <button
                            onClick={handleJoinVideoCall}
                            className="rounded-xl bg-signal px-6 py-3 font-medium text-ink hover:bg-signal-dim transition-colors whitespace-nowrap"
                        >
                            Join call
                        </button>
                    </div>
                </div>

                <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full border border-signal/15" />
                    <div className="absolute inset-8 rounded-full border border-signal/20" />
                    <div className="absolute inset-16 rounded-full border border-live/20" />
                    <div className="absolute inset-24 rounded-full bg-gradient-to-br from-signal/30 to-live/20 blur-xl" />
                </div>
            </main>
        </div>
    )
}

export default withAuth(HomeComponent)
