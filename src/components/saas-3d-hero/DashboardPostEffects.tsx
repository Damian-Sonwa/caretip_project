import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Vignette,
} from "@/lib/r3f-postfx";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";

type DashboardPostEffectsProps = {
  reducedMotion: boolean;
};

/**
 * Screen-space polish: bloom, vignette, depth of field, and a very light chromatic fringe
 * (reads as lens / speed; true velocity motion blur would need an MRT velocity buffer).
 */
export function DashboardPostEffects({ reducedMotion }: DashboardPostEffectsProps) {
  const { size } = useThree();
  const dofHeight = useMemo(() => Math.max(360, Math.min(size.height, 900)), [size.height]);
  const chromaOffset = useMemo(() => new Vector2(0.00035, 0.00055), []);

  if (reducedMotion) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false} depthBuffer>
        <Bloom
          blendFunction={BlendFunction.SCREEN}
          intensity={0.35}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.88}
          mipmapBlur
          radius={0.35}
        />
        <Vignette blendFunction={BlendFunction.NORMAL} offset={0.18} darkness={0.42} eskil={false} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false} depthBuffer>
      <DepthOfField
        blendFunction={BlendFunction.NORMAL}
        worldFocusDistance={5.65}
        worldFocusRange={1.85}
        bokehScale={2.1}
        height={dofHeight}
      />
      <Bloom
        blendFunction={BlendFunction.SCREEN}
        intensity={0.52}
        luminanceThreshold={0.22}
        luminanceSmoothing={0.82}
        mipmapBlur
        radius={0.48}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={chromaOffset}
        radialModulation
        modulationOffset={0.12}
        opacity={0.22}
      />
      <Vignette blendFunction={BlendFunction.NORMAL} offset={0.28} darkness={0.58} eskil={false} />
    </EffectComposer>
  );
}
