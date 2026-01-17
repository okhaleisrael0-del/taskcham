import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, MapPin, DollarSign, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function JobAcceptReject({ job, isOpen, onClose, driverProfile }) {
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState(false);

  const acceptJobMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Booking.update(job.id, {
        assigned_driver_id: driverProfile.id,
        assigned_driver_name: driverProfile.name,
        assigned_driver_phone: driverProfile.phone,
        status: 'assigned',
        driver_earnings: Math.round(job.total_price * 0.8),
        platform_fee: Math.round(job.total_price * 0.2)
      });

      // Update driver availability
      await base44.entities.Driver.update(driverProfile.id, {
        availability: 'busy'
      });

      // Send notifications
      await base44.integrations.Core.SendEmail({
        to: job.customer_email,
        subject: `Runner Tilldelad - #${job.booking_number}`,
        body: `
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <h2>Goda nyheter, ${job.customer_name}!</h2>
              <p>Din bokning <strong>#${job.booking_number}</strong> har tilldelats en runner.</p>
              
              <div style="background: #f0f9ff; border-left: 4px solid #14B8A6; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Runner:</p>
                <p style="margin: 5px 0 0 0; font-size: 18px;">${driverProfile.name}</p>
              </div>

              <p>Du kan följa leveransen live i appen!</p>
              <p>Med vänliga hälsningar,<br>TaskCham</p>
            </body>
          </html>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['active-driver-bookings']);
      queryClient.invalidateQueries(['driver-profile']);
      toast.success('Uppdrag accepterat! 🎉');
      onClose();
    },
    onError: (error) => {
      toast.error('Kunde inte acceptera: ' + error.message);
    }
  });

  const calculateEarnings = (price) => {
    return Math.round(price * 0.8);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nytt Uppdrag</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Info */}
          <div className="bg-gradient-to-r from-[#1E3A8A]/5 to-[#14B8A6]/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono font-bold text-lg">#{job.booking_number}</span>
              <Badge className="bg-[#1E3A8A] text-white">
                {job.service_type?.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Upphämtning</p>
                  <p className="text-gray-600">{job.pickup_address}</p>
                </div>
              </div>
              
              {job.delivery_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Leverans</p>
                    <p className="text-gray-600">{job.delivery_address}</p>
                  </div>
                </div>
              )}

              {job.task_location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#14B8A6] mt-0.5" />
                  <div>
                    <p className="font-medium">Plats</p>
                    <p className="text-gray-600">{job.task_location}</p>
                  </div>
                </div>
              )}

              {job.item_description && (
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Beskrivning</p>
                    <p className="text-gray-600">{job.item_description}</p>
                  </div>
                </div>
              )}

              {job.preferred_date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>{job.preferred_date} {job.preferred_time}</span>
                </div>
              )}
            </div>
          </div>

          {/* Earnings Highlight */}
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800">Din Intjäning (80%)</p>
                <p className="text-3xl font-bold text-green-600">
                  {calculateEarnings(job.total_price)} kr
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600" />
            </div>
            <div className="mt-2 text-xs text-green-700">
              <p>Totalt pris: {job.total_price} kr</p>
              <p>Avstånd: ~{job.distance_km?.toFixed(1) || 'N/A'} km</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500 mb-1">Kund</p>
            <p className="font-medium">{job.customer_name}</p>
            <p className="text-sm text-gray-600">{job.customer_phone}</p>
          </div>

          {job.notes_for_driver && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-900 mb-1">⚠️ Anteckningar</p>
              <p className="text-sm text-amber-800">{job.notes_for_driver}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Avböj
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => acceptJobMutation.mutate()}
            disabled={acceptJobMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {acceptJobMutation.isPending ? 'Accepterar...' : 'Acceptera Uppdrag'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}