import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from 'framer-motion';
import { 
  MapPin, Calendar, Clock, Package, Search, Filter, 
  Truck, Home, ShoppingBag, AlertCircle, CheckCircle2
} from 'lucide-react';

export default function ListingsPage() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('available');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Check if user is a driver
        const drivers = await base44.entities.Driver.filter({ email: user.email });
        if (drivers.length > 0) {
          setDriverProfile(drivers[0]);
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const { data: bookings = [] } = useQuery({
    queryKey: ['public-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = base44.entities.Booking.subscribe((event) => {
      // Trigger refetch on any booking change
      if (['create', 'update', 'delete'].includes(event.type)) {
        // Query client will automatically refetch
      }
    });
    
    return unsubscribe;
  }, []);

  // Filter bookings based on user role
  const filteredBookings = bookings.filter(booking => {
    // Hide completed and cancelled tasks from public listings (unless admin viewing specifically)
    if (currentUser?.role !== 'admin' && ['completed', 'cancelled'].includes(booking.status)) {
      return false;
    }

    // Status filter
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'available' && booking.status === 'pending') ||
      (statusFilter === 'assigned' && booking.status === 'assigned') ||
      (statusFilter === 'completed' && booking.status === 'completed');
    
    if (!statusMatch) return false;

    // Service type filter
    const typeMatch = serviceTypeFilter === 'all' || booking.service_type === serviceTypeFilter;
    if (!typeMatch) return false;

    // Search filter
    const search = searchQuery.toLowerCase();
    const matchesSearch = !search || 
      booking.item_description?.toLowerCase().includes(search) ||
      booking.pickup_address?.toLowerCase().includes(search) ||
      booking.delivery_address?.toLowerCase().includes(search) ||
      booking.task_location?.toLowerCase().includes(search) ||
      booking.booking_number?.toLowerCase().includes(search);
    
    if (!matchesSearch) return false;

    // Access control: drivers see only available tasks, admins see all
    if (currentUser?.role === 'admin') {
      return true;
    } else if (driverProfile && driverProfile.status === 'approved') {
      // Approved drivers see available tasks
      return booking.status === 'pending';
    } else {
      // Public users see only pending tasks (limited info)
      return booking.status === 'pending';
    }
  });

  const getServiceIcon = (type) => {
    switch(type) {
      case 'delivery': return Truck;
      case 'errand': return ShoppingBag;
      case 'help_at_home': return Home;
      default: return Package;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-green-100 text-green-700';
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'picked_up': return 'bg-purple-100 text-purple-700';
      case 'in_progress': return 'bg-indigo-100 text-indigo-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return t('available3');
      case 'assigned': return t('assigned3');
      case 'picked_up': return t('pickedUp');
      case 'in_progress': return t('inProgress');
      case 'completed': return t('completed4');
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90A4]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-50 to-[#E8F4F8] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('availableJobs')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('showAllActive')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder={t('searchTaskArea')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Service Type Filter */}
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('serviceType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allServices')}</SelectItem>
                  <SelectItem value="delivery">{t('delivery')}</SelectItem>
                  <SelectItem value="errand">{t('errand')}</SelectItem>
                  <SelectItem value="help_at_home">{t('helpAtHomeService')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('payoutStatus')} />
                </SelectTrigger>
                <SelectContent>
                  {currentUser?.role === 'admin' ? (
                    <>
                      <SelectItem value="all">{t('allStatuses')}</SelectItem>
                      <SelectItem value="available">{t('available2')}</SelectItem>
                      <SelectItem value="assigned">{t('assigned2')}</SelectItem>
                      <SelectItem value="completed">{t('completed3')}</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="available">{t('available2')}</SelectItem>
                      <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            {t('showing')} <span className="font-semibold">{filteredBookings.length}</span> {t('jobs')}
          </p>
          {!currentUser && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>{t('loginFullDetails')}</span>
            </div>
          )}
        </div>

        {/* Listings Grid */}
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('noJobsFound')}
              </h3>
              <p className="text-gray-600">
                {t('tryChangingFilters')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => {
              const ServiceIcon = getServiceIcon(booking.service_type);
              
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className="h-full cursor-pointer hover:shadow-xl transition-all border-gray-200"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4A90A4] to-[#7FB069] flex items-center justify-center">
                          <ServiceIcon className="h-6 w-6 text-white" />
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </div>

                      {/* Service Type */}
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 capitalize">
                        {booking.service_type.replace('_', ' ')}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {booking.item_description || t('noDescription')}
                      </p>

                      {/* Location */}
                      <div className="space-y-2 mb-4">
                        {booking.pickup_address && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-[#4A90A4] mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 line-clamp-1">{booking.pickup_address}</span>
                          </div>
                        )}
                        {booking.delivery_address && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-[#7FB069] mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 line-clamp-1">{booking.delivery_address}</span>
                          </div>
                        )}
                        {booking.task_location && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-[#7FB069] mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 line-clamp-1">{booking.task_location}</span>
                          </div>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{booking.preferred_date}</span>
                        </div>
                        {booking.preferred_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{booking.preferred_time}</span>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-sm text-gray-500">{t('amountLabel')}</span>
                        <span className="text-lg font-bold text-[#4A90A4]">
                          {booking.total_price} SEK
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {t('taskDetailsTitle')} #{selectedBooking?.booking_number}
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedBooking.status)}>
                  {getStatusText(selectedBooking.status)}
                </Badge>
                <span className="text-2xl font-bold text-[#4A90A4]">
                  {selectedBooking.total_price} SEK
                </span>
              </div>

              {/* Service Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('serviceTypeLabel')}</p>
                  <p className="font-medium capitalize">
                    {selectedBooking.service_type.replace('_', ' ')}
                  </p>
                </div>
                {selectedBooking.season && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('seasonLabel')}</p>
                    <p className="font-medium capitalize">{selectedBooking.season}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('dateLabel')}</p>
                  <p className="font-medium">{selectedBooking.preferred_date}</p>
                </div>
                {selectedBooking.preferred_time && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('timeLabel')}</p>
                    <p className="font-medium">{selectedBooking.preferred_time}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedBooking.item_description && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">{t('descriptionLabel')}</p>
                  <p className="text-gray-800">{selectedBooking.item_description}</p>
                </div>
              )}

              {/* Locations */}
              <div className="space-y-3">
                {selectedBooking.pickup_address && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-[#4A90A4] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('pickupLabel')}</p>
                      <p className="font-medium">{selectedBooking.pickup_address}</p>
                    </div>
                  </div>
                )}
                {selectedBooking.delivery_address && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-[#7FB069] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('deliveryLabel')}</p>
                      <p className="font-medium">{selectedBooking.delivery_address}</p>
                    </div>
                  </div>
                )}
                {selectedBooking.task_location && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-[#7FB069] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('locationLabel')}</p>
                      <p className="font-medium">{selectedBooking.task_location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info (Only for authenticated drivers/admin) */}
              {(currentUser?.role === 'admin' || (driverProfile && driverProfile.status === 'approved')) && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-3">{t('customerInfo')}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('nameLabel')}</p>
                      <p className="font-medium">{selectedBooking.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('phoneLabel')}</p>
                      <p className="font-medium">{selectedBooking.customer_phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!currentUser && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900 mb-1">
                        {t('loginSeeDetails')}
                      </p>
                      <p className="text-sm text-amber-700">
                        {t('contactInfoOnlyAvailable')}
                      </p>
                      <Link to={createPageUrl('DriverDashboard')}>
                        <Button className="mt-3 bg-amber-600 hover:bg-amber-700">
                          {t('loginNow')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {driverProfile && driverProfile.status === 'approved' && selectedBooking.status === 'pending' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900 mb-1">
                        {t('interestedTask')}
                      </p>
                      <p className="text-sm text-green-700 mb-3">
                        {t('contactAdminAssigned')}
                      </p>
                      <Link to={createPageUrl('Contact')}>
                        <Button className="bg-green-600 hover:bg-green-700">
                          {t('contactSupport')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}