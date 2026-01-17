import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Calendar, Package, ArrowUpRight, 
  Clock, CheckCircle, XCircle, Wallet, CreditCard
} from 'lucide-react';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';

export default function PayoutsSection({ driverProfile }) {
  const queryClient = useQueryClient();
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(driverProfile?.payment_method || 'bank_transfer');
  const [bankAccount, setBankAccount] = useState(driverProfile?.bank_account || '');

  // Fetch completed bookings for this driver
  const { data: completedBookings = [] } = useQuery({
    queryKey: ['completed-bookings', driverProfile?.id],
    queryFn: async () => {
      if (!driverProfile?.id) return [];
      return await base44.entities.Booking.filter({
        assigned_driver_id: driverProfile.id,
        status: 'completed'
      }, '-created_date', 100);
    },
    enabled: !!driverProfile?.id
  });

  // Fetch payout history
  const { data: payouts = [] } = useQuery({
    queryKey: ['payouts', driverProfile?.id],
    queryFn: async () => {
      if (!driverProfile?.id) return [];
      return await base44.entities.Payout.filter({
        driver_id: driverProfile.id
      }, '-created_date', 50);
    },
    enabled: !!driverProfile?.id
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Payout.create(data);
      // Update driver balance
      await base44.entities.Driver.update(driverProfile.id, {
        current_balance: driverProfile.current_balance - parseFloat(payoutAmount)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['driver-profile']);
      queryClient.invalidateQueries(['payouts']);
      setPayoutDialog(false);
      setPayoutAmount('');
    }
  });

  // Calculate earnings
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());

  const thisWeekEarnings = completedBookings
    .filter(b => {
      const date = new Date(b.created_date);
      return date >= thisWeekStart && date <= thisWeekEnd;
    })
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const thisMonthEarnings = completedBookings
    .filter(b => {
      const date = new Date(b.created_date);
      return date >= thisMonthStart && date <= thisMonthEnd;
    })
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const handleRequestPayout = () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0 || amount > driverProfile.current_balance) return;

    requestPayoutMutation.mutate({
      driver_id: driverProfile.id,
      driver_name: driverProfile.name,
      driver_email: driverProfile.email,
      amount: amount,
      request_date: new Date().toISOString(),
      payment_method: paymentMethod,
      bank_account: bankAccount,
      status: 'pending'
    });
  };

  const getPayoutStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Väntande' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Bearbetas' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Slutförd' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Avvisad' }
    };
    return config[status] || config.pending;
  };

  return (
    <div className="space-y-6">
      {/* Quick Withdraw Banner */}
      {driverProfile?.current_balance >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-1">💰 Tillgängligt för Utbetalning</h3>
              <p className="text-3xl font-bold text-green-700 mb-2">
                {driverProfile.current_balance.toFixed(0)} SEK
              </p>
              <p className="text-sm text-green-700">
                Begär utbetalning direkt till ditt bankkonto eller Swish
              </p>
            </div>
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setPayoutDialog(true)}
            >
              <ArrowUpRight className="h-5 w-5 mr-2" />
              Ta Ut Pengar
            </Button>
          </div>
        </motion.div>
      )}

      {/* Balance Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-2 border-[#4A90A4]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="h-5 w-5 text-[#4A90A4]" />
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-sm text-gray-500">Aktuellt Saldo</p>
            <p className="text-3xl font-bold text-[#4A90A4] mt-1">
              {driverProfile?.current_balance?.toFixed(0) || 0} SEK
            </p>
            <Button
              className="w-full mt-4 bg-[#4A90A4] hover:bg-[#3d7a8c]"
              onClick={() => setPayoutDialog(true)}
              disabled={!driverProfile?.current_balance || driverProfile.current_balance < 100}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              {driverProfile?.current_balance >= 100 ? 'Ta Ut Nu' : 'Begär Utbetalning'}
            </Button>
            {driverProfile?.current_balance < 100 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Minimum 100 SEK krävs
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-500">Denna Vecka</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {thisWeekEarnings.toFixed(0)} SEK
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-sm text-gray-500">Denna Månad</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {thisMonthEarnings.toFixed(0)} SEK
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-500">Totala Intäkter</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {driverProfile?.total_earnings?.toFixed(0) || 0} SEK
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for History */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Slutförda Uppdrag</TabsTrigger>
          <TabsTrigger value="payouts">Utbetalningshistorik</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Intäktshistorik</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {completedBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Inga slutförda uppdrag än</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedBookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 rounded-lg border hover:border-[#4A90A4] transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">#{booking.booking_number}</Badge>
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Slutförd
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {booking.service_type?.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(booking.created_date), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#4A90A4]">
                            {booking.total_price?.toFixed(0)} SEK
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Utbetalningsbegäranden</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {payouts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Inga utbetalningsbegäranden än</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payouts.map((payout) => {
                      const statusConfig = getPayoutStatusBadge(payout.status);
                      return (
                        <motion.div
                          key={payout.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                            <p className="text-lg font-bold text-gray-900">
                              {payout.amount?.toFixed(0)} SEK
                            </p>
                          </div>
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>Begärd: {format(new Date(payout.request_date), 'MMM dd, yyyy')}</p>
                            <p>Metod: {payout.payment_method?.replace('_', ' ')}</p>
                            {payout.processed_date && (
                              <p>Bearbetad: {format(new Date(payout.processed_date), 'MMM dd, yyyy')}</p>
                            )}
                            {payout.notes && (
                              <p className="text-xs mt-2 p-2 bg-gray-50 rounded">{payout.notes}</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Request Dialog */}
      <Dialog open={payoutDialog} onOpenChange={setPayoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>💰 Ta Ut Pengar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <Label className="text-sm text-green-700">Tillgängligt Saldo</Label>
              <p className="text-3xl font-bold text-green-700 mt-1">
                {driverProfile?.current_balance?.toFixed(0) || 0} SEK
              </p>
              <p className="text-xs text-green-600 mt-2">
                ✓ Utbetalning vanligtvis inom 1-3 bankdagar
              </p>
            </div>
            
            <div>
              <Label htmlFor="amount" className="text-base font-semibold">Hur mycket vill du ta ut?</Label>
              <div className="flex gap-2 mt-2 mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPayoutAmount('500')}
                  className="flex-1"
                >
                  500 kr
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPayoutAmount('1000')}
                  className="flex-1"
                >
                  1000 kr
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPayoutAmount(String(Math.floor(driverProfile?.current_balance || 0)))}
                  className="flex-1"
                >
                  Allt
                </Button>
              </div>
              <Input
                id="amount"
                type="number"
                min="100"
                max={driverProfile?.current_balance || 0}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Eller ange belopp"
                className="text-lg font-semibold h-12"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 100 SEK • Maximum {driverProfile?.current_balance?.toFixed(0)} SEK</p>
            </div>

            <div>
              <Label htmlFor="method">Betalningsmetod</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Banköverföring</SelectItem>
                  <SelectItem value="swish">Swish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="account">
                {paymentMethod === 'swish' ? 'Swish-nummer' : 'Bankkonto'}
              </Label>
              <Input
                id="account"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder={paymentMethod === 'swish' ? '+46XXXXXXXXX' : 'XXXX-XXXX-XXXX'}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setPayoutDialog(false)}
              className="w-full sm:w-auto"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={
                !payoutAmount || 
                parseFloat(payoutAmount) < 100 || 
                parseFloat(payoutAmount) > driverProfile?.current_balance ||
                !bankAccount ||
                requestPayoutMutation.isPending
              }
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-base font-semibold"
              size="lg"
            >
              {requestPayoutMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Bearbetar...
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-5 w-5 mr-2" />
                  Begär {payoutAmount} SEK
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}