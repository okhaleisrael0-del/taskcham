import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Calendar, FileText, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function EarningsDashboard({ driverProfile }) {
  const { data: earnings = [] } = useQuery({
    queryKey: ['runner-earnings', driverProfile?.id],
    queryFn: () => base44.entities.RunnerEarnings.filter({ runner_id: driverProfile?.id }),
    enabled: !!driverProfile?.id
  });

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentWeek = Math.ceil(now.getDate() / 7);
    const currentMonth = now.toISOString().substring(0, 7);

    const todayEarnings = earnings
      .filter(e => e.task_completed_date?.startsWith(today))
      .reduce((sum, e) => sum + (e.total_earning || 0), 0);

    const weekEarnings = earnings
      .filter(e => e.week_number === currentWeek && e.month === currentMonth)
      .reduce((sum, e) => sum + (e.total_earning || 0), 0);

    const monthEarnings = earnings
      .filter(e => e.month === currentMonth)
      .reduce((sum, e) => sum + (e.total_earning || 0), 0);

    const allTimeEarnings = earnings.reduce((sum, e) => sum + (e.total_earning || 0), 0);

    const availableForPayout = earnings
      .filter(e => e.status === 'available')
      .reduce((sum, e) => sum + (e.total_earning || 0), 0);

    const todayTasks = earnings.filter(e => e.task_completed_date?.startsWith(today)).length;
    const weekTasks = earnings.filter(e => e.week_number === currentWeek && e.month === currentMonth).length;

    return {
      today: todayEarnings,
      week: weekEarnings,
      month: monthEarnings,
      allTime: allTimeEarnings,
      available: availableForPayout,
      todayTasks,
      weekTasks
    };
  }, [earnings]);

  // Group by month for history
  const earningsByMonth = useMemo(() => {
    const grouped = {};
    earnings.forEach(e => {
      const month = e.month || 'Unknown';
      if (!grouped[month]) {
        grouped[month] = {
          total: 0,
          base: 0,
          bonus: 0,
          tasks: 0
        };
      }
      grouped[month].total += e.total_earning || 0;
      grouped[month].base += e.base_earning || 0;
      grouped[month].bonus += e.bonus_amount || 0;
      grouped[month].tasks += 1;
    });
    return grouped;
  }, [earnings]);

  const downloadTaxReport = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const report = Object.entries(earningsByMonth)
      .filter(([month]) => month.startsWith(String(year)))
      .map(([month, data]) => ({
        month,
        total: data.total,
        tasks: data.tasks
      }));

    const csvContent = [
      ['Månad', 'Totalt (SEK)', 'Antal Uppdrag'],
      ...report.map(r => [r.month, r.total, r.tasks])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskcham-intakter-${year}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-green-700">IDAG</p>
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-black text-green-700">{stats.today} kr</p>
            <p className="text-xs text-green-600 mt-1">{stats.todayTasks} uppdrag</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-blue-700">DENNA VECKA</p>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-blue-700">{stats.week} kr</p>
            <p className="text-xs text-blue-600 mt-1">{stats.weekTasks} uppdrag</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-purple-700">DENNA MÅNAD</p>
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-black text-purple-700">{stats.month} kr</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-amber-700">TOTALT</p>
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-3xl font-black text-amber-700">{stats.allTime} kr</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Balance */}
      {stats.available > 0 && (
        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-semibold mb-1">Tillgängligt för utbetalning</p>
                <p className="text-4xl font-black text-green-700">{stats.available} kr</p>
                <p className="text-xs text-green-600 mt-2">
                  Betalas ut automatiskt varje vecka till ditt konto
                </p>
              </div>
              <DollarSign className="h-16 w-16 text-green-300" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detaljerad Historik</CardTitle>
            <Button variant="outline" size="sm" onClick={downloadTaxReport}>
              <Download className="h-4 w-4 mr-2" />
              Ladda ner Skatteunderlag
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tasks">
            <TabsList className="mb-4">
              <TabsTrigger value="tasks">Per Uppdrag</TabsTrigger>
              <TabsTrigger value="monthly">Månatligt</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <div className="space-y-2">
                {earnings.slice(0, 20).map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">#{earning.booking_number}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(earning.task_completed_date).toLocaleDateString('sv-SE')}
                      </p>
                      {earning.bonus_amount > 0 && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs mt-1">
                          +{earning.bonus_amount} kr bonus
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">{earning.total_earning} kr</p>
                      <Badge className={
                        earning.status === 'paid_out' ? 'bg-green-100 text-green-800' :
                        earning.status === 'available' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {earning.status === 'paid_out' ? 'Utbetald' :
                         earning.status === 'available' ? 'Tillgänglig' :
                         'Väntar'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="monthly">
              <div className="space-y-3">
                {Object.entries(earningsByMonth)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([month, data]) => (
                    <div key={month} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg">{month}</p>
                          <p className="text-sm text-gray-500">{data.tasks} uppdrag</p>
                        </div>
                        <p className="text-2xl font-black text-green-600">{data.total} kr</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Basintäkt</p>
                          <p className="font-semibold">{data.base} kr</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Bonusar</p>
                          <p className="font-semibold text-amber-600">{data.bonus} kr</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}