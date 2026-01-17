import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Navigation, ExternalLink, Star, 
  Clock, Phone, Globe, ChevronRight, Loader2, Store, CheckCircle2, Sparkles
} from 'lucide-react';

export default function StoreSelector({ onSelectStore, preselectedStore }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStore, setSelectedStore] = useState(preselectedStore || null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Location error:', error);
          setIsLoadingLocation(false);
        }
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await base44.functions.invoke('searchStores', {
        query: searchQuery,
        location: userLocation
      });

      setStores(response.data.stores || []);
    } catch (error) {
      console.error('Search error:', error);
      alert('Kunde inte söka butiker. Försök igen.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const calculateDistance = (storeLat, storeLng) => {
    if (!userLocation) return null;

    const R = 6371; // Earth's radius in km
    const dLat = (storeLat - userLocation.lat) * Math.PI / 180;
    const dLon = (storeLng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(storeLat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const getPhotoUrl = (photoReference) => {
    if (!photoReference) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY || 'YOUR_API_KEY'}`;
  };

  const openInMaps = (store) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name)}&query_place_id=${store.place_id}`;
    window.open(mapsUrl, '_blank');
  };

  const handleSelectStore = async (store) => {
    // Get detailed store info
    try {
      const response = await base44.functions.invoke('getStoreDetails', {
        place_id: store.place_id
      });
      
      const detailedStore = response.data.store;
      setSelectedStore(detailedStore);
      onSelectStore(detailedStore);
    } catch (error) {
      console.error('Error getting store details:', error);
      // Fallback to basic info
      setSelectedStore(store);
      onSelectStore(store);
    }
  };

  // Popular stores in Sweden
  const popularStores = [
    'ICA', 'Coop', 'Willys', 'Lidl', 'Hemköp',
    'IKEA', 'Elgiganten', 'MediaMarkt', 'Biltema',
    'Apoteket', 'Systembolaget'
  ];

  if (selectedStore) {
    return (
      <div className="space-y-4">
        <Card className="border-2 border-green-500 bg-green-50/50">
          <CardContent className="p-6">
            {/* Header with check icon */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Du valde:</p>
              </div>
            </div>

            {/* Store image */}
            {selectedStore.photo_reference && (
              <img
                src={getPhotoUrl(selectedStore.photo_reference)}
                alt={selectedStore.name}
                className="w-full h-32 rounded-xl object-cover mb-4"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}

            {/* Store info */}
            <div className="mb-4">
              <div className="flex items-start gap-2 mb-2">
                <Store className="h-5 w-5 text-[#4A90A4] mt-0.5" />
                <h3 className="font-bold text-lg text-gray-900">{selectedStore.name}</h3>
              </div>
              <p className="text-sm text-gray-600 flex items-start gap-2 ml-7">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{selectedStore.address}</span>
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedStore.rating && (
                <Badge variant="outline" className="flex items-center gap-1 bg-white">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {selectedStore.rating}
                </Badge>
              )}
              {userLocation && (
                <Badge variant="outline" className="flex items-center gap-1 bg-white">
                  <Navigation className="h-3 w-3" />
                  {calculateDistance(selectedStore.location.lat, selectedStore.location.lng)}
                </Badge>
              )}
              {selectedStore.open_now !== null && (
                <Badge variant="outline" className={`flex items-center gap-1 ${selectedStore.open_now ? 'border-green-500 text-green-700 bg-white' : 'border-red-500 text-red-700 bg-white'}`}>
                  <Clock className="h-3 w-3" />
                  {selectedStore.open_now ? 'Öppet nu' : 'Stängt'}
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStore(null);
                  onSelectStore(null);
                }}
                className="border-gray-300"
              >
                Byt butik
              </Button>
              <Button
                className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
                onClick={() => openInMaps(selectedStore)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Öppna karta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation message */}
        <div className="bg-[#4A90A4]/10 border border-[#4A90A4]/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#4A90A4] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                Denna butik kommer användas för din TaskCham-uppdrag
              </p>
              <p className="text-xs text-gray-600">
                Ingen förvirring. Ingen fel butik. Inga förseningar.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Branding Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-[#4A90A4]" />
          <h3 className="text-xl font-bold text-gray-900">Pick-Up Anywhere™</h3>
        </div>
        <p className="text-sm text-gray-600">Välj butiken. Vi sköter resten.</p>
      </div>

      {/* Search Bar */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-5 w-5 text-[#4A90A4]" />
          <p className="font-medium text-gray-900">Hitta en butik</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Skriv butiksnamn eller plats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-12 pl-4 text-base"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="bg-[#4A90A4] hover:bg-[#3d7a8c] h-12 px-6"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Sök'
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          t.ex. "ICA", "IKEA", "Elgiganten", "Biltema", "Mall of Scandinavia"
        </p>
      </div>

      {/* Popular Stores */}
      {stores.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Populära butiker:</p>
          <div className="flex flex-wrap gap-2">
            {popularStores.map((store) => (
              <Button
                key={store}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery(store);
                  setTimeout(() => {
                    handleSearch();
                  }, 100);
                }}
                className="bg-white hover:bg-[#4A90A4] hover:text-white hover:border-[#4A90A4]"
              >
                {store}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Location */}
      {isLoadingLocation && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Hämtar din plats...
        </div>
      )}

      {/* Search Results */}
      {stores.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">🏬 Butiksresultat</p>
              <p className="text-sm text-gray-500">{stores.length} butiker hittades</p>
            </div>
            {userLocation && (
              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                <Navigation className="h-3 w-3 mr-1" />
                Sorterad efter avstånd
              </Badge>
            )}
          </div>

          <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2">
            {stores
              .sort((a, b) => {
                if (!userLocation) return 0;
                const distA = calculateDistance(a.location.lat, a.location.lng);
                const distB = calculateDistance(b.location.lat, b.location.lng);
                return parseFloat(distA) - parseFloat(distB);
              })
              .map((store, index) => (
              <Card
                key={store.place_id}
                className={`cursor-pointer transition-all border-2 hover:shadow-xl hover:scale-[1.02] ${
                  index === 0 && userLocation
                    ? 'border-[#4A90A4] bg-[#4A90A4]/5 shadow-md'
                    : 'border-gray-200 hover:border-[#4A90A4]'
                }`}
                onClick={() => handleSelectStore(store)}
              >
                <CardContent className="p-4">
                  {index === 0 && userLocation && (
                    <div className="mb-3">
                      <Badge className="bg-[#4A90A4] text-white">
                        <Navigation className="h-3 w-3 mr-1" />
                        Närmaste butik
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    {store.photo_reference ? (
                      <img
                        src={getPhotoUrl(store.photo_reference)}
                        alt={store.name}
                        className="w-24 h-24 rounded-xl object-cover flex-shrink-0 shadow-sm"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Store className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base mb-2 text-gray-900">{store.name}</h4>
                      <p className="text-sm text-gray-600 mb-3 flex items-start gap-1.5">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#4A90A4]" />
                        <span className="line-clamp-2">{store.address}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {userLocation && (
                          <Badge variant="outline" className="flex items-center gap-1 bg-white border-[#4A90A4] text-[#4A90A4] font-semibold">
                            📍 {calculateDistance(store.location.lat, store.location.lng)} bort
                          </Badge>
                        )}
                        {store.rating && (
                          <Badge variant="outline" className="flex items-center gap-1 bg-white">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {store.rating}
                          </Badge>
                        )}
                        {store.open_now !== null && (
                          <Badge variant="outline" className={`flex items-center gap-1 ${
                            store.open_now 
                              ? 'border-green-500 text-green-700 bg-green-50' 
                              : 'border-red-500 text-red-700 bg-red-50'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {store.open_now ? 'Öppet nu' : 'Stängt'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="h-6 w-6 text-[#4A90A4] flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer branding */}
      <div className="text-center pt-4 pb-2 border-t">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-[#4A90A4]">TaskCham</span> hittar den. 
          Hämtar den. Levererar den.
        </p>
      </div>
    </div>
  );
}