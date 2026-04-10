import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MoreHorizontal, Plus, Send } from "lucide-react";

export default function Page() {
    return (
        // Route: app/coach/page.tsx

        <div className="flex h-[calc(100vh-56px)]">
            {/* Conversation Sidebar */}
            <aside className="w-72 border-r border-slate-200 bg-slate-50 flex flex-col">
                {/* New Chat Button */}
                <div className="p-3 border-b border-slate-200">
                    <Button className="w-full" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        New conversation
                    </Button>
                </div>

                {/* Conversation List */}
                <ScrollArea className="flex-1">
                    <div className="p-2">
                        {/* Date Group */}
                        <p className="text-xs font-medium text-slate-400 px-2 py-2">
                            Today
                        </p>

                        {/* Conversation Item */}
                        <button
                            className="w-full text-left p-3 rounded-lg hover:bg-slate-100 
                          data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-700"
                        >
                            <p className="text-sm font-medium truncate">
                                Grammar practice session
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                2 hours ago
                            </p>
                        </button>
                    </div>
                </ScrollArea>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between">
                    <div>
                        <h1 className="font-medium text-slate-900">
                            Grammar Practice
                        </h1>
                        <p className="text-xs text-slate-400">
                            AI Coach • Always learning
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        {/* Menu items: Rename, Export, Delete */}
                    </DropdownMenu>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* AI Message */}
                        <div className="flex gap-3">
                            <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-indigo-100 text-indigo-700">
                                    AI
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                                    <p className="text-sm text-slate-700">
                                        I noticed a grammar issue in your
                                        sentence. You wrote:
                                    </p>
                                    <div className="mt-2 p-2 bg-white rounded-lg border border-red-200">
                                        <p className="text-sm">
                                            <span className="bg-red-100 text-red-700 px-1 rounded">
                                                He go
                                            </span>
                                            to school yesterday.
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-700 mt-2">
                                        It should be:{" "}
                                        <span className="text-emerald-600 font-medium">
                                            "He went"
                                        </span>
                                        (past tense of "go")
                                    </p>
                                </div>
                                <p className="text-xs text-slate-400">
                                    2:34 PM
                                </p>
                            </div>
                        </div>

                        {/* User Message */}
                        <div className="flex gap-3 flex-row-reverse">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src="/user-avatar.jpg" />
                            </Avatar>
                            <div className="flex-1 flex flex-col items-end space-y-2">
                                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                                    <p className="text-sm">
                                        Oh I see! So when should I use "went" vs
                                        "go"?
                                    </p>
                                </div>
                                <p className="text-xs text-slate-400">
                                    2:35 PM
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Input Bar */}
                <div className="border-t border-slate-200 p-4">
                    <div className="max-w-3xl mx-auto flex items-end gap-2">
                        <div className="flex-1 relative">
                            <Textarea
                                placeholder="Ask me anything about English..."
                                className="min-h-[48px] max-h-32 pr-12 resize-none"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                        >
                            <Mic className="w-4 h-4" />
                        </Button>
                        <Button
                            size="icon"
                            className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-2">
                        Press Enter to send • Shift+Enter for new line
                    </p>
                </div>
            </main>
        </div>
    );
}
