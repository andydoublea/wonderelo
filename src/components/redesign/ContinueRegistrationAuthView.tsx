/* Wonderelo — Continue Registration, auth-choice step (Claude Design v06).
   Presentational; all form state + handlers come from SessionRegistration via props.
   Maps to Continue Registration.html `data-view="auth"` (auth-idle / auth-sent). */
import { useState } from 'react';
import { getEmailProviderLink } from '../EmailVerificationWaiting';

const flagOf = (code: string): string => {
  try {
    return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
  } catch {
    return '🏳️';
  }
};

const I = {
  login: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  sms: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
};

interface Props {
  eventName?: string;
  selectedCount: number;
  registrationData: any;
  setRegistrationData: (fn: any) => void;
  formErrors: any;
  setFormErrors: (fn: any) => void;
  emailError?: string;
  onEmailChange: (e: any) => void;
  onEmailBlur: (e: any) => void;
  onRegistrationSubmit: (e: any) => void;
  sortedCountryCodes: Array<{ code: string; name: string; prefix: string; placeholder: string }>;
  phonePlaceholder: string;
  phoneCountryOpen: boolean;
  setPhoneCountryOpen: (v: boolean) => void;
  magicLinkEmail: string;
  setMagicLinkEmail: (v: string) => void;
  magicLinkSent: boolean;
  setMagicLinkSent: (v: boolean) => void;
  onSendMagicLink: () => void;
  isSendingMagicLink: boolean;
  isSubmitting: boolean;
  processingDots: number;
  onBack: () => void;
}

