interface AuthorSignatureProps {
  className?: string;
}

export function AuthorSignature({ className = '' }: AuthorSignatureProps) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{
        width: '96px',
        height: '96px',
        borderRadius: '50%',
        backgroundColor: '#f0e6f6',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#5C2277',
        fontSize: '28px',
        fontWeight: 'bold'
      }}>
        AA
      </div>
      <div>
        <p className="font-semibold" style={{ margin: 0 }}>Andy Abel</p>
        <p className="text-sm text-muted-foreground italic" style={{ margin: '2px 0 0 0' }}>Founder & CEO at Wonderelo</p>
        <hr style={{ width: '40px', border: 'none', borderTop: '1px solid #d4d4d4', margin: '8px 0' }} />
        <p className="text-sm text-muted-foreground" style={{ marginTop: '0' }}>
          I love great design and traveling — so far I've visited 49 countries, from Japan, Cambodia, Vietnam, and Sri Lanka to Brazil. I'm a passionate golfer and skier. I love good company, and even more when there's dancing (especially to Justin Timberlake).
        </p>
      </div>
    </div>
  );
}
