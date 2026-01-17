import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';

export default function PriceSummary({ 
  pricing, 
  formData, 
  calculatedPrice, 
  activePricing,
  variant = 'default' // 'default' or 'detailed'
}) {
  const getAddOnDetails = () => {
    if (!formData.add_ons || formData.add_ons.length === 0) return [];
    
    const addOnLabels = {
      heavy_items: 'Tunga varor',
      express: 'Express (samma dag)',
      multiple_stops: 'Flera stopp',
      waiting_time: 'Väntetid (15 min)',
      fragile_items: 'Ömtåliga varor'
    };

    return formData.add_ons.map(addon => ({
      name: addOnLabels[addon] || addon,
      price: activePricing?.[`addon_${addon}`] || 0
    }));
  };

  const addOnDetails = getAddOnDetails();
  const isHelpAtHome = formData.service_type === 'help_at_home';

  if (variant === 'detailed') {
    return (
      <Card className="border-2 border-[#4A90A4] bg-gradient-to-br from-[#4A90A4]/5 to-white shadow-lg">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-[#4A90A4]" />
            Detaljerad Prissammanfattning
          </h3>
          
          <div className="space-y-3">
            {/* Base Price */}
            <div className="flex justify-between items-start pb-3">
              <div>
                <p className="font-medium text-gray-900">
                  {isHelpAtHome ? '🏠 Startavgift' : '📦 Grundavgift'}
                </p>
                <p className="text-xs text-gray-500">
                  {isHelpAtHome ? 'Grundkostnad för service' : 'Inkluderar första 5 km'}
                </p>
              </div>
              <span className="font-semibold text-lg">{pricing.base_price} kr</span>
            </div>

            {/* Time Cost for Help at Home */}
            {isHelpAtHome && pricing.time_cost > 0 && (
              <div className="flex justify-between items-start pb-3 border-t pt-3">
                <div>
                  <p className="font-medium text-gray-900">⏱️ Tid</p>
                  <p className="text-xs text-gray-500">
                    {formData.help_duration_hours}h × {activePricing?.help_at_home_per_hour || 299} kr/timme
                  </p>
                </div>
                <span className="font-semibold text-lg">{pricing.time_cost} kr</span>
              </div>
            )}

            {/* Distance Fee */}
            {pricing.distance_fee > 0 && (
              <div className="flex justify-between items-start pb-3 border-t pt-3">
                <div>
                  <p className="font-medium text-gray-900">🚗 Avstånd</p>
                  <p className="text-xs text-gray-500">
                    {calculatedPrice?.distance_km || 0} km × {calculatedPrice?.per_km_rate || 8} kr/km
                  </p>
                </div>
                <span className="font-semibold text-lg">{pricing.distance_fee} kr</span>
              </div>
            )}

            {/* Individual Add-ons */}
            {addOnDetails.length > 0 && (
              <div className="border-t pt-3">
                <p className="font-medium text-gray-900 mb-2">➕ Tilläggstjänster</p>
                {addOnDetails.map((addon, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">{addon.name}</span>
                    </div>
                    <span className="font-medium text-sm">+{addon.price} kr</span>
                  </div>
                ))}
              </div>
            )}

            {/* Discount placeholder */}
            {false && ( // Set to true when discounts are active
              <div className="flex justify-between items-start pb-3 border-t pt-3 bg-green-50 -mx-6 px-6 py-3">
                <div>
                  <p className="font-medium text-green-700">🎉 Rabatt</p>
                  <p className="text-xs text-green-600">Första bokningen</p>
                </div>
                <span className="font-semibold text-lg text-green-700">-50 kr</span>
              </div>
            )}

            {/* Total */}
            <div className="border-t-2 border-[#4A90A4] pt-4 flex justify-between items-center bg-[#4A90A4]/5 -mx-6 px-6 py-4 rounded-b-xl">
              <div>
                <p className="text-sm text-gray-600 mb-1">Totalt att betala</p>
                <p className="text-2xl font-black text-[#4A90A4]">{pricing.total} kr</p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Inkl. moms
              </Badge>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              💳 Betala med Apple Pay, Google Pay eller kort. Inga dolda avgifter.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact version
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          💰 Beräknat Pris
        </h3>
        {calculatedPrice && (
          <Badge className="bg-green-100 text-green-800 text-sm">
            {calculatedPrice.distance_km} km
          </Badge>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">
            {isHelpAtHome ? 'Startavgift:' : 'Grundpris:'}
          </span>
          <span className="font-medium">{pricing.base_price} kr</span>
        </div>

        {isHelpAtHome && pricing.time_cost > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">
              Tid ({formData.help_duration_hours}h):
            </span>
            <span className="font-medium">{pricing.time_cost} kr</span>
          </div>
        )}

        {pricing.distance_fee > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">
              Avstånd ({calculatedPrice?.distance_km || 0} km):
            </span>
            <span className="font-medium">{pricing.distance_fee} kr</span>
          </div>
        )}

        {addOnDetails.length > 0 && (
          <>
            {addOnDetails.map((addon, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-600">+ {addon.name}:</span>
                <span className="font-medium">{addon.price} kr</span>
              </div>
            ))}
          </>
        )}

        <div className="border-t border-green-200 pt-3 flex justify-between items-center">
          <span className="font-semibold text-gray-900">Totalt:</span>
          <span className="font-bold text-2xl text-green-600">{pricing.total} kr</span>
        </div>
      </div>
    </motion.div>
  );
}