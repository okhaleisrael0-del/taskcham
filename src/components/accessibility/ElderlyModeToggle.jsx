import React, { useState, useEffect, createContext, useContext } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Heart, ZoomIn } from 'lucide-react';

const ElderlyModeContext = createContext();

export function ElderlyModeProvider({ children }) {
  const [elderlyMode, setElderlyMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('taskcham_elderly_mode');
    if (saved === 'true') {
      setElderlyMode(true);
      document.documentElement.classList.add('elderly-mode');
    }
  }, []);

  const toggleElderlyMode = (enabled) => {
    setElderlyMode(enabled);
    localStorage.setItem('taskcham_elderly_mode', enabled);
    
    if (enabled) {
      document.documentElement.classList.add('elderly-mode');
    } else {
      document.documentElement.classList.remove('elderly-mode');
    }
  };

  return (
    <ElderlyModeContext.Provider value={{ elderlyMode, toggleElderlyMode }}>
      {children}
    </ElderlyModeContext.Provider>
  );
}

export function useElderlyMode() {
  const context = useContext(ElderlyModeContext);
  if (!context) {
    return { elderlyMode: false, toggleElderlyMode: () => {} };
  }
  return context;
}

export function ElderlyModeToggle() {
  const { elderlyMode, toggleElderlyMode } = useElderlyMode();

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Heart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <Label htmlFor="elderly-mode" className="font-semibold cursor-pointer">
                Äldrevänligt Läge
              </Label>
              <p className="text-xs text-gray-600">Större text och förenklad design</p>
            </div>
          </div>
          <Switch
            id="elderly-mode"
            checked={elderlyMode}
            onCheckedChange={toggleElderlyMode}
          />
        </div>
      </div>
    </Card>
  );
}

// Add these CSS rules to globals.css:
/*
.elderly-mode {
  font-size: 18px;
}

.elderly-mode h1 { font-size: 3rem !important; }
.elderly-mode h2 { font-size: 2.25rem !important; }
.elderly-mode h3 { font-size: 1.875rem !important; }
.elderly-mode p, .elderly-mode span, .elderly-mode label { font-size: 1.125rem !important; }
.elderly-mode button { min-height: 3rem !important; font-size: 1.125rem !important; }
.elderly-mode input, .elderly-mode textarea, .elderly-mode select { 
  font-size: 1.125rem !important; 
  min-height: 3rem !important;
}
*/