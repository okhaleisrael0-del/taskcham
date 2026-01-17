import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, Clock } from 'lucide-react';

export default function JobHeatmap() {
  const { data: recentBookings = [] } = useQuery({
    queryKey: ['recent-bookings-heatmap'],
    queryFn: async () => {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      return await base44.entities.Booking.list('-created_date', 50);
    },
    refetchInterval: 30000 // 30 seconds
  });

  const zones = useMemo(() => {
    const areaCount = {};
    const currentHour = new Date().getHours();

    recentBookings.forEach(booking => {
      const area = booking.area_type || 'city';
      if (!areaCount[area]) {
        areaCount[area] = {
          total: 0,
          pending: 0,
          active: 0,
          avgPrice: 0,
          priceSum: 0
        };
      }
      areaCount[area].total += 1;
      areaCount[area].priceSum += booking.total_price || 0;
      
      if (booking.status === 'pending' || booking.status === 'paid') {
        areaCount[area].pending += 1;
      }
      if (['assigned', 'picked_up', 'in_progress'].includes(booking.status)) {
        areaCount[area].active += 1;
      }
    });

    // Calculate average and determine demand level
    return Object.entries(areaCount).map(([area, data]) => ({
      area,
      ...data,
      avgPrice: data.total > 0 ? Math.round(data.priceSum / data.total) : 0,
      demand: data.pending >= 3 ? 'high' : data.pending >= 1 ? 'medium' : 'low'
    })).sort((a, b) => b.pending - a.pending);
  }, [recentBookings]);

  const peakHours = useMemo(() => {
    const hourCounts = Array(24).fill(0);
    recentBookings.forEach(booking => {
      if (booking.created_date) {
        const hour = new Date(booking.created_date).getHours();
        hourCounts[hour] += 1;
      }
    });
    
    const currentHour = new Date().getHours();
    const upcomingPeaks = [];
    
    // Check next 6 hours
    for (let i = 1; i <= 6; i++) {
      const hour = (currentHour + i) % 24;
      if (hourCounts[hour] >= 3) {
        upcomingPeaks.push({ hour, count: hourCounts[hour] });
      }
    }
    
    return upcomingPeaks;
  }, [recentBookings]);

  const getDemandColor = (demand) => {
    switch(demand) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDemandIcon = (demand) => {
    switch(demand) {
      case 'high': return '🔥';
      case 'medium': return '📍';
      default: return '💤';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <TrendingUp className="h-5 w-5" />
            Efterfrågan i Göteborg
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {zones.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Ingen data tillgänglig ännu</p>
            ) : (
              zones.map(zone => (
                <div 
                  key={zone.area}
                  className={`p-4 rounded-xl border-2 ${getDemandColor(zone.demand)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getDemandIcon(zone.demand)}</span>
                      <div>
                        <p className="font-bold capitalize">{zone.area}</p>
                        <p className="text-xs opacity-75">
                          {zone.pending} jobb väntar • {zone.active} aktiva
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-white/50">
                        {zone.demand === 'high' ? 'HÖG EFTERFRÅGAN' :
                         zone.demand === 'medium' ? 'MEDEL' :
                         'LÅG'}
                      </Badge>
                      <p className="text-xs mt-1 opacity-75">~{zone.avgPrice} kr/jobb</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {peakHours.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-1" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">Kommande Rushningstider</p>
                <div className="space-y-1">
                  {peakHours.map(peak => (
                    <p key={peak.hour} className="text-sm text-amber-800">
                      ⚡ {peak.hour}:00 - {peak.hour + 1}:00 ({peak.count} jobb förväntade)
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}