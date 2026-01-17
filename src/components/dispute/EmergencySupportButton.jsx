import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, Clock, Package, MapPin } from 'lucide-react';

export default function EmergencySupportButton({ booking, variant = "default" }) {
  const [showDialog, setShowDialog] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const reportMutation = useMutation({
    mutationFn: async () => {
      // Create dispute for tracking
      await base44.entities.Dispute.create({
        booking_id: booking.id,
        booking_number: booking.booking_number,
        customer_email: booking.customer_email,
        customer_name: booking.customer_name,
        driver_id: booking.assigned_driver_id,
        driver_name: booking.assigned_driver_name,
        issue_type: issueType === 'delayed' ? 'late_delivery' : issueType,
        description: description,
        status: 'open'
      });

      // Send urgent notification to admin
      await base44.integrations.Core.SendEmail({
        to: 'admin@taskcham.se',
        subject: `🚨 BRÅDSKANDE: Problem med #${booking.booking_number}`,
        body: `
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 20px;">
                <h1 style="color: #dc2626; margin: 0;">🚨 BRÅDSKANDE SUPPORT</h1>
              </div>
              
              <p><strong>Bokning:</strong> #${booking.booking_number}</p>
              <p><strong>Problem:</strong> ${issueType}</p>
              <p><strong>Kund:</strong> ${booking.customer_name} (${booking.customer_email})</p>
              <p><strong>Runner:</strong> ${booking.assigned_driver_name || 'Ingen tilldelad'}</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Beskrivning:</p>
                <p style="margin: 10px 0 0 0;">${description}</p>
              </div>
              
              <a href="https://app.base44.com" style="display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Åtgärda Nu
              </a>
            </body>
          </html>
        `
      });

      // Notify customer
      await base44.integrations.Core.SendEmail({
        to: booking.customer_email,
        subject: 'Vi har mottagit din supportförfrågan',
        body: `
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <h2>Hej ${booking.customer_name}!</h2>
              <p>Vi har mottagit din supportförfrågan gällande bokning <strong>#${booking.booking_number}</strong>.</p>
              <p>Vårt team kontaktar dig inom kort för att lösa problemet.</p>
              <p>Med vänliga hälsningar,<br>TaskCham Support</p>
            </body>
          </html>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customer-bookings']);
      setShowDialog(false);
      alert('Support har kontaktats! Vi återkommer så snart som möjligt.');
      setIssueType('');
      setDescription('');
    }
  });

  const issues = [
    { value: 'delayed', icon: Clock, label: 'Förare försenad', desc: 'Föraren har inte kommit i tid' },
    { value: 'wrong_delivery', icon: MapPin, label: 'Fel leverans', desc: 'Levererat till fel plats' },
    { value: 'item_damaged', icon: Package, label: 'Skadad vara', desc: 'Varan är skadad' },
    { value: 'other', icon: AlertTriangle, label: 'Annat problem', desc: 'Övriga problem' }
  ];

  return (
    <>
      <Button
        variant={variant === "danger" ? "destructive" : "outline"}
        className={variant === "danger" ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" : ""}
        onClick={() => setShowDialog(true)}
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Rapportera Problem
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Rapportera Problem
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Vad är problemet?</Label>
              <RadioGroup value={issueType} onValueChange={setIssueType}>
                {issues.map((issue) => (
                  <Label
                    key={issue.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      issueType === issue.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value={issue.value} className="mt-1" />
                    <issue.icon className={`h-5 w-5 mt-0.5 ${
                      issueType === issue.value ? 'text-red-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{issue.label}</p>
                      <p className="text-xs text-gray-500">{issue.desc}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label>Beskriv problemet</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ge oss mer detaljer så vi kan hjälpa dig..."
                rows={4}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="text-amber-900">
                <strong>OBS:</strong> Detta skickar en brådskande varning till vårt supportteam. 
                De kontaktar dig inom kort.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Avbryt
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => reportMutation.mutate()}
              disabled={!issueType || !description || reportMutation.isPending}
            >
              {reportMutation.isPending ? 'Skickar...' : 'Skicka till Support'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}