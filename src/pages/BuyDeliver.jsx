import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus, Trash2, Package, MapPin, Calendar, DollarSign, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BuyDeliverPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [shoppingList, setShoppingList] = useState([
    { item_name: '', quantity: 1, notes: '', estimated_price: 0, category: 'groceries' }
  ]);
  const [pricingConfigs, setPricingConfigs] = useState([]);
  const [storeInfo, setStoreInfo] = useState({ name: '', address: '' });
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  React.useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setCustomerInfo({
          name: user.full_name || '',
          email: user.email || '',
          phone: ''
        });
      }
    };
    loadUser();
  }, []);

  React.useEffect(() => {
    const loadPricingConfigs = async () => {
      const configs = await base44.entities.ItemPricingConfig.filter({ is_active: true });
      setPricingConfigs(configs);
    };
    loadPricingConfigs();
  }, []);

  const addItem = () => {
    setShoppingList([...shoppingList, { item_name: '', quantity: 1, notes: '', estimated_price: 0, category: 'groceries' }]);
  };

  const getCategoryPrice = (category) => {
    const config = pricingConfigs.find(c => c.category === category);
    return config ? config.average_price_per_item : 0;
  };

  const updateItemCategory = (index, category) => {
    const updated = [...shoppingList];
    const autoPrice = getCategoryPrice(category) * updated[index].quantity;
    updated[index].category = category;
    updated[index].estimated_price = autoPrice;
    setShoppingList(updated);
  };

  const removeItem = (index) => {
    setShoppingList(shoppingList.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...shoppingList];
    updated[index][field] = value;
    setShoppingList(updated);
  };

  const calculatePricing = () => {
    const itemsEstimate = shoppingList.reduce((sum, item) => 
      sum + (parseFloat(item.estimated_price) || 0), 0
    );
    const deliveryFee = 79; // Base delivery fee
    const serviceFee = Math.round(itemsEstimate * 0.15); // 15% service fee
    const total = itemsEstimate + deliveryFee + serviceFee;
    
    return { itemsEstimate, deliveryFee, serviceFee, total };
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const orderNumber = `BD${Date.now().toString().slice(-6)}`;
      
      const order = await base44.entities.BuyDeliverOrder.create({
        order_number: orderNumber,
        ...orderData,
        status: 'pending_review'
      });
      
      return order;
    },
    onSuccess: (order) => {
      navigate(createPageUrl('CustomerDashboard'));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const pricing = calculatePricing();
    const validItems = shoppingList.filter(item => item.item_name.trim());
    
    createOrderMutation.mutate({
      shopping_list: validItems.map(item => ({
        ...item,
        status: 'pending'
      })),
      store_name: storeInfo.name,
      store_address: storeInfo.address,
      delivery_address: deliveryAddress,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      customer_user_id: currentUser?.id,
      items_estimate: pricing.itemsEstimate,
      delivery_fee: pricing.deliveryFee,
      service_fee: pricing.serviceFee,
      total_price: pricing.total,
      max_budget: pricing.itemsEstimate * 1.2, // 20% buffer
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      special_instructions: specialInstructions
    });
  };

  const pricing = calculatePricing();
  const validItems = shoppingList.filter(item => item.item_name.trim()).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4A90A4] to-[#7FB069] rounded-2xl mb-4">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Köp & Leverera</h1>
          <p className="text-gray-600">Vi handlar och levererar till dig i Göteborg</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shopping List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shoppinglista
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {shoppingList.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="grid grid-cols-12 gap-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="col-span-12 sm:col-span-3">
                      <Label className="text-xs">Vara</Label>
                      <Input
                        placeholder="T.ex. Mjölk, Bröd..."
                        value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Label className="text-xs">Kategori</Label>
                      <Select 
                        value={item.category || 'groceries'} 
                        onValueChange={(value) => updateItemCategory(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="groceries">🛒 Matvaror</SelectItem>
                          <SelectItem value="pharmacy">💊 Apotek</SelectItem>
                          <SelectItem value="household">🏠 Hushåll</SelectItem>
                          <SelectItem value="electronics">📱 Elektronik</SelectItem>
                          <SelectItem value="furniture">🪑 Möbler</SelectItem>
                          <SelectItem value="clothing">👕 Kläder</SelectItem>
                          <SelectItem value="toys">🧸 Leksaker</SelectItem>
                          <SelectItem value="books">📚 Böcker</SelectItem>
                          <SelectItem value="sports">⚽ Sport</SelectItem>
                          <SelectItem value="other">📦 Övrigt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <Label className="text-xs">Antal</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value);
                          updateItem(index, 'quantity', qty);
                          const autoPrice = getCategoryPrice(item.category || 'groceries') * qty;
                          updateItem(index, 'estimated_price', autoPrice);
                        }}
                        required
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Label className="text-xs flex items-center gap-1">
                        Pris (kr) <Sparkles className="h-3 w-3 text-yellow-500" />
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.estimated_price}
                        onChange={(e) => updateItem(index, 'estimated_price', e.target.value)}
                        placeholder="Auto"
                        className="bg-yellow-50"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                      <Label className="text-xs">Anteckningar</Label>
                      <Input
                        placeholder="Storlek, märke..."
                        value={item.notes}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={shoppingList.length === 1}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lägg till vara
              </Button>
            </CardContent>
          </Card>

          {/* Store & Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Butik & Leverans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Önskad Butik (valfritt)</Label>
                  <Input
                    placeholder="T.ex. ICA Kvantum, Coop..."
                    value={storeInfo.name}
                    onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Lämna tom så väljer vi bästa butiken</p>
                </div>
                <div>
                  <Label>Butiksområde (valfritt)</Label>
                  <Input
                    placeholder="T.ex. Centrum, Hisingen..."
                    value={storeInfo.address}
                    onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Leveransadress *</Label>
                <Input
                  placeholder="Din adress i Göteborg"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                När ska vi leverera?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Datum</Label>
                  <Input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Önskad Tid</Label>
                  <Input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Speciella Instruktioner</Label>
                <Textarea
                  placeholder="T.ex. ring när du är framme, lämna vid dörren..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          {!currentUser && (
            <Card>
              <CardHeader>
                <CardTitle>Dina Kontaktuppgifter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Namn *</Label>
                    <Input
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Telefon *</Label>
                    <Input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>E-post *</Label>
                  <Input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Summary */}
          <Card className="border-2 border-[#4A90A4]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Prisuppskattning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Varor ({validItems} st)</span>
                <span className="font-medium">{pricing.itemsEstimate.toFixed(0)} kr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Leveransavgift</span>
                <span className="font-medium">{pricing.deliveryFee} kr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Serviceavgift (15%)</span>
                <span className="font-medium">{pricing.serviceFee} kr</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-lg">Totalt (uppskattning)</span>
                <span className="font-bold text-2xl text-[#4A90A4]">{pricing.total.toFixed(0)} kr</span>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-800">
                  💡 <strong>Obs:</strong> Detta är en uppskattning. Admin granskar din lista och skickar 
                  det slutliga priset innan betalning.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl('Home'))}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={validItems === 0 || !deliveryAddress || createOrderMutation.isPending}
              className="flex-1 bg-[#4A90A4] hover:bg-[#3d7a8c]"
            >
              {createOrderMutation.isPending ? (
                'Skickar...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Skicka Beställning
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}