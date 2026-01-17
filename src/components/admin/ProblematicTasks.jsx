import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Flag, XCircle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import RefundManagement from '@/components/admin/RefundManagement';

export default function ProblematicTasks({ currentUser }) {
  const queryClient = useQueryClient();
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [resolution, setResolution] = useState('');

  const { data: flags = [] } = useQuery({
    queryKey: ['booking-flags'],
    queryFn: () => base44.entities.BookingFlag.filter({ status: 'pending' })
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ['disputes-admin'],
    queryFn: () => base44.entities.Dispute.filter({ status: ['open', 'investigating'] })
  });

  const { data: unpaidBookings = [] } = useQuery({
    queryKey: ['unpaid-bookings'],
    queryFn: () => base44.entities.Booking.filter({ payment_status: 'pending' })
  });

  const resolveFlag = useMutation({
    mutationFn: async ({ flagId, resolution, newStatus }) => {
      await base44.entities.BookingFlag.update(flagId, {
        status: newStatus,
        resolution,
        resolved_by: currentUser.email,
        resolved_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['booking-flags']);
      setSelectedFlag(null);
      setResolution('');
      toast.success('Flagga hanterad');
    }
  });

  const deleteBooking = useMutation({
    mutationFn: async (bookingId) => {
      await base44.entities.Booking.delete(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['booking-flags']);
      queryClient.invalidateQueries(['admin-bookings']);
      toast.success('Uppdrag raderat');
    }
  });

  const getFlagColor = (type) => {
    const colors = {
      spam: 'bg-red-100 text-red-800',
      duplicate: 'bg-orange-100 text-orange-800',
      fraud: 'bg-red-100 text-red-800',
      unpaid: 'bg-yellow-100 text-yellow-800',
      abandoned: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Flagged Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Flaggade Uppdrag ({flags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Inga flaggade uppdrag</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => (
                <div key={flag.id} className="border-2 border-red-200 rounded-xl p-4 bg-red-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">#{flag.booking_number}</span>
                        <Badge className={getFlagColor(flag.flag_type)}>
                          {flag.flag_type}
                        </Badge>
                        {flag.auto_flagged && (
                          <Badge variant="outline" className="text-xs">
                            Auto-flagged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{flag.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Flaggad av: {flag.flagged_by} • {new Date(flag.created_date).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFlag(flag)}
                    >
                      Granska
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm('Radera detta uppdrag permanent?')) {
                          deleteBooking.mutate(flag.booking_id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Radera
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disputes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Aktiva Tvister ({disputes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Inga aktiva tvister</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="border-2 border-amber-200 rounded-xl p-4 bg-amber-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">#{dispute.booking_number}</span>
                        <Badge className="bg-amber-100 text-amber-800">
                          {dispute.issue_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{dispute.description}</p>
                      <div className="text-xs text-gray-500">
                       <p>Kund: {dispute.customer_name}</p>
                       {dispute.driver_name && <p>Förare: {dispute.driver_name}</p>}
                      </div>
                      </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                      <RefundManagement dispute={dispute} />
                      </div>
                      </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unpaid Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-yellow-500" />
            Ej Betalda Uppdrag ({unpaidBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unpaidBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Alla uppdrag är betalda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidBookings.slice(0, 10).map((booking) => (
                <div key={booking.id} className="border-2 border-yellow-200 rounded-xl p-4 bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold">#{booking.booking_number}</span>
                      <p className="text-sm text-gray-600">
                        {booking.customer_name} • {booking.total_price} kr
                      </p>
                      <p className="text-xs text-gray-400">
                        Skapad: {new Date(booking.created_date).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Radera detta obetalda uppdrag?')) {
                          deleteBooking.mutate(booking.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={!!selectedFlag} onOpenChange={() => setSelectedFlag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hantera Flagga</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFlag && (
              <>
                <div>
                  <p className="font-semibold mb-1">Uppdrag #{selectedFlag.booking_number}</p>
                  <Badge className={getFlagColor(selectedFlag.flag_type)}>
                    {selectedFlag.flag_type}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">{selectedFlag.reason}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Resolution Notes</label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Anteckna vad du gjorde..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => resolveFlag.mutate({
                      flagId: selectedFlag.id,
                      resolution,
                      newStatus: 'resolved'
                    })}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Lös
                  </Button>
                  <Button
                    className="flex-1 bg-gray-600 hover:bg-gray-700"
                    onClick={() => resolveFlag.mutate({
                      flagId: selectedFlag.id,
                      resolution: resolution || 'Dismissed without action',
                      newStatus: 'dismissed'
                    })}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Avvisa
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      if (confirm('Radera uppdraget permanent?')) {
                        deleteBooking.mutate(selectedFlag.booking_id);
                        setSelectedFlag(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Radera
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}