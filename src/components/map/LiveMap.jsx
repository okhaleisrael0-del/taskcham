import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const pickupIcon = createIcon('blue');
const deliveryIcon = createIcon('green');
const driverIcon = createIcon('red');

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}

export default function LiveMap({ booking, driverLocation, showProximityRadius = false }) {
  const [mapCenter, setMapCenter] = useState([57.7089, 11.9746]); // Gothenburg default
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    // Set initial map center based on available locations
    if (driverLocation) {
      setMapCenter([driverLocation.lat, driverLocation.lng]);
      setMapZoom(14);
    } else if (booking?.pickup_lat && booking?.pickup_lng) {
      setMapCenter([booking.pickup_lat, booking.pickup_lng]);
      setMapZoom(13);
    } else if (booking?.task_lat && booking?.task_lng) {
      setMapCenter([booking.task_lat, booking.task_lng]);
      setMapZoom(13);
    }
  }, [booking, driverLocation]);

  const pickupLocation = booking?.pickup_lat && booking?.pickup_lng 
    ? [booking.pickup_lat, booking.pickup_lng] 
    : null;
  
  const deliveryLocation = booking?.delivery_lat && booking?.delivery_lng 
    ? [booking.delivery_lat, booking.delivery_lng] 
    : null;
  
  const taskLocation = booking?.task_lat && booking?.task_lng 
    ? [booking.task_lat, booking.task_lng] 
    : null;

  const currentDriverLocation = driverLocation 
    ? [driverLocation.lat, driverLocation.lng] 
    : null;

  // Calculate route line
  const routePoints = [];
  if (currentDriverLocation) routePoints.push(currentDriverLocation);
  if (pickupLocation && !taskLocation) routePoints.push(pickupLocation);
  if (deliveryLocation) routePoints.push(deliveryLocation);
  if (taskLocation) routePoints.push(taskLocation);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pickup Location */}
        {pickupLocation && (
          <Marker position={pickupLocation} icon={pickupIcon}>
            <Popup>
              <strong>Pickup Location</strong><br />
              {booking.pickup_address}
            </Popup>
          </Marker>
        )}

        {/* Delivery Location */}
        {deliveryLocation && (
          <Marker position={deliveryLocation} icon={deliveryIcon}>
            <Popup>
              <strong>Delivery Location</strong><br />
              {booking.delivery_address}
            </Popup>
          </Marker>
        )}

        {/* Task Location (Help at Home) */}
        {taskLocation && (
          <>
            <Marker position={taskLocation} icon={deliveryIcon}>
              <Popup>
                <strong>Service Location</strong><br />
                {booking.task_location}
              </Popup>
            </Marker>
            {showProximityRadius && (
              <Circle
                center={taskLocation}
                radius={500} // 500 meters proximity
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
              />
            )}
          </>
        )}

        {/* Driver Location */}
        {currentDriverLocation && (
          <>
            <Marker position={currentDriverLocation} icon={driverIcon}>
              <Popup>
                <strong>Driver Location</strong><br />
                {driverLocation.timestamp && (
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </Popup>
            </Marker>
            {showProximityRadius && deliveryLocation && (
              <Circle
                center={deliveryLocation}
                radius={500}
                pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}
              />
            )}
          </>
        )}

        {/* Route Line */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#4A90A4', weight: 3, opacity: 0.7, dashArray: '10, 10' }}
          />
        )}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="space-y-2">
          {pickupLocation && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Pickup</span>
            </div>
          )}
          {(deliveryLocation || taskLocation) && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Destination</span>
            </div>
          )}
          {currentDriverLocation && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Driver</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}