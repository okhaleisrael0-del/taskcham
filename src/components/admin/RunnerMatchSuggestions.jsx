import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Award, TrendingUp, Clock, CheckCircle, Star, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function RunnerMatchSuggestions({ booking, onAssign }) {
  const queryClient = useQueryClient();
  const [matchData, setMatchData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedRunner, setSelectedRunner] = useState(null);

  const findMatchesMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      const { data } = await base44.functions.invoke('aiRunnerMatch', {
        booking_id: booking.id
      });
      return data;
    },
    onSuccess: (data) => {
      setMatchData(data);
      setShowDialog(true);
      setIsLoading(false);
    },
    onError: () => {
      toast.error('Kunde inte hitta matchningar');
      setIsLoading(false);
    }
  });

  const assignMutation = useMutation({
    mutationFn: async (driverId) => {
      const match = matchData.matches.find(m => m.driver_id === driverId);
      
      await base44.entities.Booking.update(booking.id, {
        assigned_driver_id: driverId,
        assigned_driver_name: match.driver_name,
        assigned_driver_phone: match.driver_phone,
        status: 'assigned'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-bookings']);
      alert('Runner tilldelad!');
      setShowDialog(false);
      if (onAssign) onAssign();
    }
  });

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-amber-600 bg-amber-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getAvailabilityColor = (availability) => {
    if (availability === 'available') return 'bg-green-100 text-green-800';
    if (availability === 'busy') return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Button
        onClick={() => findMatchesMutation.mutate()}
        disabled={isLoading}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            Söker matchningar...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            🤖 Smart Match
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Smart Matchning - #{booking.booking_number}
            </DialogTitle>
          </DialogHeader>

          {matchData && (
            <div className="space-y-4">
              {/* Best Match Banner */}
              {matchData.matches && matchData.matches.length > 0 && matchData.matches[0].score >= 60 && (
                <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge className="bg-purple-600 text-white mb-2">
                          ⭐ Bästa Match
                        </Badge>
                        <h3 className="text-2xl font-bold text-gray-900">{matchData.matches[0].driver_name}</h3>
                        <p className="text-sm text-gray-600">{matchData.matches[0].driver_phone}</p>
                      </div>
                      <div className={`text-5xl font-black rounded-2xl px-6 py-3 ${getScoreColor(matchData.matches[0].score)}`}>
                        {matchData.matches[0].score}%
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="font-bold text-lg text-gray-900">{matchData.matches[0].stats.completed}</p>
                        <p className="text-xs text-gray-500 mt-1">Uppdrag</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-600">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-bold text-lg">{matchData.matches[0].stats.avg_rating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Betyg</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="font-bold text-lg text-green-600">{matchData.matches[0].stats.completion_rate.toFixed(0)}%</p>
                        <p className="text-xs text-gray-500 mt-1">Slutförd</p>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div className="bg-white rounded-xl p-4 mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-3">VARFÖR DENNA RUNNER:</p>
                      <div className="flex flex-wrap gap-2">
                        {matchData.matches[0].reasons.map((reason, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base font-bold"
                      onClick={() => assignMutation.mutate(matchData.matches[0].driver_id)}
                      disabled={assignMutation.isPending}
                    >
                      {assignMutation.isPending ? 'Tilldelar...' : '✨ Tilldela Bästa Match'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* All Matches */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Alla Matchningar ({matchData.matches?.length || 0})
                </h3>
                <div className="space-y-3">
                  {matchData.matches?.map((match, idx) => (
                    <Card 
                      key={match.driver_id}
                      className={idx === 0 ? 'border-2 border-purple-200' : ''}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-gray-900">{match.driver_name}</span>
                              {idx === 0 && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  #1
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                {match.stats.completed} uppdrag
                              </span>
                              {match.stats.avg_rating > 0 && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {match.stats.avg_rating.toFixed(1)}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                              {match.reasons.slice(0, 3).map((reason, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className={`text-3xl font-black ${getScoreColor(match.score).split(' ')[0]}`}>
                                {match.score}%
                              </div>
                              <p className="text-xs text-gray-500">match</p>
                            </div>
                            <Button
                              size="sm"
                              variant={idx === 0 ? "default" : "outline"}
                              onClick={() => assignMutation.mutate(match.driver_id)}
                              disabled={assignMutation.isPending}
                            >
                              Tilldela
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {(!matchData.matches || matchData.matches.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Inga tillgängliga runners för tillfället</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}