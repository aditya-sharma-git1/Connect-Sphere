import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import io from "socket.io-client";
import axios from 'axios';
import { Room, RoomEvent, Track } from 'livekit-client';
import server, { livekitUrl } from '../environment';

const server_url = server;

// --- Small inline icon set (dropped MUI here — keeps this page's bundle
// light and lets icons pick up the app's own color tokens directly). ---
const Icon = {
    Mic: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" /></svg>,
    MicOff: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M1 1l22 22" strokeLinecap="round" /><path d="M9 9v3a3 3 0 004.6 2.55M15 9.34V4a3 3 0 00-5.94-.6" strokeLinecap="round" /><path d="M17 16.95A7 7 0 015 12v-2M19 10v2a7 7 0 01-.11 1.23M12 19v4M8 23h8" strokeLinecap="round" /></svg>,
    Video: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M23 7l-7 5 7 5V7z" strokeLinejoin="round" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>,
    VideoOff: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M1 1l22 22" strokeLinecap="round" /><path d="M16 16v2a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h1M9 6h5a2 2 0 012 2v5m0 0l7 5V7l-7 5z" strokeLinejoin="round" /></svg>,
    Screen: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" strokeLinecap="round" /></svg>,
    ScreenOff: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M1 1l22 22" strokeLinecap="round" /><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" strokeLinecap="round" /></svg>,
    Chat: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinejoin="round" /></svg>,
    End: (p) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M10.68 13.31a16 16 0 003.41 2.6l1-1a1 1 0 011.14-.2 12.35 12.35 0 003.87.62 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.68a1 1 0 011 1 12.35 12.35 0 00.61 3.87 1 1 0 01-.25 1l-1.36 1.44z" strokeLinejoin="round" /><path d="M1 1l22 22" strokeLinecap="round" /></svg>,
    Users: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    Smile: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    Record: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}><circle cx="12" cy="12" r="8" /></svg>,
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '👏', '🎉', '😮'];