export function ContinueRegistrationAuthView(p: Props) {
  const [countrySearch, setCountrySearch] = useState('');
  const selected = p.sortedCountryCodes.find((c) => c.prefix === p.registrationData.phoneCountry) || p.sortedCountryCodes[0];
  const q = countrySearch.trim().toLowerCase();
  const countries = q
    ? p.sortedCountryCodes.filter((c) => c.name.toLowerCase().includes(q) || c.prefix.includes(q) || c.code.toLowerCase().includes(q))
    : p.sortedCountryCodes;

  return (
    <div className="wonderelo cr-page" data-state={p.magicLinkSent ? 'auth-sent' : 'auth-idle'}>
      <div className="cr-shell">
        <div className="cr-topbar">
          <a className="cr-back" role="button" tabIndex={0} onClick={p.onBack}>{I.back}<span>Round selection</span></a>
          <div className="cr-recap">
            <strong>{p.selectedCount} {p.selectedCount === 1 ? 'round' : 'rounds'}</strong>
            <span className="dot">·</span>
            <span>{p.eventName}</span>
          </div>
        </div>

        <section>
          <div className="cr-head"><h1>Tell us <em>who</em> you are</h1></div>

          <div className="cr-cards">
            <article className="cr-card">
              <header>
                <span className="cr-card-eyebrow">First time here?</span>
                <div className="cr-card-title">Create your account</div>
              </header>
              <form className="cr-form" onSubmit={p.onRegistrationSubmit}>
                <div className="cr-row">
                  <div className="cr-field">
                    <label className="cr-label" htmlFor="cr-first">First name <span className="req">*</span></label>
                    <input className="cr-input" id="cr-first" type="text" placeholder="Andy" value={p.registrationData.firstName}
                      onChange={(e) => { p.setRegistrationData((v: any) => ({ ...v, firstName: e.target.value })); if (p.formErrors.firstName) p.setFormErrors((v: any) => ({ ...v, firstName: '' })); }}
                      disabled={p.isSubmitting} />
                    {p.formErrors.firstName && <p className="cr-err">{p.formErrors.firstName}</p>}
                  </div>
                  <div className="cr-field">
                    <label className="cr-label" htmlFor="cr-last">Last name <span className="req">*</span></label>
                    <input className="cr-input" id="cr-last" type="text" placeholder="Abel" value={p.registrationData.lastName}
                      onChange={(e) => { p.setRegistrationData((v: any) => ({ ...v, lastName: e.target.value })); if (p.formErrors.lastName) p.setFormErrors((v: any) => ({ ...v, lastName: '' })); }}
                      disabled={p.isSubmitting} />
                    {p.formErrors.lastName && <p className="cr-err">{p.formErrors.lastName}</p>}
                  </div>
                </div>

                <div className="cr-field">
                  <label className="cr-label" htmlFor="cr-email">Email <span className="req">*</span></label>
                  <input className="cr-input" id="cr-email" type="email" placeholder="you@gmail.com" value={p.registrationData.email}
                    onChange={(e) => { p.onEmailChange(e); if (p.formErrors.email) p.setFormErrors((v: any) => ({ ...v, email: '' })); }}
                    onBlur={p.onEmailBlur} disabled={p.isSubmitting} />
                  {(p.emailError || p.formErrors.email)
                    ? <p className="cr-err">{p.emailError || p.formErrors.email}</p>
                    : <div className="cr-help">{I.mail}<span>You'll get shared contacts from your rounds here.</span></div>}
                </div>

                <div className="cr-field">
                  <label className="cr-label" htmlFor="cr-phone">Phone <span className="req">*</span></label>
                  <div className="cr-phone">
                    <div className={`cr-country${p.phoneCountryOpen ? ' is-open' : ''}`}>
                      <button className="cr-country-trigger" type="button" aria-haspopup="listbox" aria-expanded={p.phoneCountryOpen}
                        onClick={() => p.setPhoneCountryOpen(!p.phoneCountryOpen)}>
                        <span className="flag">{flagOf(selected.code)}</span>
                        <span>{selected.prefix}</span>
                      </button>
                      {p.phoneCountryOpen && (
                        <div className="cr-country-panel" role="listbox">
                          <div className="cr-country-search">
                            {I.search}
                            <input type="text" placeholder="Search country or code…" autoComplete="off" autoFocus
                              value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
                          </div>
                          <div className="cr-country-list">
                            {countries.length === 0 ? (
                              <div className="cr-country-empty">No country matches that.</div>
                            ) : countries.map((c) => (
                              <button type="button" key={c.code}
                                className={`cr-country-opt${c.prefix === p.registrationData.phoneCountry ? ' is-active' : ''}`}
                                onClick={() => { p.setRegistrationData((v: any) => ({ ...v, phoneCountry: c.prefix })); p.setPhoneCountryOpen(false); setCountrySearch(''); }}>
                                <span className="flag">{flagOf(c.code)}</span>
                                <span className="name">{c.name}</span>
                                <span className="code">{c.prefix}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <input className="cr-input" id="cr-phone" type="tel" placeholder={p.phonePlaceholder} value={p.registrationData.phone}
                      onChange={(e) => { p.setRegistrationData((v: any) => ({ ...v, phone: e.target.value })); if (p.formErrors.phone) p.setFormErrors((v: any) => ({ ...v, phone: '' })); }}
                      disabled={p.isSubmitting} />
                  </div>
                  {p.formErrors.phone && <p className="cr-err">{p.formErrors.phone}</p>}
                  <div className="cr-help cr-sms-help">{I.sms}<span>We send SMS reminder 5 minutes before each round.</span></div>
                </div>

                <label className="cr-check">
                  <input type="checkbox" checked={!!p.registrationData.acceptTerms}
                    onChange={(e) => p.setRegistrationData((v: any) => ({ ...v, acceptTerms: e.target.checked }))} disabled={p.isSubmitting} />
                  <span className="box">{I.check}</span>
                  <span className="text">I accept the <a href="https://wonderelo.com/terms" target="_blank" rel="noopener noreferrer">Terms of service</a> <span className="req">*</span></span>
                </label>

                <button className="cr-submit" type="submit" disabled={p.isSubmitting || !p.registrationData.acceptTerms}>
                  {p.isSubmitting ? <>Processing{'.'.repeat(p.processingDots)}</> : <>Create account &amp; continue</>}
                  {!p.isSubmitting && I.arrow}
                </button>
              </form>
            </article>

            <div className="cr-or"><span>or</span></div>

            <article className="cr-card cr-magic-card" data-magic-state={p.magicLinkSent ? 'sent' : 'idle'}>
              <header>
                <span className="cr-card-eyebrow">Already on Wonderelo?</span>
                <div className="cr-card-title">Sign in by email</div>
                <div className="cr-card-sub">We'll send a one-tap magic link — no password needed.</div>
              </header>

              {!p.magicLinkSent ? (
                <form className="cr-magic-form" onSubmit={(e) => { e.preventDefault(); p.onSendMagicLink(); }}>
                  <div className="cr-field">
                    <label className="cr-label" htmlFor="cr-magic-email">Email</label>
                    <input className="cr-input" id="cr-magic-email" type="email" placeholder="you@gmail.com"
                      value={p.magicLinkEmail} onChange={(e) => p.setMagicLinkEmail(e.target.value)} />
                  </div>
                  <button className="cr-submit is-ghost" type="submit" style={{ marginTop: '8px' }} disabled={p.isSendingMagicLink || !p.magicLinkEmail}>
                    {I.mail}{p.isSendingMagicLink ? 'Sending…' : 'Send magic link'}
                  </button>
                </form>
              ) : (
                <div className="cr-magic-sent">
                  <div className="icon">{I.mail}</div>
                  <p className="lede">Magic link sent to</p>
                  <p className="email">{p.magicLinkEmail}</p>
                  {(() => {
                    const prov = getEmailProviderLink(p.magicLinkEmail);
                    return (
                      <a className="cr-submit cr-magic-open" href={prov.url} target="_blank" rel="noopener noreferrer">
                        {I.mail}<span>{prov.name}</span>
                      </a>
                    );
                  })()}
                  <p className="retry-line">
                    Didn't get it?<button className="retry" type="button" onClick={() => { p.setMagicLinkSent(false); p.setMagicLinkEmail(''); }}>Try again</button>
                  </p>
                </div>
              )}
            </article>
          </div>
        </section>

        <footer className="cr-footer">
          <a className="cr-brand"><span className="mark"><span className="inner" /></span><span className="word">wond<em>e</em>relo</span></a>
          <p className="tagline">Break your bubble, meet new people</p>
          <p className="copy">© 2026 Wonderelo</p>
        </footer>
      </div>
    </div>
  );
}
