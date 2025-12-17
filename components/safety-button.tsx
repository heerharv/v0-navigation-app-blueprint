"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function SafetyButton() {
  const [showDialog, setShowDialog] = useState(false)
  const [sosActivated, setSosActivated] = useState(false)

  const handleSOS = () => {
    setSosActivated(true)
    // In real app: send location to emergency contacts, call emergency services
    setTimeout(() => {
      setSosActivated(false)
      setShowDialog(false)
    }, 3000)
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
      >
        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        SOS
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Emergency Assistance
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Your safety is our priority. Choose an action below.
            </DialogDescription>
          </DialogHeader>

          {sosActivated ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Alert Sent!</h3>
              <p className="text-sm text-muted-foreground">Emergency contacts notified with your location</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleSOS}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 h-auto py-4"
              >
                <div className="flex flex-col items-start w-full">
                  <span className="font-semibold">Activate SOS</span>
                  <span className="text-xs opacity-90">Share location with emergency contacts</span>
                </div>
              </Button>

              <Button variant="outline" className="w-full h-auto py-4 border-border hover:bg-secondary bg-transparent">
                <div className="flex flex-col items-start w-full">
                  <span className="font-semibold text-foreground">Find Nearby Help</span>
                  <span className="text-xs text-muted-foreground">Police, hospitals, shelters</span>
                </div>
              </Button>

              <Button variant="outline" className="w-full h-auto py-4 border-border hover:bg-secondary bg-transparent">
                <div className="flex flex-col items-start w-full">
                  <span className="font-semibold text-foreground">Share Live Location</span>
                  <span className="text-xs text-muted-foreground">Let friends track your trip</span>
                </div>
              </Button>

              <div className="pt-4 border-t border-border">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="leading-relaxed">Emergency services: 911 | Crisis hotline: 988</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
