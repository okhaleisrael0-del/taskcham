import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DollarSign, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function PayoutManagement() {
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-payouts'],
    queryFn: () => base44.entities.Driver.list()
  });

  const { data: earnings = [] } = useQuery({
    queryKey: ['runner-earnings'],
    queryFn: () => base44.entities.RunnerEarnings.filter({ status: ['pending', 'available'] })
  });

  const processPayoutMutation = useMutation({
    mutationFn: async (driverId) => {
      const driver = drivers.find(d => d.id === driverId);
      const driverEarnings = earnings.filter(e => e.runner_id === driverId && e.status === 'available');
      const totalAmount = driverEarnings.reduce((sum, e) => sum + e.total_earning, 0);

      // Update earnings to paid_out
      for (const earning of driverEarnings) {
        await base44.entities.RunnerEarnings.update(earning.id, {
          status: 'paid_out',
          payout_date: new Date().toISOString()
        });
      }

      // Update driver balance
      await base44.entities.Driver.update(driverId, {
        current_balance: 0,
        total_paid_out: (driver.total_paid_out || 0) + totalAmount
      });

      // Create payout record
      await base44.entities.Payout.create({
        driver_id: driverId,
        driver_name: driver.name,
        amount: totalAmount,
        status: 'completed',
        payment_method: driver.payment_method || 'bank_transfer',
        bank_account: driver.bank_account,
        payout_date: new Date().toISOString()
      });

      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: driver.email,
        subject: `Utbetalning Genomförd - ${totalAmount} kr`,
        body: `
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <h2>Hej ${driver.name}!</h2>
              <p>Din utbetalning har genomförts.</p>
              
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #16a34a;">${totalAmount} kr</p>
                <p style="margin: 5px 0 0 0; color: #166534;">utbetalat</p>
              </div>

              <p>Betalningen kommer att synas på ditt konto inom 1-3 arbetsdagar.</p>
              <p>Med vänliga hälsningar,<br>TaskCham</p>
            </body>
          </html>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers-payouts']);
      queryClient.invalidateQueries(['runner-earnings']);
      setShowPayoutDialog(false);
      setSelectedDriver(null);
      toast.success('Utbetalning genomförd');
    }
  });

  const driversWithBalance = drivers
    .filter(d => (d.current_balance || 0) > 0)
    .sort((a, b) => (b.current_balance || 0) - (a.current_balance || 0));

  const totalPending = driversWithBalance.reduce((sum, d) => sum + (d.current_balance || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Utbetalningshantering</CardTitle>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total väntande</p>
            <p className="text-2xl font-bold text-[#1E3A8A]">
              {totalPending.toLocaleString('sv-SE')} kr
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {driversWithBalance.map(driver => {
            const driverEarnings = earnings.filter(e => e.runner_id === driver.id);
            const availableEarnings = driverEarnings.filter(e => e.status === 'available');
            const availableAmount = availableEarnings.reduce((sum, e) => sum + e.total_earning, 0);
            const pendingAmount = driverEarnings
              .filter(e => e.status === 'pending')
              .reduce((sum, e) => sum + e.total_earning, 0);

            return (
              <div key={driver.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{driver.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{driver.email}</p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Tillgängligt:</span>
                        <span className="font-bold text-green-600 ml-2">
                          {availableAmount.toLocaleString('sv-SE')} kr
                        </span>
                      </div>
                      {pendingAmount > 0 && (
                        <div>
                          <span className="text-gray-500">Väntande:</span>
                          <span className="font-medium text-amber-600 ml-2">
                            {pendingAmount.toLocaleString('sv-SE')} kr
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500 mt-2">
                      <span>📦 {driver.completed_tasks || 0} uppdrag</span>
                      <span>💰 {(driver.total_paid_out || 0).toLocaleString('sv-SE')} kr utbetalt</span>
                      <span>💳 {driver.payment_method === 'swish' ? 'Swish' : 'Banköverföring'}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedDriver(driver);
                      setShowPayoutDialog(true);
                    }}
                    disabled={availableAmount === 0}
                    className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Betala Ut
                  </Button>
                </div>

                {pendingAmount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-800">
                      {pendingAmount.toLocaleString('sv-SE')} kr blir tillgängligt när uppdragen arkiveras (7 dagar efter slutförande)
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {driversWithBalance.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Inga väntande utbetalningar</p>
            </div>
          )}
        </div>

        {/* Payout Confirmation Dialog */}
        <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bekräfta Utbetalning</DialogTitle>
            </DialogHeader>
            {selectedDriver && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Runner</p>
                  <p className="font-semibold text-lg">{selectedDriver.name}</p>
                  <p className="text-sm text-gray-600">{selectedDriver.email}</p>
                </div>

                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-1">Utbetalningsbelopp</p>
                  <p className="text-3xl font-bold text-green-600">
                    {selectedDriver.current_balance?.toLocaleString('sv-SE')} kr
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-medium mb-1">Betalningsmetod:</p>
                  <p>{selectedDriver.payment_method === 'swish' ? '📱 Swish' : '🏦 Banköverföring'}</p>
                  <p className="mt-1">{selectedDriver.bank_account}</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <p className="font-medium">OBS:</p>
                  <p>Detta genomför utbetalningen och nollställer runnerns saldo. Säkerställ att betalningen kommer att genomföras manuellt till runnerns konto.</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                Avbryt
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => processPayoutMutation.mutate(selectedDriver.id)}
                disabled={processPayoutMutation.isPending}
              >
                {processPayoutMutation.isPending ? 'Behandlar...' : 'Genomför Utbetalning'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}