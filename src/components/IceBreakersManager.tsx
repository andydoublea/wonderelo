import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Loader2, MessageSquare, Shuffle } from 'lucide-react';
import { errorLog } from '../utils/debug';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface IceBreakersManagerProps {
  iceBreakers: IceBreaker[];
  onChange: (iceBreakers: IceBreaker[]) => void;
}

export function IceBreakersManager({ iceBreakers, onChange }: IceBreakersManagerProps) {
  const [availableIceBreakers, setAvailableIceBreakers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAvailableIceBreakers();
  }, []);

  const fetchAvailableIceBreakers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/ice-breakers`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableIceBreakers(data.iceBreakers || []);
      } else {
        errorLog('Failed to fetch ice breakers, status:', response.status);
      }
    } catch (error) {
      errorLog('Error fetching ice breakers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRandomIceBreaker = (excludeQuestions: string[]): string => {
    if (availableIceBreakers.length === 0) {
      return '';
    }
    
    const available = availableIceBreakers.filter(
      (q) => !excludeQuestions.includes(q)
    );
    
    if (available.length === 0) {
      // If all questions are already used, pick from all
      const randomIndex = Math.floor(Math.random() * availableIceBreakers.length);
      return availableIceBreakers[randomIndex];
    }
    
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  };

  const shuffleIceBreaker = (index: number) => {
    // Get questions from other ice breakers (not the current one)
    const otherQuestions = iceBreakers
      .filter((_, i) => i !== index)
      .map(ib => ib.question);
    
    const newQuestion = getRandomIceBreaker(otherQuestions);
    
    // Only update if we got a valid question
    if (newQuestion && newQuestion.trim() !== '') {
      const updated = [...iceBreakers];
      updated[index] = { ...updated[index], question: newQuestion };
      onChange(updated);
    }
  };

  const updateIceBreaker = (index: number, question: string) => {
    const updated = [...iceBreakers];
    updated[index] = { ...updated[index], question };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Strong connections happen when people talk about deep topics — their views, values, and stories. Help them skip the weather talk with our ice breakers or add your own.
      </p>

      <div className="space-y-3">
        {iceBreakers.map((iceBreaker, index) => (
          <div key={iceBreaker.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <Input
              placeholder="e.g. What's a skill you'd like to learn?"
              value={iceBreaker.question}
              onChange={(e) => updateIceBreaker(index, e.target.value)}
              className="flex-1"
              maxLength={60}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => shuffleIceBreaker(index)}
              className="h-8 w-8 p-0 shrink-0"
              title="Get random ice breaker"
              disabled={isLoading || availableIceBreakers.length === 0}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}