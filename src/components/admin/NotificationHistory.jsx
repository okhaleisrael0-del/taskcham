import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Users, Mail, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function NotificationHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [targetFilter, setTargetFilter] = useState('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notification-logs'],
    queryFn: () => base44.entities.MassNotificationLog.list('-created_date', 200),
  });

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesSearch = 
        notification.message_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.sent_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.recipient_names?.some(name => 
          name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesTarget = 
        targetFilter === 'all' || 
        notification.target_group === targetFilter;

      return matchesSearch && matchesTarget;
    });
  }, [notifications, searchTerm, targetFilter]);

  const getTargetBadge = (target) => {
    const config = {
      all: { label: 'Alla runners', color: 'bg-blue-100 text-blue-700' },
      available: { label: 'Tillgängliga', color: 'bg-green-100 text-green-700' },
      busy: { label: 'Upptagna', color: 'bg-yellow-100 text-yellow-700' },
    };
    const c = config[target] || { label: target, color: 'bg-gray-100' };
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">Laddar notiseringshistorik...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Sök i meddelanden, avsändare eller mottagare..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        
        <Select value={targetFilter} onValueChange={setTargetFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrera målgrupp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla målgrupper</SelectItem>
            <SelectItem value="all">Alla runners</SelectItem>
            <SelectItem value="available">Tillgängliga</SelectItem>
            <SelectItem value="busy">Upptagna</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-gray-600">
        Visar {filteredNotifications.length} av {notifications.length} notifieringar
      </div>

      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <Card key={notification.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">Massnotis skickad</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getTargetBadge(notification.target_group)}
                      {notification.delivery_methods?.map(method => (
                        <Badge key={method} variant="outline" className="text-xs">
                          {method === 'email' ? (
                            <>
                              <Mail className="h-3 w-3 mr-1" />
                              E-post
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-3 w-3 mr-1" />
                              SMS
                            </>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {notification.success ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Skickad</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">Fel</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Meddelande:</div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                  {notification.message_content}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Skickad</div>
                    <div className="text-sm font-medium">
                      {format(new Date(notification.created_date), 'PPP HH:mm', { locale: sv })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Mottagare</div>
                    <div className="text-sm font-medium">
                      {notification.recipient_count || 0} runners
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Skickad av</div>
                    <div className="text-sm font-medium">{notification.sent_by}</div>
                    <div className="text-xs text-gray-600">{notification.sent_by_email}</div>
                  </div>
                </div>
              </div>

              {notification.recipient_names && notification.recipient_names.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-xs text-gray-500 mb-2">Mottagna av:</div>
                  <div className="flex flex-wrap gap-2">
                    {notification.recipient_names.slice(0, 10).map((name, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                    {notification.recipient_names.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{notification.recipient_names.length - 10} fler
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {notification.errors && notification.errors.length > 0 && (
                <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                  <div className="font-medium mb-1">Fel:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {notification.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredNotifications.length === 0 && (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              Inga notifieringar hittades med de valda filtren.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}