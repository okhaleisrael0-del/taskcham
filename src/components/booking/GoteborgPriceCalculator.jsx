import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Zap, Package, Moon, Cloud, CheckCircle, Info
} from 'lucide-react';

export default function GoteborgPriceCalculator({
  serviceType,
  distanceKm = 0,
  itemCount = 0,
  selectedAddons = [],
  onAddonsChange,
  availableAddons = [],
  pricingConfig,
  preferredTime,
  onPriceCalculated
}) {
  
  const calculations = useMemo(() => {
    if (!pricingConfig) return null;

    // Base delivery price (Göteborg model)
    const basePrice = pricingConfig.base_city_price || 49;
    const pricePerKm = pricingConfig.per_km_price || 8;
    const distancePrice = distanceKm * pricePerKm;
    const deliveryTotal = basePrice + distancePrice;

    // Calculate addons
    let addonsTotal = 0;
    const appliedAddons = [];

    // Auto-apply time-based addons
    if (preferredTime) {
      const hour = parseInt(preferredTime.split(':')[0]);
      const eveningAddon = availableAddons.find(a => 
        a.addon_type === 'evening_night' && 
        a.auto_apply && 
        a.is_active
      );
      
      if (eveningAddon && ((hour >= 20 && hour <= 23) || (hour >= 0 && hour <= 7))) {
        if (eveningAddon.price_type === 'percentage') {
          const amount = Math.round(deliveryTotal * (eveningAddon.amount / 100));
          addonsTotal += amount;
          appliedAddons.push({ 
            ...eveningAddon, 
            calculatedAmount: amount,
            reason: 'Automatiskt (kväll/natt)'
          });
        } else {
          addonsTotal += eveningAddon.amount;
          appliedAddons.push({ 
            ...eveningAddon, 
            calculatedAmount: eveningAddon.amount,
            reason: 'Automatiskt (kväll/natt)'
          });
        }
      }
    }

    // Selected addons
    selectedAddons.forEach(addonId => {
      const addon = availableAddons.find(a => a.id === addonId);
      if (addon && addon.is_active) {
        if (addon.price_type === 'percentage') {
          const amount = Math.round(deliveryTotal * (addon.amount / 100));
          addonsTotal += amount;
          appliedAddons.push({ 
            ...addon, 
            calculatedAmount: amount,
            reason: 'Vald av kund'
          });
        } else {
          addonsTotal += addon.amount;
          appliedAddons.push({ 
            ...addon, 
            calculatedAmount: addon.amount,
            reason: 'Vald av kund'
          });
        }
      }
    });

    const totalPrice = deliveryTotal + addonsTotal;

    // Calculate runner and platform split
    const runnerEarnings = Math.round(totalPrice * 0.8);
    const platformFee = totalPrice - runnerEarnings;

    const result = {
      basePrice,
      distanceKm,
      pricePerKm,
      distancePrice,
      deliveryTotal,
      addonsTotal,
      appliedAddons,
      totalPrice,
      runnerEarnings,
      platformFee
    };

    // Notify parent of price calculation
    if (onPriceCalculated) {
      onPriceCalculated(result);
    }

    return result;
  }, [
    pricingConfig,
    distanceKm,
    selectedAddons,
    availableAddons,
    preferredTime,
    onPriceCalculated
  ]);

  if (!calculations) return null;

  const getAddonIcon = (type) => {
    switch (type) {
      case 'express': return <Zap className="h-4 w-4 text-orange-600" />;
      case 'heavy_items': return <Package className="h-4 w-4 text-purple-600" />;
      case 'evening_night': return <Moon className="h-4 w-4 text-indigo-600" />;
      case 'weather_surcharge': return <Cloud className="h-4 w-4 text-blue-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const manualAddons = availableAddons.filter(a => 
    a.is_active && !a.auto_apply
  );

  return (
    <div className="space-y-4">
      {/* Price Breakdown */}
      <Card className="border-2 border-primary shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Grundavgift:</span>
              <span className="font-medium">{calculations.basePrice} kr</span>
            </div>
            
            {calculations.distanceKm > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Avstånd ({calculations.distanceKm.toFixed(1)} km × {calculations.pricePerKm} kr):
                </span>
                <span className="font-medium">{calculations.distancePrice.toFixed(0)} kr</span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between text-sm font-medium">
              <span>Leveranspris:</span>
              <span className="text-primary">{calculations.deliveryTotal.toFixed(0)} kr</span>
            </div>

            {/* Applied Addons */}
            {calculations.appliedAddons.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-medium text-gray-700">Tillägg:</p>
                {calculations.appliedAddons.map((addon, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getAddonIcon(addon.addon_type)}
                      <div>
                        <span className="text-gray-700">{addon.name}</span>
                        {addon.reason && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {addon.reason}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="font-medium text-green-600">
                      +{addon.calculatedAmount} kr
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="border-t-2 border-primary pt-3">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold">Totalt:</span>
                <span className="text-3xl font-bold text-primary">
                  {calculations.totalPrice.toFixed(0)} kr
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>Full transparens i prissättningen</p>
                  <p>• Runner: {calculations.runnerEarnings} kr (80%)</p>
                  <p>• TaskCham: {calculations.platformFee} kr (20%)</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Addons Selection */}
      {manualAddons.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Välj tillägg:</h3>
            <div className="space-y-3">
              {manualAddons.map((addon) => (
                <div key={addon.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Checkbox
                    id={addon.id}
                    checked={selectedAddons.includes(addon.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onAddonsChange([...selectedAddons, addon.id]);
                      } else {
                        onAddonsChange(selectedAddons.filter(id => id !== addon.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={addon.id} className="flex items-center gap-2 cursor-pointer">
                      {getAddonIcon(addon.addon_type)}
                      <div>
                        <span className="font-medium">{addon.name}</span>
                        <span className="ml-2 text-sm text-gray-600">
                          +{addon.price_type === 'percentage' 
                            ? `${addon.amount}%` 
                            : `${addon.amount} kr`}
                        </span>
                      </div>
                    </Label>
                    {addon.description && (
                      <p className="text-xs text-gray-500 mt-1 ml-6">{addon.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}