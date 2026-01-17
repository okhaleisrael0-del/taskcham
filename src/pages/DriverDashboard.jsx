import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from 'framer-motion';
import { 
  Home, User, MapPin, Clock, DollarSign, Package, Check, 
  Phone, Mail, Calendar, ArrowRight, LogOut, AlertTriangle, Map, MessageSquare
} from 'lucide-react';
import LiveMap from '@/components/map/LiveMap';
import LocationTracker from '@/components/tracking/LocationTracker';
import ChatBox from '@/components/chat/ChatBox';
import PayoutsSection from '@/components/driver/PayoutsSection';
import ProfileSection from '@/components/driver/ProfileSection';
import PhotoUploader from '@/components/booking/PhotoUploader';
import { NotificationService } from '@/components/notifications/NotificationService';
import RunnerOrderView from '@/components/buydeliver/RunnerOrderView';
import SmartJobFeed from '@/components/runner/SmartJobFeed';
import EarningsDashboard from '@/components/runner/EarningsDashboard';
import JobHeatmap from '@/components/runner/JobHeatmap';
import JobNotifications from '@/components/runner/JobNotifications';
import NavigationHelper from '@/components/runner/NavigationHelper';
import DriverReviewResponses from '@/components/driver/DriverReviewResponses';
import SupportChatbot from '@/components/driver/SupportChatbot';

