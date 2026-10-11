import { createFileRoute } from '@tanstack/react-router';
import { LEGACY_RENDERERS, renderLegacyVisual } from '@/lib/legacy-visuals';

export const Route = createFileRoute('/visual-review')({
  component: VisualReview,
});

function VisualReview() {
  const models = Object.keys(LEGACY_RENDERERS);
  return (
    <div style={{ background: '#0b0f17', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 400px)', gap: 12 }}>
      {models.map((m) => (
        <div key={m} style={{ border: '1px solid #1e293b', borderRadius: 8 }}>
          <div style={{ color: '#7dd3fc', font: '12px monospace', padding: '4px 8px' }}>{m}</div>
          <svg width={400} height={430} viewBox="0 0 390 430">
            {renderLegacyVisual({ model: m, elapsed: 3, duration: 6, stage: 'general' })}
          </svg>
        </div>
      ))}
    </div>
  );
}
