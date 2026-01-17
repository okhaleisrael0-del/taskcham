import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, AlertTriangle, CheckCircle, Users, Truck, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function MassMessaging() {
  const [recipientType, setRecipientType] = useState('all_drivers');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [result, setResult] = useState(null);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('sendMassMessage', {
        recipient_type: recipientType,
        subject,
        message,
        urgent
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Meddelande skickat till ${data.sent_count} mottagare`);
      // Reset form
      setSubject('');
      setMessage('');
      setUrgent(false);
    },
    onError: (error) => {
      toast.error('Kunde inte skicka meddelanden');
      console.error(error);
    }
  });

  const recipientOptions = [
    { value: 'all_drivers', label: 'Alla Förare', icon: Truck, description: 'Alla godkända förare' },
    { value: 'active_drivers', label: 'Aktiva Förare', icon: Users, description: 'Endast förare med aktiv dashboard' },
    { value: 'all_customers', label: 'Alla Kunder', icon: Users, description: 'Alla som gjort en bokning' },
    { value: 'admins', label: 'Administratörer', icon: Mail, description: 'Alla admin-användare' }
  ];

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Ämne och meddelande måste fyllas i');
      return;
    }
    sendMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Massmeddelanden</CardTitle>
          <CardDescription>
            Skicka meddelanden via e-post till förare, kunder eller administratörer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label>Mottagare</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recipientOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {recipientOptions.find(o => o.value === recipientType)?.description}
            </p>
          </div>

          {/* Urgent Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <Label htmlFor="urgent" className="cursor-pointer">Brådskande Meddelande</Label>
                <p className="text-sm text-gray-500">Markeras med varningssymbol i e-posten</p>
              </div>
            </div>
            <Switch
              id="urgent"
              checked={urgent}
              onCheckedChange={setUrgent}
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Ämne</Label>
            <Input
              id="subject"
              placeholder="T.ex. Viktig information om plattformen"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Meddelande</Label>
            <Textarea
              id="message"
              placeholder="Skriv ditt meddelande här..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
            />
            <p className="text-xs text-gray-500">
              Meddelandet skickas som e-post med TaskCham-design
            </p>
          </div>

          {/* Warning */}
          {recipientType === 'all_customers' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Detta skickar till alla kunder som någonsin gjort en bokning. Var säker på att meddelandet är relevant för alla.
              </AlertDescription>
            </Alert>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || !subject.trim() || !message.trim()}
            className="w-full bg-[#4A90A4] hover:bg-[#3d7a8c]"
            size="lg"
          >
            {sendMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Skickar...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Skicka Meddelanden
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Meddelande skickat!</strong>
                <div className="mt-2 space-y-1 text-sm">
                  <p>✓ Skickade: {result.sent_count}</p>
                  {result.failed_count > 0 && (
                    <p className="text-red-600">✗ Misslyckades: {result.failed_count}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Snabbmallar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                setSubject('Planerat Underhåll - TaskCham');
                setMessage('Hej,\n\nVi vill informera om planerat underhåll av TaskCham-plattformen:\n\nDatum: [FYLL I DATUM]\nTid: [FYLL I TID]\nBeräknad varaktighet: [FYLL I]\n\nUnder denna tid kommer plattformen vara otillgänglig. Vi ber om ursäkt för eventuella besvär.\n\nMed vänliga hälsningar,\nTaskCham-teamet');
              }}
            >
              <div>
                <p className="font-medium">Planerat Underhåll</p>
                <p className="text-xs text-gray-500">Informera om kommande underhåll</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                setSubject('Nya funktioner i TaskCham!');
                setMessage('Hej,\n\nVi är glada att kunna berätta om nya funktioner som nu är tillgängliga:\n\n• [FUNKTION 1]\n• [FUNKTION 2]\n• [FUNKTION 3]\n\nLogga in för att prova de nya funktionerna!\n\nMed vänliga hälsningar,\nTaskCham-teamet');
                setUrgent(false);
              }}
            >
              <div>
                <p className="font-medium">Nya Funktioner</p>
                <p className="text-xs text-gray-500">Annonsera nya features</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                setSubject('⚠️ Viktig Information - Läs Omedelbart');
                setMessage('Hej,\n\nVi behöver informera dig om en viktig uppdatering:\n\n[FYLL I VIKTIG INFORMATION]\n\nVänligen läs detta meddelande noga.\n\nMed vänliga hälsningar,\nTaskCham-teamet');
                setUrgent(true);
              }}
            >
              <div>
                <p className="font-medium text-orange-600">Brådskande Meddelande</p>
                <p className="text-xs text-gray-500">För kritiska uppdateringar</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}