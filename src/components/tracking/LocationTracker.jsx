import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, Pause, MapPin, AlertCircle } from 'lucide-react';

export default function LocationTracker({ booking, onLocationUpdate }) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    // Initialize tracking state from booking
    if (booking?.tracking_active) {
      setIsTracking(true);
    }
  }, [booking?.tracking_active]);

  useEffect(() => {
    return () => {
      // Cleanup: stop tracking when component unmounts
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula to calculate distance in meters
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const checkProximity = async (lat, lng) => {
    // Check if driver is within 500m of destination
    let destinationLat, destinationLng;

    if (booking.delivery_lat && booking.delivery_lng) {
      destinationLat = booking.delivery_lat;
      destinationLng = booking.delivery_lng;
    } else if (booking.task_lat && booking.task_lng) {
      destinationLat = booking.task_lat;
      destinationLng = booking.task_lng;
    } else {
      return;
    }

    const distance = calculateDistance(lat, lng, destinationLat, destinationLng);

    // If within 500m and customer hasn't been notified yet
    if (distance <= 500 && !booking.customer_notified_arrival) {
      // Send notification (in real app, this would trigger email/SMS)
      await base44.entities.Booking.update(booking.id, {
        customer_notified_arrival: true
      });
      
      // Could integrate with SendEmail here
      console.log('Customer notified of driver arrival');
    }
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationData = {
          lat: latitude,
          lng: longitude,
          timestamp: new Date().toISOString()
        };

        setCurrentLocation(locationData);

        // Update booking with current location
        await base44.entities.Booking.update(booking.id, {
          tracking_active: true,
          driver_current_lat: latitude,
          driver_current_lng: longitude,
          last_location_update: locationData.timestamp
        });

        // Check proximity for customer notification
        await checkProximity(latitude, longitude);

        // Notify parent component
        if (onLocationUpdate) {
          onLocationUpdate(locationData);
        }
      },
      (err) => {
        console.error('Location error:', err);
        setError(`Location error: ${err.message}`);
        setIsTracking(false);
      },
      options
    );

    setWatchId(id);
    setIsTracking(true);
  };

  const stopTracking = async () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    // Update booking to stop tracking
    await base44.entities.Booking.update(booking.id, {
      tracking_active: false
    });

    setIsTracking(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#4A90A4]" />
          <span className="font-medium">Live-spårning</span>
          {isTracking && (
            <Badge className="bg-green-100 text-green-800">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Aktiv
            </Badge>
          )}
        </div>

        <Button
          onClick={isTracking ? stopTracking : startTracking}
          variant={isTracking ? "outline" : "default"}
          className={isTracking ? "text-red-600 border-red-200" : "bg-[#4A90A4] hover:bg-[#3d7a8c]"}
          size="sm"
        >
          {isTracking ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Stoppa Spårning
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Starta Spårning
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentLocation && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <p>Senast uppdaterad: {new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
          <p className="mt-1">
            Position: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      {isTracking && (
        <Alert>
          <AlertDescription className="text-sm">
            Din plats delas med kund och admin. Stoppa spårning när uppdraget är slutfört.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}