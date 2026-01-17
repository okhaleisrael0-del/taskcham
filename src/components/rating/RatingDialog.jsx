import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from 'lucide-react';
import { toast } from 'sonner';

export default function RatingDialog({ booking, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const submitRating = useMutation({
    mutationFn: async () => {
      await base44.entities.Rating.create({
        booking_id: booking.id,
        booking_number: booking.booking_number,
        customer_email: booking.customer_email,
        customer_name: booking.customer_name,
        driver_id: booking.assigned_driver_id,
        driver_name: booking.assigned_driver_name,
        rating: rating,
        feedback: feedback,
        service_type: booking.service_type
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customer-bookings']);
      toast.success('Tack för ditt betyg!');
      onClose();
    },
    onError: () => {
      toast.error('Kunde inte spara betyg');
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Välj ett betyg');
      return;
    }
    submitRating.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Betygsätt Din Upplevelse</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Hur nöjd var du med {booking?.assigned_driver_name}?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-12 w-12 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center mt-2 text-sm text-gray-600">
              {rating > 0 && (
                <span className="font-semibold">
                  {rating === 5 ? 'Utmärkt!' : rating === 4 ? 'Mycket bra!' : rating === 3 ? 'Bra' : rating === 2 ? 'OK' : 'Behöver förbättring'}
                </span>
              )}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Feedback (valfritt)
            </label>
            <Textarea
              placeholder="Berätta om din upplevelse..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Hoppa över
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitRating.isPending}
              className="flex-1 bg-[#4A90A4] hover:bg-[#3d7a8c]"
            >
              {submitRating.isPending ? 'Sparar...' : 'Skicka Betyg'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}