export default function DriverDashboardPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [chatMinimized, setChatMinimized] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('DriverDashboard'));
        return;
      }
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Find driver profile
      const drivers = await base44.entities.Driver.filter({ email: user.email });
      if (drivers.length > 0) {
        setDriverProfile(drivers[0]);
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const { data: bookings = [] } = useQuery({
    queryKey: ['driver-bookings', driverProfile?.id],
    queryFn: () => base44.entities.Booking.filter({ assigned_driver_id: driverProfile?.id }),
    enabled: !!driverProfile?.id
  });

  const { data: buyDeliverOrders = [] } = useQuery({
    queryKey: ['driver-buy-deliver-orders', driverProfile?.id],
    queryFn: async () => {
      if (!driverProfile?.id) return [];
      return await base44.entities.BuyDeliverOrder.filter(
        { assigned_runner_id: driverProfile.id },
        '-created_date',
        50
      );
    },
    enabled: !!driverProfile?.id,
    refetchInterval: 5000
  });

  const updateAvailability = useMutation({
    mutationFn: async (availability) => {
      await base44.entities.Driver.update(driverProfile.id, { availability });
    },
    onSuccess: (_, availability) => {
      setDriverProfile({...driverProfile, availability});
    }
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status, booking }) => {
      await base44.entities.Booking.update(bookingId, { status });
      
      // Skicka notis till kund vid statusändring
      if (booking) {
        await NotificationService.notifyStatusChange(booking, status);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['driver-bookings']);
    }
  });

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90A4]"></div>
      </div>
    );
  }

  // Check dashboard access
  if (driverProfile && driverProfile.dashboard_access !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('dashboardInactiveMsg')}</h2>
            <p className="text-gray-600 mb-6">{t('dashboardInactive')}</p>
            <Button onClick={handleLogout} variant="outline" className="rounded-full">
            <LogOut className="h-4 w-4 mr-2" />
            {t('logout')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!driverProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <User className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('noDriverProfile')}</h2>
            <p className="text-gray-600 mb-6">
              {t('needToApply')}
            </p>
            <Link to={createPageUrl('DriverSignup')}>
              <Button className="bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full">
                {t('applyNow')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (driverProfile.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {driverProfile.status === 'pending' ? t('applicationPending') : t('accountSuspended')}
            </h2>
            <p className="text-gray-600 mb-6">
              {driverProfile.status === 'pending' 
                ? t('applicationReview')
                : t('accountSuspendedMsg')}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {driverProfile.status === 'pending' && 'När din ansökan är godkänd får du omedelbar åtkomst till Runner Dashboard utan att behöva logga ut.'}
            </p>
            <Button onClick={handleLogout} variant="outline" className="rounded-full">
              <LogOut className="h-4 w-4 mr-2" />
              {t('logout')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4A90A4] to-[#7FB069] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{t('driverDashboard')}</h1>
                <p className="text-sm text-gray-500">{driverProfile.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <JobNotifications 
                driverId={driverProfile?.id}
                onJobClick={(job) => {}}
              />
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  {t('home2')}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 border-b">
          <div className="flex gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'jobs'
                  ? 'border-[#4A90A4] text-[#4A90A4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🎯 Nya Jobb
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'tasks'
                  ? 'border-[#4A90A4] text-[#4A90A4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Mina Uppdrag
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'earnings'
                  ? 'border-[#4A90A4] text-[#4A90A4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              💰 Intäkter
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'heatmap'
                  ? 'border-[#4A90A4] text-[#4A90A4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🗺️ Efterfrågan
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'border-[#4A90A4] text-[#4A90A4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ⭐ Recensioner
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-[#4A90A4] text-[#4A90A4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Min Profil
            </button>
          </div>
        </div>

        {activeTab === 'jobs' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SmartJobFeed driverProfile={driverProfile} />
            </div>
            <div>
              <JobHeatmap />
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <EarningsDashboard driverProfile={driverProfile} />
        )}

        {activeTab === 'heatmap' && (
          <div className="max-w-2xl mx-auto">
            <JobHeatmap />
          </div>
        )}

        {activeTab === 'tasks' && (
          <>
            {/* Buy & Deliver Orders */}
            {buyDeliverOrders.filter(o => ['assigned', 'shopping', 'purchased', 'delivering'].includes(o.status)).length > 0 && (
              <Card className="mb-6 border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Package className="h-5 w-5" />
                    Köp & Leverera Uppdrag
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {buyDeliverOrders
                      .filter(o => ['assigned', 'shopping', 'purchased', 'delivering'].includes(o.status))
                      .map((order) => (
                        <Dialog key={order.id}>
                          <DialogTrigger asChild>
                            <div className="bg-white rounded-lg p-4 border-2 border-purple-200 cursor-pointer hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold">#{order.order_number}</p>
                                  <p className="text-sm text-gray-600">
                                    {order.shopping_list?.length} varor • {order.store_name || 'Valfri butik'}
                                  </p>
                                </div>
                                <Badge className="bg-purple-100 text-purple-800">
                                  {order.status === 'assigned' && 'Tilldelad'}
                                  {order.status === 'shopping' && 'Handlar'}
                                  {order.status === 'purchased' && 'Köpt'}
                                  {order.status === 'delivering' && 'Levererar'}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>📍 Leverera till: {order.delivery_address}</p>
                                <p className="font-semibold text-[#4A90A4] mt-1">
                                  Din intäkt: {order.runner_earnings?.toFixed(0)} kr
                                </p>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Köp & Leverera #{order.order_number}</DialogTitle>
                            </DialogHeader>
                            <RunnerOrderView order={order} />
                          </DialogContent>
                        </Dialog>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Availability & Stats */}
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              {/* Availability */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">{t('availability')}</h3>
                  <Select 
                    value={driverProfile.availability} 
                    onValueChange={(value) => updateAvailability.mutate(value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {t('available')}
                        </span>
                      </SelectItem>
                      <SelectItem value="busy">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          {t('busy')}
                        </span>
                      </SelectItem>
                      <SelectItem value="offline">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                          {t('offline')}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Active Tasks */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{t('activeTasks2')}</h3>
                  <p className="text-3xl font-bold text-gray-900">{activeBookings.length}</p>
                </CardContent>
              </Card>

              {/* Completed */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{t('completed')}</h3>
                  <p className="text-3xl font-bold text-gray-900">{driverProfile.completed_tasks || 0}</p>
                </CardContent>
              </Card>

              {/* Earnings */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{t('totalEarnings')}</h3>
                  <p className="text-3xl font-bold text-[#4A90A4]">{driverProfile.total_earnings || 0} SEK</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Tasks */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t('assignedTasks')}</CardTitle>
              </CardHeader>
              <CardContent>
                {activeBookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>{t('noActiveAssigned')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBookings.map((booking) => (
                     <motion.div
                       key={booking.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all bg-white"
                     >
                       <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <span className="font-bold text-xl">#{booking.booking_number}</span>
                             <Badge className={getStatusColor(booking.status)}>
                               {booking.status.replace('_', ' ')}
                             </Badge>
                           </div>
                           <p className="text-sm text-gray-500 capitalize">
                             {booking.service_type.replace('_', ' ')} • {booking.season}
                           </p>
                         </div>
                         <div className="text-right">
                           <p className="text-sm text-gray-500 mb-1">Din förtjänst</p>
                           <p className="text-3xl font-black text-green-600">{booking.driver_earnings || Math.round(booking.total_price * 0.8)} kr</p>
                           <p className="text-xs text-gray-400">av {booking.total_price} kr totalt</p>
                         </div>
                       </div>

                        {/* Pickup Info */}
                        {booking.pickup_store && (
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-5 mb-5">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="bg-blue-600 text-white rounded-full p-2">
                                <Package className="h-5 w-5" />
                              </div>
                              <h3 className="text-lg font-bold text-blue-900">Upphämtning från Butik</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="bg-white rounded-xl p-4">
                                <p className="text-xs text-blue-600 font-bold uppercase mb-1">Butik</p>
                                <p className="font-bold text-lg text-gray-900">{booking.pickup_store.name}</p>
                                {booking.pickup_store.phone && (
                                  <a href={`tel:${booking.pickup_store.phone}`} className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                                    📞 {booking.pickup_store.phone}
                                  </a>
                                )}
                              </div>
                              <div className="bg-white rounded-xl p-4">
                                <p className="text-xs text-blue-600 font-bold uppercase mb-1">Adress</p>
                                <p className="text-sm text-gray-700">{booking.pickup_store.address}</p>
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickup_store.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                                >
                                  <MapPin className="h-3 w-3" />
                                  Öppna i Google Maps
                                </a>
                              </div>
                              {booking.store_booking_number && (
                                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-5">
                                  <p className="text-xs text-yellow-800 font-bold uppercase mb-2 flex items-center gap-1">
                                    🎫 Bokningsnummer
                                  </p>
                                  <p className="text-4xl font-black font-mono text-yellow-900 tracking-wider mb-2 select-all">
                                    {booking.store_booking_number}
                                  </p>
                                  <p className="text-xs text-yellow-700 leading-relaxed">
                                    Visa detta nummer i kassan eller vid upphämtningsdisken
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Navigation Helper */}
                        <div className="mb-5">
                          <NavigationHelper booking={booking} />
                        </div>

                        {/* Delivery Address */}
                        {booking.delivery_address && (
                          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-5 mb-5">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="bg-green-600 text-white rounded-full p-2">
                                <MapPin className="h-5 w-5" />
                              </div>
                              <h3 className="text-lg font-bold text-green-900">Leveransadress</h3>
                            </div>
                            <div className="bg-white rounded-xl p-4 mb-3">
                              <p className="font-bold text-base text-gray-900 mb-2">{booking.delivery_address}</p>
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.delivery_address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-600 hover:underline inline-flex items-center gap-1"
                              >
                                <MapPin className="h-4 w-4" />
                                Navigera till kund
                              </a>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                              <p className="text-xs text-green-600 font-bold uppercase mb-2">Kund</p>
                              <p className="font-semibold text-gray-900 mb-2">{booking.customer_name}</p>
                              <a href={`tel:${booking.customer_phone}`} className="text-sm text-green-600 hover:underline inline-flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {booking.customer_phone}
                              </a>
                            </div>
                            {booking.notes_for_driver && (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                                <p className="text-xs text-amber-700 font-bold uppercase mb-1">📝 Anteckningar från kund</p>
                                <p className="text-sm text-gray-700">{booking.notes_for_driver}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status Flow & Actions */}
                        <div className="bg-gray-50 rounded-2xl p-5 mb-5">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            🔄 Status & Åtgärder
                          </h4>
                          
                          {/* Status Progress */}
                          <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                              {['assigned', 'on_the_way', 'picked_up', 'in_progress', 'completed'].map((status, idx) => {
                                const isActive = booking.status === status;
                                const isPast = ['assigned', 'on_the_way', 'picked_up', 'in_progress', 'completed'].indexOf(booking.status) > idx;
                                return (
                                  <div key={status} className="flex-1 relative">
                                    <div className={`h-2 rounded-full ${isPast || isActive ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                    {isActive && (
                                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap">
                                        {status.replace('_', ' ')}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Photo Uploaders */}
                          {booking.status === 'on_the_way' && !booking.pickup_photo_url && (
                            <div className="mb-4">
                              <PhotoUploader 
                                booking={booking}
                                photoType="pickup"
                                onPhotoUploaded={() => queryClient.invalidateQueries(['driver-bookings'])}
                              />
                            </div>
                          )}

                          {booking.status === 'in_progress' && !booking.completion_photo_url && (
                            <div className="mb-4">
                              <PhotoUploader 
                                booking={booking}
                                photoType="completion"
                                onPhotoUploaded={() => queryClient.invalidateQueries(['driver-bookings'])}
                              />
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            {booking.status === 'assigned' && (
                              <Button 
                                size="lg"
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-base h-14 rounded-xl shadow-lg"
                                onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'on_the_way', booking })}
                              >
                                🚗 På väg till butik
                              </Button>
                            )}

                            {booking.status === 'on_the_way' && booking.pickup_photo_url && (
                              <Button 
                                size="lg"
                                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-base h-14 rounded-xl shadow-lg"
                                onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'picked_up', booking })}
                              >
                                📦 Plockat upp
                              </Button>
                            )}

                            {booking.status === 'picked_up' && (
                              <Button 
                                size="lg"
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-base h-14 rounded-xl shadow-lg"
                                onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'in_progress', booking })}
                              >
                                🚚 På väg till kund
                              </Button>
                            )}

                            {booking.status === 'in_progress' && booking.completion_photo_url && (
                              <Button 
                                size="lg"
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-base h-14 rounded-xl shadow-lg"
                                onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'completed', booking })}
                              >
                                ✅ Levererat
                              </Button>
                            )}
                          </div>

                          {/* Helper Buttons */}
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Map className="h-4 w-4 mr-1" />
                              Karta
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => {
                                setActiveChat(booking);
                                setChatMinimized(false);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Chatt
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Completed */}
            {completedBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('recentComplete')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completedBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium">#{booking.booking_number}</p>
                          <p className="text-sm text-gray-500">{booking.preferred_date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{booking.total_price} SEK</p>
                          <Badge className="bg-green-100 text-green-800">{t('completed')}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === 'reviews' && (
          <DriverReviewResponses driverProfile={driverProfile} />
        )}

        {activeTab === 'profile' && (
          <ProfileSection driverProfile={driverProfile} />
        )}
      </main>

      {/* Map Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t('bookingNumber')} #{selectedBooking?.booking_number} - {t('liveTracking')}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4">
            {selectedBooking && (
              <>
                <LocationTracker 
                  booking={selectedBooking} 
                  onLocationUpdate={(location) => setDriverLocation(location)}
                />
                <div className="h-[calc(100%-8rem)] rounded-xl overflow-hidden border">
                  <LiveMap 
                    booking={selectedBooking} 
                    driverLocation={driverLocation}
                    showProximityRadius={true}
                  />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat */}
      {activeChat && (
        <ChatBox
          booking={activeChat}
          currentUser={driverProfile}
          userType="driver"
          isMinimized={chatMinimized}
          onToggleMinimize={() => setChatMinimized(!chatMinimized)}
        />
      )}

      {/* AI Support Chatbot */}
      <SupportChatbot driverProfile={driverProfile} />
    </div>
  );
}