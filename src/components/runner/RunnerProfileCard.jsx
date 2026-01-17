import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, CheckCircle, Truck } from 'lucide-react';

export default function RunnerProfileCard({ driver, variant = "full" }) {
  if (!driver) return null;

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'R';
  };

  const getVehicleIcon = () => {
    if (driver.vehicle_type === 'hybrid') return '🚗 Hybrid';
    if (driver.vehicle_type === 'normal_car') return '🚙 Bil';
    return '🚶 Gående';
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
        <Avatar className="h-10 w-10">
          <AvatarImage src={driver.profile_image} alt={driver.name} />
          <AvatarFallback className="bg-[#4A90A4] text-white">
            {getInitials(driver.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{driver.name}</p>
          <div className="flex items-center gap-2 text-xs">
            {driver.average_rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {driver.average_rating.toFixed(1)}
              </span>
            )}
            <span className="text-gray-500">• {driver.completed_tasks || 0} uppdrag</span>
          </div>
        </div>
        {driver.status === 'approved' && (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </div>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
            <AvatarImage src={driver.profile_image} alt={driver.name} />
            <AvatarFallback className="bg-[#4A90A4] text-white text-xl">
              {getInitials(driver.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900">{driver.name}</h3>
              {driver.status === 'approved' && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
            {driver.average_rating > 0 && (
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(driver.average_rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-gray-700">
                  {driver.average_rating.toFixed(1)} ({driver.total_ratings || 0} recensioner)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Slutförda uppdrag</p>
            <p className="text-xl font-bold text-gray-900">{driver.completed_tasks || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500">Fordon</p>
            <p className="text-sm font-semibold text-gray-900">{getVehicleIcon()}</p>
          </div>
        </div>

        {driver.expertise && driver.expertise.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Specialitet:</p>
            <div className="flex flex-wrap gap-2">
              {driver.expertise.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {skill.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}