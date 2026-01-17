import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tag, Check, X, Loader2 } from 'lucide-react';

export default function PromoCodeInput({ bookingTotal, userEmail, onApply }) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [error, setError] = useState('');

  const validateCode = async () => {
    if (!code.trim()) return;
    
    setIsValidating(true);
    setError('');

    try {
      const { data } = await base44.functions.invoke('applyPromoCode', {
        code: code.toUpperCase(),
        booking_total: bookingTotal,
        user_email: userEmail
      });

      if (data.valid) {
        setAppliedPromo(data);
        onApply(data);
      } else {
        setError(data.error);
        setAppliedPromo(null);
      }
    } catch (err) {
      setError('Kunde inte validera koden');
      setAppliedPromo(null);
    } finally {
      setIsValidating(false);
    }
  };

  const removeCode = () => {
    setCode('');
    setAppliedPromo(null);
    setError('');
    onApply(null);
  };

  if (appliedPromo) {
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-900">Rabattkod applicerad!</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={removeCode}
            className="h-6 w-6 p-0 text-green-700 hover:text-green-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div>
            <Badge className="bg-green-600 text-white mb-1">{appliedPromo.code}</Badge>
            <p className="text-green-700">{appliedPromo.description}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-green-600">Rabatt</p>
            <p className="text-xl font-bold text-green-600">-{appliedPromo.discount_amount} kr</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="Rabattkod (t.ex. WELCOME50)"
            className="pl-10 h-12"
            disabled={isValidating}
          />
        </div>
        <Button
          onClick={validateCode}
          disabled={!code.trim() || isValidating}
          variant="outline"
          className="h-12"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Använd'
          )}
        </Button>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}