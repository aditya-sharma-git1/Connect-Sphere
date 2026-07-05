import * as React from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Authentication() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [toast, setToast] = React.useState("");
    const [formState, setFormState] = React.useState(0); // 0 = login, 1 = register
    const [submitting, setSubmitting] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    React.useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(""), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    let handleAuth = async () => {
        setError("");
        setSubmitting(true);
        try {
            if (formState === 0) {
                await handleLogin(username, password);
            } else {
                const result = await handleRegister(name, username, password);
                setUsername("");
                setPassword("");
                setName("");
                setToast(result);
                setFormState(0);
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Something went wrong. Try again.");
        } finally {
            setSubmitting(false);
        }
    }

    const inputClass = "w-full rounded-xl bg-ink border border-white/10 px-4 py-3 text-sm text-ink_text placeholder:text-ink_text-muted focus:outline-none focus:ring-2 focus:ring-signal/60 focus:border-signal/60 transition-all";

    return (
        <div className="min-h-screen bg-ink flex items-center justify-center px-6 font-body relative overflow-hidden">
            <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-signal/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-live/10 blur-3xl" />

            <div className="relative w-full max-w-md">
                <div className="relative mx-auto mb-8 h-16 w-16">
                    <span className="absolute inset-0 rounded-full border border-signal/30" />
                    <span className="absolute inset-2 rounded-full border border-signal/40" />
                    <div className="absolute inset-4 rounded-full bg-signal flex items-center justify-center font-display font-bold text-ink">
                        CS
                    </div>
                </div>

                <h1 className="text-center font-display font-semibold text-2xl mb-1">
                    {formState === 0 ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-center text-ink_text-muted text-sm mb-8">
                    {formState === 0 ? "Log in to jump back into your calls" : "Takes less than a minute"}
                </p>

                <div className="flex mb-6 rounded-full bg-ink-raised p-1 border border-white/5">
                    <button
                        onClick={() => setFormState(0)}
                        className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${formState === 0 ? "bg-signal text-ink" : "text-ink_text-muted hover:text-ink_text"}`}
                    >
                        Log in
                    </button>
                    <button
                        onClick={() => setFormState(1)}
                        className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${formState === 1 ? "bg-signal text-ink" : "text-ink_text-muted hover:text-ink_text"}`}
                    >
                        Sign up
                    </button>
                </div>

                <div className="space-y-4">
                    {formState === 1 && (
                        <input
                            className={inputClass}
                            placeholder="Full name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    )}
                    <input
                        className={inputClass}
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        autoFocus={formState === 0}
                    />
                    <input
                        className={inputClass}
                        placeholder="Password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    />

                    {error && (
                        <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={handleAuth}
                        disabled={submitting}
                        className="w-full rounded-xl bg-signal py-3 font-medium text-ink hover:bg-signal-dim transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Please wait..." : formState === 0 ? "Log in" : "Create account"}
                    </button>
                </div>
            </div>

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ink-higher border border-live/30 px-5 py-2.5 text-sm text-ink_text shadow-lg">
                    {toast}
                </div>
            )}
        </div>
    );
}
