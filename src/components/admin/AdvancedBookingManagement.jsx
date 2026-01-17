import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, UserPlus, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RunnerMatchSuggestions from '@/components/admin/RunnerMatchSuggestions';
import { toast } from 'sonner';

export default function AdvancedBookingManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const { data: bookings = [] } = useQuery({
    queryKey: ['all-bookings-advanced'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500),
    refetchInterval: 10000
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['all-drivers-assign'],
    queryFn: () => base44.entities.Driver.filter({ status: 'approved' })
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({ bookingId, driverId }) => {
      const driver = drivers.find(d => d.id === driverId);
      await base44.entities.Booking.update(bookingId, {
        assigned_driver_id: driverId,
        assigned_driver_name: driver.name,
        assigned_driver_phone: driver.phone,
        status: 'assigned'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-bookings-advanced']);
      toast.success('Runner tilldelad');
    }
  });

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesService = serviceFilter === 'all' || b.service_type === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      price_review: 'bg-amber-100 text-amber-800',
      awaiting_payment: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      on_the_way: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-teal-100 text-teal-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avancerad Bokningshantering</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Sök bokning, kund..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla Statusar</SelectItem>
              <SelectItem value="paid">Betald</SelectItem>
              <SelectItem value="assigned">Tilldelad</SelectItem>
              <SelectItem value="on_the_way">På väg</SelectItem>
              <SelectItem value="completed">Slutförd</SelectItem>
              <SelectItem value="cancelled">Avbruten</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tjänst" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla Tjänster</SelectItem>
              <SelectItem value="delivery">Leverans</SelectItem>
              <SelectItem value="errand">Ärende</SelectItem>
              <SelectItem value="help_at_home">Hjälp Hemma</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            {filteredBookings.length} resultat
          </div>
        </div>

        {/* Bookings Table */}
        <div className="space-y-3">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold">#{booking.booking_number}</span>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    <Badge variant="outline">{booking.service_type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {booking.customer_name} • {booking.customer_email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    📅 {new Date(booking.created_date).toLocaleDateString('sv-SE')} • 
                    💰 {booking.total_price} kr
                  </p>
                </div>

                <div className="flex gap-2">
                  {booking.status === 'paid' && !booking.assigned_driver_id && (
                    <RunnerMatchSuggestions booking={booking} />
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {booking.assigned_driver_name && (
                <div className="bg-blue-50 rounded-lg p-2 text-sm">
                  <span className="text-blue-900">
                    👤 Runner: <strong>{booking.assigned_driver_name}</strong>
                  </span>
                </div>
              )}
            </div>
          ))}

          {filteredBookings.length === 0 && (
            <p className="text-center text-gray-500 py-8">Inga bokningar matchar filtren</p>
          )}
        </div>

        {/* Booking Details Dialog */}
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bokningsdetaljer - #{selectedBooking?.booking_number}</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Kund</p>
                    <p className="font-semibold">{selectedBooking.customer_name}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>

                {selectedBooking.pickup_address && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">📍 Upphämtning</p>
                    <p className="text-sm">{selectedBooking.pickup_address}</p>
                  </div>
                )}

                {selectedBooking.delivery_address && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">📍 Leverans</p>
                    <p className="text-sm">{selectedBooking.delivery_address}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Totalt:</span>
                    <span className="text-2xl font-bold text-[#1E3A8A]">
                      {selectedBooking.total_price} kr
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}