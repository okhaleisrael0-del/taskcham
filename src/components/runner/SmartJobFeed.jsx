import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Clock, DollarSign, TrendingUp, Zap, Check, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JobAcceptReject from '@/components/runner/JobAcceptReject';

export default function SmartJobFeed({ driverProfile }) {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDialog, setJobDialog] = useState({ open: false, job: null });

  const { data: availableJobs = [] } = useQuery({
    queryKey: ['available-jobs', driverProfile?.id],
    queryFn: async () => {
      // Get pending paid bookings
      const jobs = await base44.entities.Booking.filter({
        status: 'paid',
        payment_status: 'paid'
      });
      return jobs;
    },
    enabled: !!driverProfile?.id,
    refetchInterval: 5000
  });

  const { data: bonuses = [] } = useQuery({
    queryKey: ['performance-bonuses'],
    queryFn: () => base44.entities.PerformanceBonus.filter({ is_active: true }),
    enabled: !!driverProfile
  });

  const acceptJobMutation = useMutation({
    mutationFn: async (booking) => {
      const runnerPayout = Math.round(booking.total_price * 0.8);
      
      await base44.entities.Booking.update(booking.id, {
        assigned_driver_id: driverProfile.id,
        assigned_driver_name: driverProfile.name,
        assigned_driver_phone: driverProfile.phone,
        driver_earnings: runnerPayout,
        status: 'assigned'
      });

      // Create earnings record
      const now = new Date();
      await base44.entities.RunnerEarnings.create({
        runner_id: driverProfile.id,
        runner_name: driverProfile.name,
        booking_id: booking.id,
        booking_number: booking.booking_number,
        base_earning: runnerPayout,
        total_earning: runnerPayout,
        status: 'pending',
        task_completed_date: now.toISOString(),
        week_number: Math.ceil(now.getDate() / 7),
        month: now.toISOString().substring(0, 7),
        year: now.getFullYear()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['available-jobs']);
      queryClient.invalidateQueries(['driver-bookings']);
      setSelectedJob(null);
    }
  });

  // Filter jobs based on runner profile
  const relevantJobs = useMemo(() => {
    if (!driverProfile) return [];
    
    return availableJobs.filter(job => {
      // Check vehicle requirement
      if (job.item_size === 'medium' && driverProfile.vehicle_type === 'none') {
        return false;
      }
      
      // Check service area
      if (driverProfile.service_areas && driverProfile.service_areas.length > 0) {
        const jobArea = job.area_type || 'city';
        if (!driverProfile.service_areas.includes(jobArea)) {
          return false;
        }
      }

      // Check expertise for help_at_home
      if (job.service_type === 'help_at_home' && driverProfile.expertise) {
        if (!driverProfile.expertise.includes(job.help_service_type)) {
          return false;
        }
      }

      return true;
    });
  }, [availableJobs, driverProfile]);

  const calculatePotentialBonus = (job) => {
    let bonus = 0;
    const currentHour = new Date().getHours();

    // Peak hours bonus (7-9am, 4-7pm)
    const peakBonus = bonuses.find(b => b.bonus_type === 'peak_hours');
    if (peakBonus && ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 19))) {
      bonus += peakBonus.bonus_amount;
    }

    return bonus;
  };

  if (driverProfile.availability !== 'available') {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6 text-center">
          <Clock className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <p className="text-amber-900 font-semibold mb-2">Du är offline</p>
          <p className="text-amber-700 text-sm">Ändra din status till "Tillgänglig" för att se jobb</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Tillgängliga Jobb</h2>
        <Badge className="bg-green-100 text-green-800">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          {relevantJobs.length} jobb
        </Badge>
      </div>

      {relevantJobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">Inga jobb just nu</p>
            <p className="text-gray-400 text-sm">Nya jobb dyker upp snart!</p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence>
          {relevantJobs.map((job) => {
            const runnerPayout = Math.round(job.total_price * 0.8);
            const potentialBonus = calculatePotentialBonus(job);
            const totalPotential = runnerPayout + potentialBonus;

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                <Card className="border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-xl">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg">#{job.booking_number}</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {job.service_type?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {job.preferred_date} • {job.preferred_time || 'Flexibel tid'}
                        </p>
                      </div>
                      
                      {/* Earnings Highlight */}
                      <div className="text-right bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-3">
                        <p className="text-xs text-green-700 font-semibold mb-1">DIN INTÄKT</p>
                        <p className="text-3xl font-black text-green-700">{runnerPayout} kr</p>
                        {potentialBonus > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                            <Zap className="h-3 w-3" />
                            <span>+{potentialBonus} kr bonus möjlig</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="space-y-3 mb-4">
                      {job.pickup_store && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-blue-600 font-semibold mb-1">HÄMTA FRÅN</p>
                              <p className="font-bold text-sm">{job.pickup_store.name}</p>
                              <p className="text-xs text-gray-600">{job.pickup_store.address}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {job.delivery_address && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-green-600 font-semibold mb-1">LEVERERA TILL</p>
                              <p className="font-medium text-sm">{job.delivery_address}</p>
                              {job.distance_km && (
                                <p className="text-xs text-gray-600 mt-1">
                                  📍 {job.distance_km.toFixed(1)} km • ~{Math.round(job.distance_km * 3)} min
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                      <p className="text-gray-600">
                        <span className="font-semibold text-gray-900">{job.customer_name}</span>
                        {job.item_description && ` • ${job.item_description}`}
                      </p>
                    </div>

                    {/* Accept Button */}
                    <Button
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-14 text-lg"
                      onClick={() => setJobDialog({ open: true, job })}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Se Detaljer & Acceptera
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Job Accept/Reject Dialog */}
      {jobDialog.job && (
        <JobAcceptReject
          job={jobDialog.job}
          isOpen={jobDialog.open}
          onClose={() => setJobDialog({ open: false, job: null })}
          driverProfile={driverProfile}
        />
      )}
    </div>
  );
}