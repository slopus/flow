import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FileText, Folder, Plus, MoreVertical, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function DocumentsPage() {
    const folders = [
        { id: "1", name: "Work", count: 12 },
        { id: "2", name: "Personal", count: 8 },
        { id: "3", name: "Projects", count: 15 },
    ]

    const documents = [
        { id: "1", title: "Q4 Planning", folder: "Work", date: "Oct 15, 2024", size: "245 KB" },
        { id: "2", title: "Budget Report", folder: "Work", date: "Oct 14, 2024", size: "1.2 MB" },
        { id: "3", title: "Travel Plans", folder: "Personal", date: "Oct 13, 2024", size: "89 KB" },
        { id: "4", title: "Product Roadmap", folder: "Projects", date: "Oct 12, 2024", size: "567 KB" },
        { id: "5", title: "Meeting Notes", folder: "Work", date: "Oct 11, 2024", size: "123 KB" },
    ]

    return (
        <div className="flex h-full gap-6">
            <aside className="w-64 shrink-0">
                <Card className="h-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Folders</CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[calc(100vh-300px)]">
                            <div className="space-y-2">
                                {folders.map((folder) => (
                                    <div
                                        key={folder.id}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Folder className="h-4 w-4" />
                                            <span className="text-sm font-medium">{folder.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {folder.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </aside>

            <div className="flex-1">
                <Card className="h-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>All Documents</CardTitle>
                                <CardDescription>
                                    Browse and manage your documents
                                </CardDescription>
                            </div>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Document
                            </Button>
                        </div>
                        <div className="relative mt-4">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search documents..."
                                className="pl-8"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[calc(100vh-350px)]">
                            <div className="space-y-2">
                                {documents.map((doc, index) => (
                                    <div key={doc.id}>
                                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{doc.title}</p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span>{doc.folder}</span>
                                                        <span>•</span>
                                                        <span>{doc.date}</span>
                                                        <span>•</span>
                                                        <span>{doc.size}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {index < documents.length - 1 && (
                                            <Separator className="my-1" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}