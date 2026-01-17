import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, BellOff, Check, X, Trash2, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      // Check notification permission
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
      // Check if user has enabled notifications
      const enabled = localStorage.getItem('notifications_enabled') === 'true';
      setNotificationsEnabled(enabled);
    }).catch(() => {});
  }, []);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Notification.filter(
        { user_email: currentUser.email },
        '-created_date',
        50
      );
    },
    enabled: !!currentUser?.email,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (!currentUser?.email) return;

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === currentUser.email) {
        queryClient.invalidateQueries(['notifications']);
        
        // Show browser notification if enabled
        if (notificationsEnabled && permission === 'granted' && event.type === 'create') {
          new Notification(event.data.title, {
            body: event.data.message,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: event.data.id,
            requireInteraction: event.data.priority === 'urgent'
          });
        }
      }
    });

    return unsubscribe;
  }, [currentUser?.email, notificationsEnabled, permission]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          base44.entities.Notification.update(n.id, {
            is_read: true,
            read_at: new Date().toISOString()
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.delete(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        notifications.map(n => base44.entities.Notification.delete(n.id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setShowPanel(false);
    }
  });

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Din webbläsare stöder inte notifikationer');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      setNotificationsEnabled(true);
      localStorage.setItem('notifications_enabled', 'true');
      new Notification('Notifikationer aktiverade!', {
        body: 'Du kommer nu att få push-notiser om nya uppdateringar',
        icon: '/logo.png'
      });
    }
  };

  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
    } else {
      if (permission !== 'granted') {
        requestNotificationPermission();
      } else {
        setNotificationsEnabled(true);
        localStorage.setItem('notifications_enabled', 'true');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    const icons = {
      booking_update: '📦',
      payment: '💰',
      driver_assignment: '🚗',
      message: '💬',
      system: '⚙️',
      promo: '🎉',
      review: '⭐'
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'border-l-gray-400',
      normal: 'border-l-blue-500',
      high: 'border-l-orange-500',
      urgent: 'border-l-red-500'
    };
    return colors[priority] || 'border-l-blue-500';
  };

  if (!currentUser) return null;

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPanel(true)}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="max-w-md max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifikationer
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNotifications}
                className={notificationsEnabled ? 'text-green-600' : 'text-gray-400'}
                title={notificationsEnabled ? 'Inaktivera push-notiser' : 'Aktivera push-notiser'}
              >
                {notificationsEnabled ? (
                  <Bell className="h-5 w-5" />
                ) : (
                  <BellOff className="h-5 w-5" />
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className="px-6 pb-3 flex items-center justify-between border-b">
            <p className="text-sm text-gray-500">
              {notificationsEnabled ? (
                <span className="text-green-600 flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Push-notiser aktiverade
                </span>
              ) : (
                'Push-notiser inaktiverade'
              )}
            </p>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Markera alla som lästa
              </Button>
            )}
          </div>

          <ScrollArea className="h-[500px]">
            <div className="p-4 space-y-2">
              <AnimatePresence>
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Inga notifikationer</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`relative border-l-4 ${getPriorityColor(notification.priority)} bg-white rounded-lg p-4 hover:shadow-md transition-shadow ${
                        notification.is_read ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                            <h4 className="font-semibold text-sm">{notification.title}</h4>
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          {notification.related_booking_number && (
                            <Badge variant="outline" className="text-xs">
                              #{notification.related_booking_number}
                            </Badge>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(notification.created_date), 'PPp', { locale: sv })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              title="Markera som läst"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            title="Ta bort"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {notifications.length > 0 && (
            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => clearAllMutation.mutate()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Rensa alla notifikationer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}