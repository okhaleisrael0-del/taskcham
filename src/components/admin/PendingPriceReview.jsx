import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Image as ImageIcon, Video, DollarSign, MessageSquare, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function PendingPriceReview({ currentUser }) {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [priceMessage, setPriceMessage] = useState('');

  const { data: pendingBookings = [] } = useQuery({
    queryKey: ['pending-price-bookings'],
    queryFn: () => base44.entities.Booking.filter({ status: 'pending_price' })
  });

  const proposePriceMutation = useMutation({
    mutationFn: async ({ bookingId, price, message }) => {
      const driverEarnings = Math.round(price * 0.8);
      const platformFee = Math.round(price * 0.2);

      await base44.entities.Booking.update(bookingId, {
        proposed_price: price,
        price_proposal_message: message,
        total_price: price,
        driver_earnings: driverEarnings,
        platform_fee: platformFee,
        status: 'price_proposed'
      });

      // Send notification via chat
      await base44.entities.ChatMessage.create({
        booking_id: bookingId,
        booking_number: selectedBooking.booking_number,
        sender_type: 'admin',
        sender_name: 'TaskCham',
        sender_id: currentUser.id,
        message: `💰 Prisförslag: ${price} kr\n\n${message}`
      });

      // Send SMS to customer
      await base44.functions.invoke('sendSMS', {
        to: selectedBooking.customer_phone,
        message: `💬 TaskCham: Vi har granskat ditt uppdrag #${selectedBooking.booking_number}. Pris: ${price} kr. Logga in för att se detaljer och acceptera.`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-price-bookings']);
      setSelectedBooking(null);
      setProposedPrice('');
      setPriceMessage('');
      toast.success('Pris skickat till kund!');
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Väntar på Prissättning ({pendingBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Check className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Inga uppdrag väntar på prissättning</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <div key={booking.id} className="border-2 border-amber-200 bg-amber-50 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg">#{booking.booking_number}</span>
                        <Badge className="bg-amber-100 text-amber-800">
                          Väntar på Pris
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {booking.task_location}
                        </p>
                        <p className="text-gray-600">
                          <strong>Kund:</strong> {booking.customer_name} • {booking.customer_phone}
                        </p>
                        <p className="text-gray-600">
                          <strong>Önskad tid:</strong> {booking.help_duration_hours}h
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Beskrivning:</p>
                    <p className="text-sm text-gray-900">{booking.item_description}</p>
                  </div>

                  {/* Media */}
                  {booking.media_urls && booking.media_urls.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        Kundens filer ({booking.media_urls.length})
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {booking.media_urls.map((media, idx) => (
                          <a
                            key={idx}
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative"
                          >
                            {media.type === 'image' ? (
                              <img
                                src={media.url}
                                alt={`Media ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-all"
                              />
                            ) : (
                              <div className="w-full h-24 bg-purple-100 rounded-lg border-2 border-purple-300 flex items-center justify-center group-hover:border-purple-500 transition-all">
                                <Video className="h-8 w-8 text-purple-600" />
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-[#4A90A4] hover:bg-[#3d7a8c]"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setProposedPrice('');
                      setPriceMessage('');
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Sätt Pris
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Proposal Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sätt Pris för Uppdrag #{selectedBooking?.booking_number}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Booking Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm mb-2"><strong>Beskrivning:</strong> {selectedBooking?.item_description}</p>
              <p className="text-sm mb-2"><strong>Tid:</strong> {selectedBooking?.help_duration_hours}h</p>
              <p className="text-sm"><strong>Plats:</strong> {selectedBooking?.task_location}</p>
            </div>

            {/* Media Preview */}
            {selectedBooking?.media_urls && selectedBooking.media_urls.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Kundens filer:</p>
                <div className="grid grid-cols-4 gap-2">
                  {selectedBooking.media_urls.map((media, idx) => (
                    <a
                      key={idx}
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={`Media ${idx + 1}`}
                          className="w-full h-20 object-cover rounded-lg border hover:opacity-80"
                        />
                      ) : (
                        <div className="w-full h-20 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Video className="h-6 w-6 text-purple-600" />
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Price Input */}
            <div>
              <Label htmlFor="price" className="mb-2 block">
                💰 Föreslaget Pris (SEK)
              </Label>
              <Input
                id="price"
                type="number"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder="ex. 450"
                className="h-14 text-2xl font-bold"
              />
              <p className="text-xs text-gray-500 mt-2">
                Förare får: {proposedPrice ? Math.round(proposedPrice * 0.8) : 0} kr (80%)
                <br />
                TaskCham-avgift: {proposedPrice ? Math.round(proposedPrice * 0.2) : 0} kr (20%)
              </p>
            </div>

            {/* Message to Customer */}
            <div>
              <Label htmlFor="message" className="mb-2 block">
                💬 Meddelande till kund
              </Label>
              <Textarea
                id="message"
                value={priceMessage}
                onChange={(e) => setPriceMessage(e.target.value)}
                placeholder="ex: Detta jobb blir 450 kr pga tunga möbler och trappor. Inkluderar montering och bortforsling av kartong."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>
              Avbryt
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={!proposedPrice || !priceMessage || proposePriceMutation.isPending}
              onClick={() => proposePriceMutation.mutate({
                bookingId: selectedBooking.id,
                price: parseFloat(proposedPrice),
                message: priceMessage
              })}
            >
              {proposePriceMutation.isPending ? 'Skickar...' : 'Skicka Prisförslag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}