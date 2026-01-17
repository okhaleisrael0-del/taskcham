import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, TrendingUp, Users, Package, Calendar,
  ArrowUpRight, ArrowDownRight, CheckCircle
} from 'lucide-react';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

export default function FinancialOverview() {
  const [period, setPeriod] = useState('month');

  const { data: bookings = [] } = useQuery({
    queryKey: ['all-bookings-financial'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500)
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['all-payouts-financial'],
    queryFn: () => base44.entities.Payout.list('-created_date', 500)
  });

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch(period) {
      case 'day':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getDateRange();

  // Filter bookings for the period
  const periodBookings = bookings.filter(b => {
    const date = new Date(b.created_date);
    return date >= start && date <= end && b.status === 'completed' && b.payment_status === 'paid';
  });

  // Calculate metrics
  const totalRevenue = periodBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const platformFees = periodBookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0);
  const driverEarnings = periodBookings.reduce((sum, b) => sum + (b.driver_earnings || 0), 0);

  const paidPayouts = payouts.filter(p => {
    const date = new Date(p.processed_date || p.created_date);
    return date >= start && date <= end && p.status === 'completed';
  }).reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayouts = payouts.filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ekonomiöversikt</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Idag</SelectItem>
            <SelectItem value="week">Denna Vecka</SelectItem>
            <SelectItem value="month">Denna Månad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-sm text-gray-500">Total Intäkter</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {totalRevenue.toFixed(0)} SEK
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {periodBookings.length} slutförda bokningar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ArrowDownRight className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Förarens Intäkter</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {driverEarnings.toFixed(0)} SEK
            </p>
            <p className="text-xs text-gray-500 mt-2">
              80% av intäkter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ArrowUpRight className="h-5 w-5 text-[#4A90A4]" />
            </div>
            <p className="text-sm text-gray-500">Plattformsavgift</p>
            <p className="text-3xl font-bold text-[#4A90A4] mt-1">
              {platformFees.toFixed(0)} SEK
            </p>
            <p className="text-xs text-gray-500 mt-2">
              20% av intäkter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500">Utbetalda till Förare</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">
              {paidPayouts.toFixed(0)} SEK
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Väntande: {pendingPayouts.toFixed(0)} SEK
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Transaktioner ({period === 'day' ? 'Idag' : period === 'week' ? 'Denna Vecka' : 'Denna Månad'})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {periodBookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Inga transaktioner för vald period</p>
            ) : (
              periodBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">#{booking.booking_number}</p>
                    <p className="text-sm text-gray-500">
                      {booking.assigned_driver_name} • {new Date(booking.created_date).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{booking.total_price} SEK</p>
                    <div className="flex gap-2 text-xs mt-1">
                      <span className="text-blue-600">Förare: {booking.driver_earnings || Math.round(booking.total_price * 0.8)} SEK</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-[#4A90A4]">Plattform: {booking.platform_fee || Math.round(booking.total_price * 0.2)} SEK</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}