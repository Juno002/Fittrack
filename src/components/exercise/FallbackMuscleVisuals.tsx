import type { ReactNode, SVGProps } from 'react';

const STROKE = '#E8EEF8';
const FADE = '#9AA8BC';
const PRIMARY = '#6EE7B7';
const SECONDARY = '#7AB9FF';

interface FigureProps extends SVGProps<SVGSVGElement> {
  children?: ReactNode;
}

function FrontFigure({ children, ...props }: FigureProps) {
  return (
    <svg viewBox="0 0 176 176" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="88" cy="26" r="12" stroke={STROKE} strokeWidth="4" />
      <path d="M58 52C66 44 76 40 88 40C100 40 110 44 118 52" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M70 56C72 78 72 98 70 124" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M106 56C104 78 104 98 106 124" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M70 58C76 54 82 52 88 52C94 52 100 54 106 58" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M88 54V118" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M58 62L42 100" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M118 62L134 100" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M88 118L72 156" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M88 118L104 156" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M42 100L38 136" stroke={FADE} strokeWidth="4" strokeLinecap="round" />
      <path d="M134 100L138 136" stroke={FADE} strokeWidth="4" strokeLinecap="round" />
      <path d="M72 156H60" stroke={FADE} strokeWidth="4" strokeLinecap="round" />
      <path d="M104 156H116" stroke={FADE} strokeWidth="4" strokeLinecap="round" />
      <path d="M64 134C74 140 82 142 88 142C94 142 102 140 112 134" stroke={FADE} strokeOpacity=".42" strokeWidth="3" strokeLinecap="round" />
      <path d="M65 79C68 88 72 97 76 106" stroke={FADE} strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
      <path d="M111 79C108 88 104 97 100 106" stroke={FADE} strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
      {children}
    </svg>
  );
}

function BackFigure({ children, ...props }: FigureProps) {
  return (
    <svg viewBox="0 0 176 176" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="88" cy="26" r="12" stroke={STROKE} strokeWidth="4" />
      <path d="M58 54C68 45 78 42 88 42C98 42 108 45 118 54" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M66 58C74 62 82 64 88 64C94 64 102 62 110 58" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M70 60C72 82 72 102 70 124" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M106 60C104 82 104 102 106 124" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M88 64V118" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M58 62L42 102" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M118 62L134 102" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M88 118L72 156" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M88 118L104 156" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
      <path d="M42 102L38 136" stroke={FADE} strokeWidth="4" strokeLinecap="round" />
      <path d="M134 102L138 136" stroke={FADE} strokeWidth="4" strokeLinecap="round" />
      <path d="M72 156H60" stroke={FADE} strokeWidth="4" strokeLinecap="round" />
      <path d="M104 156H116" stroke={FADE} strokeWidth="4" strokeLinecap="round" />
      <path d="M64 126C74 134 82 138 88 138C94 138 102 134 112 126" stroke={FADE} strokeOpacity=".42" strokeWidth="3" strokeLinecap="round" />
      <path d="M71 78C77 90 83 100 88 110" stroke={FADE} strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
      <path d="M105 78C99 90 93 100 88 110" stroke={FADE} strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
      {children}
    </svg>
  );
}

export function ChestFallbackVisual(props: SVGProps<SVGSVGElement>) {
  return (
    <FrontFigure
      {...props}
      children={
        <>
          <path d="M62 66C70 60 78 58 88 58C98 58 106 60 114 66L106 92C100 86 94 84 88 84C82 84 76 86 70 92L62 66Z" fill={PRIMARY} fillOpacity=".92" />
          <path d="M70 92C76 86 82 84 88 84C94 84 100 86 106 92" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".7" />
        </>
      }
    />
  );
}

export function BackFallbackVisual(props: SVGProps<SVGSVGElement>) {
  return (
    <BackFigure
      {...props}
      children={
        <>
          <path d="M62 66C70 58 78 54 88 54C98 54 106 58 114 66L108 104C100 96 94 92 88 92C82 92 76 96 68 104L62 66Z" fill={PRIMARY} fillOpacity=".92" />
          <path d="M74 104L88 88L102 104" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".72" />
        </>
      }
    />
  );
}

export function LegsFallbackVisual(props: SVGProps<SVGSVGElement>) {
  return (
    <FrontFigure
      {...props}
      children={
        <>
          <path d="M66 110C74 108 80 108 88 108C96 108 102 108 110 110L106 148C100 152 94 154 88 154C82 154 76 152 70 148L66 110Z" fill={PRIMARY} fillOpacity=".92" />
          <path d="M74 150L82 114" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".72" />
          <path d="M102 150L94 114" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".72" />
        </>
      }
    />
  );
}

export function ShouldersFallbackVisual(props: SVGProps<SVGSVGElement>) {
  return (
    <FrontFigure
      {...props}
      children={
        <>
          <path d="M52 62C58 54 66 50 76 50C78 56 78 62 76 70C68 70 60 68 52 62Z" fill={PRIMARY} fillOpacity=".92" />
          <path d="M124 62C118 54 110 50 100 50C98 56 98 62 100 70C108 70 116 68 124 62Z" fill={PRIMARY} fillOpacity=".92" />
          <path d="M64 72L56 98" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".72" />
          <path d="M112 72L120 98" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".72" />
        </>
      }
    />
  );
}

export function ArmsFallbackVisual(props: SVGProps<SVGSVGElement>) {
  return (
    <FrontFigure
      {...props}
      children={
        <>
          <path d="M46 66C54 68 60 72 64 80L56 116C48 112 42 106 38 96L46 66Z" fill={PRIMARY} fillOpacity=".92" />
          <path d="M130 80C134 72 140 68 148 66L156 96C152 106 146 112 138 116L130 80Z" fill={PRIMARY} fillOpacity=".92" />
          <path d="M64 82L54 116" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".72" />
          <path d="M122 82L132 116" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".72" />
        </>
      }
    />
  );
}

export function CoreFallbackVisual(props: SVGProps<SVGSVGElement>) {
  return (
    <FrontFigure
      {...props}
      children={
        <>
          <path d="M74 74C78 70 82 68 88 68C94 68 98 70 102 74L100 118C96 122 92 124 88 124C84 124 80 122 76 118L74 74Z" fill={PRIMARY} fillOpacity=".92" />
          <path d="M80 82H96" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".72" />
          <path d="M80 92H96" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".72" />
          <path d="M80 102H96" stroke={SECONDARY} strokeWidth="3" strokeLinecap="round" strokeOpacity=".72" />
        </>
      }
    />
  );
}
