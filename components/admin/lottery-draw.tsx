'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { runLottery } from '@/app/actions/events';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

interface LotteryResult {
  selected: { name: string | null; email: string | null; score: number }[];
  rejected: { name: string | null; email: string | null; score: number }[];
}

export function LotteryDraw({ eventId, entrantCount }: { eventId: string; entrantCount: number }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<LotteryResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDraw = () => {
    startTransition(async () => {
      try {
        const res = await runLottery(eventId);
        setResult(res);
        setShowConfirm(false);
        toast.success('Lottery completed!');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Lottery failed');
        setShowConfirm(false);
      }
    });
  };

  return (
    <>
      <Button
        onClick={() => setShowConfirm(true)}
        disabled={entrantCount === 0}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Run Lottery ({entrantCount} entrants)
      </Button>

      {/* Confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Lottery Draw</DialogTitle>
            <DialogDescription>
              This will select winners from {entrantCount} entrants using weighted random selection.
              Priority scores: base 1.0, +0.5 per past loss, -1.0 per past no-show.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleDraw} disabled={isPending}>
              {isPending ? 'Drawing...' : 'Confirm Draw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results dialog */}
      <Dialog open={!!result} onOpenChange={() => setResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lottery Results</DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2">
                  Selected ({result.selected.length})
                </h4>
                {result.selected.map((s, i) => (
                  <div key={i} className="flex justify-between py-1 text-sm">
                    <span>{s.name || s.email}</span>
                    <span className="text-muted-foreground">Score: {s.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-2">
                  Not Selected ({result.rejected.length})
                </h4>
                {result.rejected.map((s, i) => (
                  <div key={i} className="flex justify-between py-1 text-sm">
                    <span>{s.name || s.email}</span>
                    <span className="text-muted-foreground">Score: {s.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setResult(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
