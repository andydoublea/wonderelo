import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Calendar, ArrowRight, Star } from 'lucide-react';

export function CtaSection() {
  const navigate = useNavigate();

  return (
    <section className="py-10 md:py-20 px-6">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="mb-4"><span style={{ color: '#5C2277' }}>Add value to your event with networking rounds!</span></h2>
        <p className="mb-8 text-muted-foreground">
          Be the event people remember for the connections they made.
        </p>

        <div className="flex justify-center">
          <Button size="lg" onClick={() => navigate('/signup')}>
            <Calendar className="mr-2 h-5 w-5" />
            Let's get unforgettable!
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm">Five minute set up</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm">For events of every size</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm">No worry pricing</span>
          </div>
        </div>
      </div>
    </section>
  );
}
