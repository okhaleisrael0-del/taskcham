import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShoppingCart, Check, X, Eye, DollarSign, User, 
  MessageSquare, AlertTriangle, Package, Percent, Sparkles, Calculator
} from 'lucide-react';

export default function AdminOrderManagement() {
  const queryClient = useQueryClient();
  const [priceDialog, setPriceDialog] = useState({ open: false, order: null });
  const [adjustedPrice, setAdjustedPrice] = useState('');
  const [priceMessage, setPriceMessage] = useState('');
  const [priceMode, setPriceMode] = useState('fixed'); // 'fixed' or 'percentage'
  const [percentageAdjustment, setPercentageAdjustment] = useState('0');
  const [assignDialog, setAssignDialog] = useState({ open: false, order: null });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-buy-deliver-orders'],
    queryFn: () => base44.entities.BuyDeliverOrder.list('-created_date', 100),
    refetchInterval: 5000
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: () => base44.entities.Driver.filter({ status: 'approved', dashboard_access: 'active' })
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ orderId, totalPrice, message }) => {
      await base44.entities.BuyDeliverOrder.update(orderId, {
        total_price: totalPrice,
        status: 'price_proposed',
        max_budget: totalPrice * 0.8 // 80% for items, rest for fees
      });
      
      // Send email to customer
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await base44.integrations.Core.SendEmail({
          to: order.customer_email,
          subject: `Prisförslag för Köp & Leverera #${order.order_number}`,
          body: `
Hej ${order.customer_name}!

Vi har granskat din shoppinglista och beräknat det slutliga priset.

📦 Order: #${order.order_number}
💰 Totalpris: ${totalPrice} kr

${message ? `📝 Meddelande: ${message}` : ''}

Logga in för att godkänna och betala.

Vänliga hälsningar,
TaskCham
          `
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-buy-deliver-orders']);
      setPriceDialog({ open: false, order: null });
      setAdjustedPrice('');
      setPriceMessage('');
      setPriceMode('fixed');
      setPercentageAdjustment('0');
    }
  });

  const assignRunnerMutation = useMutation({
    mutationFn: async ({ orderId, runnerId, runnerName, runner, order }) => {
      const runnerEarnings = Math.round(order.total_price * 0.8);
      const platformFee = order.total_price - runnerEarnings;
      
      await base44.entities.BuyDeliverOrder.update(orderId, {
        assigned_runner_id: runnerId,
        assigned_runner_name: runnerName,
        assigned_runner_phone: runner.phone,
        runner_earnings: runnerEarnings,
        platform_fee: platformFee,
        status: 'assigned'
      });
      
      // Notify runner
      await base44.integrations.Core.SendEmail({
        to: runner.email,
        subject: `Nytt Köp & Leverera Uppdrag - #${order.order_number}`,
        body: `
Hej ${runnerName}!

Du har tilldelats ett Köp & Leverera uppdrag.

📦 Order: #${order.order_number}
🏪 Butik: ${order.store_name || 'Valfri butik'}
📍 Leverera till: ${order.delivery_address}
🛒 Antal varor: ${order.shopping_list?.length}
💰 Din intäkt: ${runnerEarnings} kr

Logga in på din dashboard för att se shoppinglistan och börja handla.

Vänliga hälsningar,
TaskCham
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-buy-deliver-orders']);
      setAssignDialog({ open: false, order: null });
    }
  });

  const availableRunners = drivers.filter(d => d.availability === 'available');

  // Calculate smart price suggestion based on order complexity
  const calculateSmartPrice = (order) => {
    if (!order) return 0;
    
    const basePrice = order.total_price || 0;
    let adjustments = 0;
    let reasons = [];

    // Item count factor
    const itemCount = order.shopping_list?.length || 0;
    if (itemCount > 20) {
      adjustments += basePrice * 0.15; // +15% for large orders
      reasons.push(`+15% (${itemCount} varor)`);
    } else if (itemCount > 10) {
      adjustments += basePrice * 0.10; // +10% for medium orders
      reasons.push(`+10% (${itemCount} varor)`);
    }

    // Time of day factor (evening/night orders)
    const now = new Date();
    const hour = now.getHours();
    if (order.preferred_time) {
      const preferredHour = parseInt(order.preferred_time.split(':')[0]);
      if (preferredHour >= 20 || preferredHour <= 6) {
        adjustments += basePrice * 0.20; // +20% for evening/night
        reasons.push('+20% (kväll/natt)');
      }
    }

    // Distance complexity (if coordinates available)
    if (order.store_lat && order.delivery_lat) {
      const distance = calculateDistance(
        order.store_lat, order.store_lng,
        order.delivery_lat, order.delivery_lng
      );
      if (distance > 10) {
        adjustments += basePrice * 0.10; // +10% for long distances
        reasons.push(`+10% (${distance.toFixed(1)} km)`);
      }
    }

    // Special instructions complexity
    if (order.special_instructions && order.special_instructions.length > 100) {
      adjustments += basePrice * 0.05; // +5% for complex instructions
      reasons.push('+5% (detaljerade instruktioner)');
    }

    const suggestedPrice = Math.round(basePrice + adjustments);
    return { price: suggestedPrice, reasons, adjustment: adjustments };
  };

  // Simple distance calculation
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate price based on mode
  const calculateFinalPrice = () => {
    if (!priceDialog.order) return 0;
    
    if (priceMode === 'fixed') {
      return parseFloat(adjustedPrice) || 0;
    } else {
      const basePrice = priceDialog.order.total_price || 0;
      const percentage = parseFloat(percentageAdjustment) || 0;
      return Math.round(basePrice * (1 + percentage / 100));
    }
  };

  const handleApplySmartPrice = () => {
    if (!priceDialog.order) return;
    const { price, reasons } = calculateSmartPrice(priceDialog.order);
    setAdjustedPrice(price.toString());
    setPriceMode('fixed');
    setPriceMessage(`Automatiskt beräknat pris baserat på:\n${reasons.join('\n')}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      price_proposed: 'bg-blue-100 text-blue-800',
      payment_pending: 'bg-amber-100 text-amber-800',
      paid: 'bg-green-100 text-green-800',
      assigned: 'bg-purple-100 text-purple-800',
      shopping: 'bg-indigo-100 text-indigo-800',
      purchased: 'bg-cyan-100 text-cyan-800',
      delivering: 'bg-teal-100 text-teal-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-lg">#{order.order_number}</span>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {order.shopping_list?.length} varor • {order.customer_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Totalt</p>
                <p className="text-2xl font-bold text-[#4A90A4]">{order.total_price?.toFixed(0)} kr</p>
              </div>
            </div>

            {/* Shopping List Preview */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Shoppinglista:</p>
              <div className="space-y-1">
                {order.shopping_list?.slice(0, 3).map((item, idx) => (
                  <p key={idx} className="text-sm text-gray-600">
                    • {item.item_name} ×{item.quantity} 
                    {item.notes && ` (${item.notes})`}
                    {item.status !== 'pending' && (
                      <Badge className={`ml-2 ${
                        item.status === 'found' ? 'bg-green-100 text-green-700' :
                        item.status === 'not_available' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </Badge>
                    )}
                  </p>
                ))}
                {order.shopping_list?.length > 3 && (
                  <p className="text-xs text-gray-500">+ {order.shopping_list.length - 3} fler...</p>
                )}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="text-sm text-gray-600 mb-4">
              <p>🏪 Butik: {order.store_name || 'Ej angiven'}</p>
              <p>📍 Leverans: {order.delivery_address}</p>
              {order.assigned_runner_name && (
                <p>🚗 Runner: {order.assigned_runner_name}</p>
              )}
              {order.receipt_photo_url && (
                <a href={order.receipt_photo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  📄 Visa kvitto
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {order.status === 'pending_review' && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setPriceDialog({ open: true, order });
                    setAdjustedPrice(order.total_price?.toString() || '');
                    setPriceMode('fixed');
                    setPercentageAdjustment('0');
                    setPriceMessage('');
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Sätt Slutligt Pris
                </Button>
              )}

              {order.status === 'paid' && !order.assigned_runner_id && (
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => setAssignDialog({ open: true, order })}
                >
                  <User className="h-4 w-4 mr-1" />
                  Tilldela Runner
                </Button>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    Visa Detaljer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Order #{order.order_number}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Fullständig Shoppinglista:</p>
                      {order.shopping_list?.map((item, idx) => (
                        <div key={idx} className="border-b py-2 flex justify-between">
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-gray-600">
                              Antal: {item.quantity} {item.notes && `• ${item.notes}`}
                            </p>
                          </div>
                          <p className="text-sm">{item.estimated_price || 0} kr</p>
                        </div>
                      ))}
                    </div>
                    {order.special_instructions && (
                      <div className="bg-amber-50 p-3 rounded">
                        <p className="text-sm"><strong>Instruktioner:</strong> {order.special_instructions}</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}

      {orders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Inga Köp & Leverera beställningar än</p>
          </CardContent>
        </Card>
      )}

      {/* Price Dialog */}
      <Dialog open={priceDialog.open} onOpenChange={(open) => !open && setPriceDialog({ open: false, order: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sätt Slutligt Pris</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Smart Price Suggestion */}
            {priceDialog.order && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">Smart Prisförslag</p>
                    {(() => {
                      const { price, reasons, adjustment } = calculateSmartPrice(priceDialog.order);
                      return (
                        <>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-bold text-purple-600">{price} kr</span>
                            {adjustment > 0 && (
                              <span className="text-sm text-gray-600">
                                (+{Math.round(adjustment)} kr från bas)
                              </span>
                            )}
                          </div>
                          {reasons.length > 0 && (
                            <div className="text-xs text-gray-600 space-y-1">
                              <p className="font-medium">Beräknat baserat på:</p>
                              {reasons.map((reason, idx) => (
                                <p key={idx}>• {reason}</p>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApplySmartPrice}
                    className="border-purple-300 hover:bg-purple-50"
                  >
                    Använd
                  </Button>
                </div>
              </div>
            )}

            {/* Price Mode Selection */}
            <div>
              <Label className="mb-2 block">Prisläge</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPriceMode('fixed')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    priceMode === 'fixed'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <span className="text-sm font-medium">Fast Belopp</span>
                </button>
                <button
                  onClick={() => setPriceMode('percentage')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    priceMode === 'percentage'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Percent className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <span className="text-sm font-medium">Procentuell</span>
                </button>
              </div>
            </div>

            {/* Price Input */}
            {priceMode === 'fixed' ? (
              <div>
                <Label>Totalpris (kr)</Label>
                <Input
                  type="number"
                  value={adjustedPrice}
                  onChange={(e) => setAdjustedPrice(e.target.value)}
                  placeholder="Ange slutligt pris..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ursprunglig uppskattning: {priceDialog.order?.total_price?.toFixed(0)} kr
                </p>
              </div>
            ) : (
              <div>
                <Label>Procentuell justering</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={percentageAdjustment}
                    onChange={(e) => setPercentageAdjustment(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                  <span className="text-gray-600">%</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-gray-500">
                    Bas: {priceDialog.order?.total_price?.toFixed(0)} kr
                  </span>
                  <span className="font-medium text-lg">
                    = {calculateFinalPrice()} kr
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  {[-20, -10, -5, 5, 10, 15, 20].map((percent) => (
                    <Button
                      key={percent}
                      size="sm"
                      variant="outline"
                      onClick={() => setPercentageAdjustment(percent.toString())}
                      className="flex-1 text-xs h-8"
                    >
                      {percent > 0 ? '+' : ''}{percent}%
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="bg-gray-50 border rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Slutligt pris:</span>
                <span className="font-bold text-lg">{calculateFinalPrice()} kr</span>
              </div>
              <div className="border-t pt-2 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Varor budget (80%):</span>
                  <span>{Math.round(calculateFinalPrice() * 0.8)} kr</span>
                </div>
                <div className="flex justify-between">
                  <span>Leveransavgift (20%):</span>
                  <span>{Math.round(calculateFinalPrice() * 0.2)} kr</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Meddelande till kund (valfritt)</Label>
              <Textarea
                value={priceMessage}
                onChange={(e) => setPriceMessage(e.target.value)}
                placeholder="Förklara prisjusteringar..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialog({ open: false, order: null })}>
              Avbryt
            </Button>
            <Button
              onClick={() => updatePriceMutation.mutate({
                orderId: priceDialog.order?.id,
                totalPrice: calculateFinalPrice(),
                message: priceMessage
              })}
              disabled={calculateFinalPrice() <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Skicka Prisförslag ({calculateFinalPrice()} kr)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Runner Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => !open && setAssignDialog({ open: false, order: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilldela Runner</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {availableRunners.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Inga tillgängliga runners</p>
            ) : (
              availableRunners.map((runner) => (
                <Button
                  key={runner.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => assignRunnerMutation.mutate({
                    orderId: assignDialog.order?.id,
                    runnerId: runner.id,
                    runnerName: runner.name,
                    runner: runner,
                    order: assignDialog.order
                  })}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-[#4A90A4]" />
                    <div className="text-left">
                      <p className="font-medium">{runner.name}</p>
                      <p className="text-sm text-gray-500">{runner.completed_tasks || 0} uppdrag</p>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}