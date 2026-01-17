import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Package, DollarSign, Calendar } from 'lucide-react';

export default function BusinessAnalytics({ businessAccount }) {
  const { data: bookings = [] } = useQuery({
    queryKey: ['business-analytics-bookings', businessAccount?.id],
    queryFn: () => base44.entities.Booking.filter({ business_account_id: businessAccount.id }),
    enabled: !!businessAccount?.id
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['business-analytics-team', businessAccount?.id],
    queryFn: () => base44.entities.TeamMember.filter({ business_account_id: businessAccount.id }),
    enabled: !!businessAccount?.id
  });

  const analytics = useMemo(() => {
    // Total metrics
    const totalSpending = bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;

    // By department
    const byDepartment = {};
    bookings.forEach(booking => {
      const member = teamMembers.find(m => m.user_email === booking.customer_email);
      const dept = member?.department || 'Okänd';
      
      if (!byDepartment[dept]) {
        byDepartment[dept] = { count: 0, spending: 0 };
      }
      byDepartment[dept].count++;
      if (booking.payment_status === 'paid') {
        byDepartment[dept].spending += booking.total_price || 0;
      }
    });

    const departmentData = Object.entries(byDepartment).map(([name, data]) => ({
      name,
      bokningar: data.count,
      kostnad: data.spending
    }));

    // By employee
    const byEmployee = {};
    bookings.forEach(booking => {
      const email = booking.customer_email;
      const member = teamMembers.find(m => m.user_email === email);
      
      if (!byEmployee[email]) {
        byEmployee[email] = {
          email,
          name: member?.full_name || booking.customer_name || email,
          department: member?.department,
          count: 0,
          spending: 0
        };
      }
      byEmployee[email].count++;
      if (booking.payment_status === 'paid') {
        byEmployee[email].spending += booking.total_price || 0;
      }
    });

    const employeeData = Object.values(byEmployee).sort((a, b) => b.spending - a.spending);

    // By month
    const byMonth = {};
    bookings.forEach(booking => {
      const month = new Date(booking.created_date).toISOString().substring(0, 7);
      if (!byMonth[month]) {
        byMonth[month] = { count: 0, spending: 0 };
      }
      byMonth[month].count++;
      if (booking.payment_status === 'paid') {
        byMonth[month].spending += booking.total_price || 0;
      }
    });

    const monthData = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        månad: new Date(month + '-01').toLocaleDateString('sv-SE', { month: 'short', year: '2-digit' }),
        bokningar: data.count,
        kostnad: data.spending
      }));

    // Service type breakdown
    const byService = {};
    bookings.forEach(booking => {
      const service = booking.service_type || 'other';
      if (!byService[service]) {
        byService[service] = { count: 0, spending: 0 };
      }
      byService[service].count++;
      if (booking.payment_status === 'paid') {
        byService[service].spending += booking.total_price || 0;
      }
    });

    const serviceData = Object.entries(byService).map(([name, data]) => ({
      name: name.replace('_', ' '),
      value: data.spending
    }));

    return {
      totalSpending,
      totalBookings,
      completedBookings,
      departmentData,
      employeeData,
      monthData,
      serviceData
    };
  }, [bookings, teamMembers]);

  const COLORS = ['#1E3A8A', '#14B8A6', '#FACC15', '#22C55E', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 text-[#1E3A8A]" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Total Kostnad</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics.totalSpending.toLocaleString('sv-SE')} kr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Package className="h-8 w-8 text-[#14B8A6] mb-2" />
            <p className="text-sm text-gray-500">Bokningar</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalBookings}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Users className="h-8 w-8 text-[#FACC15] mb-2" />
            <p className="text-sm text-gray-500">Aktiva Teammedlemmar</p>
            <p className="text-2xl font-bold text-gray-900">
              {teamMembers.filter(m => m.status === 'active').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Calendar className="h-8 w-8 text-[#22C55E] mb-2" />
            <p className="text-sm text-gray-500">Snitt per Bokning</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics.totalBookings > 0 
                ? Math.round(analytics.totalSpending / analytics.totalBookings).toLocaleString('sv-SE')
                : 0} kr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="department">
        <TabsList>
          <TabsTrigger value="department">Per Avdelning</TabsTrigger>
          <TabsTrigger value="employee">Per Anställd</TabsTrigger>
          <TabsTrigger value="timeline">Tidslinj</TabsTrigger>
          <TabsTrigger value="services">Tjänster</TabsTrigger>
        </TabsList>

        <TabsContent value="department">
          <Card>
            <CardHeader>
              <CardTitle>Användning per Avdelning</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="kostnad" fill="#1E3A8A" name="Kostnad (kr)" />
                    <Bar dataKey="bokningar" fill="#14B8A6" name="Bokningar" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">Ingen data än</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employee">
          <Card>
            <CardHeader>
              <CardTitle>Topp Användare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.employeeData.slice(0, 10).map((emp, idx) => (
                  <div key={emp.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{emp.name}</p>
                        {emp.department && (
                          <p className="text-xs text-gray-500">{emp.department}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1E3A8A]">{emp.spending.toLocaleString('sv-SE')} kr</p>
                      <p className="text-xs text-gray-500">{emp.count} bokningar</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Användning över Tid</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.monthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.monthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="månad" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="kostnad" stroke="#1E3A8A" strokeWidth={2} name="Kostnad (kr)" />
                    <Line type="monotone" dataKey="bokningar" stroke="#14B8A6" strokeWidth={2} name="Bokningar" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">Ingen data än</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Fördelning per Tjänst</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.serviceData.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics.serviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.serviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {analytics.serviceData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span className="text-sm capitalize">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {item.value.toLocaleString('sv-SE')} kr
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Ingen data än</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}