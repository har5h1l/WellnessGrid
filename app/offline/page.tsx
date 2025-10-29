"use client"

import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6">
                        <WifiOff className="h-16 w-16 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        You're Offline
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        It looks like you've lost your internet connection. Some features may not be available right now.
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
                        <p className="font-medium">What you can still do:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>View cached pages and content</li>
                            <li>Browse previously loaded data</li>
                            <li>Navigate between pages you've visited</li>
                        </ul>
                    </div>

                    <Button 
                        onClick={() => window.location.reload()} 
                        className="w-full"
                        size="lg"
                    >
                        Try Again
                    </Button>

                    <Button 
                        onClick={() => window.history.back()} 
                        variant="outline"
                        className="w-full"
                        size="lg"
                    >
                        Go Back
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground pt-4">
                    WellnessGrid works best with an active internet connection
                </p>
            </div>
        </div>
    )
}

