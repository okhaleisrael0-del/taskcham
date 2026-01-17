import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Eye, EyeOff, Flag, MessageCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewModeration() {
  const queryClient = useQueryClient();
  const [moderateDialog, setModerateDialog] = useState({ open: false, review: null });
  const [moderationNote, setModerationNote] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: allReviews = [] } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: () => base44.entities.Rating.list('-created_date', 200)
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['review-responses'],
    queryFn: () => base44.entities.ReviewResponse.list('-created_date')
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Rating.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-reviews']);
      setModerateDialog({ open: false, review: null });
      setModerationNote('');
    }
  });

  const flaggedReviews = allReviews.filter(r => r.flagged);
  const hiddenReviews = allReviews.filter(r => !r.is_visible);
  const visibleReviews = allReviews.filter(r => r.is_visible && !r.flagged);

  const handleModerate = (review, action) => {
    const updates = {
      moderated_by: currentUser?.email,
      moderation_note: moderationNote
    };

    if (action === 'hide') {
      updates.is_visible = false;
    } else if (action === 'show') {
      updates.is_visible = true;
      updates.flagged = false;
    } else if (action === 'flag') {
      updates.flagged = true;
    } else if (action === 'unflag') {
      updates.flagged = false;
    }

    updateReviewMutation.mutate({ id: review.id, data: updates });
  };

  const getResponseForReview = (reviewId) => {
    return responses.find(r => r.review_id === reviewId);
  };

  const ReviewCard = ({ review, showActions = true }) => {
    const response = getResponseForReview(review.id);

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline">#{review.booking_number}</Badge>
                <span className="text-sm text-gray-500">
                  {format(new Date(review.created_date), 'dd MMM yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{review.driver_name}</span>
              </div>
              <p className="text-sm text-gray-600">
                av {review.customer_name} ({review.customer_email})
              </p>
            </div>
            <div className="text-right">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {review.would_recommend && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    Rekommenderar
                  </Badge>
                )}
                {!review.is_visible && (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Dold
                  </Badge>
                )}
                {review.flagged && (
                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                    <Flag className="h-3 w-3 mr-1" />
                    Flaggad
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {review.feedback && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">{review.feedback}</p>
            </div>
          )}

          {review.categories && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {Object.entries(review.categories).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-gray-500 capitalize block text-xs mb-1">
                    {key.replace('_', ' ')}
                  </span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < value
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {response && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Svar från förare</span>
              </div>
              <p className="text-sm text-blue-800">{response.response_text}</p>
            </div>
          )}

          {review.moderation_note && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-700">
                <strong>Admin-notering:</strong> {review.moderation_note}
              </p>
            </div>
          )}

          {showActions && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setModerateDialog({ open: true, review });
                  setModerationNote(review.moderation_note || '');
                }}
              >
                Moderera
              </Button>
              {review.is_visible ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModerate(review, 'hide')}
                >
                  <EyeOff className="h-4 w-4 mr-1" />
                  Dölj
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModerate(review, 'show')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Visa
                </Button>
              )}
              {!review.flagged ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModerate(review, 'flag')}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Flagga
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModerate(review, 'unflag')}
                >
                  Avflagga
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Recensionshantering</h2>
          <p className="text-gray-600">Moderera och hantera kundrecensioner</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Totala Recensioner</p>
                <p className="text-3xl font-bold text-gray-900">{allReviews.length}</p>
              </div>
              <Star className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Flaggade</p>
                <p className="text-3xl font-bold text-orange-600">{flaggedReviews.length}</p>
              </div>
              <Flag className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Genomsnitt</p>
                <p className="text-3xl font-bold text-green-600">
                  {allReviews.length > 0 
                    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
                    : '0.0'}
                </p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            Alla ({visibleReviews.length})
          </TabsTrigger>
          <TabsTrigger value="flagged">
            Flaggade ({flaggedReviews.length})
          </TabsTrigger>
          <TabsTrigger value="hidden">
            Dolda ({hiddenReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {visibleReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {visibleReviews.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                Inga recensioner att visa
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4 mt-6">
          {flaggedReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {flaggedReviews.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                Inga flaggade recensioner
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hidden" className="space-y-4 mt-6">
          {hiddenReviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {hiddenReviews.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <EyeOff className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                Inga dolda recensioner
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={moderateDialog.open} onOpenChange={(open) => setModerateDialog({ open, review: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderera Recension</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {moderateDialog.review && (
              <>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Recension av {moderateDialog.review.driver_name}</p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < moderateDialog.review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {moderateDialog.review.feedback && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{moderateDialog.review.feedback}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Admin-notering</label>
                  <Textarea
                    value={moderationNote}
                    onChange={(e) => setModerationNote(e.target.value)}
                    placeholder="Lägg till intern notering om denna recension..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setModerateDialog({ open: false, review: null })}
            >
              Avbryt
            </Button>
            {moderateDialog.review?.is_visible ? (
              <Button
                variant="destructive"
                onClick={() => handleModerate(moderateDialog.review, 'hide')}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Dölj Recension
              </Button>
            ) : (
              <Button
                className="bg-green-600"
                onClick={() => handleModerate(moderateDialog.review, 'show')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visa Recension
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}