import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MapPin, DollarSign, Clock, Package } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function BookingHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
  });

  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const matchesSearch = 
        booking.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.assigned_driver_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'date_asc':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'price_desc':
          return (b.total_price || 0) - (a.total_price || 0);
        case 'price_asc':
          return (a.total_price || 0) - (b.total_price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [bookings, searchTerm, statusFilter, sortBy]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Utkast', color: 'bg-gray-100 text-gray-700' },
      price_review: { label: 'Prisöversyn', color: 'bg-yellow-100 text-yellow-700' },
      awaiting_payment: { label: 'Väntar betalning', color: 'bg-orange-100 text-orange-700' },
      paid: { label: 'Betald', color: 'bg-green-100 text-green-700' },
      assigned: { label: 'Tilldelad', color: 'bg-blue-100 text-blue-700' },
      picked_up: { label: 'Upphämtad', color: 'bg-indigo-100 text-indigo-700' },
      on_the_way: { label: 'På väg', color: 'bg-purple-100 text-purple-700' },
      delivered: { label: 'Levererad', color: 'bg-teal-100 text-teal-700' },
      completed: { label: 'Slutförd', color: 'bg-green-100 text-green-700' },
      archived: { label: 'Arkiverad', color: 'bg-gray-100 text-gray-700' },
      cancelled: { label: 'Avbruten', color: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">Laddar bokningshistorik...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Sök på bokningsnummer, kund, eller runner..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrera status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statuser</SelectItem>
            <SelectItem value="completed">Slutförda</SelectItem>
            <SelectItem value="cancelled">Avbrutna</SelectItem>
            <SelectItem value="archived">Arkiverade</SelectItem>
            <SelectItem value="delivered">Levererade</SelectItem>
            <SelectItem value="on_the_way">På väg</SelectItem>
            <SelectItem value="assigned">Tilldelade</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sortera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Nyast först</SelectItem>
            <SelectItem value="date_asc">Äldst först</SelectItem>
            <SelectItem value="price_desc">Högst pris</SelectItem>
            <SelectItem value="price_asc">Lägst pris</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-gray-600">
        Visar {filteredAndSortedBookings.length} av {bookings.length} bokningar
      </div>

      <div className="space-y-4">
        {filteredAndSortedBookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{booking.booking_number}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(booking.status)}
                    <span className="text-sm text-gray-500 capitalize">
                      {booking.service_type?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {booking.total_price || booking.proposed_price || 0} kr
                  </div>
                  <div className="text-xs text-gray-500">
                    {booking.payment_status === 'paid' ? '✓ Betald' : 'Ej betald'}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium">{booking.customer_name}</div>
                    <div className="text-sm text-gray-600">{booking.customer_email}</div>
                    <div className="text-sm text-gray-600">{booking.customer_phone}</div>
                  </div>
                </div>

                {booking.assigned_driver_name && (
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Runner: {booking.assigned_driver_name}</div>
                      <div className="text-sm text-gray-600">{booking.assigned_driver_phone}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Skapad</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(booking.created_date), 'PPP HH:mm', { locale: sv })}
                    </div>
                  </div>
                </div>

                {booking.completed_date && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Slutförd</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(booking.completed_date), 'PPP HH:mm', { locale: sv })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {(booking.pickup_address || booking.delivery_address || booking.task_location) && (
                <div className="border-t pt-3 space-y-2">
                  {booking.pickup_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">Upphämtning: </span>
                        {booking.pickup_address}
                      </div>
                    </div>
                  )}
                  {booking.delivery_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">Leverans: </span>
                        {booking.delivery_address}
                      </div>
                    </div>
                  )}
                  {booking.task_location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">Plats: </span>
                        {booking.task_location}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {booking.item_description && (
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Beskrivning: </span>
                    {booking.item_description}
                  </div>
                </div>
              )}

              {booking.notes_for_driver && (
                <div className="bg-yellow-50 p-2 rounded text-sm">
                  <span className="font-medium">Anteckningar: </span>
                  {booking.notes_for_driver}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredAndSortedBookings.length === 0 && (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              Inga bokningar hittades med de valda filtren.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}