import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, UserX, UserCheck, Mail, Calendar, ShieldAlert, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, user: null });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users-admin'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['all-bookings-users'],
    queryFn: () => base44.entities.Booking.list()
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['all-drivers-users'],
    queryFn: () => base44.entities.Driver.list()
  });

  const getUserBookingCount = (email) => {
    return bookings.filter(b => b.customer_email === email).length;
  };

  const getUserSpending = (email) => {
    return bookings
      .filter(b => b.customer_email === email && b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const customers = filteredUsers.filter(u => u.role === 'user');
  const admins = filteredUsers.filter(u => u.role === 'admin');

  const suspendDriverMutation = useMutation({
    mutationFn: async (email) => {
      const driver = drivers.find(d => d.email === email);
      if (driver) {
        await base44.entities.Driver.update(driver.id, {
          dashboard_access: 'suspended',
          status: 'suspended'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-drivers-users']);
      toast.success('Runner avstängd');
      setActionDialog({ open: false, type: null, user: null });
    }
  });

  const reactivateDriverMutation = useMutation({
    mutationFn: async (email) => {
      const driver = drivers.find(d => d.email === email);
      if (driver) {
        await base44.entities.Driver.update(driver.id, {
          dashboard_access: 'active',
          status: 'approved'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-drivers-users']);
      toast.success('Runner återaktiverad');
      setActionDialog({ open: false, type: null, user: null });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Användarhantering</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Sök användare..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="customers">
          <TabsList className="mb-6">
            <TabsTrigger value="customers">
              Kunder ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="runners">
              Runners ({drivers.length})
            </TabsTrigger>
            <TabsTrigger value="admins">
              Admins ({admins.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <div className="space-y-3">
              {customers.map(user => {
                const bookingCount = getUserBookingCount(user.email);
                const spending = getUserSpending(user.email);

                return (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{user.full_name || 'Ingen namn'}</h3>
                          <Badge variant="outline">{user.role}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>📦 {bookingCount} bokningar</span>
                          <span>💰 {spending.toLocaleString('sv-SE')} kr</span>
                          <span>📅 {new Date(user.created_date).toLocaleDateString('sv-SE')}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {customers.length === 0 && (
                <p className="text-center text-gray-500 py-8">Inga kunder hittades</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="runners">
            <div className="space-y-3">
              {drivers.map(driver => {
                const user = users.find(u => u.email === driver.email);
                const isSuspended = driver.dashboard_access === 'suspended' || driver.status === 'suspended';

                return (
                  <div key={driver.id} className={`border rounded-lg p-4 ${isSuspended ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{driver.name}</h3>
                          <Badge className={
                            driver.status === 'approved' ? 'bg-green-100 text-green-800' :
                            driver.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {driver.status}
                          </Badge>
                          {isSuspended && <Badge variant="destructive">Avstängd</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{driver.email}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>✅ {driver.completed_tasks || 0} uppdrag</span>
                          <span>⭐ {driver.average_rating?.toFixed(1) || 'N/A'}</span>
                          <span>💰 {driver.total_earnings?.toLocaleString('sv-SE') || 0} kr</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isSuspended ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => setActionDialog({ open: true, type: 'suspend', user: driver })}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Stäng av
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => setActionDialog({ open: true, type: 'reactivate', user: driver })}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Aktivera
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {drivers.length === 0 && (
                <p className="text-center text-gray-500 py-8">Inga runners hittades</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="admins">
            <div className="space-y-3">
              {admins.map(admin => (
                <div key={admin.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold">{admin.full_name || 'Ingen namn'}</h3>
                        <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Medlem sedan {new Date(admin.created_date).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Confirmation Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, user: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.type === 'suspend' ? 'Stäng av Runner' : 'Återaktivera Runner'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Är du säker på att du vill {actionDialog.type === 'suspend' ? 'stänga av' : 'återaktivera'}{' '}
                <strong>{actionDialog.user?.name}</strong>?
              </p>
              {actionDialog.type === 'suspend' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  Detta kommer att blockera runnerns åtkomst till dashboarden och förhindra tilldelning av nya uppdrag.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog({ open: false, type: null, user: null })}>
                Avbryt
              </Button>
              <Button
                className={actionDialog.type === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                onClick={() => {
                  if (actionDialog.type === 'suspend') {
                    suspendDriverMutation.mutate(actionDialog.user.email);
                  } else {
                    reactivateDriverMutation.mutate(actionDialog.user.email);
                  }
                }}
              >
                Bekräfta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}