// Generate unique identification image with geometric shape on colored background
// Each match gets a unique combination of shape and colors

interface GeometricIdentificationProps {
  matchId: string;
  className?: string;
}

// Available shapes
const shapes = [
  'circle',
  'triangle',
  'square',
  'star',
  'pentagon',
  'hexagon',
  'diamond',
  'crescent'
] as const;

// Color palette with good contrast options
const backgroundColors = [
  '#1e3a8a', // dark blue
  '#7c2d12', // dark red
  '#14532d', // dark green
  '#713f12', // dark brown
  '#4c1d95', // dark purple
  '#831843', // dark pink
  '#115e59', // dark teal
  '#6b21a8', // dark violet
];

const shapeColors = [
  '#fbbf24', // yellow
  '#f87171', // red
  '#34d399', // green
  '#60a5fa', // blue
  '#a78bfa', // purple
  '#fb923c', // orange
  '#f472b6', // pink
  '#2dd4bf', // cyan
];

// Simple hash function to convert string to number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Get deterministic values from matchId
function getDeterministicValues(matchId: string) {
  const hash = hashString(matchId);
  
  const shapeIndex = hash % shapes.length;
  const bgIndex = Math.floor(hash / shapes.length) % backgroundColors.length;
  const shapeColorIndex = Math.floor(hash / (shapes.length * backgroundColors.length)) % shapeColors.length;
  
  return {
    shape: shapes[shapeIndex],
    backgroundColor: backgroundColors[bgIndex],
    shapeColor: shapeColors[shapeColorIndex]
  };
}

export function GeometricIdentification({ matchId, className = '' }: GeometricIdentificationProps) {
  const { shape, backgroundColor, shapeColor } = getDeterministicValues(matchId);
  
  const renderShape = () => {
    const shapeProps = {
      fill: shapeColor,
      stroke: 'none'
    };
    
    switch (shape) {
      case 'circle':
        return <circle cx="200" cy="200" r="120" {...shapeProps} />;
      
      case 'triangle':
        return <polygon points="200,80 320,320 80,320" {...shapeProps} />;
      
      case 'square':
        return <rect x="100" y="100" width="200" height="200" {...shapeProps} />;
      
      case 'star':
        const starPoints = [];
        for (let i = 0; i < 5; i++) {
          const angle1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const angle2 = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
          starPoints.push(`${200 + 120 * Math.cos(angle1)},${200 + 120 * Math.sin(angle1)}`);
          starPoints.push(`${200 + 50 * Math.cos(angle2)},${200 + 50 * Math.sin(angle2)}`);
        }
        return <polygon points={starPoints.join(' ')} {...shapeProps} />;
      
      case 'pentagon':
        const pentagonPoints = [];
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          pentagonPoints.push(`${200 + 120 * Math.cos(angle)},${200 + 120 * Math.sin(angle)}`);
        }
        return <polygon points={pentagonPoints.join(' ')} {...shapeProps} />;
      
      case 'hexagon':
        const hexagonPoints = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * 2 * Math.PI) / 6;
          hexagonPoints.push(`${200 + 120 * Math.cos(angle)},${200 + 120 * Math.sin(angle)}`);
        }
        return <polygon points={hexagonPoints.join(' ')} {...shapeProps} />;
      
      case 'diamond':
        return <polygon points="200,80 320,200 200,320 80,200" {...shapeProps} />;
      
      case 'crescent':
        return (
          <>
            <circle cx="200" cy="200" r="120" {...shapeProps} />
            <circle cx="240" cy="200" r="100" fill={backgroundColor} />
          </>
        );
      
      default:
        return <circle cx="200" cy="200" r="120" {...shapeProps} />;
    }
  };
  
  return (
    <svg 
      viewBox="0 0 400 400" 
      className={className}
      style={{ backgroundColor }}
    >
      {renderShape()}
    </svg>
  );
}
