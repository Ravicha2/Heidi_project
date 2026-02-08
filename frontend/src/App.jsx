import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Mic, Square, Play, AlertTriangle, CheckCircle, Clock, Activity, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Dashboard } from './components/Dashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
    return (
        <Router>
            <div className="min-h-screen p-4 md:p-8 max-w-[1600px] mx-auto w-full">
                <Navbar />
                <Routes>
                    <Route path="/" element={<RecordingView />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </div>
        </Router>
    )
}

function RecordingView() {
    const [isRecording, setIsRecording] = useState(false)
    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const queryClient = useQueryClient()

    const { data: voicemails, isLoading } = useQuery({
        queryKey: ['voicemails'],
        queryFn: async () => {
            const { data } = await axios.get(`${API_URL}/api/voicemails`)
            return data
        },
        refetchInterval: (query) => {
            const data = query.state.data
            if (Array.isArray(data) && data.some(item => item.status === 'PROCESSING')) return 2000
            return false
        }
    })

    const uploadMutation = useMutation({
        mutationFn: async (audioBlob) => {
            const formData = new FormData()
            formData.append("file", audioBlob, "voicemail.wav")
            return axios.post(`${API_URL}/api/voicemails`, formData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['voicemails'] })
        }
    })

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            chunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
                uploadMutation.mutate(blob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
        } catch (err) {
            console.error("Error accessing microphone:", err)
            alert("Could not access microphone")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    return (
        <div>
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold text-brand-plum mb-2">
                    Intelligent Voicemail
                </h1>
                <p className="text-brand-brown">Event-Driven Triage System</p>
            </header>

            {/* Recording Section */}
            <div className="flex justify-center mb-12">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={clsx(
                        "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4",
                        isRecording
                            ? "bg-red-100 border-red-500 animate-pulse"
                            : "bg-brand-yellow/20 border-brand-yellow hover:bg-brand-yellow/40 hover:scale-105"
                    )}
                >
                    {isRecording ? (
                        <Square className="w-8 h-8 text-red-500 fill-current" />
                    ) : (
                        <Mic className="w-10 h-10 text-brand-plum" />
                    )}
                    {isRecording && (
                        <span className="absolute -bottom-10 text-red-500 font-mono text-sm animate-pulse font-bold">
                            RECORDING...
                        </span>
                    )}
                </button>
            </div>

            {/* List Section */}
            <div className="grid gap-4">
                {isLoading ? (
                    <div className="text-center text-brand-brown">Loading voicemails...</div>
                ) : voicemails?.map((vm) => (
                    <VoicemailCard key={vm.id} vm={vm} />
                ))}
            </div>
        </div>
    )
}

function VoicemailCard({ vm }) {
    const isProcessing = vm.status === 'PROCESSING'

    const statusColors = {
        RED: "border-l-red-500 bg-white",
        YELLOW: "border-l-yellow-500 bg-white",
        GREEN: "border-l-green-500 bg-white",
        NEED_VALIDATION: "border-l-orange-500 bg-white",
    }

    const badgeColors = {
        RED: "bg-red-100 text-red-700 border-red-200",
        YELLOW: "bg-yellow-100 text-yellow-700 border-yellow-200",
        GREEN: "bg-green-100 text-green-700 border-green-200",
        NEED_VALIDATION: "bg-orange-100 text-orange-700 border-orange-200 animate-pulse",
    }

    const baseClass = "p-6 border-l-4 transition-all hover:translate-x-1 rounded-r-xl shadow-sm border border-brand-brown/10"
    // Use white background for "cream" theme feel (on top of cream body)
    const colorClass = isProcessing ? "border-l-brand-brown/50 bg-white/60" : (statusColors[vm.urgency] || "border-l-brand-brown/50 bg-white")

    return (
        <div className={`${baseClass} ${colorClass}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs text-brand-brown/60">
                            {new Date(vm.created_at || Date.now()).toLocaleTimeString()}
                        </span>
                        {isProcessing ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-brand-brown bg-brand-brown/10 px-2 py-1 rounded-full animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" /> PROCESSING
                            </span>
                        ) : (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${badgeColors[vm.urgency]}`}>
                                {vm.urgency} • {vm.category}
                            </span>
                        )}
                    </div>

                    <p className="text-brand-plum mb-4 font-medium leading-relaxed">
                        {/* We hide the full transcript per user request, only show summary or placeholder */}
                        {vm.analysis?.summary || <span className="text-brand-brown/40 italic">Processing analysis...</span>}
                    </p>

                    {!isProcessing && (
                        <audio
                            controls
                            className="h-8 w-full max-w-md opacity-80 hover:opacity-100 transition-opacity"
                            src={`${API_URL}/api/voicemails/audio/${vm.file_path}`}
                        />
                    )}
                </div>

                <div className="flex flex-col items-center gap-2">
                    {/* Icon logic based on urgency */}
                    {!isProcessing && vm.urgency === 'RED' && <Activity className="text-red-500 w-6 h-6" />}
                    {!isProcessing && vm.urgency === 'YELLOW' && <AlertTriangle className="text-yellow-500 w-6 h-6" />}
                    {!isProcessing && vm.urgency === 'GREEN' && <CheckCircle className="text-green-500 w-6 h-6" />}
                    {!isProcessing && vm.urgency === 'NEED_VALIDATION' && <AlertTriangle className="text-orange-500 w-6 h-6" />}
                </div>
            </div>
        </div>
    )
}

export default App
