import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Truck } from 'lucide-react';

export default function RunnerDashboardButton() {
  const [isRunner, setIsRunner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRunnerStatus = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          setLoading(false);
          return;
        }

        const user = await base44.auth.me();
        if (user?.is_runner) {
          setIsRunner(true);
        }
      } catch (error) {
        console.error('Failed to check runner status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRunnerStatus();
  }, []);

  if (loading || !isRunner) {
    return null;
  }

  return (
    <Link to={createPageUrl('DriverDashboard')}>
      <Button 
        className="bg-gradient-to-r from-[#4A90A4] to-[#7FB069] hover:from-[#3d7a8c] hover:to-[#6a9557] text-white font-semibold shadow-lg"
      >
        <Truck className="h-4 w-4 mr-2" />
        Runner Dashboard
      </Button>
    </Link>
  );
}