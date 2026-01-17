import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Users, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RunnerNearbyIndicator({ area = 'city' }) {
  const { data: availableRunners = [] } = useQuery({
    queryKey: ['available-runners', area],
    queryFn: async () => {
      const drivers = await base44.entities.Driver.filter({ 
        status: 'approved',
        availability: 'available',
        dashboard_access: 'active'
      });
      
      // Filter by area if specified
      return drivers.filter(d => 
        !d.service_areas || 
        d.service_areas.length === 0 || 
        d.service_areas.includes(area)
      );
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (!availableRunners || availableRunners.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Users className="h-6 w-6 text-green-600" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-900">
            {availableRunners.length} {availableRunners.length === 1 ? 'runner' : 'runners'} tillgänglig{availableRunners.length !== 1 ? 'a' : ''} nu
          </p>
          <div className="flex items-center gap-1 text-sm text-green-700">
            <MapPin className="h-3 w-3" />
            <span>I ditt område</span>
          </div>
        </div>
        <Badge className="bg-green-500 text-white">
          Snabb leverans!
        </Badge>
      </div>
    </motion.div>
  );
}