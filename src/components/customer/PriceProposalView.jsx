import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import PaymentButton from '@/components/payment/PaymentButton';

export default function PriceProposalView({ booking }) {
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);

  const acceptPriceMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Booking.update(booking.id, {
        price_accepted_by_customer: true,
        negotiation_status: 'customer_accepted',
        status: 'awaiting_payment',
        total_price: booking.proposed_price
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customer-bookings']);
      setShowPayment(true);
    }
  });

  const rejectPriceMutation = useMutation({
    mutationFn: async () => {
      if (confirm('Är du säker på att du vill avvisa detta pris? Uppdraget kommer att avbrytas.')) {
        await base44.entities.Booking.update(booking.id, {
          negotiation_status: 'rejected',
          status: 'cancelled'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customer-bookings']);
    }
  });

  // Show payment interface if accepted
  if (showPayment) {
    return (
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Betala Nu</h3>
            <p className="text-gray-600">Du har accepterat priset på {booking.proposed_price} kr</p>
          </div>

          <div className="bg-white rounded-xl p-4 mb-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Totalt att betala:</span>
              <span className="text-green-600">{booking.proposed_price} kr</span>
            </div>
          </div>

          <PaymentButton 
            bookingData={{
              ...booking,
              total_price: booking.proposed_price
            }}
            onPaymentComplete={() => {
              queryClient.invalidateQueries(['customer-bookings']);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // Pending admin review
  if (booking.negotiation_status === 'pending_admin_review') {
    return (
      <Card className="border-2 border-amber-300 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Clock className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">Väntar på Prisbekräftelse</h3>
              <p className="text-sm text-amber-800 mb-3">
                Vi granskar ditt uppdrag och ditt prisförslag. Du får svar inom 24 timmar!
              </p>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Ditt förslag:</p>
                <p className="text-2xl font-bold text-amber-600">{booking.customer_offered_price} kr</p>
                {booking.customer_price_message && (
                  <p className="text-sm text-gray-600 mt-2 italic">"{booking.customer_price_message}"</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Admin counter-offered
  if (booking.negotiation_status === 'admin_countered') {
    return (
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <MessageSquare className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">💬 Vi har ett motbud!</h3>
              <p className="text-sm text-blue-800 mb-4">
                Vi har granskat ditt uppdrag och kan erbjuda följande pris:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Ditt förslag</p>
              <p className="text-xl font-bold text-gray-600">{booking.customer_offered_price} kr</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border-2 border-blue-400">
              <p className="text-xs text-blue-600 mb-1 font-semibold">Vårt motbud</p>
              <p className="text-3xl font-black text-blue-600">{booking.proposed_price} kr</p>
            </div>
          </div>

          {booking.price_proposal_message && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-2">Meddelande från TaskCham:</p>
              <p className="text-sm text-gray-700 italic">"{booking.price_proposal_message}"</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 h-12"
              onClick={() => acceptPriceMutation.mutate()}
              disabled={acceptPriceMutation.isPending}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Acceptera {booking.proposed_price} kr
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => rejectPriceMutation.mutate()}
              disabled={rejectPriceMutation.isPending}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Avvisa
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Already accepted, waiting for payment
  if (booking.negotiation_status === 'customer_accepted' && booking.payment_status === 'pending') {
    return (
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Betala Nu</h3>
            <p className="text-gray-600">Avsluta din bokning med betalning</p>
          </div>

          <div className="bg-white rounded-xl p-4 mb-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Överenskommet pris:</span>
              <span className="text-green-600">{booking.proposed_price || booking.total_price} kr</span>
            </div>
          </div>

          <PaymentButton 
            bookingData={{
              ...booking,
              total_price: booking.proposed_price || booking.total_price
            }}
            onPaymentComplete={() => {
              queryClient.invalidateQueries(['customer-bookings']);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return null;
}