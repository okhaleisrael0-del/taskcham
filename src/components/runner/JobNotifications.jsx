import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Package, DollarSign } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function JobNotifications({ driverId, onJobClick }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: newBookings = [] } = useQuery({
    queryKey: ['new-jobs-notifications', driverId],
    queryFn: async () => {
      // Get new paid bookings not assigned
      const jobs = await base44.entities.Booking.filter({
        status: 'paid',
        assigned_driver_id: null
      }, '-created_date', 10);
      return jobs;
    },
    refetchInterval: 5000,
    enabled: !!driverId
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['unread-messages', driverId],
    queryFn: async () => {
      const messages = await base44.entities.ChatMessage.list('-created_date', 50);
      return messages.filter(m => 
        m.sender_type !== 'driver' && 
        !m.read_by?.includes(driverId)
      );
    },
    refetchInterval: 5000,
    enabled: !!driverId
  });

  useEffect(() => {
    const newJobsNotifs = newBookings.slice(0, 3).map(b => ({
      id: `job-${b.id}`,
      type: 'new_job',
      title: 'Nytt Uppdrag Tillgängligt',
      message: `${b.service_type.replace('_', ' ')} - ${b.total_price} kr`,
      data: b,
      timestamp: b.created_date
    }));

    const messageNotifs = chatMessages.slice(0, 3).map(m => ({
      id: `msg-${m.id}`,
      type: 'new_message',
      title: 'Nytt Meddelande',
      message: `${m.sender_name}: ${m.message?.substring(0, 40)}...`,
      data: m,
      timestamp: m.created_date
    }));

    const allNotifs = [...newJobsNotifs, ...messageNotifs]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setNotifications(allNotifs);
    setUnreadCount(newBookings.length + chatMessages.length);

    // Show toast for very new jobs (within last 30 seconds)
    const veryNewJobs = newBookings.filter(b => {
      const jobAge = (Date.now() - new Date(b.created_date).getTime()) / 1000;
      return jobAge < 30;
    });

    if (veryNewJobs.length > 0 && !showDropdown) {
      toast.success(`🔔 ${veryNewJobs.length} nya uppdrag!`, {
        action: {
          label: 'Visa',
          onClick: () => setShowDropdown(true)
        }
      });
    }
  }, [newBookings, chatMessages]);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-12 w-80 bg-white border rounded-xl shadow-2xl z-50"
          >
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Notifikationer</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} olästa</p>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Inga notifikationer</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (notif.type === 'new_job') {
                          onJobClick(notif.data);
                        }
                        setShowDropdown(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          notif.type === 'new_job' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {notif.type === 'new_job' ? (
                            <Package className="h-5 w-5 text-green-600" />
                          ) : (
                            <Bell className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.timestamp).toLocaleTimeString('sv-SE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}