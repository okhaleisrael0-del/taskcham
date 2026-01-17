import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Clock, CloudRain, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function PriceAdjustmentLog() {
  const [filterDays, setFilterDays] = useState('7');

  const { data: logs = [] } = useQuery({
    queryKey: ['price-adjustment-logs', filterDays],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(filterDays));
      
      const allLogs = await base44.entities.PriceAdjustmentLog.list('-created_date', 100);
      return allLogs.filter(log => new Date(log.created_date) >= cutoffDate);
    }
  });

  const totalAdjustments = logs.reduce((sum, log) => sum + (log.total_adjustment || 0), 0);
  const avgAdjustment = logs.length > 0 ? totalAdjustments / logs.length : 0;

  const getRuleIcon = (type) => {
    const icons = {
      time_based: <Clock className="h-3 w-3" />,
      weather_based: <CloudRain className="h-3 w-3" />,
      demand_based: <TrendingUp className="h-3 w-3" />,
      area_based: <MapPin className="h-3 w-3" />
    };
    return icons[type] || <Clock className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Prislogg</h2>
          <p className="text-gray-600">Historik över automatiska prisjusteringar</p>
        </div>
        <Select value={filterDays} onValueChange={setFilterDays}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Senaste dagen</SelectItem>
            <SelectItem value="7">Senaste veckan</SelectItem>
            <SelectItem value="30">Senaste månaden</SelectItem>
            <SelectItem value="90">Senaste 90 dagarna</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Totala Justeringar</p>
                <p className="text-2xl font-bold text-[#4A90A4]">
                  {totalAdjustments > 0 ? '+' : ''}{totalAdjustments.toFixed(0)} SEK
                </p>
              </div>
              {totalAdjustments >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Genomsnitt/Bokning</p>
                <p className="text-2xl font-bold text-gray-900">
                  {avgAdjustment > 0 ? '+' : ''}{avgAdjustment.toFixed(0)} SEK
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Antal Bokningar</p>
                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Justeringshistorik</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:border-[#4A90A4] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {log.booking_number && (
                          <Badge variant="outline">#{log.booking_number}</Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          {format(new Date(log.created_date), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      {log.customer_email && (
                        <p className="text-sm text-gray-600">{log.customer_email}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 line-through">
                        {log.original_price} SEK
                      </p>
                      <p className="text-xl font-bold text-[#4A90A4]">
                        {log.final_price} SEK
                      </p>
                      <Badge className={log.total_adjustment >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {log.total_adjustment >= 0 ? '+' : ''}{log.total_adjustment} SEK
                      </Badge>
                    </div>
                  </div>

                  {log.adjustments_applied && log.adjustments_applied.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700">Tillämpade Regler:</p>
                      {log.adjustments_applied.map((adj, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-2 text-sm">
                          <div className="flex items-center gap-2">
                            {getRuleIcon(adj.rule_type)}
                            <span className="font-medium">{adj.rule_name}</span>
                            <span className="text-gray-500 text-xs">• {adj.reason}</span>
                          </div>
                          <span className="font-semibold text-[#4A90A4]">
                            {adj.adjustment_value >= 0 ? '+' : ''}{adj.adjustment_value.toFixed(0)} SEK
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {log.context_data && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-xs text-gray-600">
                      <div>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {log.context_data.time_of_day} ({log.context_data.day_of_week})
                      </div>
                      {log.context_data.weather && (
                        <div>
                          <CloudRain className="h-3 w-3 inline mr-1" />
                          {log.context_data.weather} ({log.context_data.temperature}°C)
                        </div>
                      )}
                      {log.context_data.active_bookings_count !== undefined && (
                        <div>
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          {log.context_data.active_bookings_count} aktiva uppdrag
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {logs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Inga prisjusteringar registrerade än</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}