import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Mic, Square, Play, AlertTriangle, CheckCircle, Clock, Activity, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
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
        refetchInterval: (data) => {
            // Poll every 2s if any item is PROCESSING
            if (data?.some(item => item.status === 'PROCESSING')) return 2000
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
        <div className="min-h-screen p-8 max-w-4xl mx-auto">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                    Intelligent Voicemail
                </h1>
                <p className="text-slate-400">Event-Driven Triage System</p>
            </header>

            {/* Recording Section */}
            <div className="flex justify-center mb-12">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={clsx(
                        "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4",
                        isRecording
                            ? "bg-red-500/20 border-red-500 animate-pulse"
                            : "bg-blue-500/20 border-blue-500 hover:bg-blue-500/30 hover:scale-105"
                    )}
                >
                    {isRecording ? (
                        <Square className="w-8 h-8 text-red-500 fill-current" />
                    ) : (
                        <Mic className="w-10 h-10 text-blue-400" />
                    )}
                    {isRecording && (
                        <span className="absolute -bottom-10 text-red-400 font-mono text-sm animate-pulse">
                            RECORDING...
                        </span>
                    )}
                </button>
            </div>

            {/* List Section */}
            <div className="grid gap-4">
                {isLoading ? (
                    <div className="text-center text-slate-500">Loading voicemails...</div>
                ) : voicemails?.map((vm) => (
                    <VoicemailCard key={vm.id} vm={vm} />
                ))}
                {voicemails?.length === 0 && (
                    <div className="text-center text-slate-600 py-12 glass-panel">
                        No voicemails yet. Record one to test the pipeline.
                    </div>
                )}
            </div>
        </div>
    )
}

function VoicemailCard({ vm }) {
    const isProcessing = vm.status === 'PROCESSING'

    const statusColors = {
        RED: "border-l-red-500 bg-red-950/20",
        YELLOW: "border-l-yellow-500 bg-yellow-950/20",
        GREEN: "border-l-green-500 bg-green-950/20",
    }

    const badgeColors = {
        RED: "bg-red-500/20 text-red-200 border-red-500/50",
        YELLOW: "bg-yellow-500/20 text-yellow-200 border-yellow-500/50",
        GREEN: "bg-green-500/20 text-green-200 border-green-500/50",
    }

    const baseClass = "glass-panel p-6 border-l-4 transition-all hover:translate-x-1"
    const colorClass = isProcessing ? "border-l-slate-500" : (statusColors[vm.urgency] || "border-l-slate-500")

    return (
        <div className={`${baseClass} ${colorClass}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs text-slate-400">
                            {new Date(vm.created_at || Date.now()).toLocaleTimeString()}
                        </span>
                        {isProcessing ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" /> PROCESSING
                            </span>
                        ) : (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${badgeColors[vm.urgency]}`}>
                                {vm.urgency} • {vm.category}
                            </span>
                        )}
                    </div>

                    <p className="text-slate-200 mb-4 font-medium leading-relaxed">
                        {vm.transcript || <span className="text-slate-600 italic">Transcribing audio...</span>}
                    </p>

                    {!isProcessing && (
                        <audio
                            controls
                            className="h-8 w-full max-w-md opacity-70 hover:opacity-100 transition-opacity"
                            src={`http://localhost:9000/voicemails/${vm.file_path}`}
                        />
                    )}
                </div>

                <div className="flex flex-col items-center gap-2">
                    {/* Icon logic based on urgency */}
                    {!isProcessing && vm.urgency === 'RED' && <Activity className="text-red-500 w-6 h-6" />}
                    {!isProcessing && vm.urgency === 'YELLOW' && <AlertTriangle className="text-yellow-500 w-6 h-6" />}
                    {!isProcessing && vm.urgency === 'GREEN' && <CheckCircle className="text-green-500 w-6 h-6" />}
                </div>
            </div>
        </div>
    )
}

export default App
