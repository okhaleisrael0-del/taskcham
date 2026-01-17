import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage, LANGUAGES } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from 'framer-motion';
import { 
  Home, Users, Package, DollarSign, MapPin, Clock, Check, X,
  User, Phone, Mail, Calendar, LogOut, Settings, AlertTriangle,
  CheckCircle, XCircle, Pause, Play, Trash2, Map, MessageSquare, Star,
  ExternalLink
} from 'lucide-react';
import LiveMap from '@/components/map/LiveMap';
import ChatBox from '@/components/chat/ChatBox';
import { NotificationService } from '@/components/notifications/NotificationService';
import FinancialOverview from '@/components/admin/FinancialOverview';
import MassMessaging from '@/components/admin/MassMessaging';
import PricingSettings from '@/components/admin/PricingSettings';
import ProblematicTasks from '@/components/admin/ProblematicTasks';
import PendingPriceReview from '@/components/admin/PendingPriceReview';
import RunnerMatchSuggestions from '@/components/admin/RunnerMatchSuggestions';
import QuickReplies from '@/components/admin/QuickReplies';
import { AutoMessageService } from '@/components/notifications/AutoMessageService';
import RunnerPerformance from '@/components/admin/RunnerPerformance';
import AdminOrderManagement from '@/components/buydeliver/AdminOrderManagement';
import MassNotifications from '@/components/admin/MassNotifications';
import AnalyticsReports from '@/components/admin/AnalyticsReports';
import PricingAddonsManager from '@/components/admin/PricingAddonsManager';
import BookingHistory from '@/components/admin/BookingHistory';
import NotificationHistory from '@/components/admin/NotificationHistory';
import CancellationManagement from '@/components/admin/CancellationManagement';
import PriceNegotiation from '@/components/admin/PriceNegotiation';
import RefundManagement from '@/components/admin/RefundManagement';
import DashboardMetrics from '@/components/admin/DashboardMetrics';
import UserManagement from '@/components/admin/UserManagement';
import AdvancedBookingManagement from '@/components/admin/AdvancedBookingManagement';
import PromoCodeManagement from '@/components/admin/PromoCodeManagement';
import PayoutManagement from '@/components/admin/PayoutManagement';
import BusinessAccountManagement from '@/components/admin/BusinessAccountManagement';
import DynamicPricingManager from '@/components/admin/DynamicPricingManager';
import PriceAdjustmentLog from '@/components/admin/PriceAdjustmentLog';
import ReviewModeration from '@/components/admin/ReviewModeration';

