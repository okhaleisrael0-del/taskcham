import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  ShoppingCart, MapPin, Check, X, MessageSquare, Upload, 
  ExternalLink, AlertCircle, Package, DollarSign, Camera, Navigation
} from 'lucide-react';

export default function RunnerOrderView({ order, onClose }) {
  const queryClient = useQueryClient();
  const [replacementDialog, setReplacementDialog] = useState({ open: false, itemIndex: null });
  const [replacementText, setReplacementText] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadingDelivery, setUploadingDelivery] = useState(false);
  const [actualAmount, setActualAmount] = useState('');
  const [locationTracking, setLocationTracking] = useState(false);
  const [locationNotification, setLocationNotification] = useState(null);

  const updateItemStatusMutation = useMutation({
    mutationFn: async ({ itemIndex, status, replacement }) => {
      const updatedList = [...order.shopping_list];
      updatedList[itemIndex] = {
        ...updatedList[itemIndex],
        status,
        ...(replacement && { 
          replacement_item: replacement,
          replacement_approved: false 
        })
      };
      
      await base44.entities.BuyDeliverOrder.update(order.id, {
        shopping_list: updatedList
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['driver-buy-deliver-orders']);
      setReplacementDialog({ open: false, itemIndex: null });
      setReplacementText('');
    }
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      await base44.entities.BuyDeliverOrder.update(order.id, {
        status: newStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['driver-buy-deliver-orders']);
    }
  });

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.BuyDeliverOrder.update(order.id, {
        receipt_photo_url: file_url,
        actual_purchase_amount: parseFloat(actualAmount) || order.items_estimate
      });
      queryClient.invalidateQueries(['driver-buy-deliver-orders']);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploadingReceipt(false);
  };

  const handleDeliveryPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDelivery(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.BuyDeliverOrder.update(order.id, {
        delivery_photo_url: file_url
      });
      queryClient.invalidateQueries(['driver-buy-deliver-orders']);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploadingDelivery(false);
  };

  const getItemStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      found: 'bg-green-100 text-green-800',
      not_available: 'bg-red-100 text-red-800',
      replaced: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.pending;
  };

  const allItemsProcessed = order.shopping_list.every(item => 
    ['found', 'not_available', 'replaced'].includes(item.status)
  );

  // Auto location tracking
  useEffect(() => {
    let watchId;
    
    if (locationTracking && ['assigned', 'shopping', 'purchased', 'delivering'].includes(order.status)) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            try {
              const response = await base44.functions.invoke('updateOrderStatusByLocation', {
                orderId: order.id,
                currentLat: position.coords.latitude,
                currentLng: position.coords.longitude
              });

              if (response.data.notification) {
                setLocationNotification(response.data.notification.message);
                setTimeout(() => setLocationNotification(null), 5000);
              }

              if (response.data.statusChanged) {
                queryClient.invalidateQueries(['driver-buy-deliver-orders']);
              }
            } catch (error) {
              console.error('Location update failed:', error);
            }
          },
          (error) => console.error('Geolocation error:', error),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [locationTracking, order.id, order.status]);

  return (
    <div className="space-y-4">
      {/* Location Notification */}
      {locationNotification && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600 animate-pulse" />
          <p className="text-sm font-medium text-blue-900">{locationNotification}</p>
        </div>
      )}

      {/* Location Tracking Toggle */}
      {['assigned', 'shopping', 'purchased', 'delivering'].includes(order.status) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-900">📍 Auto-spårning</p>
                <p className="text-xs text-green-700">Uppdaterar status automatiskt baserat på din plats</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={locationTracking}
                  onChange={(e) => setLocationTracking(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Butiksinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold text-lg">{order.store_name || 'Valfri butik'}</p>
            {order.store_address && (
              <p className="text-sm text-gray-600">{order.store_address}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const query = order.store_name || order.store_address || 'ICA Göteborg';
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Öppna i Kartor
          </Button>
        </CardContent>
      </Card>

      {/* Budget Info */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-800 font-medium">Max Budget</p>
              <p className="text-2xl font-bold text-amber-900">{order.max_budget?.toFixed(0)} kr</p>
            </div>
            <DollarSign className="h-8 w-8 text-amber-600" />
          </div>
          <p className="text-xs text-amber-700 mt-2">
            ⚠️ Överskrid inte denna summa utan att kontakta admin
          </p>
        </CardContent>
      </Card>

      {/* Shopping List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shoppinglista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.shopping_list.map((item, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{item.item_name}</p>
                      <Badge className={getItemStatusColor(item.status)}>
                        {item.status === 'found' && '✓ Hittad'}
                        {item.status === 'not_available' && '✗ Saknas'}
                        {item.status === 'replaced' && '↔ Ersatt'}
                        {item.status === 'pending' && '⬜ Väntande'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Antal: {item.quantity}
                      {item.notes && ` • ${item.notes}`}
                      {item.estimated_price > 0 && ` • ~${item.estimated_price} kr`}
                    </p>
                    {item.replacement_item && (
                      <p className="text-sm text-amber-700 mt-1">
                        🔄 Ersättning: {item.replacement_item}
                        {item.replacement_approved ? ' (Godkänd ✓)' : ' (Väntar på godkännande)'}
                      </p>
                    )}
                  </div>
                </div>

                {order.status === 'shopping' && item.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-green-600 border-green-200"
                      onClick={() => updateItemStatusMutation.mutate({ itemIndex: index, status: 'found' })}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Hittad
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200"
                      onClick={() => setReplacementDialog({ open: true, itemIndex: index })}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Saknas / Ersätt
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Leveransadress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium mb-2">{order.delivery_address}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`, '_blank');
            }}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Navigera
          </Button>
          {order.special_instructions && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">
                <strong>Instruktioner:</strong> {order.special_instructions}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        {order.status === 'assigned' && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => updateOrderStatusMutation.mutate('shopping')}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Börja Handla
          </Button>
        )}

        {order.status === 'shopping' && allItemsProcessed && !order.receipt_photo_url && (
          <div className="space-y-2">
            <Label>Faktisk summa (valfritt)</Label>
            <Input
              type="number"
              placeholder="Faktisk köpsumma..."
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
            />
            <Label
              htmlFor="receipt-upload"
              className="cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 hover:bg-gray-50">
                {uploadingReceipt ? (
                  <span>Laddar upp...</span>
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    Ladda upp kvitto
                  </>
                )}
              </div>
              <input
                id="receipt-upload"
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="hidden"
              />
            </Label>
          </div>
        )}

        {order.receipt_photo_url && order.status === 'shopping' && (
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => updateOrderStatusMutation.mutate('purchased')}
          >
            <Check className="h-4 w-4 mr-2" />
            Markera som Köpt
          </Button>
        )}

        {order.status === 'purchased' && (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={() => updateOrderStatusMutation.mutate('delivering')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            På Väg till Kund
          </Button>
        )}

        {order.status === 'delivering' && (
          <div className="space-y-2">
            {!order.delivery_photo_url && (
              <Label
                htmlFor="delivery-upload"
                className="cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 hover:bg-gray-50">
                  {uploadingDelivery ? (
                    <span>Laddar upp...</span>
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      Ta leveransfoto (valfritt)
                    </>
                  )}
                </div>
                <input
                  id="delivery-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleDeliveryPhoto}
                  className="hidden"
                />
              </Label>
            )}
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => updateOrderStatusMutation.mutate('completed')}
            >
              <Check className="h-4 w-4 mr-2" />
              Markera som Levererat
            </Button>
          </div>
        )}
      </div>

      {/* Replacement Dialog */}
      <Dialog open={replacementDialog.open} onOpenChange={(open) => !open && setReplacementDialog({ open: false, itemIndex: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ersättning eller Ej Tillgänglig</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {replacementDialog.itemIndex !== null && order.shopping_list[replacementDialog.itemIndex]?.item_name} är inte tillgänglig.
            </p>
            <div>
              <Label>Föreslå ersättning (valfritt)</Label>
              <Input
                placeholder="T.ex. Arla istället för Skånemejerier..."
                value={replacementText}
                onChange={(e) => setReplacementText(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Kunden kommer att se detta och kan godkänna eller avvisa
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplacementDialog({ open: false, itemIndex: null })}
            >
              Avbryt
            </Button>
            <Button
              onClick={() => {
                if (replacementText.trim()) {
                  updateItemStatusMutation.mutate({
                    itemIndex: replacementDialog.itemIndex,
                    status: 'replaced',
                    replacement: replacementText
                  });
                } else {
                  updateItemStatusMutation.mutate({
                    itemIndex: replacementDialog.itemIndex,
                    status: 'not_available'
                  });
                }
              }}
            >
              Bekräfta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}