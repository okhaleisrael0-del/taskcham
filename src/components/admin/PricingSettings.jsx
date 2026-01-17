import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Save, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function PricingSettings() {
  const queryClient = useQueryClient();
  const [pricing, setPricing] = useState({
    base_city_price: 49,
    per_km_price: 8,
    help_at_home_base: 99,
    help_at_home_per_hour: 299,
    addon_heavy_items: 50,
    addon_express: 75,
    addon_multiple_stops: 30,
    addon_waiting_time: 50,
    addon_fragile_items: 25
  });

  const { data: pricingConfigs = [] } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: () => base44.entities.PricingConfig.list()
  });

  useEffect(() => {
    const activeConfig = pricingConfigs.find(c => c.is_active);
    if (activeConfig) {
      setPricing({
        base_city_price: activeConfig.base_city_price || 49,
        per_km_price: activeConfig.per_km_price || 8,
        help_at_home_base: activeConfig.help_at_home_base || 99,
        help_at_home_per_hour: activeConfig.help_at_home_per_hour || 299,
        addon_heavy_items: activeConfig.addon_heavy_items || 50,
        addon_express: activeConfig.addon_express || 75,
        addon_multiple_stops: activeConfig.addon_multiple_stops || 30,
        addon_waiting_time: activeConfig.addon_waiting_time || 50,
        addon_fragile_items: activeConfig.addon_fragile_items || 25
      });
    }
  }, [pricingConfigs]);

  const updatePricingMutation = useMutation({
    mutationFn: async (newPricing) => {
      const activeConfig = pricingConfigs.find(c => c.is_active);
      
      if (activeConfig) {
        await base44.entities.PricingConfig.update(activeConfig.id, newPricing);
      } else {
        await base44.entities.PricingConfig.create({
          ...newPricing,
          config_name: 'Göteborg Standardpriser',
          is_active: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-config']);
      toast.success('Priser uppdaterade!');
    },
    onError: (error) => {
      toast.error('Kunde inte uppdatera priser');
      console.error(error);
    }
  });

  const handleSave = () => {
    updatePricingMutation.mutate(pricing);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border-2 border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Göteborg Prismodell</h3>
            <p className="text-sm text-gray-600">Automatisk avståndsberoende prissättning</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">🚚 Leverans & Pickup</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_price" className="text-sm mb-2 block">
                  Grundavgift (SEK)
                </Label>
                <Input
                  id="base_price"
                  type="number"
                  value={pricing.base_city_price}
                  onChange={(e) => setPricing({
                    ...pricing,
                    base_city_price: parseFloat(e.target.value)
                  })}
                  className="h-12 text-xl font-bold"
                />
              </div>

              <div>
                <Label htmlFor="per_km" className="text-sm mb-2 block">
                  Per Kilometer (SEK)
                </Label>
                <Input
                  id="per_km"
                  type="number"
                  value={pricing.per_km_price}
                  onChange={(e) => setPricing({
                    ...pricing,
                    per_km_price: parseFloat(e.target.value)
                  })}
                  className="h-12 text-xl font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">🏠 Hjälp Hemma</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="home_base" className="text-sm mb-2 block">
                  Startavgift (SEK)
                </Label>
                <Input
                  id="home_base"
                  type="number"
                  value={pricing.help_at_home_base}
                  onChange={(e) => setPricing({
                    ...pricing,
                    help_at_home_base: parseFloat(e.target.value)
                  })}
                  className="h-12 text-xl font-bold"
                />
              </div>

              <div>
                <Label htmlFor="per_hour" className="text-sm mb-2 block">
                  Per Timme (SEK)
                </Label>
                <Input
                  id="per_hour"
                  type="number"
                  value={pricing.help_at_home_per_hour}
                  onChange={(e) => setPricing({
                    ...pricing,
                    help_at_home_per_hour: parseFloat(e.target.value)
                  })}
                  className="h-12 text-xl font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">➕ Tillägg</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-2 block">Tunga varor</Label>
                <Input
                  type="number"
                  value={pricing.addon_heavy_items}
                  onChange={(e) => setPricing({
                    ...pricing,
                    addon_heavy_items: parseFloat(e.target.value)
                  })}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Express</Label>
                <Input
                  type="number"
                  value={pricing.addon_express}
                  onChange={(e) => setPricing({
                    ...pricing,
                    addon_express: parseFloat(e.target.value)
                  })}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Flera stopp</Label>
                <Input
                  type="number"
                  value={pricing.addon_multiple_stops}
                  onChange={(e) => setPricing({
                    ...pricing,
                    addon_multiple_stops: parseFloat(e.target.value)
                  })}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Väntetid (15 min)</Label>
                <Input
                  type="number"
                  value={pricing.addon_waiting_time}
                  onChange={(e) => setPricing({
                    ...pricing,
                    addon_waiting_time: parseFloat(e.target.value)
                  })}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Ömtåliga varor</Label>
                <Input
                  type="number"
                  value={pricing.addon_fragile_items}
                  onChange={(e) => setPricing({
                    ...pricing,
                    addon_fragile_items: parseFloat(e.target.value)
                  })}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={updatePricingMutation.isPending}
          className="w-full mt-6 h-12 bg-green-600 hover:bg-green-700"
        >
          {updatePricingMutation.isPending ? (
            'Sparar...'
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Spara Priser
            </>
          )}
        </Button>
      </div>

      {/* Price Examples */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              Leveranspriser
            </h4>
            <div className="space-y-2">
              {[2, 5, 10, 15].map((km) => {
                const price = pricing.base_city_price + (km * pricing.per_km_price);
                return (
                  <div key={km} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-700">{km} km:</span>
                    <span className="font-bold text-[#4A90A4]">{Math.round(price)} SEK</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              Hemhjälp-priser
            </h4>
            <div className="space-y-2">
              {[0.5, 1, 2, 3].map((hours) => {
                const price = pricing.help_at_home_base + (hours * pricing.help_at_home_per_hour);
                return (
                  <div key={hours} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-700">{hours}h:</span>
                    <span className="font-bold text-[#4A90A4]">{Math.round(price)} SEK</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}