export default function AdminDashboardPage() {
  const { t, language, changeLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [assignDialog, setAssignDialog] = useState({ open: false, booking: null });
  const [statusChangeDialog, setStatusChangeDialog] = useState({ open: false, driver: null, action: '' });
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [selectedBookingMap, setSelectedBookingMap] = useState(null);
  const [chatMinimized, setChatMinimized] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [payoutDialog, setPayoutDialog] = useState({ open: false, payout: null });
  const [payoutNotes, setPayoutNotes] = useState('');
  const [viewRatings, setViewRatings] = useState(null);
  const [runnerMode, setRunnerMode] = useState(false);
  const [adminTasks, setAdminTasks] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('all');

  // All hooks must be called unconditionally at the top
  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 100),
    enabled: !!currentUser
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: () => base44.entities.Driver.list('-created_date', 100),
    enabled: !!currentUser
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['all-payouts'],
    queryFn: () => base44.entities.Payout.list('-created_date', 100),
    refetchInterval: 5000,
    enabled: !!currentUser
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['all-ratings'],
    queryFn: () => base44.entities.Rating.list('-created_date', 200),
    enabled: !!currentUser
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ['all-disputes'],
    queryFn: () => base44.entities.Dispute.list('-created_date', 100),
    enabled: !!currentUser
  });

  // Calculate performance data for alerts
  const performanceData = useMemo(() => {
    if (!drivers.length || !bookings.length || !ratings) return [];
    
    return drivers.map(driver => {
      const driverBookings = bookings.filter(b => b.assigned_driver_id === driver.id);
      const completedBookings = driverBookings.filter(b => b.status === 'completed');
      const driverRatings = ratings.filter(r => r.driver_id === driver.id);
      
      const totalAssigned = driverBookings.length;
      const totalCompleted = completedBookings.length;
      const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;
      const avgRating = driverRatings.length > 0
        ? driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length
        : 0;
      
      const flags = [];
      if (avgRating < 3.5 && driverRatings.length >= 3) flags.push('low_rating');
      if (completionRate < 70 && totalAssigned >= 5) flags.push('low_completion');
      if (totalCompleted === 0 && totalAssigned > 3) flags.push('no_completions');
      
      return { driver, flags, avgRating, completionRate };
    });
  }, [drivers, bookings, ratings]);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('AdminDashboard'));
        return;
      }
      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setCurrentUser(user);
      setIsLoading(false);
    };
    loadUser();
  }, []);

  // Load admin runner mode state and tasks
  useEffect(() => {
    const savedRunnerMode = localStorage.getItem('admin_runner_mode') === 'true';
    setRunnerMode(savedRunnerMode);
    
    if (savedRunnerMode) {
      const assignedToAdmin = bookings.filter(b => 
        b.assigned_driver_id === 'admin' && 
        ['assigned', 'on_the_way', 'picked_up', 'in_progress'].includes(b.status)
      );
      setAdminTasks(assignedToAdmin);
    }
  }, [bookings]);

  const assignDriver = useMutation({
    mutationFn: async ({ bookingId, driverId, driverName, driver, booking }) => {
      await base44.entities.Booking.update(bookingId, { 
        assigned_driver_id: driverId,
        assigned_driver_name: driverName,
        assigned_driver_phone: driver.phone,
        status: 'assigned'
      });
      
      // Skicka notis till förare
      await NotificationService.notifyDriverAssigned(driver, {
        ...booking,
        assigned_driver_name: driverName
      });
      
      // Skicka notis till kund
      await NotificationService.notifyStatusChange({
        ...booking,
        assigned_driver_name: driverName
      }, 'assigned');
      
      // Send auto messages
      await AutoMessageService.handleStatusChange(booking, 'assigned', driver);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-bookings']);
      setAssignDialog({ open: false, booking: null });
    }
  });

  const updateDriverStatus = useMutation({
    mutationFn: async ({ driverId, status, driver }) => {
      // Update driver status and unlock dashboard access when approved
      const updateData = { status };
      if (status === 'approved') {
        updateData.dashboard_access = 'active';
        updateData.availability = 'offline'; // Set to offline, driver can go online manually
      }
      
      await base44.entities.Driver.update(driverId, updateData);
      
      // If approved, update user and send notifications
      if (status === 'approved' && driver) {
        // Update user to mark as runner
        if (driver.user_id) {
          try {
            await base44.entities.User.update(driver.user_id, {
              is_runner: true,
              driver_id: driverId,
              driver_approved_date: new Date().toISOString()
            });
          } catch (error) {
            console.error('Failed to update user:', error);
          }
        }
        
        // Send welcome email and SMS
        await NotificationService.notifyDriverApproved(driver);
        
        // Show admin confirmation
        return { success: true, driverName: driver.name };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['admin-drivers']);
      if (result?.success) {
        // Toast notification for admin
        alert(`✓ Runner ${result.driverName} godkänd och aktiv`);
      }
    }
  });

  const updateDriverDashboardAccess = useMutation({
    mutationFn: async ({ driverId, driverName, previousAccess, newAccess, reason }) => {
      await base44.entities.Driver.update(driverId, { dashboard_access: newAccess });
      // Log the change
      await base44.entities.DriverStatusLog.create({
        driver_id: driverId,
        driver_name: driverName,
        previous_dashboard_access: previousAccess,
        new_dashboard_access: newAccess,
        reason: reason,
        changed_by: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-drivers']);
      setStatusChangeDialog({ open: false, driver: null, action: '' });
      setStatusChangeReason('');
    }
  });

  const toggleRunnerMode = () => {
    const newMode = !runnerMode;
    setRunnerMode(newMode);
    localStorage.setItem('admin_runner_mode', newMode.toString());
    
    if (!newMode) {
      setAdminTasks([]);
    }
  };

  const acceptTaskMutation = useMutation({
    mutationFn: async (booking) => {
      await base44.entities.Booking.update(booking.id, {
        assigned_driver_id: 'admin',
        assigned_driver_name: 'TaskCham Admin',
        assigned_driver_phone: '+46769566135',
        status: 'assigned',
        fulfilled_by_admin: true
      });
      
      await NotificationService.notifyStatusChange({
        ...booking,
        assigned_driver_name: 'TaskCham'
      }, 'assigned');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-bookings']);
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }) => {
      await base44.entities.Booking.update(bookingId, { status });
      
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        await NotificationService.notifyStatusChange(booking, status);
        // Send auto messages
        await AutoMessageService.handleStatusChange(booking, status);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-bookings']);
    }
  });

  const processPayoutMutation = useMutation({
    mutationFn: async ({ payoutId, status, notes }) => {
      const payout = payouts.find(p => p.id === payoutId);
      
      await base44.entities.Payout.update(payoutId, {
        status: status,
        notes: notes,
        processed_date: new Date().toISOString(),
        processed_by: currentUser?.email
      });

      if (status === 'completed') {
        const driver = drivers.find(d => d.id === payout.driver_id);
        await base44.entities.Driver.update(payout.driver_id, {
          total_paid_out: (driver?.total_paid_out || 0) + payout.amount
        });
      } else if (status === 'rejected') {
        const driver = drivers.find(d => d.id === payout.driver_id);
        await base44.entities.Driver.update(payout.driver_id, {
          current_balance: (driver?.current_balance || 0) + payout.amount
        });
      }
      
      // Skicka notis till förare
      await NotificationService.notifyPayoutProcessed({
        ...payout,
        notes: notes
      }, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-payouts']);
      queryClient.invalidateQueries(['admin-drivers']);
      setPayoutDialog({ open: false, payout: null });
      setPayoutNotes('');
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

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(b => ['assigned', 'on_the_way', 'picked_up', 'in_progress'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');
  
  const pendingDrivers = drivers.filter(d => d.status === 'pending');
  const approvedDrivers = drivers.filter(d => d.status === 'approved');
  const availableDrivers = approvedDrivers.filter(d => d.availability === 'available' && d.dashboard_access === 'active');

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_progress: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDashboardAccessColor = (access) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      temporarily_disabled: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colors[access] || 'bg-gray-100 text-gray-800';
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
                <h1 className="font-semibold text-gray-900">{t('adminDashboard')}</h1>
                <p className="text-sm text-gray-500">{t('taskChamManagement')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Select value={language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={runnerMode ? "default" : "outline"}
                size="sm"
                onClick={toggleRunnerMode}
                className={runnerMode ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {runnerMode ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('onlineAsRunner')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {t('goOnlineRunner')}
                  </>
                )}
              </Button>
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  {t('home3')}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('logout2')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Metrics */}
        <div className="mb-8">
          <DashboardMetrics />
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" style={{ display: 'none' }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('newBookings')}</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingBookings.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('activeBookings')}</p>
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
                  <p className="text-sm text-gray-500">{t('completedBookings')}</p>
                  <p className="text-3xl font-bold text-green-600">{completedBookings.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('availableDrivers2')}</p>
                  <p className="text-3xl font-bold text-[#4A90A4]">{availableDrivers.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#4A90A4]/10 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#4A90A4]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Runner Mode Active Tasks */}
        {runnerMode && adminTasks.length > 0 && (
          <Card className="mb-6 border-green-500 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                {t('activeTasks2')} ({adminTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-xl p-4 border-2 border-green-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">#{task.booking_number}</span>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {task.service_type?.replace('_', ' ')} • {task.total_price} SEK
                        </p>
                      </div>
                    </div>

                    {task.pickup_store && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-600 font-medium mb-1">📦 Upphämtning:</p>
                        <p className="font-semibold text-sm">{task.pickup_store.name}</p>
                        <p className="text-xs text-gray-600">{task.pickup_store.address}</p>
                        {task.store_booking_number && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <p className="text-xs text-blue-600 font-medium mb-1">Bokningsnummer:</p>
                            <p className="text-lg font-bold font-mono text-gray-900 bg-white px-2 py-1 rounded">
                              {task.store_booking_number}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 mb-3 text-sm">
                      {task.pickup_address && !task.pickup_store && (
                        <p className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                          <span><strong>Hämta:</strong> {task.pickup_address}</span>
                        </p>
                      )}
                      {task.delivery_address && (
                        <p className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span><strong>Leverera:</strong> {task.delivery_address}</span>
                        </p>
                      )}
                      {task.notes_for_driver && (
                        <p className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <span><strong>Notering:</strong> {task.notes_for_driver}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {task.pickup_store && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.pickup_store.name)}&query_place_id=${task.pickup_store.place_id}`;
                            window.open(mapsUrl, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Öppna Butik i Kartor
                        </Button>
                      )}
                      {task.status === 'assigned' && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => updateTaskStatusMutation.mutate({ 
                            bookingId: task.id, 
                            status: 'picked_up' 
                          })}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Markera som Upphämtat
                        </Button>
                      )}
                      {task.status === 'picked_up' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateTaskStatusMutation.mutate({ 
                            bookingId: task.id, 
                            status: 'completed' 
                          })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Markera som Levererat
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveChat(task);
                          setChatMinimized(false);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chatt med Kund
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              📊 {t('overviewTab')}
            </TabsTrigger>
            <TabsTrigger value="users">
              👥 {t('usersTab')}
            </TabsTrigger>
            <TabsTrigger value="booking-mgmt">
              📦 {t('bookingsMgmtTab')}
            </TabsTrigger>
            <TabsTrigger value="promo-codes">
              🎟️ {t('promoCodesTab')}
            </TabsTrigger>
            <TabsTrigger value="payout-mgmt">
              💸 {t('payoutMgmtTab')}
            </TabsTrigger>
            <TabsTrigger value="price-review">
              💰 {t('pricingTab')}
              {pendingBookings.filter(b => b.status === 'pending_price').length > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-800">
                  {pendingBookings.filter(b => b.status === 'pending_price').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings">
              {t('bookings')}
              {runnerMode && pendingBookings.length > 0 && (
                <Badge className="ml-2 bg-green-100 text-green-800">{pendingBookings.length} nya</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="drivers">
              {t('driversTab')}
              {pendingDrivers.length > 0 && (
                <Badge className="ml-2 bg-yellow-100 text-yellow-800">{pendingDrivers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="performance">
              📊 {t('performanceTab')}
              {performanceData && performanceData.filter(p => p.flags.length > 0).length > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-800">
                  {performanceData.filter(p => p.flags.length > 0).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payouts">
              {t('payoutsTab')}
              {payouts.filter(p => p.status === 'pending').length > 0 && (
                <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                  {payouts.filter(p => p.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="financial">
              {t('financialTab')}
            </TabsTrigger>
            <TabsTrigger value="disputes">
              {t('problemTab')}
              {disputes.filter(d => d.status === 'open').length > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-800">
                  {disputes.filter(d => d.status === 'open').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="problematic">
              🚨 {t('cleanupTab')}
            </TabsTrigger>
            <TabsTrigger value="messaging">
              {t('messagingTab')}
            </TabsTrigger>
            <TabsTrigger value="pricing">
              {t('pricingTab')}
            </TabsTrigger>
            <TabsTrigger value="buy-deliver">
              🛒 {t('buyDeliverTab')}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              📢 {t('notificationsTab')}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              📊 {t('analyticsTab')}
            </TabsTrigger>
            <TabsTrigger value="pricing-addons">
              💰 {t('pricingAddonsTab')}
            </TabsTrigger>
            <TabsTrigger value="booking-history">
              📜 {t('bookingHistoryTab')}
            </TabsTrigger>
            <TabsTrigger value="notification-history">
              📋 {t('notificationHistoryTab')}
            </TabsTrigger>
            <TabsTrigger value="cancellations">
              ❌ {t('cancellationsTab')}
            </TabsTrigger>
            <TabsTrigger value="price-negotiation">
              💰 {t('priceNegotiationTab')}
            </TabsTrigger>
            <TabsTrigger value="business-accounts">
              🏢 {t('businessAccountsTab')}
            </TabsTrigger>
            <TabsTrigger value="dynamic-pricing">
              📈 Dynamisk Prissättning
            </TabsTrigger>
            <TabsTrigger value="price-log">
              📋 Prislogg
            </TabsTrigger>
            <TabsTrigger value="reviews">
              ⭐ Recensioner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DashboardMetrics />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="booking-mgmt">
            <AdvancedBookingManagement />
          </TabsContent>

          <TabsContent value="promo-codes">
            <PromoCodeManagement />
          </TabsContent>

          <TabsContent value="payout-mgmt">
            <PayoutManagement />
          </TabsContent>

          <TabsContent value="price-review">
            <PendingPriceReview currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle>{t('allBookings2')}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={bookingFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setBookingFilter('all')}
                    >
                      {t('allFilter')}
                    </Button>
                    <Button
                      size="sm"
                      variant={bookingFilter === 'unpaid' ? 'default' : 'outline'}
                      onClick={() => setBookingFilter('unpaid')}
                      className={bookingFilter === 'unpaid' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                    >
                      💸 {t('unpaidBookings')}
                    </Button>
                    <Button
                      size="sm"
                      variant={bookingFilter === 'active' ? 'default' : 'outline'}
                      onClick={() => setBookingFilter('active')}
                    >
                      {t('activeBookingsFilter')}
                    </Button>
                    <Button
                      size="sm"
                      variant={bookingFilter === 'completed' ? 'default' : 'outline'}
                      onClick={() => setBookingFilter('completed')}
                    >
                      {t('completedFilter')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings
                    .filter(b => {
                      if (bookingFilter === 'unpaid') return b.payment_status === 'pending';
                      if (bookingFilter === 'active') return !['completed', 'cancelled'].includes(b.status);
                      if (bookingFilter === 'completed') return b.status === 'completed';
                      return true;
                    })
                    .map((booking) => (
                    <div key={booking.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">#{booking.booking_number}</span>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 capitalize">
                            {booking.service_type?.replace('_', ' ')} • {booking.season}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#4A90A4]">{booking.total_price} SEK</p>
                          <p className="text-sm text-gray-500">{booking.preferred_date}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {booking.customer_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {booking.customer_phone}
                        </span>
                        {booking.store_booking_number && (
                          <span className="flex items-center gap-1 text-[#4A90A4] font-semibold">
                            <Package className="h-4 w-4" />
                            Order: {booking.store_booking_number}
                          </span>
                        )}
                        {booking.payment_status && (
                          <Badge className={
                           booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                           booking.payment_status === 'frozen' ? 'bg-red-100 text-red-800' :
                           'bg-yellow-100 text-yellow-800'
                          }>
                           {booking.payment_status === 'paid' ? t('paid') :
                            booking.payment_status === 'frozen' ? t('frozen') :
                            t('pendingPayment')}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        {booking.assigned_driver_name ? (
                          <span className="text-sm text-gray-500">
                            {t('assignedTo2')} <span className="font-medium text-gray-900">{booking.assigned_driver_name}</span>
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">{t('noDriverAssigned2')}</span>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          {['assigned', 'on_the_way', 'picked_up', 'in_progress'].includes(booking.status) && (
                            <>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setSelectedBookingMap(booking)}
                              >
                                <Map className="h-4 w-4 mr-1" />
                                {t('track2')}
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {
                                  setActiveChat(booking);
                                  setChatMinimized(false);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {t('chat2')}
                              </Button>
                            </>
                          )}
                          {booking.status === 'pending' && !booking.assigned_driver_id && (
                            <>
                              {runnerMode && (
                               <Button 
                                 size="sm"
                                 className="bg-green-600 hover:bg-green-700 rounded-full"
                                 onClick={() => acceptTaskMutation.mutate(booking)}
                               >
                                 <Check className="h-4 w-4 mr-1" />
                                 {t('acceptTask')}
                               </Button>
                              )}
                              {booking.service_type === 'help_at_home' && (
                                <RunnerMatchSuggestions 
                                  booking={booking}
                                  onAssign={() => queryClient.invalidateQueries(['admin-bookings'])}
                                />
                              )}
                              <Button 
                                size="sm"
                                className="bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full"
                                onClick={() => setAssignDialog({ open: true, booking })}
                              >
                                {t('assignDriver')}
                              </Button>
                            </>
                          )}
                          {booking.fulfilled_by_admin && (
                            <Badge className="bg-purple-100 text-purple-800">
                              {t('fulfilledByTaskCham')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <RunnerPerformance 
              drivers={drivers}
              bookings={bookings}
              ratings={ratings}
            />
          </TabsContent>

          <TabsContent value="drivers">
            {/* Pending Drivers */}
            {pendingDrivers.length > 0 && (
              <Card className="mb-6 border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    {t('pendingApproval3')} ({pendingDrivers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingDrivers.map((driver) => (
                      <div key={driver.id} className="bg-white rounded-xl p-4 border">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                          <div>
                            <p className="font-semibold">{driver.name}</p>
                            <p className="text-sm text-gray-500">{driver.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 rounded-full"
                              onClick={() => updateDriverStatus.mutate({ driverId: driver.id, status: 'approved', driver })}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {t('approve')}
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 rounded-full"
                              onClick={() => updateDriverStatus.mutate({ driverId: driver.id, status: 'suspended' })}
                            >
                              <X className="h-4 w-4 mr-1" />
                              {t('reject2')}
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>{t('phone2')} {driver.phone}</span>
                          <span>{t('vehicle')} {driver.vehicle_type || t('none')}</span>
                          <span>{t('areas')} {driver.service_areas?.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Drivers */}
            <Card>
              <CardHeader>
                <CardTitle>{t('manageDrivers')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approvedDrivers.map((driver) => {
                    const driverPerf = performanceData.find(p => p.driver.id === driver.id);
                    const hasIssues = driverPerf && driverPerf.flags.length > 0;
                    
                    return (
                    <div key={driver.id} className={`border rounded-xl p-4 hover:shadow-md transition-shadow ${
                      hasIssues ? 'border-red-200 bg-red-50' : ''
                    }`}>
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{driver.name}</p>
                            <Badge className={
                              driver.availability === 'available' ? 'bg-green-100 text-green-800' :
                              driver.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {driver.availability}
                            </Badge>
                            <Badge className={getDashboardAccessColor(driver.dashboard_access)}>
                              {driver.dashboard_access?.replace('_', ' ')}
                            </Badge>
                            {hasIssues && (
                              <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {t('requiresAttention')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{driver.email} • {driver.phone}</p>
                          {driverPerf && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                               <Star className="h-3 w-3 text-amber-500" />
                               {driverPerf.avgRating.toFixed(1)} {t('avgRating')}
                              </span>
                              <span>
                               {driverPerf.completionRate.toFixed(0)}% {t('completionRate')}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#4A90A4]">{driver.total_earnings || 0} SEK</p>
                          <p className="text-sm text-gray-500">{driver.completed_tasks || 0} {t('tasks2')}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs mt-1"
                            onClick={() => {
                              const driverRatings = ratings.filter(r => r.driver_id === driver.id);
                              setViewRatings({ driver, ratings: driverRatings });
                            }}
                          >
                            {t('viewRatings')} ({ratings.filter(r => r.driver_id === driver.id).length})
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {driver.dashboard_access === 'active' ? (
                          <>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 rounded-full"
                              onClick={() => setStatusChangeDialog({ 
                                open: true, 
                                driver, 
                                action: 'temporarily_disabled' 
                              })}
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              {t('disableAccess')}
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 rounded-full"
                              onClick={() => setStatusChangeDialog({ 
                                open: true, 
                                driver, 
                                action: 'suspended' 
                              })}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t('suspend2')}
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 rounded-full"
                            onClick={() => updateDriverDashboardAccess.mutate({
                              driverId: driver.id,
                              driverName: driver.name,
                              previousAccess: driver.dashboard_access,
                              newAccess: 'active',
                              reason: 'Access re-enabled by admin'
                            })}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            {t('enableAccess')}
                          </Button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>{t('payoutManagement2')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payouts.filter(p => p.status === 'pending').length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">{t('pendingPayouts2')}</h3>
                      <div className="space-y-3">
                        {payouts.filter(p => p.status === 'pending').map((payout) => (
                          <motion.div
                            key={payout.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-gray-900">{payout.driver_name}</span>
                                  <Badge className="bg-yellow-100 text-yellow-800">{t('pending2')}</Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>{t('amount2')} <span className="font-semibold">{payout.amount?.toFixed(0)} SEK</span></p>
                                  <p>{t('method2')} {payout.payment_method?.replace('_', ' ')}</p>
                                  <p>{t('account2')} {payout.bank_account}</p>
                                  <p>{t('requested2')} {new Date(payout.request_date).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => setPayoutDialog({ open: true, payout, action: 'approve' })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {t('approve2')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setPayoutDialog({ open: true, payout, action: 'reject' })}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  {t('reject3')}
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t('payoutHistory2')}</h3>
                    <div className="space-y-2">
                      {payouts.filter(p => p.status !== 'pending').map((payout) => {
                        const statusConfig = {
                          processing: { color: 'bg-blue-100 text-blue-800', label: t('processing3') },
                          completed: { color: 'bg-green-100 text-green-800', label: t('completed2') },
                          rejected: { color: 'bg-red-100 text-red-800', label: t('rejected') }
                        }[payout.status];

                        return (
                          <div
                            key={payout.id}
                            className="p-4 rounded-lg border bg-gray-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-gray-900">{payout.driver_name}</span>
                                  <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>{t('amount2')} <span className="font-semibold">{payout.amount?.toFixed(0)} SEK</span></p>
                                  <p>{t('processed2')} {new Date(payout.processed_date).toLocaleDateString()}</p>
                                  {payout.notes && (
                                    <p className="text-xs mt-2 p-2 bg-white rounded">{payout.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <FinancialOverview />
          </TabsContent>

          <TabsContent value="messaging">
            <MassMessaging />
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Prissättning - Göteborg Modell</CardTitle>
              </CardHeader>
              <CardContent>
                <PricingSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="problematic">
            <ProblematicTasks currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="buy-deliver">
            <AdminOrderManagement />
          </TabsContent>

          <TabsContent value="notifications">
            <MassNotifications />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsReports />
          </TabsContent>

          <TabsContent value="pricing-addons">
            <PricingAddonsManager />
          </TabsContent>

          <TabsContent value="booking-history">
            <BookingHistory />
          </TabsContent>

          <TabsContent value="notification-history">
            <NotificationHistory />
          </TabsContent>

          <TabsContent value="cancellations">
            <CancellationManagement />
          </TabsContent>

          <TabsContent value="price-negotiation">
            <PriceNegotiation />
          </TabsContent>

          <TabsContent value="disputes">
            <ProblematicTasks currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="business-accounts">
            <BusinessAccountManagement currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="dynamic-pricing">
            <DynamicPricingManager />
          </TabsContent>

          <TabsContent value="price-log">
            <PriceAdjustmentLog />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewModeration />
          </TabsContent>

          <TabsContent value="disputes-old" style={{ display: 'none' }}>
            <Card>
              <CardHeader>
                <CardTitle>Problemrapporter & Tvister</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {disputes.filter(d => d.status === 'open').length > 0 && (
                    <div>
                      <h3 className="font-semibold text-red-900 mb-3">Öppna Ärenden</h3>
                      {disputes.filter(d => d.status === 'open').map((dispute) => (
                        <div key={dispute.id} className="p-4 border-2 border-red-200 bg-red-50 rounded-lg mb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">#{dispute.booking_number}</p>
                              <p className="text-sm text-gray-600">{dispute.customer_name}</p>
                            </div>
                            <Badge className="bg-red-100 text-red-800">Öppen</Badge>
                          </div>
                          <div className="text-sm space-y-1 mb-3">
                            <p><span className="font-medium">Problem:</span> {dispute.issue_type?.replace('_', ' ')}</p>
                            <p><span className="font-medium">Beskrivning:</span> {dispute.description}</p>
                            <p><span className="font-medium">Förare:</span> {dispute.driver_name}</p>
                          </div>
                          {dispute.payment_frozen && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Betalning Frusen
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {disputes.filter(d => d.status !== 'open').length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Historik</h3>
                      {disputes.filter(d => d.status !== 'open').map((dispute) => (
                        <div key={dispute.id} className="p-4 border rounded-lg mb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">#{dispute.booking_number}</p>
                              <p className="text-sm text-gray-500">
                                {dispute.issue_type?.replace('_', ' ')} • {dispute.status}
                              </p>
                              {dispute.resolution && (
                                <p className="text-sm text-gray-600 mt-2">Lösning: {dispute.resolution}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {disputes.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Inga problemrapporter</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Driver Ratings Dialog */}
      <Dialog open={!!viewRatings} onOpenChange={() => setViewRatings(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('ratingsFor')} {viewRatings?.driver?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewRatings?.ratings?.length > 0 ? (
              <>
                <div className="text-center py-4 border-b">
                  <p className="text-sm text-gray-500 mb-2">{t('averageRating')}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-amber-500">
                      {(viewRatings.ratings.reduce((sum, r) => sum + r.rating, 0) / viewRatings.ratings.length).toFixed(1)}
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-6 w-6 ${
                            i < Math.round(viewRatings.ratings.reduce((sum, r) => sum + r.rating, 0) / viewRatings.ratings.length)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {viewRatings.ratings.length} {t('ratingsCount')}
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {viewRatings.ratings.map((rating) => (
                    <div key={rating.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(rating.created_date).toLocaleDateString('sv-SE')}
                        </span>
                      </div>
                      {rating.feedback && (
                        <p className="text-sm text-gray-700">{rating.feedback}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">#{rating.booking_number}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">{t('noRatingsYet')}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ open, booking: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('assignDriver')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              {t('selectAvailableDriver')} #{assignDialog.booking?.booking_number}
            </p>
            {availableDrivers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">{t('noAvailableDriversMoment')}</p>
            ) : (
              <div className="space-y-2">
                {availableDrivers.map((driver) => (
                  <Button
                    key={driver.id}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => assignDriver.mutate({
                      bookingId: assignDialog.booking?.id,
                      driverId: driver.id,
                      driverName: driver.name,
                      driver: driver,
                      booking: assignDialog.booking
                    })}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4A90A4]/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#4A90A4]" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-gray-500">
                          {driver.vehicle_type} • {driver.completed_tasks || 0} {t('tasks2')}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusChangeDialog.open} onOpenChange={(open) => {
        setStatusChangeDialog({ open, driver: null, action: '' });
        setStatusChangeReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusChangeDialog.action === 'temporarily_disabled' ? t('disableDashboard') : t('suspendDriver2')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              {statusChangeDialog.action === 'temporarily_disabled' 
                ? `${t('temporarilyDisableAccess')} ${statusChangeDialog.driver?.name}. ${t('cannotLoginAccept')}`
                : `${t('suspendAccount2')} ${statusChangeDialog.driver?.name}${t('accountUntilReenabled')}`
              }
            </p>
            <div className="space-y-2">
              <Label>{t('reasonOptional')}</Label>
              <Textarea
                placeholder={t('enterReasonAction')}
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setStatusChangeDialog({ open: false, driver: null, action: '' });
              setStatusChangeReason('');
            }}>
              {t('cancel2')}
            </Button>
            <Button 
              className={statusChangeDialog.action === 'suspended' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
              onClick={() => updateDriverDashboardAccess.mutate({
                driverId: statusChangeDialog.driver?.id,
                driverName: statusChangeDialog.driver?.name,
                previousAccess: statusChangeDialog.driver?.dashboard_access,
                newAccess: statusChangeDialog.action,
                reason: statusChangeReason
              })}
            >
              {t('confirm2')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Map Dialog */}
      <Dialog open={!!selectedBookingMap} onOpenChange={() => setSelectedBookingMap(null)}>
        <DialogContent className="max-w-5xl h-[85vh]">
          <DialogHeader>
            <DialogTitle>{t('liveTracking2')} #{selectedBookingMap?.booking_number}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4">
            {selectedBookingMap && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('driver2')}</span>
                    <span className="ml-2 font-medium">{selectedBookingMap.assigned_driver_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('status2')}</span>
                    <Badge className={`ml-2 ${getStatusColor(selectedBookingMap.status)}`}>
                      {selectedBookingMap.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                  {selectedBookingMap.tracking_active && (
                    <div className="col-span-2">
                      <Badge className="bg-green-100 text-green-800">
                        <span className="relative flex h-2 w-2 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {t('liveTrackingActive2')}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="h-[calc(100%-8rem)] rounded-xl overflow-hidden border">
                  <LiveMap 
                    booking={selectedBookingMap} 
                    driverLocation={
                      selectedBookingMap.driver_current_lat && selectedBookingMap.driver_current_lng
                        ? {
                            lat: selectedBookingMap.driver_current_lat,
                            lng: selectedBookingMap.driver_current_lng,
                            timestamp: selectedBookingMap.last_location_update
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

      {/* Admin Chat with Quick Replies */}
      {activeChat && (
        <div className="fixed bottom-4 right-4 z-50 flex gap-4">
          <div className="w-80">
            <QuickReplies 
              bookingId={activeChat.id}
              bookingNumber={activeChat.booking_number}
              onMessageSent={() => {
                // Trigger chat refresh
                queryClient.invalidateQueries(['chat-messages']);
              }}
            />
          </div>
          <ChatBox
            booking={activeChat}
            currentUser={currentUser}
            userType="admin"
            isMinimized={chatMinimized}
            onToggleMinimize={() => setChatMinimized(!chatMinimized)}
          />
        </div>
      )}

      {/* Payout Processing Dialog */}
      <Dialog open={payoutDialog.open} onOpenChange={() => setPayoutDialog({ open: false, payout: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {payoutDialog.action === 'approve' ? t('approvePayout2') : t('rejectPayout2')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">{t('driver3')}</p>
              <p className="font-semibold">{payoutDialog.payout?.driver_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('amount3')}</p>
              <p className="text-2xl font-bold text-[#4A90A4]">
                {payoutDialog.payout?.amount?.toFixed(0)} SEK
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('paymentDetails2')}</p>
              <p className="font-medium">{payoutDialog.payout?.payment_method?.replace('_', ' ')}</p>
              <p className="text-sm text-gray-600">{payoutDialog.payout?.bank_account}</p>
            </div>
            <div>
              <Label htmlFor="notes">
                {payoutDialog.action === 'approve' ? t('processingNotesOpt') : t('rejectionReason2')}
              </Label>
              <Textarea
                id="notes"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder={payoutDialog.action === 'approve' 
                  ? t('addProcessingNotes')
                  : t('provideRejectionReason')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPayoutDialog({ open: false, payout: null })}
            >
              {t('cancel3')}
            </Button>
            <Button
              onClick={() => {
                processPayoutMutation.mutate({
                  payoutId: payoutDialog.payout?.id,
                  status: payoutDialog.action === 'approve' ? 'completed' : 'rejected',
                  notes: payoutNotes
                });
              }}
              disabled={processPayoutMutation.isPending || (payoutDialog.action === 'reject' && !payoutNotes)}
              className={payoutDialog.action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}
            >
              {processPayoutMutation.isPending 
                ? t('processing4')
                : payoutDialog.action === 'approve' ? t('approvePayout2') : t('rejectPayout2')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}