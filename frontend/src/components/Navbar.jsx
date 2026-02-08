
import { Link, useLocation } from 'react-router-dom'
import { Mic, LayoutDashboard } from 'lucide-react'
import clsx from 'clsx'

export function Navbar() {
    const location = useLocation()

    const navItemClass = (path) => clsx(
        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium",
        location.pathname === path
            ? "bg-white text-brand-plum border border-brand-brown/20 shadow-sm"
            : "text-brand-brown hover:text-brand-plum hover:bg-brand-brown/10"
    )

    return (
        <nav className="flex items-center justify-between p-4 bg-brand-yellow shadow-md mb-8 rounded-xl">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-brand-plum">
                    Heidi Comms
                </h1>
            </div>
            <div className="flex gap-2">
                <Link to="/" className={navItemClass("/")}>
                    <Mic className="w-4 h-4" />
                    <span className="hidden md:inline">Record</span>
                </Link>
                <Link to="/dashboard" className={navItemClass("/dashboard")}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden md:inline">Dashboard</span>
                </Link>
            </div>
        </nav>
    )
}
