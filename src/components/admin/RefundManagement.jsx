import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, AlertTriangle } from 'lucide-react';

export default function RefundManagement({ dispute }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [refundType, setRefundType] = useState('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [resolution, setResolution] = useState('');

  const { data: bookings = [] } = useQuery({
    queryKey: ['booking', dispute?.booking_id],
    queryFn: () => base44.entities.Booking.filter({ id: dispute?.booking_id }),
    enabled: !!dispute?.booking_id
  });

  const booking = bookings[0];

  const processRefundMutation = useMutation({
    mutationFn: async () => {
      const refundAmount = refundType === 'full' 
        ? booking.total_price 
        : parseFloat(partialAmount);

      // Update booking payment status
      await base44.entities.Booking.update(booking.id, {
        payment_status: 'refunded',
        status: 'cancelled'
      });

      // Update dispute
      await base44.entities.Dispute.update(dispute.id, {
        status: 'resolved',
        resolution: `Återbetalning: ${refundAmount} kr. ${resolution}`,
        resolved_by: (await base44.auth.me()).email,
        resolved_date: new Date().toISOString()
      });

      // Notify customer
      await base44.integrations.Core.SendEmail({
        to: booking.customer_email,
        subject: `Återbetalning Godkänd - #${booking.booking_number}`,
        body: `
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <h2>Hej ${booking.customer_name}!</h2>
              <p>Vi har godkänt din återbetalning för bokning <strong>#${booking.booking_number}</strong>.</p>
              
              <div style="background: #f0f9ff; border-left: 4px solid #4A90A4; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #4A90A4;">${refundAmount} kr</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">återbetalas till ditt kort inom 5-10 arbetsdagar</p>
              </div>

              ${resolution ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Kommentar:</p>
                <p style="margin: 10px 0 0 0;">${resolution}</p>
              </div>` : ''}

              <p>Vi beklagar besväret och hoppas kunna hjälpa dig igen!</p>
              <p>Med vänliga hälsningar,<br>TaskCham Support</p>
            </body>
          </html>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['disputes']);
      queryClient.invalidateQueries(['admin-bookings']);
      setShowDialog(false);
      alert('Återbetalning behandlad!');
    }
  });

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => setShowDialog(true)}
      >
        <DollarSign className="h-4 w-4 mr-1" />
        Återbetalning
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hantera Återbetalning</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Bokning: <strong>#{booking?.booking_number}</strong></p>
              <p className="text-sm text-gray-600">Totalt belopp: <strong>{booking?.total_price} kr</strong></p>
            </div>

            <div>
              <Label className="mb-3 block">Återbetalningstyp</Label>
              <RadioGroup value={refundType} onValueChange={setRefundType}>
                <Label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer">
                  <RadioGroupItem value="full" />
                  <div>
                    <p className="font-semibold">Full återbetalning</p>
                    <p className="text-sm text-gray-500">{booking?.total_price} kr</p>
                  </div>
                </Label>
                <Label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer">
                  <RadioGroupItem value="partial" />
                  <div>
                    <p className="font-semibold">Delvis återbetalning</p>
                    <p className="text-sm text-gray-500">Ange belopp nedan</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {refundType === 'partial' && (
              <div>
                <Label>Återbetalningsbelopp (SEK)</Label>
                <Input
                  type="number"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder="0"
                  max={booking?.total_price}
                />
              </div>
            )}

            <div>
              <Label>Meddelande till kund</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Förklara varför återbetalning görs..."
                rows={3}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">OBS:</p>
                <p className="text-amber-800">
                  Återbetalning görs via Stripe och tar 5-10 arbetsdagar.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Avbryt
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => processRefundMutation.mutate()}
              disabled={
                processRefundMutation.isPending ||
                (refundType === 'partial' && (!partialAmount || parseFloat(partialAmount) <= 0))
              }
            >
              {processRefundMutation.isPending ? 'Behandlar...' : 'Genomför Återbetalning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}