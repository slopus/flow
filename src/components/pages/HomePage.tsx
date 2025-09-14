import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Plus, Clock, Star, ArrowRight } from "lucide-react"

export function HomePage() {
    const recentDocuments = [
        { id: "1", title: "Project Roadmap", lastModified: "2 hours ago", icon: FileText },
        { id: "2", title: "Meeting Notes", lastModified: "5 hours ago", icon: FileText },
        { id: "3", title: "Design System", lastModified: "1 day ago", icon: FileText },
        { id: "4", title: "API Documentation", lastModified: "2 days ago", icon: FileText },
    ]

    const quickActions = [
        { title: "New Document", icon: Plus, action: "new-document" },
        { title: "Recent", icon: Clock, action: "recent" },
        { title: "Starred", icon: Star, action: "starred" },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Welcome back!</h1>
                <p className="text-muted-foreground mt-2">
                    Here's what's happening in your workspace today.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {quickActions.map((action) => (
                    <Card key={action.action} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <action.icon className="h-4 w-4" />
                                    <CardTitle className="text-sm font-medium">
                                        {action.title}
                                    </CardTitle>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Documents</CardTitle>
                    <CardDescription>
                        Your recently modified documents
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                            {recentDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <doc.icon className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{doc.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Modified {doc.lastModified}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        Open
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Total Documents</span>
                                <span className="font-medium">24</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Shared with you</span>
                                <span className="font-medium">8</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Starred</span>
                                <span className="font-medium">5</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <p>• Use keyboard shortcuts for faster navigation</p>
                            <p>• Star important documents for quick access</p>
                            <p>• Organize documents in folders for better structure</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}