import React from 'react';
import { Button } from "@/components/ui/button";
import { CreditCard } from 'lucide-react';

export default function PaymentButton({ bookingData, onPaymentComplete }) {
  const handlePayment = () => {
    // Check if running in iframe (preview mode)
    if (window.self !== window.top) {
      alert('Betalning fungerar endast i publicerade appar. Publicera din app för att testa betalningar.');
      return;
    }

    // Convert to öre (SEK cents) and open Stripe Payment Link with prefilled amount
    const amountInOre = Math.round(bookingData.total_price * 100);
    const paymentUrl = `https://buy.stripe.com/bJebJ10BObayfuE3Ay6Na00?prefilled_amount=${amountInOre}`;
    window.open(paymentUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePayment}
        className="w-full bg-[#4A90A4] hover:bg-[#3d7a8c] h-14 text-lg rounded-full"
        size="lg"
      >
        <CreditCard className="h-5 w-5 mr-2" />
        Betala {bookingData.total_price} SEK
      </Button>

      <p className="text-xs text-center text-gray-500">
        Säker betalning via Stripe • Kort, Apple Pay, Google Pay
      </p>
    </div>
  );
}