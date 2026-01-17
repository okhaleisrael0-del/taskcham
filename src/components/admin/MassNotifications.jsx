import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Users, CheckCircle } from 'lucide-react';

export default function MassNotifications() {
  const [message, setMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState('all'); // all, available, busy
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: drivers = [] } = useQuery({
    queryKey: ['all-drivers'],
    queryFn: () => base44.entities.Driver.filter({ status: 'approved' })
  });

  const getTargetedDrivers = () => {
    if (targetGroup === 'all') return drivers;
    if (targetGroup === 'available') return drivers.filter(d => d.availability === 'available');
    if (targetGroup === 'busy') return drivers.filter(d => d.availability === 'busy');
    return drivers;
  };

  const targetedDrivers = getTargetedDrivers();

  const handleSend = async () => {
    if (!message.trim() || targetedDrivers.length === 0) return;

    setSending(true);
    try {
      // Send to all targeted drivers
      for (const driver of targetedDrivers) {
        if (sendEmail) {
          await base44.integrations.Core.SendEmail({
            to: driver.email,
            subject: 'Meddelande från TaskCham Admin',
            body: `
Hej ${driver.name}!

${message}

Vänliga hälsningar,
TaskCham Admin
            `
          });
        }

        if (sendSMS && driver.phone) {
          try {
            await base44.functions.invoke('sendSMS', {
              to: driver.phone,
              message: `TaskCham: ${message}`
            });
          } catch (smsError) {
            console.log(`SMS skipped for ${driver.name} (service not configured)`);
          }
        }
      }

      setMessage('');
      alert(`✓ Meddelande skickat till ${targetedDrivers.length} runners!`);
    } catch (error) {
      console.error('Failed to send mass notification:', error);
      alert('⚠️ Något gick fel. Försök igen.');
    }
    setSending(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Massnotiser till Runners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Group */}
          <div>
            <Label className="mb-3 block">Målgrupp</Label>
            <div className="space-y-2">
              <button
                onClick={() => setTargetGroup('all')}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  targetGroup === 'all'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Alla Runners</span>
                  <Badge>{drivers.length} st</Badge>
                </div>
              </button>

              <button
                onClick={() => setTargetGroup('available')}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  targetGroup === 'available'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Tillgängliga Runners</span>
                  <Badge className="bg-green-100 text-green-800">
                    {drivers.filter(d => d.availability === 'available').length} st
                  </Badge>
                </div>
              </button>

              <button
                onClick={() => setTargetGroup('busy')}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  targetGroup === 'busy'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Upptagna Runners</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {drivers.filter(d => d.availability === 'busy').length} st
                  </Badge>
                </div>
              </button>
            </div>
          </div>

          {/* Message */}
          <div>
            <Label>Meddelande</Label>
            <Textarea
              placeholder="T.ex. Nya högprioriterade uppdrag tillgängliga! Logga in för att se dem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length} tecken
            </p>
          </div>

          {/* Send Options */}
          <div className="space-y-3">
            <Label>Skicka via</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                />
                <span className="text-sm">📧 E-post</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={sendSMS}
                  onCheckedChange={setSendSMS}
                />
                <span className="text-sm">📱 SMS</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Förhandsvisning:</p>
            <div className="bg-white rounded p-3 border">
              <p className="text-sm whitespace-pre-wrap">{message || 'Ditt meddelande här...'}</p>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || targetedDrivers.length === 0 || sending || (!sendEmail && !sendSMS)}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Skickar...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Skicka till {targetedDrivers.length} runners
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Notifications (could be extended with a log entity) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Tips för effektiva meddelanden</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>✓ Håll meddelandet kort och tydligt</p>
          <p>✓ Inkludera en tydlig uppmaning till handling</p>
          <p>✓ Använd SMS för brådskande meddelanden</p>
          <p>✓ Använd E-post för längre instruktioner</p>
        </CardContent>
      </Card>
    </div>
  );
}