import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users, Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function DashboardMetrics() {
  const { data: bookings = [] } = useQuery({
    queryKey: ['all-bookings-metrics'],
    queryFn: () => base44.entities.Booking.list('-created_date', 1000)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users-metrics'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['all-drivers-metrics'],
    queryFn: () => base44.entities.Driver.list()
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ['disputes-metrics'],
    queryFn: () => base44.entities.Dispute.filter({ status: ['open', 'investigating'] })
  });

  // Calculate metrics
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const activeBookings = bookings.filter(b => 
    ['paid', 'assigned', 'picked_up', 'on_the_way', 'in_progress'].includes(b.status)
  );

  const completedLast30 = bookings.filter(b => 
    b.status === 'completed' && new Date(b.completed_date) >= last30Days
  );

  const completedLast60 = bookings.filter(b => 
    b.status === 'completed' && 
    new Date(b.completed_date) >= last60Days &&
    new Date(b.completed_date) < last30Days
  );

  const revenueLast30 = completedLast30.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const revenueLast60 = completedLast60.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const revenueGrowth = revenueLast60 > 0 ? ((revenueLast30 - revenueLast60) / revenueLast60 * 100) : 0;

  const newUsersLast30 = users.filter(u => new Date(u.created_date) >= last30Days).length;
  const activeDrivers = drivers.filter(d => d.availability === 'available').length;
  const pendingPayouts = drivers.reduce((sum, d) => sum + (d.current_balance || 0), 0);

  const metrics = [
    {
      title: 'Aktiva Uppdrag',
      value: activeBookings.length,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtext: `${bookings.filter(b => b.status === 'paid').length} väntar tilldelning`
    },
    {
      title: 'Intäkter (30 dagar)',
      value: `${revenueLast30.toLocaleString('sv-SE')} kr`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: revenueGrowth,
      subtext: `${completedLast30.length} slutförda uppdrag`
    },
    {
      title: 'Nya Användare',
      value: newUsersLast30,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtext: `${users.length} totalt`
    },
    {
      title: 'Aktiva Runners',
      value: `${activeDrivers}/${drivers.length}`,
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      subtext: `${drivers.filter(d => d.status === 'approved').length} godkända`
    },
    {
      title: 'Väntande Utbetalningar',
      value: `${pendingPayouts.toLocaleString('sv-SE')} kr`,
      icon: Package,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      subtext: 'Till runners'
    },
    {
      title: 'Aktiva Tvister',
      value: disputes.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      subtext: disputes.length > 0 ? 'Kräver uppmärksamhet' : 'Allt OK'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${metric.bgColor} rounded-xl flex items-center justify-center`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              {metric.trend !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  metric.trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(metric.trend).toFixed(1)}%
                </div>
              )}
            </div>
            <h3 className="text-sm text-gray-500 mb-1">{metric.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
            <p className="text-xs text-gray-500">{metric.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}