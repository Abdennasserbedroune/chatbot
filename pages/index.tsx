/**
 * Home Page
 * Displays profile overview
 */

import type { ReactElement } from 'react';

export default function Home(): ReactElement {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Profile Data Layer</h1>
      <p>Multilingual profile Q&A system with TypeScript support.</p>
      <p>
        <strong>Data Location:</strong> <code>/public/data/profile.json</code>
      </p>
      <p>
        <strong>Helper Library:</strong> <code>/lib/profile.ts</code>
      </p>
      <p>
        <strong>Types:</strong> <code>/types/profile.ts</code>
      </p>
      <p>See the README for full documentation and usage examples.</p>
    </div>
  );
}