export default function VideoMeetComponent() {
    // `:url` route param doubles as both the socket.io chat room name and
    // the LiveKit room name, so chat and video stay scoped to the same call.
    const { url: meetingCode } = useParams();

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    // Holds the live LiveKit Room instance across renders.
    const roomRef = useRef(null);
    // participantIdentity -> { videoEl, audioEl, screenEl } so we can
    // .attach()/.detach() tracks onto the actual DOM nodes as React
    // re-renders the tile list.
    const tileRefs = useRef({});

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState();
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState(true);
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");
    let [connecting, setConnecting] = useState(false);

    // One entry per REMOTE participant: { identity, videoTrack, audioTrack,
    // screenTrack, audioMuted, videoMuted }. Local user is rendered
    // separately (localVideoref).
    let [videos, setVideos] = useState([])
    // Identities LiveKit currently considers "speaking" — drives the
    // active-speaker ring on tiles.
    let [activeSpeakerIds, setActiveSpeakerIds] = useState([]);
    let [showParticipants, setShowParticipants] = useState(false);
    // Floating reaction emojis currently animating: { id, emoji }
    let [reactions, setReactions] = useState([]);
    let [isRecording, setIsRecording] = useState(false);
    let [recordingLoading, setRecordingLoading] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        getPermissions();
        return () => {
            if (roomRef.current) {
                roomRef.current.disconnect();
                roomRef.current = null;
            }
        }
    }, []);

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                videoPermission.getTracks().forEach(t => t.stop());
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                audioPermission.getTracks().forEach(t => t.stop());
            } else {
                setAudioAvailable(false);
            }

            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
        } catch (error) {
            console.log(error);
        }
    };

    const videoRef = useRef([]);

    const upsertParticipantTrack = (identity, kind, track) => {
        setVideos(videos => {
            const idx = videos.findIndex(v => v.identity === identity);
            let updated;
            if (idx === -1) {
                updated = [...videos, { identity, [kind]: track }];
            } else {
                updated = videos.map((v, i) => i === idx ? { ...v, [kind]: track } : v);
            }
            videoRef.current = updated;
            return updated;
        });
    };

    const removeParticipantTrack = (identity, kind) => {
        setVideos(videos => {
            const updated = videos.map(v => v.identity === identity ? { ...v, [kind]: null } : v);
            videoRef.current = updated;
            return updated;
        });
    };

    const setParticipantMuteState = (identity, kind, muted) => {
        const field = kind === Track.Kind.Audio ? 'audioMuted' : 'videoMuted';
        setVideos(videos => {
            const updated = videos.map(v => v.identity === identity ? { ...v, [field]: muted } : v);
            videoRef.current = updated;
            return updated;
        });
    };

    const removeParticipant = (identity) => {
        delete tileRefs.current[identity];
        setVideos(videos => {
            const updated = videos.filter(v => v.identity !== identity);
            videoRef.current = updated;
            return updated;
        });
    };

    const syncTileMedia = (identity) => {
        const entry = videoRef.current.find(v => v.identity === identity);
        const refs = tileRefs.current[identity];
        if (!entry || !refs) return;
        if (entry.videoTrack && refs.videoEl) entry.videoTrack.attach(refs.videoEl);
        if (entry.audioTrack && refs.audioEl) entry.audioTrack.attach(refs.audioEl);
        if (entry.screenTrack && refs.screenEl) entry.screenTrack.attach(refs.screenEl);
    };

    let connectToChatSocket = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', meetingCode)
            socketIdRef.current = socketRef.current.id
            socketRef.current.on('chat-message', addMessage)
        })
    }

    // Fetches a LiveKit token from our backend, connects to the room, wires
    // up track subscription events, then publishes our own camera/mic.
    const connectToLiveKit = async () => {
        try {
            const { data } = await axios.post(`${server_url}/api/v1/users/get_livekit_token`, {
                room: meetingCode,
                identity: `${username}-${Math.random().toString(36).slice(2, 8)}`,
            })

            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
            })
            roomRef.current = room

            room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                const kind = publication.source === Track.Source.ScreenShare ? 'screenTrack'
                    : track.kind === Track.Kind.Video ? 'videoTrack'
                    : 'audioTrack'
                upsertParticipantTrack(participant.identity, kind, track)
                setTimeout(() => syncTileMedia(participant.identity), 0)
            })

            room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                track.detach()
                const kind = publication.source === Track.Source.ScreenShare ? 'screenTrack'
                    : track.kind === Track.Kind.Video ? 'videoTrack'
                    : 'audioTrack'
                removeParticipantTrack(participant.identity, kind)
            })

            room.on(RoomEvent.TrackMuted, (publication, participant) => {
                setParticipantMuteState(participant.identity, publication.kind, true)
            })
            room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
                setParticipantMuteState(participant.identity, publication.kind, false)
            })

            room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                setActiveSpeakerIds(speakers.map(p => p.identity))
            })

            room.on(RoomEvent.DataReceived, (payload) => {
                try {
                    const msg = JSON.parse(new TextDecoder().decode(payload))
                    if (msg.type === 'reaction') {
                        showReaction(msg.emoji)
                    }
                } catch (e) { }
            })

            room.on(RoomEvent.ParticipantDisconnected, (participant) => {
                removeParticipant(participant.identity)
            })

            await room.connect(livekitUrl, data.token)

            await room.localParticipant.setCameraEnabled(!!videoAvailable)
            await room.localParticipant.setMicrophoneEnabled(!!audioAvailable)
            setVideo(!!videoAvailable)
            setAudio(!!audioAvailable)

            const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera)
            if (camPub && camPub.videoTrack && localVideoref.current) {
                camPub.videoTrack.attach(localVideoref.current)
            }
        } catch (e) {
            console.log('Failed to connect to LiveKit:', e)
        } finally {
            setConnecting(false)
        }
    }

    let connect = () => {
        setAskForUsername(false);
        setConnecting(true);
        connectToChatSocket();
        connectToLiveKit();
    }

    let handleVideo = async () => {
        const next = !video
        setVideo(next)
        if (roomRef.current) {
            await roomRef.current.localParticipant.setCameraEnabled(next)
            const camPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)
            if (next && camPub && camPub.videoTrack && localVideoref.current) {
                camPub.videoTrack.attach(localVideoref.current)
            }
        }
    }

    let handleAudio = async () => {
        const next = !audio
        setAudio(next)
        if (roomRef.current) {
            await roomRef.current.localParticipant.setMicrophoneEnabled(next)
        }
    }

    let handleScreen = async () => {
        const next = !screen
        setScreen(next)
        if (roomRef.current) {
            try {
                await roomRef.current.localParticipant.setScreenShareEnabled(next)
            } catch (e) {
                console.log(e)
                setScreen(false)
            }
        }
    }

    const showReaction = (emoji) => {
        const id = Math.random().toString(36).slice(2);
        setReactions(prev => [...prev, { id, emoji }]);
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
        }, 2200);
    }

    let sendReaction = (emoji) => {
        showReaction(emoji); // show it locally right away, don't wait on the round trip
        if (roomRef.current) {
            const payload = new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji }))
            roomRef.current.localParticipant.publishData(payload, { reliable: true })
        }
    }

    let toggleRecording = async () => {
        setRecordingLoading(true)
        try {
            if (!isRecording) {
                await axios.post(`${server_url}/api/v1/livekit/start_recording`, { room: meetingCode })
                setIsRecording(true)
            } else {
                await axios.post(`${server_url}/api/v1/livekit/stop_recording`, { room: meetingCode })
                setIsRecording(false)
            }
        } catch (e) {
            console.log('Recording toggle failed:', e)
            alert('Recording is not set up on the server yet — see PHASE4_FEATURES.md for the storage bucket setup required.')
        } finally {
            setRecordingLoading(false)
        }
    }

    let handleEndCall = () => {
        try {
            if (roomRef.current) {
                roomRef.current.disconnect()
                roomRef.current = null
            }
            if (socketRef.current) socketRef.current.disconnect()
        } catch (e) { }
        window.location.href = "/"
    }

    let handleMessage = (e) => setMessage(e.target.value);

    const addMessage = (data, sender, socketIdSender, date) => {
        setMessages((prevMessages) => [...prevMessages, { sender, data, date: date || new Date() }]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    let sendMessage = () => {
        if (!message.trim()) return;
        socketRef.current.emit('chat-message', message, username)
        setMessage("");
    }

    const formatTime = (d) => {
        const date = new Date(d);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const gridColsClass = (count) => {
        if (count <= 1) return "grid-cols-1";
        if (count <= 2) return "grid-cols-1 md:grid-cols-2";
        if (count <= 4) return "grid-cols-2";
        if (count <= 6) return "grid-cols-2 md:grid-cols-3";
        return "grid-cols-2 md:grid-cols-4";
    }

    const ctrlBtnClass = (active, danger) =>
        `flex items-center justify-center h-12 w-12 rounded-full transition-colors ${danger
            ? "bg-danger hover:bg-danger/80 text-white"
            : active
                ? "bg-ink-higher hover:bg-white/10 text-ink_text"
                : "bg-white/10 hover:bg-white/20 text-ink_text-muted"
        }`;

    if (askForUsername) {
        return (
            <div className="min-h-screen bg-ink flex items-center justify-center px-6 font-body text-ink_text">
                <div className="w-full max-w-sm text-center">
                    <div className="relative mx-auto mb-8 h-56 w-56 rounded-2xl bg-ink-raised border border-white/10 overflow-hidden flex items-center justify-center">
                        <video ref={localVideoref} autoPlay muted className="h-full w-full object-cover" />
                        {!videoAvailable && (
                            <Icon.VideoOff className="absolute text-ink_text-muted" />
                        )}
                    </div>

                    <h2 className="font-display font-semibold text-xl mb-1">Ready to join?</h2>
                    <p className="text-ink_text-muted text-sm mb-6">Enter a name so others recognize you</p>

                    <input
                        className="w-full rounded-xl bg-ink-raised border border-white/10 px-4 py-3 text-sm text-center mb-4 focus:outline-none focus:ring-2 focus:ring-signal/60 focus:border-signal/60 transition-all"
                        placeholder="Your name"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && username.trim() && connect()}
                        autoFocus
                    />

                    <button
                        onClick={connect}
                        disabled={!username.trim()}
                        className="w-full rounded-xl bg-signal py-3 font-medium text-ink hover:bg-signal-dim transition-colors disabled:opacity-40"
                    >
                        Join meeting
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen bg-ink font-body text-ink_text overflow-hidden">
            {connecting && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/80">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-2 border-signal/30 border-t-signal animate-spin" />
                        <p className="text-sm text-ink_text-muted">Connecting...</p>
                    </div>
                </div>
            )}

            <div className="p-4 md:p-6 pb-28 h-screen overflow-y-auto">
                <div className={`grid gap-3 ${gridColsClass(videos.length + 1)}`}>
                    {/* Local tile */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-ink-raised border border-white/5">
                        <video ref={localVideoref} autoPlay muted className="h-full w-full object-cover -scale-x-100" />
                        {!video && (
                            <div className="absolute inset-0 flex items-center justify-center bg-ink-raised">
                                <Icon.VideoOff className="text-ink_text-muted" />
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-ink/70 backdrop-blur px-2.5 py-1 text-xs">
                            <span>You</span>
                            {!audio && <Icon.MicOff className="text-danger" width="13" height="13" />}
                        </div>
                    </div>

                    {/* Remote tiles */}
                    {videos.map((v) => {
                        const isSpeaking = activeSpeakerIds.includes(v.identity) && !v.audioMuted;
                        return (
                            <div key={v.identity}>
                                <div className={`relative aspect-video rounded-2xl overflow-hidden bg-ink-raised border transition-all ${isSpeaking ? "border-live shadow-[0_0_0_3px_rgba(53,217,180,0.25)]" : "border-white/5"}`}>
                                    <video
                                        ref={ref => {
                                            if (!tileRefs.current[v.identity]) tileRefs.current[v.identity] = {}
                                            tileRefs.current[v.identity].videoEl = ref
                                            if (ref && v.videoTrack) v.videoTrack.attach(ref)
                                        }}
                                        autoPlay
                                        className="h-full w-full object-cover"
                                    />
                                    <audio
                                        ref={ref => {
                                            if (!tileRefs.current[v.identity]) tileRefs.current[v.identity] = {}
                                            tileRefs.current[v.identity].audioEl = ref
                                            if (ref && v.audioTrack) v.audioTrack.attach(ref)
                                        }}
                                        autoPlay
                                    ></audio>
                                    {(!v.videoTrack || v.videoMuted) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-ink-raised">
                                            <div className="h-14 w-14 rounded-full bg-signal/15 border border-signal/30 flex items-center justify-center font-display text-signal">
                                                {v.identity.slice(0, 1).toUpperCase()}
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-ink/70 backdrop-blur px-2.5 py-1 text-xs">
                                        <span>{v.identity.split('-')[0]}</span>
                                        {v.audioMuted && <Icon.MicOff className="text-danger" width="13" height="13" />}
                                    </div>
                                </div>

                                {v.screenTrack && (
                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-ink-raised border border-signal/30 mt-3">
                                        <video
                                            ref={ref => {
                                                if (!tileRefs.current[v.identity]) tileRefs.current[v.identity] = {}
                                                tileRefs.current[v.identity].screenEl = ref
                                                if (ref && v.screenTrack) v.screenTrack.attach(ref)
                                            }}
                                            autoPlay
                                            className="h-full w-full object-contain bg-black"
                                        />
                                        <div className="absolute top-2 left-2 rounded-full bg-signal/90 px-2.5 py-1 text-xs text-ink font-medium">
                                            {v.identity.split('-')[0]}'s screen
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Chat panel */}
            {showModal && (
                <div className="fixed top-0 right-0 z-20 h-full w-full max-w-sm bg-ink-raised border-l border-white/10 flex flex-col">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <h3 className="font-display font-semibold">Chat</h3>
                        <button onClick={() => setModal(false)} className="text-ink_text-muted hover:text-ink_text">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        {messages.length === 0 ? (
                            <p className="text-ink_text-muted text-sm text-center mt-8">No messages yet</p>
                        ) : messages.map((item, index) => (
                            <div key={index}>
                                <div className="flex items-baseline gap-2 mb-0.5">
                                    <p className="text-xs font-medium text-signal">{item.sender}</p>
                                    <p className="text-[10px] text-ink_text-muted">{formatTime(item.date)}</p>
                                </div>
                                <p className="text-sm">{item.data}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 p-4 border-t border-white/10">
                        <input
                            value={message}
                            onChange={handleMessage}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message"
                            className="flex-1 rounded-xl bg-ink border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/60"
                        />
                        <button onClick={sendMessage} className="rounded-xl bg-signal px-4 text-ink font-medium hover:bg-signal-dim transition-colors">
                            Send
                        </button>
                    </div>
                </div>
            )}

            {/* Floating reactions overlay */}
            <div className="fixed bottom-24 right-8 z-20 pointer-events-none flex flex-col items-end gap-1">
                {reactions.map(r => (
                    <span key={r.id} className="text-3xl animate-[float_2.2s_ease-out_forwards]" style={{ animation: 'floatUp 2.2s ease-out forwards' }}>
                        {r.emoji}
                    </span>
                ))}
            </div>
            <style>{`@keyframes floatUp { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-120px); opacity: 0; } }`}</style>

            {/* Participants panel */}
            {showParticipants && (
                <div className="fixed top-0 right-0 z-20 h-full w-full max-w-sm bg-ink-raised border-l border-white/10 flex flex-col">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <h3 className="font-display font-semibold">Participants ({videos.length + 1})</h3>
                        <button onClick={() => setShowParticipants(false)} className="text-ink_text-muted hover:text-ink_text">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                        <div className="flex items-center justify-between rounded-xl bg-ink px-4 py-3">
                            <span className="text-sm font-medium">You</span>
                            <div className="flex items-center gap-2 text-ink_text-muted">
                                {!audio && <Icon.MicOff width="15" height="15" className="text-danger" />}
                                {!video && <Icon.VideoOff width="15" height="15" />}
                            </div>
                        </div>
                        {videos.map(v => (
                            <div key={v.identity} className="flex items-center justify-between rounded-xl bg-ink px-4 py-3">
                                <span className="text-sm font-medium">{v.identity.split('-')[0]}</span>
                                <div className="flex items-center gap-2 text-ink_text-muted">
                                    {v.audioMuted && <Icon.MicOff width="15" height="15" className="text-danger" />}
                                    {v.videoMuted && <Icon.VideoOff width="15" height="15" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Control bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-full bg-ink-raised border border-white/10 px-4 py-3 shadow-2xl">
                <button onClick={handleAudio} className={ctrlBtnClass(audio)} title={audio ? "Mute" : "Unmute"}>
                    {audio ? <Icon.Mic /> : <Icon.MicOff className="text-danger" />}
                </button>
                <button onClick={handleVideo} className={ctrlBtnClass(video)} title={video ? "Turn off camera" : "Turn on camera"}>
                    {video ? <Icon.Video /> : <Icon.VideoOff className="text-danger" />}
                </button>
                {screenAvailable && (
                    <button onClick={handleScreen} className={ctrlBtnClass(!screen)} title={screen ? "Stop sharing" : "Share screen"}>
                        {screen ? <Icon.ScreenOff className="text-signal" /> : <Icon.Screen />}
                    </button>
                )}

                <div className="relative group">
                    <button className="flex items-center justify-center h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-ink_text-muted transition-colors" title="React">
                        <Icon.Smile />
                    </button>
                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 hidden group-hover:flex gap-1 rounded-full bg-ink border border-white/10 px-2 py-1.5 shadow-xl">
                        {REACTION_EMOJIS.map(e => (
                            <button key={e} onClick={() => sendReaction(e)} className="text-lg hover:scale-125 transition-transform px-0.5">
                                {e}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={toggleRecording}
                    disabled={recordingLoading}
                    className={`flex items-center justify-center h-12 w-12 rounded-full transition-colors disabled:opacity-50 ${isRecording ? "bg-danger/20 hover:bg-danger/30" : "bg-white/10 hover:bg-white/20 text-ink_text-muted"}`}
                    title={isRecording ? "Stop recording" : "Start recording"}
                >
                    <Icon.Record className={isRecording ? "text-danger animate-pulse" : ""} />
                </button>

                <button
                    onClick={() => { setShowParticipants(!showParticipants); setModal(false); }}
                    className="flex items-center justify-center h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-ink_text-muted transition-colors"
                    title="Participants"
                >
                    <Icon.Users />
                </button>

                <button onClick={() => { setModal(!showModal); setNewMessages(0); setShowParticipants(false); }} className="relative flex items-center justify-center h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-ink_text-muted transition-colors" title="Chat">
                    <Icon.Chat />
                    {newMessages > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-signal text-ink text-[11px] font-semibold flex items-center justify-center">
                            {newMessages > 9 ? "9+" : newMessages}
                        </span>
                    )}
                </button>
                <button onClick={handleEndCall} className={ctrlBtnClass(false, true)} title="Leave call">
                    <Icon.End />
                </button>
            </div>
        </div>
    )
}
