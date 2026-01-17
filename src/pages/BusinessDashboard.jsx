import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Home, LogOut, Building2, Users, Package, BarChart3, FileText } from 'lucide-react';
import TeamManagement from '@/components/business/TeamManagement';
import BusinessAnalytics from '@/components/business/BusinessAnalytics';
import MonthlyInvoicing from '@/components/business/MonthlyInvoicing';
import OrderHistoryView from '@/components/customer/OrderHistoryView';

export default function BusinessDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [businessAccount, setBusinessAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('BusinessDashboard'));
        return;
      }
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Check if user is business admin
      const accounts = await base44.entities.BusinessAccount.filter({ admin_email: user.email });
      if (accounts.length > 0) {
        setBusinessAccount(accounts[0]);
        setIsAdmin(true);
      } else {
        // Check if user is team member
        const members = await base44.entities.TeamMember.filter({ user_email: user.email });
        if (members.length > 0) {
          const member = members[0];
          const account = await base44.entities.BusinessAccount.filter({ id: member.business_account_id });
          if (account.length > 0) {
            setBusinessAccount(account[0]);
            setIsAdmin(member.role === 'admin');
          }
        }
      }

      setIsLoading(false);
    };
    loadUser();
  }, []);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['business-team', businessAccount?.id],
    queryFn: () => base44.entities.TeamMember.filter({ business_account_id: businessAccount.id }),
    enabled: !!businessAccount?.id
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['business-bookings-dash', businessAccount?.id],
    queryFn: () => base44.entities.Booking.filter({ business_account_id: businessAccount.id }),
    enabled: !!businessAccount?.id
  });

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }

  if (!businessAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Inget Företagskonto</h2>
            <p className="text-gray-600 mb-6">
              Du är inte kopplad till något företagskonto än.
            </p>
            <Link to={createPageUrl('Home')}>
              <Button>Tillbaka till Hem</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeMembers = teamMembers.filter(m => m.status === 'active').length;
  const totalSpending = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{businessAccount.company_name}</h1>
                <p className="text-sm text-gray-500">Företagskonto</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Booking')}>
                <Button size="sm" className="bg-[#1E3A8A]">
                  Ny Bokning
                </Button>
              </Link>
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Hem
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Kostnad</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">
                    {totalSpending.toLocaleString('sv-SE')} kr
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-[#1E3A8A]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Teammedlemmar</p>
                  <p className="text-3xl font-bold text-[#14B8A6]">{activeMembers}</p>
                </div>
                <Users className="h-10 w-10 text-[#14B8A6]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Bokningar</p>
                  <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
                </div>
                <Package className="h-10 w-10 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Info Banner */}
        <Card className="mb-8 bg-gradient-to-r from-[#1E3A8A]/5 to-[#14B8A6]/5 border-2 border-[#1E3A8A]/20">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Företagsinformation</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Org.nr:</strong> {businessAccount.org_number}</p>
                  <p><strong>Kontakt:</strong> {businessAccount.contact_person}</p>
                  <p><strong>E-post:</strong> {businessAccount.contact_email}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Betalningsvillkor</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Typ:</strong>{' '}
                    <Badge className="bg-[#FACC15] text-gray-900">
                      {businessAccount.payment_terms === 'monthly_invoice' ? 'Månadsfakturering' :
                       businessAccount.payment_terms === 'net_30' ? 'Netto 30 dagar' :
                       businessAccount.payment_terms === 'net_60' ? 'Netto 60 dagar' :
                       'Förskottsbetalning'}
                    </Badge>
                  </p>
                  {businessAccount.monthly_credit_limit > 0 && (
                    <p><strong>Kreditgräns:</strong> {businessAccount.monthly_credit_limit?.toLocaleString('sv-SE')} kr/månad</p>
                  )}
                  {businessAccount.current_balance > 0 && (
                    <p className="text-amber-600"><strong>Utestående:</strong> {businessAccount.current_balance?.toLocaleString('sv-SE')} kr</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="team">
          <TabsList className="mb-6">
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analys
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="h-4 w-4 mr-2" />
              Fakturor
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Package className="h-4 w-4 mr-2" />
              Bokningar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <TeamManagement businessAccount={businessAccount} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="analytics">
            <BusinessAnalytics businessAccount={businessAccount} />
          </TabsContent>

          <TabsContent value="invoices">
            <MonthlyInvoicing businessAccount={businessAccount} />
          </TabsContent>

          <TabsContent value="bookings">
            <OrderHistoryView userEmail={currentUser?.email} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}