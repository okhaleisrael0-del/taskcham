import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Download, Calendar, DollarSign, 
  Package, Users, Star, Clock
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';

export default function AnalyticsReports() {
  const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90, 365, all
  const [reportType, setReportType] = useState('overview'); // overview, bookings, drivers, revenue

  const { data: bookings = [] } = useQuery({
    queryKey: ['analytics-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500)
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['analytics-drivers'],
    queryFn: () => base44.entities.Driver.list('-created_date', 200)
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['analytics-ratings'],
    queryFn: () => base44.entities.Rating.list('-created_date', 500)
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['analytics-payouts'],
    queryFn: () => base44.entities.Payout.list('-created_date', 500)
  });

  // Filter data by time range
  const getDateFilter = () => {
    if (timeRange === 'all') return null;
    const days = parseInt(timeRange);
    return subDays(new Date(), days);
  };

  const filteredBookings = useMemo(() => {
    const dateFilter = getDateFilter();
    if (!dateFilter) return bookings;
    return bookings.filter(b => new Date(b.created_date) >= dateFilter);
  }, [bookings, timeRange]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalBookings = filteredBookings.length;
    const completedBookings = filteredBookings.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const platformRevenue = completedBookings.reduce((sum, b) => sum + (b.platform_fee || b.total_price * 0.2), 0);
    const driverPayouts = completedBookings.reduce((sum, b) => sum + (b.driver_earnings || b.total_price * 0.8), 0);
    const avgBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;
    const completionRate = totalBookings > 0 ? (completedBookings.length / totalBookings) * 100 : 0;
    
    const activeDrivers = drivers.filter(d => d.status === 'approved' && d.availability === 'available').length;
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    return {
      totalBookings,
      completedBookings: completedBookings.length,
      totalRevenue,
      platformRevenue,
      driverPayouts,
      avgBookingValue,
      completionRate,
      activeDrivers,
      avgRating
    };
  }, [filteredBookings, drivers, ratings]);

  // Calculate trend data for charts
  const trendData = useMemo(() => {
    const dateFilter = getDateFilter();
    const days = timeRange === 'all' ? 90 : parseInt(timeRange);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayBookings = filteredBookings.filter(b => 
        format(new Date(b.created_date), 'yyyy-MM-dd') === dateStr
      );
      const completedDay = dayBookings.filter(b => b.status === 'completed');
      
      data.push({
        date: format(date, 'MMM dd'),
        bookings: dayBookings.length,
        completed: completedDay.length,
        revenue: completedDay.reduce((sum, b) => sum + (b.total_price || 0), 0),
        platformFee: completedDay.reduce((sum, b) => sum + (b.platform_fee || b.total_price * 0.2), 0)
      });
    }

    return data;
  }, [filteredBookings, timeRange]);

  // Service type breakdown
  const serviceTypeData = useMemo(() => {
    const types = {};
    filteredBookings.forEach(b => {
      const type = b.service_type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
      percentage: ((value / filteredBookings.length) * 100).toFixed(1)
    }));
  }, [filteredBookings]);

  // Driver performance data
  const driverPerformanceData = useMemo(() => {
    return drivers
      .map(driver => {
        const driverBookings = filteredBookings.filter(b => b.assigned_driver_id === driver.id);
        const completed = driverBookings.filter(b => b.status === 'completed').length;
        const revenue = driverBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.driver_earnings || b.total_price * 0.8), 0);
        const driverRatings = ratings.filter(r => r.driver_id === driver.id);
        const avgRating = driverRatings.length > 0
          ? driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length
          : 0;

        return {
          name: driver.name,
          completed,
          revenue: Math.round(revenue),
          avgRating: avgRating.toFixed(1),
          total: driverBookings.length
        };
      })
      .filter(d => d.total > 0)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10);
  }, [drivers, filteredBookings, ratings]);

  // Export to CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBookingsReport = () => {
    const data = filteredBookings.map(b => ({
      booking_number: b.booking_number,
      created_date: format(new Date(b.created_date), 'yyyy-MM-dd HH:mm'),
      service_type: b.service_type,
      status: b.status,
      customer_name: b.customer_name,
      customer_email: b.customer_email,
      driver_name: b.assigned_driver_name || 'Ej tilldelad',
      total_price: b.total_price,
      platform_fee: b.platform_fee || b.total_price * 0.2,
      driver_earnings: b.driver_earnings || b.total_price * 0.8,
      payment_status: b.payment_status
    }));
    exportToCSV(data, 'bookings_report');
  };

  const exportDriverReport = () => {
    const data = driverPerformanceData.map(d => ({
      driver_name: d.name,
      total_bookings: d.total,
      completed_bookings: d.completed,
      completion_rate: ((d.completed / d.total) * 100).toFixed(1) + '%',
      total_revenue: d.revenue,
      avg_rating: d.avgRating
    }));
    exportToCSV(data, 'driver_performance_report');
  };

  const exportRevenueReport = () => {
    const data = trendData.map(d => ({
      date: d.date,
      bookings: d.bookings,
      completed: d.completed,
      revenue: d.revenue.toFixed(0),
      platform_fee: d.platformFee.toFixed(0)
    }));
    exportToCSV(data, 'revenue_report');
  };

  const COLORS = ['#4A90A4', '#7FB069', '#F4A259', '#E63946', '#A8DADC', '#457B9D'];

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{Math.abs(trend).toFixed(1)}% från föregående period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Senaste 7 dagarna</SelectItem>
              <SelectItem value="30">Senaste 30 dagarna</SelectItem>
              <SelectItem value="90">Senaste 90 dagarna</SelectItem>
              <SelectItem value="365">Senaste året</SelectItem>
              <SelectItem value="all">All tid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportBookingsReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Bokningar
          </Button>
          <Button variant="outline" size="sm" onClick={exportDriverReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Förare
          </Button>
          <Button variant="outline" size="sm" onClick={exportRevenueReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Intäkter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Totala Bokningar"
          value={metrics.totalBookings}
          subtitle={`${metrics.completedBookings} slutförda`}
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Total Intäkt"
          value={`${Math.round(metrics.totalRevenue)} kr`}
          subtitle={`Genomsnitt: ${Math.round(metrics.avgBookingValue)} kr/bokning`}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Plattformsintäkt"
          value={`${Math.round(metrics.platformRevenue)} kr`}
          subtitle={`Utbetalat: ${Math.round(metrics.driverPayouts)} kr`}
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Genomsnitt Betyg"
          value={metrics.avgRating.toFixed(1)}
          subtitle={`${ratings.length} betyg totalt`}
          icon={Star}
          color="amber"
        />
      </div>

      {/* Booking Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bokningstrend över tid</CardTitle>
            <Badge>{trendData.length} dagar</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="bookings" stackId="1" stroke="#4A90A4" fill="#4A90A4" name="Alla Bokningar" />
              <Area type="monotone" dataKey="completed" stackId="2" stroke="#7FB069" fill="#7FB069" name="Slutförda" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Intäktstrend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#7FB069" strokeWidth={2} name="Total Intäkt (kr)" />
              <Line type="monotone" dataKey="platformFee" stroke="#4A90A4" strokeWidth={2} name="Plattformsavgift (kr)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Service Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Fördelning per Tjänstetyp</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Drivers */}
        <Card>
          <CardHeader>
            <CardTitle>Topp 10 Förare - Prestanda</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={driverPerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#7FB069" name="Slutförda" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detaljerad Förarstatistik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3 font-semibold">Förare</th>
                  <th className="pb-3 font-semibold text-right">Totalt</th>
                  <th className="pb-3 font-semibold text-right">Slutförda</th>
                  <th className="pb-3 font-semibold text-right">%</th>
                  <th className="pb-3 font-semibold text-right">Intäkt</th>
                  <th className="pb-3 font-semibold text-right">Betyg</th>
                </tr>
              </thead>
              <tbody>
                {driverPerformanceData.map((driver, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3">{driver.name}</td>
                    <td className="py-3 text-right">{driver.total}</td>
                    <td className="py-3 text-right">{driver.completed}</td>
                    <td className="py-3 text-right">
                      <Badge className={
                        (driver.completed / driver.total) >= 0.9 ? 'bg-green-100 text-green-800' :
                        (driver.completed / driver.total) >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {((driver.completed / driver.total) * 100).toFixed(0)}%
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-semibold">{driver.revenue} kr</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        {driver.avgRating}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slutförandegrad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{metrics.completionRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-2">
                {metrics.completedBookings} av {metrics.totalBookings} bokningar
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktiva Förare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{metrics.activeDrivers}</p>
              <p className="text-sm text-gray-500 mt-2">
                av {drivers.filter(d => d.status === 'approved').length} godkända
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Genomsnittligt Värde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-600">{Math.round(metrics.avgBookingValue)} kr</p>
              <p className="text-sm text-gray-500 mt-2">per slutförd bokning</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}