"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { demoAPI } from "@/lib/demo-api"
import { ArrowLeft, FileText, Calendar, User, AlertCircle } from "lucide-react"

export default function HealthRecords() {
    const [loading, setLoading] = useState(true)
    const [records, setRecords] = useState<any[]>([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const response = await demoAPI.getHealthRecords()
            setRecords(response.data)
        } catch (error) {
            console.error('Error loading records:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen wellness-gradient flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading health records...</p>
                </div>
            </div>
        )
    }

    const getRecordIcon = (type: string) => {
        switch (type) {
            case 'Lab Results':
                return <FileText className="h-5 w-5 text-blue-500" />
            case 'Appointment':
                return <Calendar className="h-5 w-5 text-green-500" />
            case 'Prescription':
                return <FileText className="h-5 w-5 text-purple-500" />
            default:
                return <FileText className="h-5 w-5 text-gray-500" />
        }
    }

    return (
        <div className="min-h-screen wellness-gradient">
            {/* demo banner */}
            <div className="bg-red-500 text-white py-2 px-4 text-center text-sm">
                <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>DEMO MODE - Health records are sample data for demonstration</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Back to Dashboard</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Health Records</h1>
                    <p className="text-gray-600 mt-1">Your medical history and documents</p>
                </div>

                {/* records list */}
                <div className="space-y-4">
                    {records.map((record) => (
                        <div 
                            key={record.id}
                            className="wellness-feature-card"
                        >
                            <div className="flex items-start gap-4">
                                <div className="wellness-icon-container bg-secondary flex-shrink-0">
                                    {getRecordIcon(record.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                                {record.type}
                                            </span>
                                            <h3 className="font-semibold text-gray-900 mt-2">
                                                {record.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {new Date(record.date).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-3">
                                        {record.summary}
                                    </p>

                                    {record.provider && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                            <User className="h-4 w-4" />
                                            <span>{record.provider}</span>
                                        </div>
                                    )}

                                    <div className="bg-secondary rounded-2xl p-4">
                                        <p className="text-sm text-gray-700">
                                            {record.details}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* info box */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">About Health Records</h3>
                    <p className="text-sm text-blue-800">
                        In the full version of WellnessGrid, you can upload and store actual medical documents, 
                        lab results, and appointment notes securely. This demo shows sample records for 
                        demonstration purposes only.
                    </p>
                </div>
            </div>
        </div>
    )
}

