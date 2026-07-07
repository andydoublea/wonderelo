import { useNavigate } from 'react-router';
import { PublicNav } from './redesign/PublicNav';
import { PublicFooter } from './redesign/PublicFooter';
import { AuthorSignature } from './AuthorSignature';

interface OurStoryPageProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function OurStoryPage({ onGetStarted, onSignIn }: OurStoryPageProps) {
  const navigate = useNavigate();
  const handleGetStarted = onGetStarted || (() => navigate('/signup'));
  const handleSignIn = onSignIn || (() => navigate('/signin'));

  return (
    <div className="wonderelo w-public os-page">
      <PublicNav onGetStarted={handleGetStarted} onSignIn={handleSignIn} />

      <main>

        {/* ───────── Hero ───────── */}
        <section className="st-hero">
          <span className="deco-1"></span>
          <span className="deco-2"></span>
          <span className="deco-3"></span>
          <div className="st-hero-grid">
            <div>
              <span className="st-stamp"><span className="w-diamond"></span> A note from the founder</span>
              <h1 className="w-display">It started at <span className="w-italic">my 30th</span><br/>birthday party</h1>
              <p className="w-lede" style={{ maxWidth: '520px' }}>Seventy-five guests, friend groups that didn't know each other, and me — wanting everyone to leave as friends. So I tried a small experiment with a TV above the bar.</p>
              <div className="st-meta">
                <div className="item">
                  <div className="l">Year</div>
                  <div className="v">2016 <em>· Slovakia, Europe</em></div>
                </div>
                <div className="item">
                  <div className="l">Guests</div>
                  <div className="v">75 <em>· friends &amp; family</em></div>
                </div>
                <div className="item">
                  <div className="l">Result</div>
                  <div className="v">A bet on <em>randomness</em></div>
                </div>
              </div>
            </div>
            <div className="st-photo" style={{ '--story-pos-x': '50%', '--story-pos-y': '33%', '--story-scale': 1 } as React.CSSProperties}>
              <img className="st-img" src="/Andy-birthday-30-Wonderelo.png" alt="Andy's 30th birthday party — the night Wonderelo began"/>
              <div className="st-annot">
                <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid meet" fill="none">
                  <path d="M66 63 C 61 55, 56 47, 50.2 42.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M50.2 42.5 L 55.3 44.2 M50.2 42.5 L 49.6 48" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="lbl">That&rsquo;s me!</span>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Pull-quote ───────── */}
        <section className="st-pull">
          <div className="deco-italic">wonder</div>
          <blockquote>
            Nobody remembers the <span className="accent">event.</span><br/>
            They remember the <span className="accent">people</span> they met there.
          </blockquote>
        </section>

        {/* ───────── Chapters ───────── */}
        <section className="st-chapters">

          <article className="st-chapter is-first">
            <div className="ch-num">01</div>
            <span className="ch-label">The birthday experiment</span>
            <h2>A TV above the bar, two names at a <span className="w-italic">time</span></h2>
            <p>
              I had a problem. My birthday was coming up, and the guest list included people from very different parts of my life — family, university friends, colleagues from the printing studio, and a bunch of international contacts from years of traveling. I already knew how it would play out: everyone sticks with who they came with, a few polite hellos, and that's it.
            </p>
            <p>
              So I had an idea. <strong>What if a TV screen above the bar displayed random pairings every few minutes?</strong> Two names at a time, and each pair had to meet at the bar for a shot... and a talk that could open the door to new friendships.
            </p>
            <p>
              My friend Martin Miko, a developer, programmed it in an evening. The guest list went in, the TV started cycling, and we waited to see what would happen.
            </p>
          </article>

          <article className="st-chapter">
            <div className="ch-num">02</div>
            <span className="ch-label">What happened next</span>
            <h2>A few rounds in, unexpected connections <span className="w-italic">emerged</span></h2>
            <p>
              People who would never have approached each other were suddenly standing at the bar together, laughing, sharing stories, discovering unexpected connections. The university mathematician found out that the graphic designer shared his obsession with board games. Two people who'd lived in the same building for three years — but never spoken — realized they had a mutual friend in another country.
            </p>
            <p>
              The energy in the room was electric. Guests kept checking the screen, waiting for their name to appear, excited about who they'd be paired with next. <strong>It wasn't just networking — it was fun.</strong>
            </p>
          </article>

          <article className="st-chapter">
            <div className="ch-num">03</div>
            <span className="ch-label">Eight years later</span>
            <h2>Everywhere I went, people needed the same <span className="w-italic">thing</span></h2>
            <p>
              The party ended. Life went on. I built a successful printing and branding studio. But the memory of that evening stayed with me. Every time I attended a conference, a meetup, or a corporate event and watched people awkwardly hover near the coffee station, the same thought came back: <em>my birthday socializing app would be perfect for this event!</em>
            </p>
            <p>
              Then, in 2024, the pieces fell into place. I sold the printing studio and had the space to think about what to build next. The world had changed — phones were in every pocket, QR codes were second nature, and after covid pandemic people were hungrier than ever for real, face-to-face connection.
            </p>
            <p>
              The birthday-party hack was ready to become a real product.
            </p>
          </article>

          <article className="st-chapter">
            <div className="ch-num">04</div>
            <span className="ch-label">Wonderelo today</span>
            <h2>I rebuilt the party trick for the <span className="w-italic">world</span></h2>
            <p>
              What started as a TV above a bar with random names is now a platform any event organizer can use in minutes. No apps to download, no profiles to fill out, no AI trying to guess who you should meet. Just the same serendipity that made seventy-five guests fall in love with each other at a birthday party — packaged so a thousand-person conference can have it too.
            </p>
            <p>
              But the birthday hack couldn't simply be copied. Before it could work for strangers — and for organizers I'd never met — I had to solve two problems that only worked at my party because the party was <em>mine.</em>
            </p>
            <p>
              <strong>First: I knew every name on my guest list. Most organizers don't.</strong> So instead of the organizer entering everyone by hand, we let participants register themselves into the rounds. The list builds itself.
            </p>
            <p>
              <strong>Second: at my party I could see who was actually in the room and ready to meet. At a real event, you can't.</strong> So participants sign up for a round at a specific time and get an SMS reminder five minutes before it starts — so when the pairs appear on screen, the people behind the names are genuinely there, ready to go.
            </p>
            <p>
              I believe the best connections come from <strong>surprise.</strong> And I believe nobody really remembers the event — they remember the people they met there. That's what Wonderelo is for: a little structure, a lot of trust in randomness, and an event no one forgets.
            </p>
          </article>

        </section>


        {/* ───────── Author + signature ───────── */}
        <section className="st-author">
          <AuthorSignature />
        </section>

        {/* ───────── Final CTA ───────── */}
        <section className="st-cta">
          <div className="st-cta-inner">
            <span className="deco-1"></span>
            <span className="deco-2"></span>
            <span className="deco-3"></span>
            <span className="deco-italic">try it</span>
            <h2>Try the same trick at <span className="w-italic" style={{ color: 'var(--w-purple-deep)' }}>your</span> event</h2>
            <p>Free for up to 5 participants. No card needed. Five minutes from sign-up to your first round.</p>
            <div className="actions">
              <a className="w-btn w-btn-ghost w-btn-lg" href="#" onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>Read the blog</a>
              <a className="w-btn w-btn-primary w-btn-lg" href="#" onClick={(e) => { e.preventDefault(); handleGetStarted(); }}>
                Start for free
                <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
