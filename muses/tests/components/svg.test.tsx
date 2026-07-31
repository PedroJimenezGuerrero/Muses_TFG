import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  MusaSvg,
  AstroSvg,
  ActionCardSvg,
  InspirationCardSvg,
  DevotionTokenSvg,
} from '@/components/svg';
import { TipoMusa, TipoAccion } from '@/types/game';

describe('SVG Fallback Components', () => {
  const musas: TipoMusa[] = [
    'CLIO',
    'EUTERPE',
    'TALIA',
    'MELPOMENE',
    'TERPSICORE',
    'ERATO',
    'POLIMNIA',
    'URANIA',
    'CALIOPE',
  ];

  it('renders all 9 musas cleanly with distinct graphics', () => {
    musas.forEach((musa) => {
      const { container } = render(<MusaSvg musa={musa} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', expect.stringContaining(musa));
    });
  });

  it('renders Sun and Moon AstroSvg components', () => {
    const { container: sunContainer } = render(<AstroSvg type="sun" />);
    expect(sunContainer.querySelector('svg')).toHaveAttribute('aria-label', 'Astro Solar');

    const { container: moonContainer } = render(<AstroSvg type="moon" />);
    expect(moonContainer.querySelector('svg')).toHaveAttribute('aria-label', 'Astro Lunar');
  });

  it('renders all 4 ActionCardSvg components', () => {
    const actions: TipoAccion[] = [
      'DEVOCION_SOL',
      'DEVOCION_LUNA',
      'REVOLUCION_SOL',
      'REVOLUCION_LUNA',
    ];
    actions.forEach((act) => {
      const { container } = render(<ActionCardSvg action={act} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('renders InspirationCardSvg with active and used states', () => {
    const { container: activeContainer } = render(
      <InspirationCardSvg musa="CLIO" isUsada={false} />
    );
    expect(activeContainer.querySelector('svg')).toBeInTheDocument();
    expect(activeContainer.textContent).toContain('INSPIRACIÓN');

    const { container: usedContainer } = render(
      <InspirationCardSvg musa="CLIO" isUsada={true} />
    );
    expect(usedContainer.textContent).toContain('YA USADA');
  });

  it('renders DevotionTokenSvg for different player numbers', () => {
    [1, 2, 3, 4, 5].forEach((pNum) => {
      const { container } = render(<DevotionTokenSvg playerNumber={pNum} count={3} />);
      expect(container.querySelector('svg')).toHaveAttribute(
        'aria-label',
        `Devotion Token Player ${pNum}`
      );
      expect(container.textContent).toContain('3');
    });
  });
});
