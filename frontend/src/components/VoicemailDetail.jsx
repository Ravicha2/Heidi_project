
import { X, Calendar, Stethoscope, AlertTriangle, User, Play, FileText, Monitor, Activity } from 'lucide-react'
import { InlineWidget } from 'react-calendly'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function VoicemailDetail({ vm, onClose, className }) {
    if (!vm) return <div className="p-8 text-center text-brand-brown/60 italic">Select a voicemail to view details</div>

    const analysis = vm.analysis || {}
    const missingInfo = analysis.missing_info || []

    // Helper to highlight text found in transcript
    const highlightText = (text, highlights) => {
        if (!text) return null

        const valuesToHighlight = [
            analysis.symptoms,
            analysis.appointment_time,
            analysis.patient_name,
            analysis.intent,
            analysis.treatment_mode,
            analysis.visit_type,
            analysis.referral_plan ? "referral" : null
        ].filter(Boolean)

        if (valuesToHighlight.length === 0) return text;

        const regex = new RegExp(`(${valuesToHighlight.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
        const parts = text.split(regex);

        return (
            <span>
                {parts.map((part, i) =>
                    valuesToHighlight.some(v => v.toLowerCase() === part.toLowerCase()) ? (
                        <span key={i} className="bg-brand-yellow/50 text-brand-plum px-1 rounded mx-0.5 font-bold border-b border-brand-yellow">
                            {part}
                        </span>
                    ) : (
                        part
                    )
                )}
            </span>
        )
    }

    return (
        <div className={`bg-brand-cream border border-brand-brown/20 shadow-xl rounded-xl p-8 overflow-y-auto h-full text-brand-gray ${className}`}>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-brand-plum mb-2">{analysis.intent || "Unknown Intent"}</h2>
                    <span className="font-mono text-brand-brown/60 text-sm">ID: {vm.id.slice(0, 8)}</span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-brand-brown/10 rounded-full text-brand-brown hover:text-brand-plum transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Urgency Alert */}
            <div className={`p-4 rounded-lg border mb-8 flex items-start gap-4 ${vm.urgency === 'RED' ? 'bg-red-100 border-red-200 text-red-800' :
                vm.urgency === 'NEED_VALIDATION' ? 'bg-orange-100 border-orange-200 text-orange-800' :
                    'bg-white border-brand-brown/10 text-brand-gray'
                }`}>
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <div>
                    <h3 className="font-bold text-lg mb-1">Priority: {vm.urgency}</h3>
                    {missingInfo.length > 0 && (
                        <p className="text-sm opacity-90">
                            Missing Information: <span className="font-mono font-bold">{missingInfo.join(", ")}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Extracted Fields */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Time */}
                <div className="p-4 bg-white/50 rounded-lg border border-brand-brown/10">
                    <div className="flex items-center gap-2 text-brand-brown mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-bold">Time</span>
                    </div>
                    <p className="text-lg font-medium text-brand-plum">
                        {analysis.appointment_time || <span className="text-brand-brown/40 italic">N/A</span>}
                    </p>
                </div>

                {/* Symptoms */}
                <div className="p-4 bg-white/50 rounded-lg border border-brand-brown/10">
                    <div className="flex items-center gap-2 text-brand-brown mb-2">
                        <Stethoscope className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-bold">Symptoms</span>
                    </div>
                    <p className="text-lg font-medium text-brand-plum">
                        {analysis.symptoms || <span className="text-brand-brown/40 italic">N/A</span>}
                    </p>
                </div>

                {/* Patient */}
                <div className="p-4 bg-white/50 rounded-lg border border-brand-brown/10">
                    <div className="flex items-center gap-2 text-brand-brown mb-2">
                        <User className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-bold">Patient</span>
                    </div>
                    <p className="text-lg font-medium text-brand-plum">
                        {analysis.patient_name || <span className="text-brand-brown/40 italic">Not mentioned</span>}
                    </p>
                </div>

                {/* Mode */}
                <div className="p-4 bg-white/50 rounded-lg border border-brand-brown/10">
                    <div className="flex items-center gap-2 text-brand-brown mb-2">
                        <Monitor className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-bold">Mode</span>
                    </div>
                    <p className="text-lg font-medium text-brand-plum">
                        {analysis.treatment_mode || <span className="text-brand-brown/40 italic">N/A</span>}
                    </p>
                </div>

                {/* Visit Type */}
                <div className="p-4 bg-white/50 rounded-lg border border-brand-brown/10">
                    <div className="flex items-center gap-2 text-brand-brown mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-bold">Type</span>
                    </div>
                    <p className="text-lg font-medium text-brand-plum">
                        {analysis.visit_type || <span className="text-brand-brown/40 italic">N/A</span>}
                    </p>
                </div>

                {/* Referral */}
                <div className="p-4 bg-white/50 rounded-lg border border-brand-brown/10">
                    <div className="flex items-center gap-2 text-brand-brown mb-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-bold">Referral</span>
                    </div>
                    <p className="text-lg font-medium text-brand-plum">
                        {analysis.referral_plan ? "Yes, mentioned" : <span className="text-brand-brown/40 italic">No</span>}
                    </p>
                </div>
            </div>

            {/* Audio Player */}
            <div className="mb-8 p-4 bg-white/80 rounded-lg border border-brand-brown/10">
                <span className="text-xs text-brand-brown uppercase font-bold mb-2 block">Original Audio</span>
                <audio
                    controls
                    className="w-full h-8 opacity-80"
                    src={`${API_URL}/api/voicemails/audio/${vm.file_path}`}
                    onClick={e => e.stopPropagation()}
                />
            </div>

            {/* Transcript */}
            <div className="prose prose-slate max-w-none">
                <h3 className="text-brand-brown uppercase text-xs font-bold tracking-wider mb-4 border-b border-brand-brown/10 pb-2">
                    Transcript Analysis
                </h3>
                <p className="text-lg leading-relaxed text-brand-plum bg-white/40 p-6 rounded-lg border border-brand-brown/10">
                    {highlightText(vm.transcript)}
                </p>
            </div>
            {/* Scheduling Section */}
            <div className="mt-8 border-t border-brand-brown/10 pt-8">
                <h3 className="text-brand-brown uppercase text-xs font-bold tracking-wider mb-4">
                    Next Steps
                </h3>

                <div className="h-[650px] bg-white/50 rounded-lg overflow-hidden border border-brand-brown/10">
                    <InlineWidget
                        url={analysis.booking_url || import.meta.env.VITE_CALENDLY_URL || "https://calendly.com"}
                        styles={{ height: '100%' }}
                        prefill={{
                            name: analysis.patient_name,
                            email: "patient@example.com",
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
