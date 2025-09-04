"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp } from "@/lib/store/safe-context"
import { Upload, FileText, Download, Eye, Trash2, Plus } from "lucide-react"
import type { HealthRecord } from "@/lib/types"

interface HealthRecordsManagerProps {
  onClose?: () => void
}

export function HealthRecordsManager({ onClose }: HealthRecordsManagerProps) {
  const { state, actions } = useApp()
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    type: "ehr" as HealthRecord["type"],
    title: "",
    description: "",
    provider: "",
    date: new Date().toISOString().split("T")[0],
    tags: "",
  })

  const healthRecords = state.healthRecords || []

  const handleUpload = async (file: File) => {
    try {
      actions.setLoading(true)

      // Simulate file upload
      const fileUrl = URL.createObjectURL(file)

      const newRecord: Omit<HealthRecord, "id"> = {
        ...uploadForm,
        fileUrl,
        tags: uploadForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        userId: state.user?.id || "",
        isVerified: false,
        uploadedAt: new Date().toISOString(),
      }

      // In a real app, this would call an API
      // actions.addHealthRecord(newRecord)

      setShowUpload(false)
      setUploadForm({
        type: "ehr",
        title: "",
        description: "",
        provider: "",
        date: new Date().toISOString().split("T")[0],
        tags: "",
      })
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      actions.setLoading(false)
    }
  }

  const recordTypes = [
    { value: "ehr", label: "Electronic Health Record", icon: "📋" },
    { value: "genetic", label: "Genetic Information", icon: "🧬" },
    { value: "lab", label: "Lab Results", icon: "🔬" },
    { value: "imaging", label: "Medical Imaging", icon: "🩻" },
    { value: "visit", label: "Visit Summary", icon: "🏥" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Health Records</h2>
        <Button onClick={() => setShowUpload(true)} className="wellness-button-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <Card className="wellness-card">
          <CardHeader>
            <CardTitle>Upload Health Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="record-type">Record Type</Label>
                <Select
                  value={uploadForm.type}
                  onValueChange={(value) => setUploadForm((prev) => ({ ...prev, type: value as HealthRecord["type"] }))}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recordTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="record-date">Date</Label>
                <Input
                  id="record-date"
                  type="date"
                  value={uploadForm.date}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="rounded-2xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="record-title">Title</Label>
              <Input
                id="record-title"
                placeholder="e.g., Annual Physical Exam"
                value={uploadForm.title}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                className="rounded-2xl"
              />
            </div>

            <div>
              <Label htmlFor="record-provider">Healthcare Provider</Label>
              <Input
                id="record-provider"
                placeholder="e.g., Dr. Smith, Children's Hospital"
                value={uploadForm.provider}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, provider: e.target.value }))}
                className="rounded-2xl"
              />
            </div>

            <div>
              <Label htmlFor="record-description">Description</Label>
              <Textarea
                id="record-description"
                placeholder="Brief description of the record..."
                value={uploadForm.description}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                className="rounded-2xl"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="record-tags">Tags (comma-separated)</Label>
              <Input
                id="record-tags"
                placeholder="e.g., asthma, medication, routine"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, tags: e.target.value }))}
                className="rounded-2xl"
              />
            </div>

            {/* File Upload */}
            <div>
              <Label>Upload File</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-red-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Drag and drop your file here, or click to browse</p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleUpload(file)
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="rounded-full" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
                <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowUpload(false)} className="rounded-full">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Trigger file upload
                  document.getElementById("file-upload")?.click()
                }}
                className="wellness-button-primary"
                disabled={!uploadForm.title || !uploadForm.type}
              >
                Upload Record
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records List */}
      <div className="space-y-4">
        {healthRecords.length === 0 ? (
          <Card className="wellness-card">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No health records yet</h3>
              <p className="text-gray-600 mb-4">
                Upload your medical records, lab results, and other health documents to keep everything organized.
              </p>
              <Button onClick={() => setShowUpload(true)} className="wellness-button-primary">
                Upload Your First Record
              </Button>
            </CardContent>
          </Card>
        ) : (
          healthRecords.map((record) => (
            <Card key={record.id} className="wellness-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl">{recordTypes.find((t) => t.value === record.type)?.icon || "📄"}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{record.title}</h4>
                      <p className="text-sm text-gray-600">{recordTypes.find((t) => t.value === record.type)?.label}</p>
                      {record.provider && <p className="text-sm text-gray-500">Provider: {record.provider}</p>}
                      <p className="text-sm text-gray-500">Date: {new Date(record.date).toLocaleDateString()}</p>
                      {record.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {record.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
