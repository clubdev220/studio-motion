import { Composition } from 'remotion';
import { CHARTE_DEFAUT } from './charte';
import { Montage } from './Montage';
import { FORMATS, type Montage as MontageProps } from './types';

export const FPS = 30;

export const RemotionRoot = () => (
  <Composition
    id="Montage"
    component={Montage}
    width={1920}
    height={1080}
    fps={FPS}
    durationInFrames={FPS * 10}
    defaultProps={{ format: '16:9', charte: CHARTE_DEFAUT, scenes: [] } as MontageProps}
    calculateMetadata={({ props }) => {
      const f = FORMATS[props.format] ?? FORMATS['16:9'];
      const duree = props.scenes.reduce((s, x) => s + x.duree, 0);
      return { width: f.width, height: f.height, durationInFrames: Math.max(FPS, Math.ceil(duree * FPS)) };
    }}
  />
);
