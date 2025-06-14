"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp, useMedications } from "@/lib/store/enhanced-context"
import { X, Pill, Settings, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface MedicationLoggerProps {
  onClose: () => void
}

export function MedicationLogger({ onClose }: MedicationLoggerProps) {
  const { actions } = useApp()
  const medications = useMedications()
  const [selectedMedications, setSelectedMedications] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [sideEffects, setSideEffects] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMedicationManager, setShowMedicationManager] = useState(false)
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    timeSlots: ["08:00"]
  })

  const commonSideEffects = [
    "Nausea",
    "Dizziness",
    "Headache",
    "Drowsiness",
    "Dry mouth",
    "Upset stomach",
    "Fatigue",
    "Jitters",
    "Increased heart rate",
  ]

  const handleMedicationToggle = (medicationId: string) => {
    setSelectedMedications((prev) =>
      prev.includes(medicationId) ? prev.filter((id) => id !== medicationId) : [...prev, medicationId],
    )
  }

  const handleSideEffectToggle = (effect: string) => {
    setSideEffects((prev) => (prev.includes(effect) ? prev.filter((e) => e !== effect) : [...prev, effect]))
  }

  const handleSubmit = async () => {
    if (selectedMedications.length === 0) return

    setIsSubmitting(true)

    const now = new Date()
    const currentDate = now.toISOString().split("T")[0]
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5)

    // Log each selected medication
    for (const medicationId of selectedMedications) {
      const logEntry = {
        medicationId,
        date: currentDate,
        scheduledTime: currentTime,
        taken: true,
        actualTime: currentTime,
        notes: notes.trim() || undefined,
        sideEffects: sideEffects.length > 0 ? sideEffects : undefined,
      }

      actions.addMedicationLog(logEntry)
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    setIsSubmitting(false)
    onClose()
  }

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) return

    actions.addMedication({
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency,
      timeSlots: newMedication.timeSlots,
      adherence: 0,
      sideEffects: [],
      isActive: true
    })

    setNewMedication({
      name: "",
      dosage: "",
      frequency: "",
      timeSlots: ["08:00"]
    })
    setShowMedicationManager(false)
  }

  const handleRemoveMedication = (medicationId: string) => {
    actions.removeMedication(medicationId)
  }

  if (medications.length === 0 && !showMedicationManager) {
    return (
      <div className="wellness-popup-overlay" onClick={onClose}>
        <div className="wellness-popup-content" onClick={(e) => e.stopPropagation()}>
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Medication Manager
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="mb-6">
                <Pill className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No medications found in your profile.</p>
                <p className="text-sm text-gray-500">Add medications to start tracking adherence.</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowMedicationManager(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
                <Button onClick={onClose} className="flex-1 wellness-button-primary">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show medication manager
  if (showMedicationManager) {
    return (
      <div className="wellness-popup-overlay" onClick={onClose}>
        <div className="wellness-popup-content" onClick={(e) => e.stopPropagation()}>
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Manage Medications
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing medications */}
              {medications.length > 0 && (
                <div>
                  <Label className="text-base font-medium">Current Medications</Label>
                  <div className="space-y-2 mt-2">
                    {medications.map((medication) => (
                      <div
                        key={medication.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{medication.name}</h4>
                          <p className="text-sm text-gray-600">{medication.dosage} - {medication.frequency}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedication(medication.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new medication form */}
              <div>
                <Label className="text-base font-medium">Add New Medication</Label>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="med-name">Medication Name</Label>
                    <Input
                      id="med-name"
                      placeholder="e.g., Lisinopril"
                      value={newMedication.name}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="med-dosage">Dosage</Label>
                    <Input
                      id="med-dosage"
                      placeholder="e.g., 10mg"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="med-frequency">Frequency</Label>
                    <Select 
                      value={newMedication.frequency} 
                      onValueChange={(value) => setNewMedication(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Once daily">Once daily</SelectItem>
                        <SelectItem value="Twice daily">Twice daily</SelectItem>
                        <SelectItem value="Three times daily">Three times daily</SelectItem>
                        <SelectItem value="Four times daily">Four times daily</SelectItem>
                        <SelectItem value="As needed">As needed</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowMedicationManager(false)}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleAddMedication}
                  disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency}
                  className="flex-1 wellness-button-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="wellness-popup-overlay" onClick={onClose}>
      <div className="wellness-popup-content" onClick={(e) => e.stopPropagation()}>
        <Card className="border-0 shadow-none">
                      <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Log Medication
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowMedicationManager(true)}
                  title="Manage Medications"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          <CardContent className="space-y-6">
            {/* Medication Selection */}
            <div>
              <Label className="text-base font-medium">Which medications did you take?</Label>
              <div className="space-y-3 mt-2">
                {medications.map((medication) => (
                  <div
                    key={medication.id}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedMedications.includes(medication.id)
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-red-300"
                    }`}
                    onClick={() => handleMedicationToggle(medication.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedMedications.includes(medication.id)}
                        onChange={() => handleMedicationToggle(medication.id)}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{medication.name}</h4>
                        <p className="text-sm text-gray-600">
                          {medication.dosage} - {medication.frequency}
                        </p>
                        <p className="text-xs text-gray-500">Current adherence: {medication.adherence}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side Effects */}
            {selectedMedications.length > 0 && (
              <div>
                <Label className="text-base font-medium">Any side effects? (optional)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonSideEffects.map((effect) => (
                    <button
                      key={effect}
                      onClick={() => handleSideEffectToggle(effect)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        sideEffects.includes(effect)
                          ? "bg-orange-100 text-orange-700 border border-orange-300"
                          : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {effect}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="med-notes" className="text-base font-medium">
                Notes (optional)
              </Label>
              <Textarea
                id="med-notes"
                placeholder="Any additional notes about taking your medication?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 rounded-2xl"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={selectedMedications.length === 0 || isSubmitting}
              className="w-full wellness-button-primary"
            >
              {isSubmitting ? "Logging..." : "Log Medication"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
