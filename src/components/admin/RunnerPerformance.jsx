import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, TrendingDown, Star, Clock, CheckCircle, 
  AlertTriangle, Award, Target, Activity
} from 'lucide-react';

export default function RunnerPerformance({ drivers, bookings, ratings }) {
  const performanceData = useMemo(() => {
    return drivers.map(driver => {
      const driverBookings = bookings.filter(b => b.assigned_driver_id === driver.id);
      const completedBookings = driverBookings.filter(b => b.status === 'completed');
      const driverRatings = ratings.filter(r => r.driver_id === driver.id);
      
      // Calculate metrics
      const totalAssigned = driverBookings.length;
      const totalCompleted = completedBookings.length;
      const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;
      
      const avgRating = driverRatings.length > 0
        ? driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length
        : 0;
      
      // Calculate average delivery time (from assigned to completed)
      const deliveryTimes = completedBookings
        .filter(b => b.created_date && b.updated_date)
        .map(b => {
          const start = new Date(b.created_date).getTime();
          const end = new Date(b.updated_date).getTime();
          return (end - start) / (1000 * 60); // minutes
        });
      
      const avgDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, t) => sum + t, 0) / deliveryTimes.length
        : 0;
      
      // Acceptance rate (completed / total assigned)
      const acceptanceRate = completionRate;
      
      // Performance score (weighted)
      const performanceScore = (
        (avgRating / 5) * 40 + // 40% weight on ratings
        (completionRate / 100) * 30 + // 30% weight on completion
        (totalCompleted > 0 ? 20 : 0) + // 20% weight on activity
        (avgDeliveryTime < 60 ? 10 : avgDeliveryTime < 120 ? 5 : 0) // 10% weight on speed
      );
      
      // Determine performance level
      let performanceLevel = 'excellent';
      if (performanceScore < 50) performanceLevel = 'poor';
      else if (performanceScore < 70) performanceLevel = 'average';
      else if (performanceScore < 85) performanceLevel = 'good';
      
      // Flags for issues
      const flags = [];
      if (avgRating < 3.5 && driverRatings.length >= 3) flags.push('low_rating');
      if (completionRate < 70 && totalAssigned >= 5) flags.push('low_completion');
      if (totalCompleted === 0 && totalAssigned > 3) flags.push('no_completions');
      if (avgDeliveryTime > 120) flags.push('slow_delivery');
      
      return {
        driver,
        metrics: {
          totalAssigned,
          totalCompleted,
          completionRate,
          avgRating,
          totalRatings: driverRatings.length,
          avgDeliveryTime,
          acceptanceRate,
          performanceScore
        },
        performanceLevel,
        flags
      };
    }).sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore);
  }, [drivers, bookings, ratings]);
  
  const topPerformers = performanceData.slice(0, 5);
  const needsAttention = performanceData.filter(p => p.flags.length > 0 || p.performanceLevel === 'poor');
  
  const getPerformanceColor = (level) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800 border-green-200',
      good: 'bg-blue-100 text-blue-800 border-blue-200',
      average: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      poor: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[level] || colors.average;
  };
  
  const getFlagText = (flag) => {
    const texts = {
      low_rating: '⭐ Lågt betyg',
      low_completion: '📊 Låg slutförandegrad',
      no_completions: '❌ Inga slutförda',
      slow_delivery: '🐌 Långsam leverans'
    };
    return texts[flag] || flag;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Aktiva Runners</p>
                <p className="text-2xl font-bold">
                  {drivers.filter(d => d.status === 'approved').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Genomsnitt Betyg</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {ratings.length > 0
                    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
                    : '0.0'}
                  <Star className="h-4 w-4 text-amber-500" />
                </p>
              </div>
              <Star className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Topp Performers</p>
                <p className="text-2xl font-bold text-green-600">
                  {performanceData.filter(p => p.performanceLevel === 'excellent').length}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={needsAttention.length > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Kräver Uppmärksamhet</p>
                <p className="text-2xl font-bold text-red-600">
                  {needsAttention.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Needs Attention Section */}
      {needsAttention.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Runners som Kräver Uppmärksamhet ({needsAttention.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsAttention.map(({ driver, metrics, flags }) => (
                <div key={driver.id} className="bg-white rounded-lg p-4 border-2 border-red-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.email}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      {metrics.performanceScore.toFixed(0)}% poäng
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Slutförda:</span>
                      <span className="font-medium ml-1">{metrics.totalCompleted}/{metrics.totalAssigned}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Betyg:</span>
                      <span className="font-medium ml-1 flex items-center gap-1">
                        {metrics.avgRating.toFixed(1)}
                        <Star className="h-3 w-3 text-amber-500" />
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {flags.map((flag, idx) => (
                      <Badge key={idx} className="bg-red-100 text-red-700 text-xs">
                        {getFlagText(flag)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Award className="h-5 w-5" />
            Topp 5 Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.map(({ driver, metrics, performanceLevel }, idx) => (
              <div key={driver.id} className="bg-white rounded-lg p-4 border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-200 text-gray-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{driver.name}</p>
                      <p className="text-sm text-gray-600">
                        {metrics.totalCompleted} uppdrag • {metrics.totalRatings} betyg
                      </p>
                    </div>
                  </div>
                  <Badge className={getPerformanceColor(performanceLevel)}>
                    {metrics.performanceScore.toFixed(0)}%
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Slutförandegrad</span>
                      <span className="font-medium">{metrics.completionRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={metrics.completionRate} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-gray-600">Betyg:</span>
                      <span className="font-semibold">{metrics.avgRating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600">Snitt tid:</span>
                      <span className="font-semibold">{metrics.avgDeliveryTime.toFixed(0)} min</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Runners Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alla Runners - Detaljerad Prestanda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {performanceData.map(({ driver, metrics, performanceLevel, flags }) => (
              <div key={driver.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{driver.name}</p>
                      <Badge className={getPerformanceColor(performanceLevel)}>
                        {performanceLevel}
                      </Badge>
                      {flags.length > 0 && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{driver.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#4A90A4]">
                      {metrics.performanceScore.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500">poäng</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1">Uppdrag</p>
                    <p className="font-semibold">{metrics.totalCompleted}/{metrics.totalAssigned}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Betyg
                    </p>
                    <p className="font-semibold">
                      {metrics.avgRating.toFixed(1)} ({metrics.totalRatings})
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1">Slutförd</p>
                    <p className="font-semibold">{metrics.completionRate.toFixed(0)}%</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Snitt Tid
                    </p>
                    <p className="font-semibold">{metrics.avgDeliveryTime.toFixed(0)} min</p>
                  </div>
                </div>
                
                {flags.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                    {flags.map((flag, idx) => (
                      <Badge key={idx} className="bg-red-100 text-red-700 text-xs">
                        {getFlagText(flag)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}