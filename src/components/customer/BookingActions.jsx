import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingActions({ booking, onRebook }) {
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Calculate time until preferred date/time
  const getTimeUntilStart = () => {
    if (!booking.preferred_date) return null;
    
    const startTime = new Date(booking.preferred_date);
    if (booking.preferred_time) {
      const [hours, minutes] = booking.preferred_time.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes));
    }
    
    const now = new Date();
    const hoursUntil = (startTime - now) / (1000 * 60 * 60);
    return hoursUntil;
  };

  // Check if cancellation is allowed
  const canCancel = () => {
    const status = booking.status;
    const allowedStatuses = ['paid', 'assigned', 'awaiting_payment'];
    
    if (!allowedStatuses.includes(status)) return { allowed: false, reason: 'Kan ej avbokas i detta tillstånd' };
    
    // If task has started, can't cancel
    if (['picked_up', 'on_the_way', 'in_progress'].includes(status)) {
      return { allowed: false, reason: 'Uppdraget har redan påbörjats' };
    }

    const hoursUntil = getTimeUntilStart();
    
    // If scheduled and less than 2 hours away
    if (hoursUntil !== null && hoursUntil < 2) {
      return { allowed: false, reason: 'Måste avbokas minst 2 timmar före start' };
    }

    return { allowed: true, reason: null };
  };

  // Check if rebooking is allowed
  const canRebook = () => {
    return ['completed', 'cancelled'].includes(booking.status);
  };

  const cancelInfo = canCancel();

  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
      // Update booking status
      await base44.entities.Booking.update(booking.id, {
        status: 'cancelled',
        notes_for_driver: `Avbokad av kund: ${cancelReason}`
      });

      // If driver was assigned, send compensation if within rules
      if (booking.assigned_driver_id) {
        const hoursUntil = getTimeUntilStart();
        let compensationAmount = 0;

        // Compensation rules
        if (hoursUntil !== null) {
          if (hoursUntil < 4) compensationAmount = 100; // Less than 4 hours
          else if (hoursUntil < 24) compensationAmount = 50; // Less than 24 hours
        }

        if (compensationAmount > 0) {
          await base44.entities.CancellationCompensation.create({
            booking_id: booking.id,
            booking_number: booking.booking_number,
            runner_id: booking.assigned_driver_id,
            runner_name: booking.assigned_driver_name,
            cancellation_reason: 'customer_cancelled',
            was_accepted: true,
            was_started: false,
            compensation_amount: compensationAmount,
            status: 'pending'
          });
        }

        // Notify driver
        await base44.integrations.Core.SendEmail({
          to: booking.assigned_driver_name || 'runner@taskcham.se',
          subject: `Uppdrag Avbokat - #${booking.booking_number}`,
          body: `
            <p>Hej!</p>
            <p>Kunden har avbokat uppdrag <strong>#${booking.booking_number}</strong>.</p>
            ${compensationAmount > 0 ? `<p>Du får ${compensationAmount} kr i kompensation.</p>` : ''}
            <p>Orsak: ${cancelReason || 'Ingen angiven'}</p>
          `
        });
      }

      // Send cancellation confirmation to customer
      await base44.integrations.Core.SendEmail({
        to: booking.customer_email,
        subject: `Avbokning Bekräftad - #${booking.booking_number}`,
        body: `
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <h2>Hej ${booking.customer_name}!</h2>
              <p>Din bokning <strong>#${booking.booking_number}</strong> har avbokats.</p>
              
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Avbokningsstatus:</p>
                <p style="margin: 10px 0 0 0;">✓ Bokningen är avbruten</p>
                ${booking.payment_status === 'paid' ? 
                  '<p style="margin: 5px 0 0 0;">💰 Återbetalning behandlas inom 5-10 dagar</p>' : 
                  '<p style="margin: 5px 0 0 0;">💳 Ingen betalning har gjorts</p>'
                }
              </div>

              <p>Vi hoppas kunna hjälpa dig en annan gång!</p>
              <p>Med vänliga hälsningar,<br>TaskCham</p>
            </body>
          </html>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customer-bookings']);
      setShowCancelDialog(false);
      setCancelReason('');
      toast.success('Bokning avbokad');
    },
    onError: (error) => {
      toast.error('Kunde inte avboka: ' + error.message);
    }
  });

  return (
    <div className="flex gap-2">
      {/* Rebook Button */}
      {canRebook() && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRebook}
          className="flex-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Boka Om
        </Button>
      )}

      {/* Cancel Button */}
      {cancelInfo.allowed ? (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 flex-1"
          onClick={() => setShowCancelDialog(true)}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Avboka
        </Button>
      ) : (
        <div className="flex-1">
          <Button
            size="sm"
            variant="outline"
            disabled
            className="w-full"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Kan ej avbokas
          </Button>
          <p className="text-xs text-gray-500 mt-1">{cancelInfo.reason}</p>
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avboka Uppdrag</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Bokning: <strong>#{booking.booking_number}</strong></p>
              <p className="text-sm text-gray-600">Totalt: <strong>{booking.total_price} kr</strong></p>
            </div>

            {getTimeUntilStart() !== null && getTimeUntilStart() < 24 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900">Avbokningspolicy:</p>
                  <ul className="text-amber-800 mt-1 space-y-1">
                    <li>• Mindre än 2h: Avbokning ej tillåten</li>
                    <li>• 2-4h: Förarens kompensation 100 kr</li>
                    <li>• 4-24h: Förarens kompensation 50 kr</li>
                    <li>• Mer än 24h: Full återbetalning</li>
                  </ul>
                </div>
              </div>
            )}

            {booking.payment_status === 'paid' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-green-800">Återbetalning sker automatiskt inom 5-10 dagar</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Varför vill du avboka? (valfritt)
              </label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="T.ex. ändrade planer, vädret..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Tillbaka
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => cancelBookingMutation.mutate()}
              disabled={cancelBookingMutation.isPending}
            >
              {cancelBookingMutation.isPending ? 'Avbokar...' : 'Bekräfta Avbokning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}