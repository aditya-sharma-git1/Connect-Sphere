import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

function SignalRings() {
    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="relative w-[560px] h-[560px]">
                <div className="absolute inset-0 rounded-full border border-signal/20" />
                <div className="absolute inset-[60px] rounded-full border border-signal/25" />
                <div className="absolute inset-[120px] rounded-full border border-live/20" />
                <div className="absolute inset-[190px] rounded-full bg-signal/10 blur-2xl" />
                <span className="absolute inset-[190px] rounded-full border-2 border-signal/70 animate-ringPulse" />
            </div>
        </div>
    )
}

export default function LandingPage() {
    const router = useNavigate();

    return (
        <div className="relative min-h-screen bg-ink overflow-hidden font-body">
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 md:px-16">
                <h2 className="font-display font-semibold text-xl tracking-tight">
                    Connect<span className="text-signal">Sphere</span>
                </h2>
                <div className="flex items-center gap-6 text-sm text-ink_text-muted">
                    <button onClick={() => router("/aljk23")} className="hover:text-ink_text transition-colors">
                        Join as guest
                    </button>
                    <button onClick={() => router("/auth")} className="hover:text-ink_text transition-colors">
                        Register
                    </button>
                    <button
                        onClick={() => router("/auth")}
                        className="rounded-full border border-white/15 px-5 py-2 text-ink_text hover:border-signal/60 hover:text-signal transition-colors"
                    >
                        Log in
                    </button>
                </div>
            </nav>

            <SignalRings />

            <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-32 md:pt-36">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-live/30 bg-live/10 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-live">
                    <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
                    Peer-to-peer &middot; No middleman
                </span>

                <h1 className="font-display font-semibold text-4xl md:text-6xl leading-tight max-w-3xl">
                    Distance is just a<br />
                    <span className="text-signal">signal away</span>
                </h1>

                <p className="mt-6 max-w-md text-ink_text-muted text-lg">
                    Clear video calls that reach the people who matter, without the clutter.
                </p>

                <Link
                    to="/auth"
                    className="mt-10 rounded-full bg-signal px-8 py-3.5 font-medium text-ink shadow-lg shadow-signal/20 hover:bg-signal-dim transition-colors"
                >
                    Get started
                </Link>
            </main>
        </div>
    )
}
