import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { NotificationService } from '@/components/notifications/NotificationService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SavedAddressSelector from '@/components/booking/SavedAddressSelector';
import { ElderlyModeToggle } from '@/components/accessibility/ElderlyModeToggle';
import PaymentButton from '@/components/payment/PaymentButton';
import StoreSelector from '@/components/booking/StoreSelector';
import MediaUploader from '@/components/booking/MediaUploader';
import { 
  Truck, Home, ShoppingBag, Sun, Snowflake, MapPin, Calendar, Clock,
  Package, User, Phone, Mail, Check, ArrowRight, ArrowLeft, Dog,
  Sparkles, Users, FileText
} from 'lucide-react';
import PriceSummary from '@/components/booking/PriceSummary';
import PromoCodeInput from '@/components/booking/PromoCodeInput';
import RunnerNearbyIndicator from '@/components/customer/RunnerNearbyIndicator';

export default function BookingPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setFormData(prev => ({
          ...prev,
          customer_name: user.full_name || prev.customer_name,
          customer_email: user.email || prev.customer_email,
          customer_user_id: user.id
        }));
      }
    };
    loadUser();

    // Load active pricing config
    const loadPricing = async () => {
      const configs = await base44.entities.PricingConfig.filter({ is_active: true });
      if (configs.length > 0) {
        setActivePricing(configs[0]);
      }
    };
    loadPricing();

    // Check for repeat booking
    const urlParams = new URLSearchParams(window.location.search);
    const repeatData = urlParams.get('repeat');
    if (repeatData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(repeatData));
        setFormData(prev => ({ ...prev, ...parsed, terms_accepted: false }));
      } catch (e) {}
    }
  }, []);
  
  const [formData, setFormData] = useState({
    service_type: '',
    season: '',
    help_service_type: '',
    pickup_address: '',
    delivery_address: '',
    task_location: '',
    preferred_date: '',
    preferred_time: '',
    item_description: '',
    item_size: 'small',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_user_id: '',
    notes_for_driver: '',
    store_booking_number: '',
    terms_accepted: false,
    add_ons: [],
    help_duration_hours: 1,
    customer_offered_price: '',
    customer_price_message: ''
  });
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [activePricing, setActivePricing] = useState(null);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [deliveryProtection, setDeliveryProtection] = useState(false);

  const [pricing, setPricing] = useState({
    base_price: 99,
    distance_fee: 0,
    add_ons_total: 0,
    total: 99,
    area_type: 'city'
  });

  // Calculate pricing based on selections
  useEffect(() => {
    if (!activePricing) return;

    let baseTotal = 0;

    if (formData.service_type === 'help_at_home') {
      const basePrice = activePricing.help_at_home_base || 99;
      const hourlyRate = activePricing.help_at_home_per_hour || 299;
      const timeCost = formData.help_duration_hours * hourlyRate;
      baseTotal = basePrice + timeCost;

      setPricing({
        base_price: basePrice,
        distance_fee: 0,
        time_cost: timeCost,
        add_ons_total: 0,
        protection_fee: deliveryProtection ? 25 : 0,
        subtotal: baseTotal + (deliveryProtection ? 25 : 0),
        discount: appliedPromo?.discount_amount || 0,
        total: baseTotal + (deliveryProtection ? 25 : 0) - (appliedPromo?.discount_amount || 0),
        area_type: 'home'
      });
    } else if (calculatedPrice) {
      const protectionFee = deliveryProtection ? 25 : 0;
      baseTotal = calculatedPrice.final_total + protectionFee;
      
      setPricing({
        base_price: calculatedPrice.base_price,
        distance_fee: calculatedPrice.distance_fee,
        add_ons_total: calculatedPrice.add_ons_total || 0,
        protection_fee: protectionFee,
        subtotal: baseTotal,
        discount: appliedPromo?.discount_amount || 0,
        total: baseTotal - (appliedPromo?.discount_amount || 0),
        area_type: 'city'
      });
    } else {
      const basePrice = activePricing.base_city_price || 49;
      const addOnsTotal = formData.add_ons.reduce((sum, addon) => {
        return sum + (activePricing[`addon_${addon}`] || 0);
      }, 0);
      const protectionFee = deliveryProtection ? 25 : 0;
      baseTotal = basePrice + addOnsTotal + protectionFee;

      setPricing({
        base_price: basePrice,
        distance_fee: 0,
        add_ons_total: addOnsTotal,
        protection_fee: protectionFee,
        subtotal: baseTotal,
        discount: appliedPromo?.discount_amount || 0,
        total: baseTotal - (appliedPromo?.discount_amount || 0),
        area_type: 'city'
      });
    }
  }, [formData.service_type, formData.help_duration_hours, formData.add_ons, calculatedPrice, activePricing, deliveryProtection, appliedPromo]);

  const [pendingBooking, setPendingBooking] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [useStoreSelector, setUseStoreSelector] = useState(false);

  const handleDeliveryAddressSelect = (address, lat, lng) => {
    setFormData({
      ...formData,
      delivery_address: address,
      delivery_lat: lat,
      delivery_lng: lng
    });
  };

  const calculatePrice = async (pickupLat, pickupLng, deliveryLat, deliveryLng) => {
    setIsCalculatingPrice(true);
    try {
      const result = await base44.functions.invoke('calculateDistance', {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        add_ons: formData.add_ons
      });
      setCalculatedPrice(result.data);
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  useEffect(() => {
    // Check for payment success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      const bookingNum = urlParams.get('booking');
      if (bookingNum) {
        setBookingNumber(bookingNum);
        setIsComplete(true);
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (!formData.terms_accepted) return;
    
    setIsSubmitting(true);
    
    const bookingNum = 'TC' + Date.now().toString().slice(-8);
    
    // Calculate driver earnings and platform fee
    const driverEarnings = Math.round(pricing.total * 0.8);
    const platformFee = Math.round(pricing.total * 0.2);
    
    // Build add-ons array with prices
    const addOnsArray = formData.add_ons.map(addon => {
      const addonLabels = {
        heavy_items: 'Tunga varor',
        express: 'Express (samma dag)',
        multiple_stops: 'Flera stopp',
        waiting_time: 'Väntetid',
        fragile_items: 'Ömtåliga varor'
      };
      return {
        name: addonLabels[addon] || addon,
        price: activePricing?.[`addon_${addon}`] || 0
      };
    });

    const bookingData = {
      ...formData,
      booking_number: bookingNum,
      base_price: pricing.base_price,
      distance_fee: pricing.distance_fee || 0,
      distance_km: calculatedPrice?.distance_km || 0,
      total_price: pricing.total,
      area_type: pricing.area_type,
      driver_earnings: Math.round(pricing.total * 0.8),
      platform_fee: Math.round(pricing.total * 0.2),
      add_ons: addOnsArray,
      media_urls: uploadedMedia,
      pickup_store: selectedStore || undefined,
      pickup_lat: selectedStore?.location?.lat || formData.pickup_lat,
      pickup_lng: selectedStore?.location?.lng || formData.pickup_lng,
      promo_code: appliedPromo?.code,
      discount_amount: appliedPromo?.discount_amount || 0,
      delivery_protection: deliveryProtection,
      protection_fee: deliveryProtection ? 25 : 0,
      business_account_id: businessAccountId
    };

    // For help_at_home, submit for price review first
    if (formData.service_type === 'help_at_home') {
      bookingData.status = 'price_review';
      bookingData.negotiation_status = 'pending_admin_review';
      bookingData.payment_status = 'pending';
      bookingData.customer_offered_price = formData.customer_offered_price;
      bookingData.customer_price_message = formData.customer_price_message;
      
      await base44.entities.Booking.create(bookingData);
      setBookingNumber(bookingNum);
      setIsComplete(true);
      setIsSubmitting(false);
    } else {
      // For delivery/errand, proceed to payment
      bookingData.status = 'pending';
      bookingData.payment_status = 'pending';
      
      await base44.entities.Booking.create(bookingData);
      setBookingNumber(bookingNum);
      setPendingBooking(bookingData);
      setShowPayment(true);
      setIsSubmitting(false);
    }
  };

  const serviceTypes = [
    { value: 'delivery', label: t('delivery'), icon: Truck, desc: t('packageDelivery') },
    { value: 'errand', label: t('errand'), icon: ShoppingBag, desc: t('shoppingPickups') },
    { value: 'help_at_home', label: t('helpAtHomeService'), icon: Home, desc: t('homeAssistance') }
  ];

  const helpServiceTypes = [
    { value: 'pet_care', label: t('petCare'), icon: Dog },
    { value: 'dishes_cleanup', label: t('dishesCleanup'), icon: Sparkles },
    { value: 'household_help', label: t('householdHelp'), icon: Home },
    { value: 'store_pickup', label: t('storePickup'), icon: ShoppingBag },
    { value: 'parcel_returns', label: t('parcelReturns'), icon: Package },
    { value: 'elderly_support', label: t('elderlySupport'), icon: Users }
  ];

  const getAddOnOptions = () => {
    if (!activePricing) return [];
    return [
      { value: 'heavy_items', label: 'Tunga varor', price: activePricing.addon_heavy_items },
      { value: 'express', label: 'Express (samma dag)', price: activePricing.addon_express },
      { value: 'multiple_stops', label: t('multipleStops'), price: activePricing.addon_multiple_stops },
      { value: 'waiting_time', label: t('waitingTime'), price: activePricing.addon_waiting_time },
      { value: 'fragile_items', label: t('fragileItems'), price: activePricing.addon_fragile_items }
    ];
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Vad behöver du hjälp med?</h2>
              <p className="text-gray-600">Välj typ av tjänst nedan</p>
            </div>

            {/* Runner Availability Banner */}
            <RunnerNearbyIndicator area="city" />
            
            <RadioGroup 
              value={formData.service_type} 
              onValueChange={(value) => setFormData({...formData, service_type: value})}
              className="grid gap-4"
            >
              {serviceTypes.map((type) => (
                <Label
                  key={type.value}
                  htmlFor={type.value}
                  className={`flex items-center gap-4 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.service_type === type.value
                      ? 'border-[#4A90A4] bg-[#4A90A4]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    formData.service_type === type.value ? 'bg-[#4A90A4]' : 'bg-gray-100'
                  }`}>
                    <type.icon className={`h-7 w-7 ${
                      formData.service_type === type.value ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.desc}</p>
                  </div>
                  {formData.service_type === type.value && (
                    <Check className="h-6 w-6 text-[#4A90A4]" />
                  )}
                </Label>
              ))}
            </RadioGroup>

            {formData.service_type && formData.service_type !== 'help_at_home' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('selectSeason')}</h3>
                <RadioGroup 
                  value={formData.season} 
                  onValueChange={(value) => setFormData({...formData, season: value})}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="summer"
                    className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.season === 'summer'
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="summer" id="summer" className="sr-only" />
                    <Sun className={`h-6 w-6 ${formData.season === 'summer' ? 'text-amber-500' : 'text-gray-400'}`} />
                    <span className="font-medium">{t('summer')}</span>
                  </Label>
                  <Label
                    htmlFor="winter"
                    className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.season === 'winter'
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="winter" id="winter" className="sr-only" />
                    <Snowflake className={`h-6 w-6 ${formData.season === 'winter' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="font-medium">{t('winter')}</span>
                  </Label>
                </RadioGroup>
              </motion.div>
            )}

            {formData.service_type === 'help_at_home' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('selectServiceHelp')}</h3>
                <RadioGroup 
                  value={formData.help_service_type} 
                  onValueChange={(value) => setFormData({...formData, help_service_type: value})}
                  className="grid sm:grid-cols-2 gap-3"
                >
                  {helpServiceTypes.map((type) => (
                    <Label
                      key={type.value}
                      htmlFor={type.value}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.help_service_type === type.value
                          ? 'border-[#7FB069] bg-[#7FB069]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                      <type.icon className={`h-5 w-5 ${
                        formData.help_service_type === type.value ? 'text-[#7FB069]' : 'text-gray-400'
                      }`} />
                      <span className="text-sm font-medium">{type.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">📍 Var och när?</h2>
              <p className="text-gray-600">Ange platser och önskad tid</p>
            </div>
            
            {formData.service_type !== 'help_at_home' && (
              <>
                <div>
                  <Label className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#4A90A4]" />
                      {t('pickupAddress')}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseStoreSelector(!useStoreSelector)}
                      className="text-[#4A90A4]"
                    >
                      {useStoreSelector ? 'Skriv adress manuellt' : '🏪 Välj från butik'}
                    </Button>
                  </Label>

                  {useStoreSelector ? (
                    <StoreSelector
                      onSelectStore={(store) => {
                        setSelectedStore(store);
                        if (store) {
                          setFormData({
                            ...formData,
                            pickup_address: store.address
                          });
                        }
                      }}
                      preselectedStore={selectedStore}
                    />
                  ) : (
                    <>
                      <SavedAddressSelector
                        userEmail={currentUser?.email}
                        onSelectAddress={(address) => {
                          setFormData({...formData, pickup_address: address});
                          setSelectedStore(null);
                        }}
                        selectedAddress={formData.pickup_address}
                      />
                      <Input
                        id="pickup"
                        placeholder={t('enterPickupAddress')}
                        value={formData.pickup_address}
                        onChange={(e) => {
                          setFormData({...formData, pickup_address: e.target.value});
                          setSelectedStore(null);
                        }}
                        className="h-12 mt-2"
                      />
                    </>
                  )}
                </div>

                <div>
                  <Label htmlFor="delivery" className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-[#7FB069]" />
                    {t('deliveryAddress')}
                  </Label>
                  <SavedAddressSelector
                    userEmail={currentUser?.email}
                    onSelectAddress={(address, lat, lng) => handleDeliveryAddressSelect(address, lat, lng)}
                    selectedAddress={formData.delivery_address}
                  />
                  <Input
                    id="delivery"
                    placeholder={t('enterDeliveryAddress')}
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                    className="h-12 mt-2"
                  />
                </div>
              </>
            )}

            {formData.service_type === 'help_at_home' && (
              <div>
                <Label htmlFor="task_location" className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-[#7FB069]" />
                  {t('taskLocation')}
                </Label>
                <SavedAddressSelector
                  userEmail={currentUser?.email}
                  onSelectAddress={(address) => setFormData({...formData, task_location: address})}
                  selectedAddress={formData.task_location}
                />
                <Input
                  id="task_location"
                  placeholder={t('enterYourAddress')}
                  value={formData.task_location}
                  onChange={(e) => setFormData({...formData, task_location: e.target.value})}
                  className="h-12 mt-2"
                />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {t('preferredDate')}
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="time" className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {t('preferredTime')}
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                  className="h-12"
                />
              </div>
            </div>

            {formData.service_type !== 'help_at_home' && (
              <>
                <div>
                  <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    {t('itemDescription')}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={t('describeTask')}
                    value={formData.item_description}
                    onChange={(e) => setFormData({...formData, item_description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="mb-3 block">{t('itemSize')}</Label>
                  <RadioGroup 
                    value={formData.item_size} 
                    onValueChange={(value) => setFormData({...formData, item_size: value})}
                    className="flex gap-4"
                  >
                    <Label
                      htmlFor="small"
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer ${
                        formData.item_size === 'small'
                          ? 'border-[#4A90A4] bg-[#4A90A4]/5'
                          : 'border-gray-200'
                      }`}
                    >
                      <RadioGroupItem value="small" id="small" className="sr-only" />
                      <span className="font-medium">{t('small')}</span>
                    </Label>
                    <Label
                      htmlFor="medium"
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer ${
                        formData.item_size === 'medium'
                          ? 'border-[#4A90A4] bg-[#4A90A4]/5'
                          : 'border-gray-200'
                      }`}
                    >
                      <RadioGroupItem value="medium" id="medium" className="sr-only" />
                      <span className="font-medium">{t('medium')}</span>
                    </Label>
                  </RadioGroup>
                </div>
              </>
            )}

            {formData.service_type === 'help_at_home' && (
              <>
                <div>
                  <Label className="mb-3 block font-semibold">⏱ Hur lång tid behöver du hjälp?</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { hours: 0.5, label: '30 min' },
                      { hours: 1, label: '1 timme' },
                      { hours: 2, label: '2 timmar' }
                    ].map((option) => (
                      <button
                        key={option.hours}
                        type="button"
                        onClick={() => setFormData({...formData, help_duration_hours: option.hours})}
                        className={`p-4 rounded-xl border-2 font-medium transition-all ${
                          formData.help_duration_hours === option.hours
                            ? 'border-[#7FB069] bg-[#7FB069]/10 text-[#7FB069]'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                    📝 Beskriv vad som ska göras
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="ex: montera IKEA-garderob, bära soffa uppför trappa, fixa kökslåda..."
                    value={formData.item_description}
                    onChange={(e) => setFormData({...formData, item_description: e.target.value})}
                    rows={3}
                  />
                </div>

                {/* Media Upload */}
                <div>
                  <Label className="mb-3 block font-semibold">
                    📸 Visa oss jobbet
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Ladda upp bilder eller video så vi kan se exakt vad som behövs. Ju tydligare, desto snabbare får du pris!
                  </p>
                  <MediaUploader 
                    onMediaUploaded={(media) => setUploadedMedia(media)}
                    existingMedia={uploadedMedia}
                  />
                </div>
              </>
            )}

            {/* Store Booking Number */}
            {useStoreSelector && selectedStore && (
              <div>
                <Label htmlFor="store_booking" className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-[#4A90A4]" />
                  Butikens Boknings-/Ordernummer ({t('optional')})
                </Label>
                <Input
                  id="store_booking"
                  placeholder="t.ex. #IK123456, Order-789, etc."
                  value={formData.store_booking_number}
                  onChange={(e) => setFormData({...formData, store_booking_number: e.target.value})}
                  className="h-12 font-mono text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Numret som butiken gav dig vid beställning
                </p>
              </div>
            )}

            {/* Notes for Driver */}
            <div>
              <Label htmlFor="notes" className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-500" />
                Anteckningar till Förare ({t('optional')})
              </Label>
              <Textarea
                id="notes"
                placeholder="Specialinstruktioner, portkod, parkeringsinfo..."
                value={formData.notes_for_driver}
                onChange={(e) => setFormData({...formData, notes_for_driver: e.target.value})}
                rows={2}
              />
            </div>

            {/* Price Preview */}
            {calculatedPrice && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    💰 Beräknat Pris
                  </h3>
                  <Badge className="bg-green-100 text-green-800 text-sm">
                    {calculatedPrice.distance_km} km
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grundpris:</span>
                    <span className="font-medium">{calculatedPrice.base_price} SEK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avstånd ({calculatedPrice.distance_km} km × {calculatedPrice.per_km_rate} SEK):</span>
                    <span className="font-medium">{calculatedPrice.distance_fee} SEK</span>
                  </div>
                  {calculatedPrice.add_ons_total > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tillägg:</span>
                      <span className="font-medium">{calculatedPrice.add_ons_total} SEK</span>
                    </div>
                  )}
                  <div className="border-t border-green-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Totalt:</span>
                    <span className="font-bold text-2xl text-green-600">{calculatedPrice.final_total} SEK</span>
                  </div>
                </div>
              </motion.div>
            )}

            {isCalculatingPrice && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90A4] mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Beräknar pris...</p>
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">👤 Dina uppgifter</h2>
              <p className="text-gray-600">Hur kan vi nå dig?</p>
            </div>
            
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                {t('fullName')}
              </Label>
              <Input
                id="name"
                placeholder={t('yourFullName')}
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-gray-500" />
                {t('phoneNumber')}
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+46 XXX XXX XXX"
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-gray-500" />
                {t('email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                className="h-12"
              />
            </div>

            {formData.service_type !== 'help_at_home' && (
              <div>
                <Label className="mb-3 block font-semibold">➕ Tillägg ({t('optional')})</Label>
                <div className="space-y-2">
                  {getAddOnOptions().map((addon) => (
                    <Label
                      key={addon.value}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.add_ons.includes(addon.value)
                          ? 'border-[#4A90A4] bg-[#4A90A4]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={formData.add_ons.includes(addon.value)}
                          onCheckedChange={(checked) => {
                            const newAddOns = checked 
                              ? [...formData.add_ons, addon.value]
                              : formData.add_ons.filter(a => a !== addon.value);
                            setFormData({...formData, add_ons: newAddOns});
                            // Recalculate with new add-ons
                            if (formData.pickup_lat && formData.delivery_lat) {
                              calculatePrice(formData.pickup_lat, formData.pickup_lng, formData.delivery_lat, formData.delivery_lng);
                            }
                          }}
                        />
                        <span className="text-sm font-medium">{addon.label}</span>
                      </div>
                      <span className="text-[#4A90A4] font-bold text-sm">+{addon.price} kr</span>
                    </Label>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">✅ Bekräfta uppdrag</h2>
              <p className="text-gray-600">Granska innan du betalar</p>
            </div>
            
            {/* Summary Card */}
            <Card className="border-0 bg-gray-50">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('service')}</span>
                  <span className="font-medium capitalize">{formData.service_type.replace('_', ' ')}</span>
                </div>
                {formData.season && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('season')}</span>
                    <span className="font-medium capitalize">{formData.season}</span>
                  </div>
                )}
                {formData.pickup_address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('pickup')}</span>
                    <div className="text-right max-w-[200px]">
                      {selectedStore && (
                        <p className="font-semibold text-[#4A90A4] mb-1">{selectedStore.name}</p>
                      )}
                      <span className="font-medium text-sm">{formData.pickup_address}</span>
                      {formData.store_booking_number && (
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          Order: {formData.store_booking_number}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {formData.delivery_address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('deliveryDest')}</span>
                    <span className="font-medium text-right max-w-[200px]">{formData.delivery_address}</span>
                  </div>
                )}
                {formData.task_location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('location')}</span>
                    <span className="font-medium text-right max-w-[200px]">{formData.task_location}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('dateTime')}</span>
                  <span className="font-medium">{formData.preferred_date} {formData.preferred_time}</span>
                </div>
              </CardContent>
            </Card>

            {/* Runner Availability Indicator */}
            <RunnerNearbyIndicator area={pricing.area_type} />

            {/* Delivery Protection Add-on */}
            {formData.service_type !== 'help_at_home' && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryProtection}
                    onChange={(e) => setDeliveryProtection(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-blue-900">🛡️ Leveransskydd</span>
                      <Badge className="bg-blue-600 text-white text-xs">+25 kr</Badge>
                    </div>
                    <p className="text-sm text-blue-800">
                      Försäkring för värdefulla varor. Täcker skador och förlust upp till 5,000 kr.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Promo Code */}
            {formData.service_type !== 'help_at_home' && (
              <PromoCodeInput
                bookingTotal={pricing.subtotal || pricing.total}
                userEmail={formData.customer_email}
                onApply={(promo) => setAppliedPromo(promo)}
              />
            )}

            {/* Price Summary or Price Offer for Help at Home */}
            {formData.service_type === 'help_at_home' ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">💰 Ditt Prisförslag</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Vi bedömer varje uppdrag individuellt. Föreslå ett pris så återkommer vi inom 24 timmar!
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 text-gray-700">Vad vill du betala? (SEK)</Label>
                    <Input
                      type="number"
                      value={formData.customer_offered_price}
                      onChange={(e) => setFormData({...formData, customer_offered_price: e.target.value})}
                      placeholder="ex: 500"
                      className="h-12 text-lg font-semibold"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Vårt uppskattade pris: {pricing.total} kr (baserat på {formData.help_duration_hours}h)
                    </p>
                  </div>

                  <div>
                    <Label className="mb-2 text-gray-700">Meddelande (valfritt)</Label>
                    <Textarea
                      value={formData.customer_price_message}
                      onChange={(e) => setFormData({...formData, customer_price_message: e.target.value})}
                      placeholder="Förklara gärna varför du föreslår detta pris..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <PriceSummary
                pricing={pricing}
                formData={formData}
                calculatedPrice={calculatedPrice}
                activePricing={activePricing}
                variant="detailed"
              />
            )}

            {/* Terms */}
            <Label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer">
              <Checkbox
                checked={formData.terms_accepted}
                onCheckedChange={(checked) => setFormData({...formData, terms_accepted: checked})}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-600">
                {t('termsAccept')} - 
                <Link to={createPageUrl('Terms')} className="text-[#4A90A4] hover:underline ml-1">{t('terms')}</Link>,
                <Link to={createPageUrl('Privacy')} className="text-[#4A90A4] hover:underline ml-1">{t('privacy')}</Link>
              </span>
            </Label>
          </motion.div>
        );
    }
  };

  if (showPayment && pendingBooking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#E8F4F8] py-24 flex items-center">
        <div className="max-w-md mx-auto px-4">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Slutför Betalning</h2>
                <p className="text-gray-600">Din bokning är nästan klar</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500">{t('bookingNumber')}</p>
                <p className="text-xl font-bold text-[#4A90A4] mb-4">{bookingNumber}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tjänst</span>
                    <span className="font-medium capitalize">{pendingBooking.service_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grundpris:</span>
                    <span className="font-medium">{pendingBooking.base_price} kr</span>
                  </div>
                  {pendingBooking.distance_fee > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Avstånd ({pendingBooking.distance_km?.toFixed(1)} km):</span>
                      <span className="font-medium">{pendingBooking.distance_fee} kr</span>
                    </div>
                  )}
                  {pendingBooking.add_ons && pendingBooking.add_ons.length > 0 && (
                    <div className="border-t pt-2 mt-2">
                      <p className="text-xs text-gray-500 mb-1">Tillägg:</p>
                      {pendingBooking.add_ons.map((addon, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-600">• {addon.name}</span>
                          <span>{addon.price} kr</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2 mt-2">
                    <span>Totalt</span>
                    <span className="text-[#4A90A4]">{pendingBooking.total_price} kr</span>
                  </div>
                </div>
              </div>

              <PaymentButton 
                bookingData={pendingBooking}
                onPaymentComplete={() => {
                  setIsComplete(true);
                  setShowPayment(false);
                }}
              />

              <Button 
                variant="ghost" 
                className="w-full mt-4"
                onClick={() => {
                  setShowPayment(false);
                  setPendingBooking(null);
                }}
              >
                Gå tillbaka
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const isHelpAtHome = formData.service_type === 'help_at_home' || pendingBooking?.service_type === 'help_at_home';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#E8F4F8] py-24 flex items-center">
        <div className="max-w-md mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-8 text-center"
          >
            <div className={`w-20 h-20 rounded-full ${isHelpAtHome ? 'bg-amber-100' : 'bg-green-100'} flex items-center justify-center mx-auto mb-6`}>
              <Check className={`h-10 w-10 ${isHelpAtHome ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isHelpAtHome ? '📬 Förfrågan Skickad!' : 'Betalning Slutförd!'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {isHelpAtHome 
                ? 'Vi granskar ditt uppdrag och återkommer inom 24 timmar!'
                : t('thankYou')
              }
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500">{t('bookingNumber')}</p>
              <p className="text-2xl font-bold text-[#4A90A4]">{bookingNumber}</p>
            </div>

            {isHelpAtHome && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-left">
                <p className="font-semibold text-amber-900 mb-2">📋 Nästa steg:</p>
                <ul className="space-y-1 text-gray-700">
                  <li>✓ Vi granskar ditt prisförslag</li>
                  <li>✓ Du får svar via email inom 24h</li>
                  <li>✓ Efter godkännande kan du betala</li>
                  <li>✓ Sedan tilldelar vi en runner</li>
                </ul>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-6">
              Vi har skickat en bekräftelse till {pendingBooking?.customer_email || formData.customer_email}
            </p>

            <div className="space-y-3">
              <Link to={createPageUrl('CustomerDashboard')}>
                <Button className="w-full bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full">
                  Visa Mina Bokningar
                </Button>
              </Link>
              <Link to={createPageUrl('Home')}>
                <Button variant="outline" className="w-full rounded-full">
                  {t('backToHome')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#E8F4F8] py-12 lg:py-24">
    <div className="max-w-2xl mx-auto px-4">
        {/* Elderly Mode Toggle */}
        <div className="mb-6">
          <ElderlyModeToggle />
        </div>
        
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  s === step ? 'bg-[#4A90A4] text-white' :
                  s < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s < step ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-16 sm:w-24 h-1 mx-2 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="rounded-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('previous')}
                </Button>
              ) : <div />}
              
              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !formData.service_type) ||
                    (step === 1 && formData.service_type !== 'help_at_home' && !formData.season) ||
                    (step === 1 && formData.service_type === 'help_at_home' && !formData.help_service_type)
                  }
                  className="bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full"
                >
                  {t('next')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
               <Button
                 onClick={handleSubmit}
                 disabled={
                   !formData.terms_accepted || 
                   isSubmitting ||
                   (formData.service_type === 'help_at_home' && !formData.customer_offered_price)
                 }
                 className="bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full"
               >
                 {isSubmitting ? (
                   <span className="flex items-center gap-2">
                     <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                     </svg>
                     {t('processing')}
                   </span>
                 ) : formData.service_type === 'help_at_home' ? (
                   <>
                     Skicka Prisförslag
                     <Check className="h-4 w-4 ml-2" />
                   </>
                 ) : (
                   <>
                     {t('confirmBooking')}
                     <Check className="h-4 w-4 ml-2" />
                   </>
                 )}
               </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}