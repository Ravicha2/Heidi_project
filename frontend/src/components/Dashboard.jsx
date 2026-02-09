import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, Loader2, Search, ArrowUpDown } from 'lucide-react'
import { VoicemailDetail } from './VoicemailDetail'
import clsx from 'clsx'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export function Dashboard() {
    const [selectedVoicemail, setSelectedVoicemail] = useState(null)
    const [sortBy, setSortBy] = useState('time_desc')

    const { data: voicemails, isLoading } = useQuery({
        queryKey: ['voicemails'],
        queryFn: async () => {
            const { data } = await axios.get(`${API_URL}/api/voicemails`)
            return data
        },
        refetchInterval: 5000
    })

    // Auto-select first item if none selected and data loaded
    useEffect(() => {
        if (!selectedVoicemail && voicemails?.length > 0) {
            setSelectedVoicemail(voicemails[0])
        }
    }, [voicemails])

    const urgencyBadge = (urgency) => {
        const styles = {
            RED: "bg-red-100 text-red-700 border-red-200",
            YELLOW: "bg-yellow-100 text-yellow-700 border-yellow-200",
            GREEN: "bg-green-100 text-green-700 border-green-200",
            NEED_VALIDATION: "bg-orange-100 text-orange-700 border-orange-200 animate-pulse",
        }
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${styles[urgency] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                {urgency || "UNKNOWN"}
            </span>
        )
    }

    // Sorting Logic
    const sortedVoicemails = [...(voicemails || [])].sort((a, b) => {
        if (sortBy === 'time_desc') return new Date(b.created_at) - new Date(a.created_at)
        if (sortBy === 'time_asc') return new Date(a.created_at) - new Date(b.created_at)

        if (sortBy.startsWith('priority')) {
            const urgencyOrder = { RED: 0, NEED_VALIDATION: 1, YELLOW: 2, GREEN: 3, null: 4 }
            const uA = urgencyOrder[a.urgency] ?? 4
            const uB = urgencyOrder[b.urgency] ?? 4
            return sortBy === 'priority_desc' ? uA - uB : uB - uA
        }
        return 0
    })

    return (
        <div className="flex flex-col h-full md:h-[calc(100vh-140px)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-brand-plum">Voicemail Log</h2>
                    <p className="text-brand-brown">Manage and triage patient voicemails.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/50" />
                        <input
                            type="text"
                            placeholder="Filter logs..."
                            className="w-full sm:w-64 bg-white/50 border border-brand-brown/20 rounded-full pl-10 pr-4 py-2 text-sm text-brand-plum focus:outline-none focus:border-brand-plum/50 transition-colors placeholder:text-brand-brown/40"
                        />
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full sm:w-auto bg-white/50 border border-brand-brown/20 rounded-lg px-4 py-2 text-sm text-brand-plum focus:outline-none focus:border-brand-plum/50 appearance-none cursor-pointer font-medium"
                    >
                        <option value="time_desc">Newest First</option>
                        <option value="time_asc">Oldest First</option>
                        <option value="priority_desc">Priority (Critical First)</option>
                        <option value="priority_asc">Priority (Safe First)</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 flex-1 min-h-0 relative">
                {/* Left Panel: List */}
                <div className={clsx(
                    "glass-panel overflow-hidden flex flex-col transition-all duration-300",
                    // Mobile: Hide if item selected (detail view active)
                    // Desktop: Always show as col-span-4
                    selectedVoicemail ? "hidden lg:flex lg:col-span-4" : "flex flex-1 lg:col-span-4",
                    // Height adjustments
                    "h-full lg:h-auto"
                )}>
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left border-collapse text-brand-plum">
                            <thead className="sticky top-0 bg-white/95 backdrop-blur z-10 shadow-sm">
                                <tr className="border-b border-brand-brown/10 text-brand-plum text-xs uppercase tracking-wider font-bold">
                                    <th className="p-4">Priority</th>
                                    <th className="p-4">Summary</th>
                                    <th className="p-4 text-right hidden sm:table-cell">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-brown/10">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-brand-brown">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                                            Loading...
                                        </td>
                                    </tr>
                                ) : sortedVoicemails.map((vm) => (
                                    <tr
                                        key={vm.id}
                                        onClick={() => setSelectedVoicemail(vm)}
                                        className={clsx(
                                            "cursor-pointer transition-colors group border-l-4",
                                            selectedVoicemail?.id === vm.id
                                                ? "bg-brand-yellow/20 border-l-brand-plum"
                                                : "hover:bg-brand-brown/5 border-l-transparent"
                                        )}
                                    >
                                        <td className="p-4 align-top">
                                            {vm.urgency ? urgencyBadge(vm.urgency) : <span className="text-brand-brown/40">-</span>}
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="font-medium line-clamp-2 text-sm">
                                                {vm.status === 'FAILED' || (vm.status === 'COMPLETED' && !vm.transcript) ? (
                                                    <span className="text-red-500 font-bold">Extraction Failed</span>
                                                ) : (
                                                    vm.analysis?.summary || <span className="text-brand-brown/60 italic">Processing...</span>
                                                )}
                                            </div>
                                            {vm.status === 'PROCESSING' && (
                                                <div className="flex items-center gap-1 text-xs text-brand-brown mt-1 animate-pulse">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Processing
                                                </div>
                                            )}
                                            {/* Show time here on mobile since column is hidden */}
                                            <div className="sm:hidden text-xs text-brand-brown/60 mt-1 font-mono">
                                                {new Date(vm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top text-right font-mono text-xs opacity-70 whitespace-nowrap hidden sm:table-cell">
                                            {new Date(vm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Panel: Detail */}
                <div className={clsx(
                    // Mobile: Fixed overlay if selected, else hidden
                    selectedVoicemail ? "fixed inset-0 z-50 p-4 bg-white/95 lg:static lg:p-0 lg:bg-transparent lg:block lg:col-span-8" : "hidden lg:block lg:col-span-8",
                    "h-full min-h-0"
                )}>
                    <VoicemailDetail
                        vm={selectedVoicemail}
                        onClose={() => setSelectedVoicemail(null)}
                        className="h-full shadow-2xl lg:shadow-xl"
                    />
                </div>
            </div>
        </div>
    )
}
