import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from 'framer-motion';
import { 
  Home, Package, Clock, MapPin, User, Phone, LogOut, 
  RefreshCw, MessageCircle, PhoneCall, HelpCircle, CheckCircle,
  Image as ImageIcon, Eye, Settings, AlertTriangle, Star
} from 'lucide-react';
import LiveMap from '@/components/map/LiveMap';
import ChatBox from '@/components/chat/ChatBox';
import RatingDialog from '@/components/rating/RatingDialog';
import ReportIssueDialog from '@/components/dispute/ReportIssueDialog';
import PriceProposalView from '@/components/customer/PriceProposalView';
import OrderHistoryView from '@/components/customer/OrderHistoryView';
import EmergencySupportButton from '@/components/dispute/EmergencySupportButton';
import RunnerProfileCard from '@/components/runner/RunnerProfileCard';
import CustomerFAQ from '@/components/customer/CustomerFAQ';
import BookingActions from '@/components/customer/BookingActions';
import ReviewsSection from '@/components/customer/ReviewsSection';

export default function CustomerDashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [chatMinimized, setChatMinimized] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [viewPhotos, setViewPhotos] = useState(null);
  const [ratingDialog, setRatingDialog] = useState({ open: false, booking: null });
  const [disputeDialog, setDisputeDialog] = useState({ open: false, booking: null });

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('CustomerDashboard'));
        return;
      }
      const user = await base44.auth.me();
      setCurrentUser(user);
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const { data: bookings = [] } = useQuery({
    queryKey: ['customer-bookings', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Booking.filter(
        { customer_email: currentUser.email },
        '-created_date',
        50
      );
    },
    enabled: !!currentUser?.email,
    refetchInterval: 5000
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['customer-ratings', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Rating.filter(
        { customer_email: currentUser.email },
        '-created_date',
        50
      );
    },
    enabled: !!currentUser?.email
  });

  const repeatBookingMutation = useMutation({
    mutationFn: async (originalBooking) => {
      // Copy booking data without ID and status
      const newBooking = {
        service_type: originalBooking.service_type,
        season: originalBooking.season,
        pickup_address: originalBooking.pickup_address,
        pickup_lat: originalBooking.pickup_lat,
        pickup_lng: originalBooking.pickup_lng,
        delivery_address: originalBooking.delivery_address,
        delivery_lat: originalBooking.delivery_lat,
        delivery_lng: originalBooking.delivery_lng,
        task_location: originalBooking.task_location,
        task_lat: originalBooking.task_lat,
        task_lng: originalBooking.task_lng,
        item_description: originalBooking.item_description,
        item_size: originalBooking.item_size,
        help_service_type: originalBooking.help_service_type,
        customer_name: originalBooking.customer_name,
        customer_phone: originalBooking.customer_phone,
        customer_email: originalBooking.customer_email,
        customer_user_id: currentUser.id,
        notes_for_driver: originalBooking.notes_for_driver,
        area_type: originalBooking.area_type
      };
      
      navigate(createPageUrl('Booking') + `?repeat=${encodeURIComponent(JSON.stringify(newBooking))}`);
    }
  });

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      pending_price: 'bg-amber-100 text-amber-800',
      price_proposed: 'bg-green-100 text-green-800',
      price_accepted: 'bg-blue-100 text-blue-800',
      assigned: 'bg-blue-100 text-blue-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_progress: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: t('pending'),
      pending_price: 'Väntar på Pris',
      price_proposed: 'Prisförslag Mottaget',
      price_accepted: 'Pris Accepterat',
      assigned: t('assigned3'),
      on_the_way: 'På väg',
      picked_up: t('pickedUp'),
      in_progress: t('inProgress'),
      completed: t('completed'),
      cancelled: 'Avbruten'
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90A4]"></div>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => 
    ['pending', 'pending_price', 'price_proposed', 'price_accepted', 'assigned', 'on_the_way', 'picked_up', 'in_progress'].includes(b.status)
  );
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const lastCompletedBooking = completedBookings[0];

  // Check if booking needs rating
  const needsRating = (booking) => {
    return booking.status === 'completed' && 
           !ratings.find(r => r.booking_id === booking.id);
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
                <h1 className="font-semibold text-gray-900">Mina Bokningar</h1>
                <p className="text-sm text-gray-500">{currentUser?.full_name || currentUser?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Booking')}>
                <Button size="sm" className="bg-[#4A90A4] hover:bg-[#3d7a8c]">
                  {t('book')}
                </Button>
              </Link>
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  {t('home')}
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
        {/* Quick Actions */}
        {lastCompletedBooking && (
          <Card className="mb-6 border-2 border-[#4A90A4] bg-gradient-to-r from-[#4A90A4]/5 to-[#7FB069]/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Upprepa Senaste Bokning</h3>
                  <p className="text-sm text-gray-600">
                    {lastCompletedBooking.service_type?.replace('_', ' ')} • 
                    {lastCompletedBooking.total_price} SEK
                  </p>
                </div>
                <Button
                  onClick={() => repeatBookingMutation.mutate(lastCompletedBooking)}
                  className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Upprepa Bokning
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aktiva Bokningar</p>
                  <p className="text-3xl font-bold text-blue-600">{activeBookings.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Slutförda</p>
                  <p className="text-3xl font-bold text-green-600">{completedBookings.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Spenderat</p>
                  <p className="text-3xl font-bold text-[#4A90A4]">
                    {bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.total_price || 0), 0)} SEK
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#4A90A4]/10 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-[#4A90A4]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Aktiva Bokningar
              {activeBookings.length > 0 && (
                <Badge className="ml-2 bg-blue-100 text-blue-800">{activeBookings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Historik</TabsTrigger>
            <TabsTrigger value="reviews">Mina Recensioner</TabsTrigger>
            <TabsTrigger value="faq">Frågor & Svar</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Inga Aktiva Bokningar</h3>
                  <p className="text-gray-600 mb-6">Du har inga pågående bokningar just nu</p>
                  <Link to={createPageUrl('Booking')}>
                    <Button className="bg-[#4A90A4] hover:bg-[#3d7a8c]">
                      Skapa Ny Bokning
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeBookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        {/* Price Proposal View */}
                        {(booking.status === 'pending_price' || booking.status === 'price_proposed') && (
                          <div className="mb-4">
                            <PriceProposalView booking={booking} />
                          </div>
                        )}

                        {/* Status Header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusText(booking.status)}
                            </Badge>
                            <span className="font-mono text-sm text-gray-500">
                              #{booking.booking_number}
                            </span>
                          </div>
                          {booking.total_price > 0 && (
                            <span className="text-lg font-bold text-[#4A90A4]">
                              {booking.total_price} SEK
                            </span>
                          )}
                        </div>

                        {/* Service Details */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="capitalize">{booking.service_type?.replace('_', ' ')}</span>
                            {booking.season && <span className="text-gray-400">• {booking.season}</span>}
                          </div>
                          
                          {booking.pickup_address && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mt-0.5 text-blue-500" />
                              <span>{booking.pickup_address}</span>
                            </div>
                          )}
                          {booking.delivery_address && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mt-0.5 text-green-500" />
                              <span>{booking.delivery_address}</span>
                            </div>
                          )}
                          {booking.task_location && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mt-0.5 text-[#7FB069]" />
                              <span>{booking.task_location}</span>
                            </div>
                          )}
                        </div>

                        {/* Driver Info */}
                        {booking.assigned_driver_name && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{booking.assigned_driver_name}</span>
                              </div>
                              {booking.tracking_active && (
                                <Badge className="bg-green-100 text-green-800">
                                  <span className="relative flex h-2 w-2 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                  </span>
                                  Live
                                </Badge>
                              )}
                            </div>
                            
                            {/* Contact Driver Buttons (Only during active delivery) */}
                            {['on_the_way', 'picked_up', 'in_progress'].includes(booking.status) && (
                              <div className="flex gap-2">
                                {booking.assigned_driver_phone && booking.status !== 'completed' && (
                                  <a href={`tel:${booking.assigned_driver_phone}`} className="flex-1">
                                    <Button variant="outline" className="w-full" size="sm">
                                      <PhoneCall className="h-4 w-4 mr-2" />
                                      Ring Förare
                                    </Button>
                                  </a>
                                )}
                                <Button 
                                  variant="outline" 
                                  className="flex-1"
                                  size="sm"
                                  onClick={() => {
                                    setActiveChat(booking);
                                    setChatMinimized(false);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Meddelande
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Photo Proofs */}
                        {(booking.pickup_photo_url || booking.completion_photo_url) && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Fotobevis
                            </h4>
                            <div className="flex gap-3">
                              {booking.pickup_photo_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewPhotos({ booking, type: 'pickup' })}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Upphämtning
                                </Button>
                              )}
                              {booking.completion_photo_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewPhotos({ booking, type: 'completion' })}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Leverans
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Live Tracking Alert - Show when active */}
                        {booking.tracking_active && ['on_the_way', 'picked_up', 'in_progress'].includes(booking.status) && (
                         <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                           <div className="flex items-start gap-3">
                             <div className="relative flex h-3 w-3 mt-1">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                             </div>
                             <div className="flex-1">
                               <h4 className="font-semibold text-blue-900 mb-1">📍 Spårning Aktiv</h4>
                               <p className="text-sm text-blue-700 mb-3">
                                 Föraren är {booking.status === 'on_the_way' ? 'på väg till upphämtning' : 
                                           booking.status === 'picked_up' ? 'på väg till dig' : 'utför uppdraget'}
                               </p>
                               <Button
                                 size="sm"
                                 className="bg-blue-600 hover:bg-blue-700"
                                 onClick={() => setSelectedBooking(booking)}
                               >
                                 <MapPin className="h-4 w-4 mr-2" />
                                 Visa Live-karta
                               </Button>
                             </div>
                           </div>
                         </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-2">
                         <div className="flex flex-wrap gap-2">
                           {booking.tracking_active && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setSelectedBooking(booking)}
                               className="border-blue-300 hover:border-blue-500"
                             >
                               <MapPin className="h-4 w-4 mr-2" />
                               Live-spårning
                             </Button>
                           )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveChat(booking);
                                setChatMinimized(false);
                              }}
                            >
                              <HelpCircle className="h-4 w-4 mr-2" />
                              Behöver Hjälp?
                            </Button>

                            <EmergencySupportButton booking={booking} variant="danger" />
                          </div>

                          <BookingActions 
                            booking={booking}
                            onRebook={() => repeatBookingMutation.mutate(booking)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <OrderHistoryView userEmail={currentUser?.email} />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsSection customerEmail={currentUser?.email} />
          </TabsContent>

          <TabsContent value="history-old">
            <div className="space-y-4">
              {completedBookings.map((booking) => {
                const hasRating = ratings.find(r => r.booking_id === booking.id);
                const bookingNeedsRating = needsRating(booking);
                
                return (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('completed')}
                          </Badge>
                          <span className="font-mono text-sm text-gray-500">
                            #{booking.booking_number}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 capitalize">
                          {booking.service_type?.replace('_', ' ')} • 
                          {new Date(booking.created_date).toLocaleDateString('sv-SE')}
                        </p>
                        {booking.assigned_driver_name && (
                          <p className="text-sm text-gray-500 mt-1">
                            Förare: {booking.assigned_driver_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-900">
                          {booking.total_price} SEK
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => repeatBookingMutation.mutate(booking)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Upprepa
                        </Button>
                      </div>
                    </div>

                    {/* View Photos if available */}
                    {(booking.pickup_photo_url || booking.completion_photo_url) && (
                      <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        {booking.pickup_photo_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewPhotos({ booking, type: 'pickup' })}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Visa Upphämtningsfoto
                          </Button>
                        )}
                        {booking.completion_photo_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewPhotos({ booking, type: 'completion' })}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Visa Leveransfoto
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Rate Driver Button - Show prominently if not rated */}
                    {bookingNeedsRating && (
                      <div className="mt-4 pt-4 border-t bg-amber-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
                        <p className="text-sm text-amber-800 mb-3 font-medium">
                          ⭐ Hur var din upplevelse? Ditt betyg hjälper oss förbättra!
                        </p>
                        <Button
                          className="w-full bg-amber-500 hover:bg-amber-600"
                          onClick={() => setRatingDialog({ open: true, booking })}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Betygsätt Din Upplevelse
                        </Button>
                      </div>
                    )}
                    
                    {/* Show rating if already rated */}
                    {!bookingNeedsRating && hasRating && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                          <CheckCircle className="h-4 w-4" />
                          <span>Du har betygsatt detta uppdrag</span>
                          <div className="flex ml-auto">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < hasRating.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })}
              
              {completedBookings.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Inga slutförda bokningar än</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <CustomerFAQ />
          </TabsContent>
        </Tabs>
      </main>

      {/* Live Tracking Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              Live Spårning - #{selectedBooking?.booking_number}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4">
            {selectedBooking && (
              <>
                {/* Status Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Förare</p>
                      <p className="font-semibold text-gray-900">{selectedBooking.assigned_driver_name}</p>
                      {selectedBooking.assigned_driver_phone && (
                        <a href={`tel:${selectedBooking.assigned_driver_phone}`} className="text-blue-600 text-xs hover:underline">
                          📞 {selectedBooking.assigned_driver_phone}
                        </a>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Status</p>
                      <Badge className={getStatusColor(selectedBooking.status)}>
                        {getStatusText(selectedBooking.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Senast uppdaterad</p>
                      <p className="text-xs text-gray-600">
                        {selectedBooking.last_location_update 
                          ? new Date(selectedBooking.last_location_update).toLocaleTimeString('sv-SE')
                          : 'Okänt'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveChat(selectedBooking);
                      setChatMinimized(false);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chatta med Förare
                  </Button>
                  {selectedBooking.assigned_driver_phone && (
                    <a href={`tel:${selectedBooking.assigned_driver_phone}`}>
                      <Button size="sm" variant="outline">
                        <PhoneCall className="h-4 w-4 mr-2" />
                        Ring Förare
                      </Button>
                    </a>
                  )}
                </div>

                {/* Map */}
                <div className="h-[calc(100%-12rem)] rounded-xl overflow-hidden border-2 border-blue-200 shadow-lg">
                  <LiveMap 
                    booking={selectedBooking} 
                    driverLocation={
                      selectedBooking.driver_current_lat && selectedBooking.driver_current_lng
                        ? {
                            lat: selectedBooking.driver_current_lat,
                            lng: selectedBooking.driver_current_lng,
                            timestamp: selectedBooking.last_location_update
                          }
                        : null
                    }
                    showProximityRadius={true}
                  />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewPhotos} onOpenChange={() => setViewPhotos(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {viewPhotos?.type === 'pickup' ? 'Upphämtningsfoto' : 'Leveransfoto'} - 
              #{viewPhotos?.booking?.booking_number}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {viewPhotos && (
              <img
                src={viewPhotos.type === 'pickup' 
                  ? viewPhotos.booking.pickup_photo_url 
                  : viewPhotos.booking.completion_photo_url}
                alt={viewPhotos.type === 'pickup' ? 'Pickup proof' : 'Delivery proof'}
                className="w-full rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat */}
      {activeChat && (
        <ChatBox
          booking={activeChat}
          currentUser={currentUser}
          userType="customer"
          isMinimized={chatMinimized}
          onToggleMinimize={() => setChatMinimized(!chatMinimized)}
        />
      )}

      {/* Rating Dialog */}
      {ratingDialog.booking && (
        <RatingDialog
          booking={ratingDialog.booking}
          isOpen={ratingDialog.open}
          onClose={() => setRatingDialog({ open: false, booking: null })}
        />
      )}

      {/* Dispute Dialog */}
      {disputeDialog.booking && (
        <ReportIssueDialog
          booking={disputeDialog.booking}
          isOpen={disputeDialog.open}
          onClose={() => setDisputeDialog({ open: false, booking: null })}
        />
      )}
    </div>
  );
}