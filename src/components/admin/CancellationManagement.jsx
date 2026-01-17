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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, DollarSign, CheckCircle, XCircle, User, Package } from 'lucide-react';

export default function CancellationManagement() {
  const queryClient = useQueryClient();
  const [compensationDialog, setCompensationDialog] = useState({ open: false, booking: null });
  const [compensationAmount, setCompensationAmount] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [notes, setNotes] = useState('');

  const { data: cancelledBookings = [] } = useQuery({
    queryKey: ['cancelled-bookings'],
    queryFn: () => base44.entities.Booking.filter({ status: 'cancelled' }),
  });

  const { data: compensations = [] } = useQuery({
    queryKey: ['cancellation-compensations'],
    queryFn: () => base44.entities.CancellationCompensation.list('-created_date', 100),
  });

  const createCompensationMutation = useMutation({
    mutationFn: async ({ booking, amount, reason }) => {
      // Check if already exists
      const existing = compensations.find(c => c.booking_id === booking.id);
      if (existing) {
        throw new Error('Kompensation finns redan för denna bokning');
      }

      await base44.entities.CancellationCompensation.create({
        booking_id: booking.id,
        booking_number: booking.booking_number,
        runner_id: booking.assigned_driver_id,
        runner_name: booking.assigned_driver_name,
        cancellation_reason: reason,
        was_accepted: !!booking.assigned_driver_id,
        was_started: ['on_the_way', 'picked_up', 'in_progress'].includes(booking.status),
        compensation_amount: parseFloat(amount),
        status: 'pending'
      });

      // Add to runner's earnings
      await base44.entities.RunnerEarnings.create({
        runner_id: booking.assigned_driver_id,
        runner_name: booking.assigned_driver_name,
        booking_id: booking.id,
        booking_number: booking.booking_number,
        base_earning: parseFloat(amount),
        total_earning: parseFloat(amount),
        status: 'available',
        task_completed_date: new Date().toISOString(),
        week_number: Math.ceil(new Date().getDate() / 7),
        month: new Date().toISOString().substring(0, 7),
        year: new Date().getFullYear()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cancellation-compensations']);
      queryClient.invalidateQueries(['runner-earnings']);
      setCompensationDialog({ open: false, booking: null });
      setCompensationAmount('');
      setCancellationReason('');
      setNotes('');
      alert('Kompensation skapad och tillgänglig för utbetalning');
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const updateCompensationMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.CancellationCompensation.update(id, {
        status,
        paid_date: status === 'paid' ? new Date().toISOString() : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cancellation-compensations']);
    }
  });

  const calculateSuggestedCompensation = (booking) => {
    if (!booking.assigned_driver_id) return 0;
    
    const fullPayout = booking.driver_earnings || Math.round(booking.total_price * 0.8);
    
    // If started (on the way or picked up), give 50-75%
    if (['on_the_way', 'picked_up', 'in_progress'].includes(booking.status)) {
      return Math.round(fullPayout * 0.75);
    }
    
    // If just assigned, give 25%
    if (booking.status === 'assigned') {
      return Math.round(fullPayout * 0.25);
    }
    
    return 0;
  };

  const openCompensationDialog = (booking) => {
    const suggested = calculateSuggestedCompensation(booking);
    setCompensationAmount(suggested.toString());
    setCompensationDialog({ open: true, booking });
  };

  // Filter bookings that had assigned runners
  const eligibleCancellations = cancelledBookings.filter(b => b.assigned_driver_id);
  
  // Check which already have compensation
  const bookingsWithCompensation = eligibleCancellations.map(booking => ({
    ...booking,
    hasCompensation: compensations.some(c => c.booking_id === booking.id),
    compensation: compensations.find(c => c.booking_id === booking.id)
  }));

  const pendingCompensations = compensations.filter(c => c.status === 'pending');
  const paidCompensations = compensations.filter(c => c.status === 'paid');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avbokningar totalt</p>
                <p className="text-3xl font-bold text-gray-900">{cancelledBookings.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Behöver kompensation</p>
                <p className="text-3xl font-bold text-amber-600">
                  {eligibleCancellations.filter(b => !compensations.some(c => c.booking_id === b.id)).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Utbetald kompensation</p>
                <p className="text-3xl font-bold text-green-600">
                  {paidCompensations.reduce((sum, c) => sum + (c.compensation_amount || 0), 0)} kr
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Compensations */}
      {pendingCompensations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Väntande Kompensationer ({pendingCompensations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingCompensations.map((comp) => (
                <div key={comp.id} className="bg-white rounded-lg p-4 border-2 border-amber-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">#{comp.booking_number}</p>
                      <p className="text-sm text-gray-600">{comp.runner_name}</p>
                      <Badge className="bg-amber-100 text-amber-800 mt-1">
                        {comp.cancellation_reason?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-600">{comp.compensation_amount} kr</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateCompensationMutation.mutate({ id: comp.id, status: 'approved' })}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Godkänn
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200"
                      onClick={() => updateCompensationMutation.mutate({ id: comp.id, status: 'paid' })}
                    >
                      Markera som utbetald
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Bookings Needing Compensation */}
      <Card>
        <CardHeader>
          <CardTitle>Avbokade Uppdrag - Kompensationshantering</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookingsWithCompensation.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Inga avbokade uppdrag med tilldelade runners</p>
            ) : (
              bookingsWithCompensation.map((booking) => (
                <div
                  key={booking.id}
                  className={`border rounded-lg p-4 ${
                    booking.hasCompensation ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">#{booking.booking_number}</span>
                        {booking.hasCompensation && (
                          <Badge className="bg-green-100 text-green-800">
                            Kompensation hanterad
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          Runner: {booking.assigned_driver_name}
                        </p>
                        <p className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          Status vid avbokning: <Badge variant="outline">{booking.status}</Badge>
                        </p>
                        <p className="text-gray-600">
                          Avbokad: {new Date(booking.updated_date).toLocaleString('sv-SE')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {booking.hasCompensation ? (
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            {booking.compensation.compensation_amount} kr
                          </p>
                          <Badge className={
                            booking.compensation.status === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-amber-100 text-amber-800'
                          }>
                            {booking.compensation.status === 'paid' ? 'Utbetald' : 'Väntande'}
                          </Badge>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => openCompensationDialog(booking)}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Skapa Kompensation
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compensation Dialog */}
      <Dialog open={compensationDialog.open} onOpenChange={(open) => {
        if (!open) {
          setCompensationDialog({ open: false, booking: null });
          setCompensationAmount('');
          setCancellationReason('');
          setNotes('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa Kompensation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Bokning</p>
              <p className="font-semibold">#{compensationDialog.booking?.booking_number}</p>
              <p className="text-sm text-gray-600">{compensationDialog.booking?.assigned_driver_name}</p>
            </div>

            <div>
              <Label>Anledning till avbokning</Label>
              <Select value={cancellationReason} onValueChange={setCancellationReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj anledning" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_cancelled">Kund avbokade</SelectItem>
                  <SelectItem value="store_unavailable">Butik inte tillgänglig</SelectItem>
                  <SelectItem value="weather">Väderproblem</SelectItem>
                  <SelectItem value="other">Övrigt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Kompensationsbelopp (SEK)</Label>
              <Input
                type="number"
                value={compensationAmount}
                onChange={(e) => setCompensationAmount(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Föreslagen kompensation baserat på status: {calculateSuggestedCompensation(compensationDialog.booking || {})} kr
              </p>
            </div>

            <div>
              <Label>Anteckningar (valfritt)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ytterligare information..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompensationDialog({ open: false, booking: null })}
            >
              Avbryt
            </Button>
            <Button
              onClick={() => createCompensationMutation.mutate({
                booking: compensationDialog.booking,
                amount: compensationAmount,
                reason: cancellationReason
              })}
              disabled={!compensationAmount || !cancellationReason || createCompensationMutation.isPending}
            >
              Skapa Kompensation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}