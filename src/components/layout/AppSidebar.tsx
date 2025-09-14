import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Home,
    FileText,
    Settings,
    Plus,
    ChevronRight,
    Search,
    Inbox,
    Calendar,
    Star,
    Trash2,
    User,
    HelpCircle,
} from "lucide-react"
import { useState } from "react"

interface AppSidebarProps {
    onPageChange: (page: string) => void
    currentPage: string
}

export function AppSidebar({ onPageChange, currentPage }: AppSidebarProps) {
    const [documentsOpen, setDocumentsOpen] = useState(true)
    const [workspaceOpen, setWorkspaceOpen] = useState(false)

    const documents = [
        { id: "1", title: "Getting Started", icon: FileText },
        { id: "2", title: "Project Overview", icon: FileText },
        { id: "3", title: "API Documentation", icon: FileText },
    ]

    return (
        <Sidebar>
            <SidebarHeader className="border-b px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="text-sm font-bold">N</span>
                        </div>
                        <span className="font-semibold">Notion Clone</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <ScrollArea className="flex-1">
                    <SidebarGroup>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => onPageChange("search")}
                                    isActive={currentPage === "search"}
                                >
                                    <Search className="h-4 w-4" />
                                    <span>Search</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => onPageChange("home")}
                                    isActive={currentPage === "home"}
                                >
                                    <Home className="h-4 w-4" />
                                    <span>Home</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => onPageChange("inbox")}
                                    isActive={currentPage === "inbox"}
                                >
                                    <Inbox className="h-4 w-4" />
                                    <span>Inbox</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => onPageChange("calendar")}
                                    isActive={currentPage === "calendar"}
                                >
                                    <Calendar className="h-4 w-4" />
                                    <span>Calendar</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>

                    <Separator className="my-2" />

                    <SidebarGroup>
                        <Collapsible
                            open={workspaceOpen}
                            onOpenChange={setWorkspaceOpen}
                        >
                            <SidebarGroupLabel asChild>
                                <CollapsibleTrigger className="group flex w-full items-center gap-2 px-2 py-1.5 text-sm font-medium">
                                    <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                                    Workspace
                                </CollapsibleTrigger>
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                onClick={() => onPageChange("starred")}
                                                isActive={currentPage === "starred"}
                                            >
                                                <Star className="h-4 w-4" />
                                                <span>Starred</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                onClick={() => onPageChange("trash")}
                                                isActive={currentPage === "trash"}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span>Trash</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarGroup>

                    <SidebarGroup>
                        <Collapsible
                            open={documentsOpen}
                            onOpenChange={setDocumentsOpen}
                        >
                            <div className="flex items-center justify-between px-2">
                                <SidebarGroupLabel asChild>
                                    <CollapsibleTrigger className="group flex items-center gap-2 py-1.5 text-sm font-medium">
                                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                                        Documents
                                    </CollapsibleTrigger>
                                </SidebarGroupLabel>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => onPageChange("new-document")}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {documents.map((doc) => (
                                            <SidebarMenuItem key={doc.id}>
                                                <SidebarMenuButton
                                                    onClick={() => onPageChange(`document-${doc.id}`)}
                                                    isActive={currentPage === `document-${doc.id}`}
                                                >
                                                    <doc.icon className="h-4 w-4" />
                                                    <span>{doc.title}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarGroup>
                </ScrollArea>
            </SidebarContent>

            <SidebarFooter className="border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => onPageChange("settings")}
                            isActive={currentPage === "settings"}
                        >
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => onPageChange("help")}
                            isActive={currentPage === "help"}
                        >
                            <HelpCircle className="h-4 w-4" />
                            <span>Help & Support</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <Separator className="my-2" />
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => onPageChange("profile")}
                            isActive={currentPage === "profile"}
                        >
                            <User className="h-4 w-4" />
                            <span>John Doe</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}