"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useApp, useMedications } from "@/lib/store/enhanced-context"
import { X, Pill } from "lucide-react"

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

  if (medications.length === 0) {
    return (
      <div className="wellness-popup-overlay" onClick={onClose}>
        <div className="wellness-popup-content" onClick={(e) => e.stopPropagation()}>
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Log Medication
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-gray-600 mb-4">No medications found in your profile.</p>
              <p className="text-sm text-gray-500">Add medications in your profile settings to start tracking.</p>
              <Button onClick={onClose} className="mt-4 wellness-button-primary">
                Close
              </Button>
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
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
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
