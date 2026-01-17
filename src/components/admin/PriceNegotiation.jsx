import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DollarSign, MessageSquare, Check, X, AlertCircle } from 'lucide-react';
import { NotificationService } from '@/components/notifications/NotificationService';

export default function PriceNegotiation() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const { data: pendingNegotiations = [] } = useQuery({
    queryKey: ['price-negotiations'],
    queryFn: () => base44.entities.Booking.filter({
      service_type: 'help_at_home',
      negotiation_status: 'pending_admin_review'
    }),
    refetchInterval: 10000
  });

  const { data: counterOffers = [] } = useQuery({
    queryKey: ['counter-offers'],
    queryFn: () => base44.entities.Booking.filter({
      service_type: 'help_at_home',
      negotiation_status: 'admin_countered'
    })
  });

  const acceptOfferMutation = useMutation({
    mutationFn: async (booking) => {
      await base44.entities.Booking.update(booking.id, {
        proposed_price: booking.customer_offered_price,
        total_price: booking.customer_offered_price,
        price_proposal_message: 'Vi accepterar ditt prisförslag!',
        negotiation_status: 'customer_accepted',
        price_accepted_by_customer: true,
        status: 'awaiting_payment'
      });

      // Send notification
      await NotificationService.notifyCustomerPriceAccepted(booking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['price-negotiations']);
      queryClient.invalidateQueries(['admin-bookings']);
      alert('Erbjudande accepterat! Kunden kan nu betala.');
    }
  });

  const counterOfferMutation = useMutation({
    mutationFn: async ({ booking, price, message }) => {
      await base44.entities.Booking.update(booking.id, {
        proposed_price: parseFloat(price),
        price_proposal_message: message,
        negotiation_status: 'admin_countered',
        status: 'price_review'
      });

      // Send notification
      await base44.integrations.Core.SendEmail({
        to: booking.customer_email,
        subject: `TaskCham - Motbud för ditt uppdrag #${booking.booking_number}`,
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #4A90A4 0%, #7FB069 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1>💬 Motbud från TaskCham</h1>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
                <p>Hej ${booking.customer_name}!</p>
                <p>Vi har granskat ditt uppdrag <strong>#${booking.booking_number}</strong> och har ett motbud:</p>
                
                <div style="background: #f0f9ff; border-left: 4px solid #4A90A4; padding: 20px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0;"><strong>Ditt förslag:</strong> ${booking.customer_offered_price} kr</p>
                  <p style="margin: 10px 0 0 0;"><strong>Vårt motbud:</strong> ${price} kr</p>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-style: italic;">"${message}"</p>
                </div>

                <p><strong>Nästa steg:</strong> Logga in på TaskCham för att acceptera eller diskutera priset vidare.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${window.location.origin}" style="background: #4A90A4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Visa Uppdrag
                  </a>
                </div>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
                <p>TaskCham - Din Lokala Hjälp i Göteborg</p>
              </div>
            </body>
          </html>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['price-negotiations']);
      queryClient.invalidateQueries(['admin-bookings']);
      setShowDialog(false);
      setCounterPrice('');
      setCounterMessage('');
      alert('Motbud skickat till kunden!');
    }
  });

  const rejectOfferMutation = useMutation({
    mutationFn: async (booking) => {
      await base44.entities.Booking.update(booking.id, {
        negotiation_status: 'rejected',
        status: 'cancelled',
        price_proposal_message: 'Vi kan tyvärr inte utföra detta uppdrag till det föreslagna priset.'
      });

      // Send notification
      await base44.integrations.Core.SendEmail({
        to: booking.customer_email,
        subject: `TaskCham - Uppdrag #${booking.booking_number}`,
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #ef4444; color: white; padding: 30px; text-align: center;">
                <h1>Tack för ditt förslag</h1>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #ddd;">
                <p>Hej ${booking.customer_name},</p>
                <p>Tyvärr kan vi inte utföra uppdraget <strong>#${booking.booking_number}</strong> till det föreslagna priset på ${booking.customer_offered_price} kr.</p>
                <p>Du är välkommen att skicka in en ny förfrågan med ett annat prisförslag, eller kontakta oss för diskussion.</p>
              </div>
            </body>
          </html>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['price-negotiations']);
      queryClient.invalidateQueries(['admin-bookings']);
      alert('Erbjudande avvisat.');
    }
  });

  const openCounterDialog = (booking) => {
    setSelectedBooking(booking);
    setCounterPrice((booking.customer_offered_price * 1.2).toFixed(0)); // Suggest 20% higher
    setCounterMessage('');
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      {pendingNegotiations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Nya Prisförslag ({pendingNegotiations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingNegotiations.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg p-4 border-2 border-amber-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold">#{booking.booking_number}</span>
                        <Badge className="bg-amber-100 text-amber-800">Väntar på granskning</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {booking.customer_name} • {booking.help_service_type?.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {booking.task_location}
                      </p>
                      {booking.help_duration_hours && (
                        <p className="text-sm text-gray-600">
                          ⏱️ Uppskattat: {booking.help_duration_hours} timmar
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Kundens förslag:</p>
                      <p className="text-3xl font-black text-amber-600">{booking.customer_offered_price} kr</p>
                    </div>
                  </div>

                  {booking.customer_price_message && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1">Kundens meddelande:</p>
                      <p className="text-sm text-gray-700 italic">"{booking.customer_price_message}"</p>
                    </div>
                  )}

                  {booking.item_description && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1">Beskrivning:</p>
                      <p className="text-sm text-gray-700">{booking.item_description}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => acceptOfferMutation.mutate(booking)}
                      disabled={acceptOfferMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Acceptera
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openCounterDialog(booking)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Motbud
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Är du säker på att du vill avvisa detta förslag?')) {
                          rejectOfferMutation.mutate(booking);
                        }
                      }}
                      disabled={rejectOfferMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Avvisa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Counter Offers Awaiting Customer Response */}
      {counterOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Motbud Skickade ({counterOffers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {counterOffers.map((booking) => (
                <div key={booking.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold">#{booking.booking_number}</span>
                      <p className="text-sm text-gray-600">{booking.customer_name}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Väntar på kund</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Kundens förslag:</p>
                      <p className="font-semibold">{booking.customer_offered_price} kr</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ditt motbud:</p>
                      <p className="font-semibold text-blue-600">{booking.proposed_price} kr</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Counter Offer Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skicka Motbud</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Uppdrag: <span className="font-semibold">#{selectedBooking?.booking_number}</span>
              </p>
              <p className="text-sm text-gray-600">
                Kundens förslag: <span className="font-semibold text-amber-600">{selectedBooking?.customer_offered_price} kr</span>
              </p>
            </div>

            <div>
              <Label>Ditt motbud (SEK)</Label>
              <Input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                placeholder="Ange pris"
              />
            </div>

            <div>
              <Label>Meddelande till kund</Label>
              <Textarea
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="Förklara varför detta pris är rimligt..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Avbryt
            </Button>
            <Button
              onClick={() => counterOfferMutation.mutate({
                booking: selectedBooking,
                price: counterPrice,
                message: counterMessage
              })}
              disabled={!counterPrice || !counterMessage || counterOfferMutation.isPending}
            >
              Skicka Motbud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}