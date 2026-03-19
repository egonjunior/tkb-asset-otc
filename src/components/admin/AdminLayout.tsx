import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu } from "lucide-react";
import tkbLogo from "@/assets/tkb-logo.png";

interface AdminLayoutProps {
    children: ReactNode;
    /** Extra class applied to the <main> element */
    mainClassName?: string;
}

/**
 * Shared layout wrapper for all admin pages.
 * – Desktop: fixed sidebar on the left, content fills the rest.
 * – Mobile:  sidebar hidden behind a hamburger; slides in as a Sheet overlay.
 */
export function AdminLayout({ children, mainClassName }: AdminLayoutProps) {
    return (
        <SidebarProvider
            defaultOpen={true}
            style={{ "--sidebar-width": "18rem" } as React.CSSProperties}
        >
            {/* Mobile-only sticky top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-black/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center gap-3 px-4">
                <SidebarTrigger className="text-white/50 hover:text-white transition-colors -ml-1">
                    <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <div className="flex items-center gap-2">
                    <img src={tkbLogo} alt="TKB Asset" className="h-6 w-6" />
                    <span className="text-white font-semibold text-sm tracking-tight">TKB Admin</span>
                </div>
            </div>

            {/* Layout: sidebar + main */}
            <div className="flex w-full min-h-screen bg-black text-white">
                <AppSidebar forceAdmin={true} />

                {/* pt-14 on mobile accounts for the fixed top bar height */}
                <main
                    className={[
                        "flex-1 overflow-y-auto overflow-x-hidden",
                        "pt-14 md:pt-0",
                        "px-4 py-5 md:p-8",
                        mainClassName ?? "",
                    ].join(" ")}
                >
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
