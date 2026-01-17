import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, MapPin, Calendar, DollarSign, Download, FileText, CheckCircle, Tag, Shield } from 'lucide-react';
import RunnerProfileCard from '@/components/runner/RunnerProfileCard';
import BookingActions from '@/components/customer/BookingActions';

export default function OrderHistoryView({ userEmail }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const { data: bookings = [] } = useQuery({
    queryKey: ['customer-history', userEmail],
    queryFn: () => base44.entities.Booking.filter({ customer_email: userEmail }),
    enabled: !!userEmail
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ['customer-receipts', userEmail],
    queryFn: () => base44.entities.Receipt.filter({ customer_email: userEmail }),
    enabled: !!userEmail
  });

  const { data: allDrivers = [] } = useQuery({
    queryKey: ['all-drivers'],
    queryFn: () => base44.entities.Driver.list()
  });

  const getDriver = (driverId) => allDrivers.find(d => d.id === driverId);

  const completedBookings = bookings.filter(b => ['completed', 'archived'].includes(b.status));
  const activeBookings = bookings.filter(b => !['completed', 'archived', 'cancelled'].includes(b.status));

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800',
      paid: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      on_the_way: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const downloadReceipt = (booking) => {
    const receipt = receipts.find(r => r.booking_id === booking.id);
    if (!receipt) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial; max-width: 800px; margin: 40px auto; padding: 20px; }
          .header { text-align: center; border-bottom: 3px solid #4A90A4; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #4A90A4; margin: 0; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .section { background: #f8f9fa; padding: 15px; border-radius: 8px; }
          .section-title { font-weight: bold; color: #4A90A4; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
          th { background: #4A90A4; color: white; }
          .total { font-size: 20px; font-weight: bold; text-align: right; color: #4A90A4; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 TaskCham</h1>
          <p>Kvitto</p>
          <p><strong>${receipt.receipt_number}</strong></p>
        </div>

        <div class="info">
          <div class="section">
            <div class="section-title">Kund</div>
            <p>${receipt.customer_name}<br>${receipt.customer_email}</p>
          </div>
          <div class="section">
            <div class="section-title">Datum</div>
            <p>${new Date(receipt.created_date).toLocaleDateString('sv-SE')}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tjänst</th>
              <th>Beskrivning</th>
              <th>Belopp</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Grundpris</td>
              <td>${receipt.service_description || receipt.service_type}</td>
              <td>${receipt.base_price} kr</td>
            </tr>
            ${receipt.distance_fee > 0 ? `
            <tr>
              <td>Avstånd</td>
              <td>Transport</td>
              <td>${receipt.distance_fee} kr</td>
            </tr>` : ''}
            ${receipt.add_ons?.map(addon => `
            <tr>
              <td>${addon.name}</td>
              <td>Tillägg</td>
              <td>${addon.price} kr</td>
            </tr>`).join('') || ''}
            ${receipt.discount_amount > 0 ? `
            <tr>
              <td>Rabatt</td>
              <td>${receipt.promo_code || 'Kampanj'}</td>
              <td style="color: green;">-${receipt.discount_amount} kr</td>
            </tr>` : ''}
            <tr>
              <td colspan="2"><strong>Totalt (inkl. 25% moms)</strong></td>
              <td><strong>${receipt.total_amount} kr</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="section">
          <div class="section-title">Betalning</div>
          <p>Betald via ${receipt.payment_method || 'Stripe'}</p>
          ${receipt.runner_name ? `<p>Utfört av: ${receipt.runner_name}</p>` : ''}
        </div>

        <div class="footer">
          <p>TaskCham AB • Org.nr: XXXXXX-XXXX</p>
          <p>info@taskcham.se • www.taskcham.se</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TaskCham-Kvitto-${receipt.receipt_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dina Bokningar</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-6">
              <TabsTrigger value="active">Aktiva ({activeBookings.length})</TabsTrigger>
              <TabsTrigger value="completed">Historik ({completedBookings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Inga aktiva bokningar</p>
              ) : (
                <div className="space-y-3">
                  {activeBookings.map(booking => (
                    <Card key={booking.id} className="border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-lg">#{booking.booking_number}</p>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">{booking.total_price} kr</p>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {booking.service_type?.replace('_', ' ')}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {booking.preferred_date}
                          </div>
                        </div>

                        {booking.assigned_driver_id && (
                          <div className="mt-3">
                            <RunnerProfileCard 
                              driver={getDriver(booking.assigned_driver_id)} 
                              variant="compact"
                            />
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t">
                          <BookingActions 
                            booking={booking} 
                            onRebook={() => {
                              window.location.href = `/booking?repeat=${encodeURIComponent(JSON.stringify({
                                service_type: booking.service_type,
                                pickup_address: booking.pickup_address,
                                delivery_address: booking.delivery_address,
                                item_description: booking.item_description
                              }))}`;
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Ingen historik ännu</p>
              ) : (
                <div className="space-y-3">
                  {completedBookings.map(booking => (
                    <Card key={booking.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold">#{booking.booking_number}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.completed_date || booking.updated_date).toLocaleDateString('sv-SE')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">{booking.total_price} kr</p>
                            <div className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              Slutförd
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadReceipt(booking)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Kvitto
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowReceipt(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Detaljer
                            </Button>
                          </div>
                          <BookingActions 
                            booking={booking} 
                            onRebook={() => {
                              window.location.href = `/booking?repeat=${encodeURIComponent(JSON.stringify({
                                service_type: booking.service_type,
                                pickup_address: booking.pickup_address,
                                delivery_address: booking.delivery_address,
                                item_description: booking.item_description
                              }))}`;
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Receipt Detail Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kvittoinfo</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Bokningsnummer</p>
                <p className="text-2xl font-bold text-blue-600">#{selectedBooking.booking_number}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tjänst</p>
                  <p className="font-semibold">{selectedBooking.service_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Datum</p>
                  <p className="font-semibold">
                    {new Date(selectedBooking.completed_date || selectedBooking.updated_date).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>

              {selectedBooking.assigned_driver_name && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Utfört av</p>
                  <RunnerProfileCard 
                    driver={getDriver(selectedBooking.assigned_driver_id)} 
                    variant="compact"
                  />
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Prisuppdelning
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grundpris:</span>
                    <span className="font-medium">{selectedBooking.base_price} kr</span>
                  </div>
                  {selectedBooking.distance_fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avstånd ({selectedBooking.distance_km?.toFixed(1)} km):</span>
                      <span className="font-medium">{selectedBooking.distance_fee} kr</span>
                    </div>
                  )}
                  {selectedBooking.add_ons?.map((addon, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-gray-600">{addon.name}:</span>
                      <span className="font-medium">{addon.price} kr</span>
                    </div>
                  ))}
                  {selectedBooking.protection_fee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Leveransskydd:
                      </span>
                      <span className="font-medium">{selectedBooking.protection_fee} kr</span>
                    </div>
                  )}
                  {selectedBooking.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Rabatt ({selectedBooking.promo_code}):
                      </span>
                      <span className="font-medium">-{selectedBooking.discount_amount} kr</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Totalt (inkl. moms):</span>
                    <span className="text-[#1E3A8A]">{selectedBooking.total_price} kr</span>
                  </div>
                  <p className="text-xs text-gray-500 text-right">varav moms (25%): {Math.round(selectedBooking.total_price * 0.25)} kr</p>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => downloadReceipt(selectedBooking)}
              >
                <Download className="h-4 w-4 mr-2" />
                Ladda ner Kvitto
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}