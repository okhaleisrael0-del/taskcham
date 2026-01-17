import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation, MapPin, ExternalLink } from 'lucide-react';

export default function NavigationHelper({ booking }) {
  const openGoogleMaps = (lat, lng, address) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openWaze = (lat, lng) => {
    const url = `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  return (
    <Card className="bg-blue-50 border-2 border-blue-200">
      <CardContent className="p-4">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          Navigation
        </h3>

        <div className="space-y-3">
          {/* Pickup Navigation */}
          {booking.pickup_address && (
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Upphämtning</p>
              <p className="text-sm font-medium mb-2">{booking.pickup_address}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openGoogleMaps(booking.pickup_lat, booking.pickup_lng, booking.pickup_address)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Google Maps
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openWaze(booking.pickup_lat, booking.pickup_lng)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Waze
                </Button>
              </div>
            </div>
          )}

          {/* Delivery Navigation */}
          {booking.delivery_address && (
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Leverans</p>
              <p className="text-sm font-medium mb-2">{booking.delivery_address}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openGoogleMaps(booking.delivery_lat, booking.delivery_lng, booking.delivery_address)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Google Maps
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openWaze(booking.delivery_lat, booking.delivery_lng)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Waze
                </Button>
              </div>
            </div>
          )}

          {/* Task Location Navigation */}
          {booking.task_location && (
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Plats</p>
              <p className="text-sm font-medium mb-2">{booking.task_location}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openGoogleMaps(booking.task_lat, booking.task_lng, booking.task_location)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Google Maps
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openWaze(booking.task_lat, booking.task_lng)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Waze
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 bg-white rounded-lg p-3 text-xs text-gray-600">
          <p>💡 Tips: Klicka på länkarna för att öppna navigationen i din föredragna kart-app.</p>
        </div>
      </CardContent>
    </Card>
  );
}