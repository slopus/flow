import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { useState, ReactNode } from "react"
import { HomePage } from "@/components/pages/HomePage"
import { DocumentsPage } from "@/components/pages/DocumentsPage"
import { SettingsPage } from "@/components/pages/SettingsPage"

interface MainLayoutProps {
    children?: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    const [currentPage, setCurrentPage] = useState("home")

    const renderPage = () => {
        switch(currentPage) {
            case "home":
                return <HomePage />;
            case "documents":
            case "document-1":
            case "document-2":
            case "document-3":
                return <DocumentsPage />;
            case "settings":
                return <SettingsPage />;
            default:
                return (
                    <div className="text-muted-foreground">
                        Page not found
                    </div>
                );
        }
    };

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar
                    onPageChange={setCurrentPage}
                    currentPage={currentPage}
                />
                <main className="flex-1 overflow-hidden">
                    <div className="flex h-full flex-col">
                        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
                            <SidebarTrigger />
                            <div className="flex flex-1 items-center justify-between">
                                <h1 className="text-lg font-semibold capitalize">
                                    {currentPage.replace(/-/g, " ")}
                                </h1>
                            </div>
                        </header>
                        <div className="flex-1 overflow-auto p-6">
                            {renderPage()}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}