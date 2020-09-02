import React, { useCallback, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

const perceivedBrightness = (r: number, g: number, b: number) => {
  return Math.floor(Math.sqrt(0.241 * r * r + 0.691 * g * g + 0.068 * b * b));
};

const index = (() => {
  const brightnesses: number[][] = [];
  for (let l = 0; l < 256; l++) {
    brightnesses[l] = [];
  }
  for (let r = 0; r < 256; r++) {
    for (let g = 0; g < 256; g++) {
      for (let b = 0; b < 256; b++) {
        const l = perceivedBrightness(r, g, b);
        brightnesses[l].push(b + (g << 8) + (r << 16));
      }
    }
  }
  return brightnesses;
})();

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h, s, l];
}

function hexToRgb(hex: number): [number, number, number] {
  let b = hex & 0xff;
  hex >>= 8;
  let g = hex & 0xff;
  hex >>= 8;
  return [hex, g, b];
}

function hexToHsl(hex: number) {
  return rgbToHsl(...hexToRgb(hex));
}

function memo1<T, U>(f: (arg: T) => U) {
  const cache = new Map();
  return (arg: T): U => {
    if (!cache.has(arg)) {
      cache.set(arg, f(arg));
    }
    return cache.get(arg);
  };
}

const hsl = memo1((hex: number) => hexToHsl(hex));

function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function getPalette(brightness: number, tolerance = 0, paletteSize = 200) {
  brightness = Math.floor(Math.max(0, Math.min(255, brightness)));
  const colors: number[] = [];

  for (
    let i = Math.max(0, brightness - tolerance);
    i <= Math.min(255, brightness + tolerance);
    i++
  ) {
    const b = i;
    if (!index[b]) {
      throw new Error(`${b}`);
    }
    colors.push(...index[b]);
  }

  shuffle(colors);
  return colors
    .slice(0, paletteSize)
    .filter((c) => hsl(c)[1] > 0.5)
    .sort((c1, c2) => {
      const [h1, s1, l1] = hsl(c1);
      const [h2, s2, l2] = hsl(c2);

      const h = h1 - h2;
      if (h !== 0) return h;

      const l = l1 - l2;
      if (l !== 0) return l;

      const s = s1 - s2;
      if (s !== 0) return s;

      return 0;
    });
}

function App() {
  const [palette, setPalette] = useState([] as number[]);
  const [brightness, setBrightness] = useState(200);
  const [tolerance, setTolerance] = useState(0);

  useEffect(() => {
    setPalette(getPalette(brightness, tolerance));
  }, [brightness, tolerance]);

  return (
    <div>
      <h1>Generate color palette for a given perceived brightness</h1>
      <div>
        Perceived brightness: <b>{brightness}</b> / 255
      </div>
      <input
        type="range"
        min="0"
        max="255"
        value={brightness}
        onChange={(e) => setBrightness(Number(e.target.value))}
      />
      <div>
        Allowed error: +/- <b>{tolerance}</b>
      </div>
      <input
        type="range"
        min="0"
        max="20"
        value={tolerance}
        onChange={(e) => setTolerance(Number(e.target.value))}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        {palette.map((color, i) => (
          <div
            key={`${i}/${color}`}
            style={{
              background: `#${color.toString(16).padStart(6, '0')}`,
              height: 16,
              width: 120,
            }}
          />
        ))}
      </div>
      <div style={{ margin: '16px 0' }}>Palette (for use in JS):</div>
      <textarea
        value={`const palette = [
${palette.map((hex) => `  '#${hex.toString(16).padStart(6, '0')}',`).join('\n')}
]`}
      />
    </div>
  );
}

export default App;
