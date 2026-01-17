import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const QUICK_REPLIES = [
  {
    category: 'Status Updates',
    messages: [
      { text: 'Vi kollar på din förfrågan nu.', icon: '🔍' },
      { text: 'Din runner är på väg.', icon: '🚗' },
      { text: 'Vi har anlänt till butiken.', icon: '🛒' },
      { text: 'Din vara har hämtats.', icon: '📦' },
      { text: 'Vi är på väg till dig.', icon: '🚚' },
      { text: 'Ditt uppdrag är slutfört.', icon: '✅' }
    ]
  },
  {
    category: 'Price & Confirmation',
    messages: [
      { text: 'Vänligen bekräfta detta pris så vi kan starta.', icon: '💰' },
      { text: 'Priset är godkänt. Vi startar nu!', icon: '✔️' },
      { text: 'Vi behöver lite mer information. Kan du skicka en bild?', icon: '📸' }
    ]
  },
  {
    category: 'Support',
    messages: [
      { text: 'Tack för att du vände dig till oss. Hur kan jag hjälpa dig?', icon: '👋' },
      { text: 'Förlåt för förseningen. Vi löser det så snabbt som möjligt.', icon: '⚠️' },
      { text: 'Allt klart! Kontakta oss om du behöver mer hjälp.', icon: '👍' },
      { text: 'Vi återkommer inom 10 minuter med uppdatering.', icon: '⏰' }
    ]
  }
];

export default function QuickReplies({ bookingId, bookingNumber, onMessageSent }) {
  const [sending, setSending] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState('Status Updates');

  const sendQuickReply = async (messageText) => {
    setSending(true);
    try {
      await base44.entities.ChatMessage.create({
        booking_id: bookingId,
        booking_number: bookingNumber,
        sender_type: 'admin',
        sender_name: 'Admin',
        message: messageText
      });
      
      toast.success('Meddelande skickat!');
      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Kunde inte skicka meddelande');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Snabbsvar</h3>
      </div>

      <div className="space-y-3">
        {QUICK_REPLIES.map((category) => (
          <div key={category.category}>
            <button
              onClick={() => setExpandedCategory(
                expandedCategory === category.category ? null : category.category
              )}
              className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors font-medium text-sm text-gray-700"
            >
              {category.category} ({category.messages.length})
            </button>
            
            {expandedCategory === category.category && (
              <div className="mt-2 space-y-2 pl-2">
                {category.messages.map((msg, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendQuickReply(msg.text)}
                    disabled={sending}
                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{msg.icon}</span>
                      <span className="text-sm text-gray-700 flex-1">{msg.text}</span>
                      <Send className="h-4 w-4 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          Klicka för att skicka meddelandet direkt till kunden
        </p>
      </div>
    </div>
  );
}