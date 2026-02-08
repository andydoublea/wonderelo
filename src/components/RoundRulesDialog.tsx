import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Info } from 'lucide-react';

export interface RoundRule {
  headline: string;
  text: string;
}

interface RoundRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: RoundRule[];
}

export function RoundRulesDialog({ open, onOpenChange, rules }: RoundRulesDialogProps) {
  const defaultRules: RoundRule[] = [
    {
      headline: 'Initiate deep talks',
      text: 'Skip the weather talk — meaningful relationships emerge when you share views, values, and stories. Use our ice breakers if you want to.'
    },
    {
      headline: 'End round on time',
      text: 'It prevents you from getting stuck in one conversation and helps you reach your next round without delay.'
    },
    {
      headline: 'Do not ask for contacts',
      text: 'After the round, you\'ll be asked if you want to exchange contacts. Sharing happens 30 minutes later, only if both parties agree.'
    }
  ];

  let displayRules: RoundRule[] = defaultRules;
  
  if (rules) {
    if (Array.isArray(rules)) {
      if (rules.length > 0) {
        const validRules = rules.filter(
          (rule: any) => rule && typeof rule === 'object' && rule.headline
        );
        if (validRules.length > 0) {
          displayRules = validRules as RoundRule[];
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Round rules
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {displayRules.map((rule, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">{rule.headline}</p>
                {rule.text && <p className="text-sm text-muted-foreground">{rule.text}</p>}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
