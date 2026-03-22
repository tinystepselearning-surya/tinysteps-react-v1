// @ts-nocheck
import type { FC } from 'react';
import Meta from '../components/common/Meta';
import ElectricBorder from '../components/ui/ElectricBorder';
import SoftAurora from '../components/ui/SoftAurora';

const ContactPage: FC = () => {
  return (
    <div className="relative overflow-hidden bg-[#060a16]">
      <Meta title="Contact Tiny Steps Online School" description="Premium 1:1 online English school for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice and stage-based parent progress insights. Free assessment class; flexible monthly plans." canonical="https://tinystepslearning.com/contact" />
      <div className="pointer-events-none absolute inset-0">
        <SoftAurora
          speed={0.6}
          scale={1.5}
          brightness={0.95}
          color1="#f7f7f7"
          color2="#e100ff"
          noiseFrequency={2.5}
          noiseAmplitude={1}
          bandHeight={0.5}
          bandSpread={1.1}
          octaveDecay={0.1}
          layerOffset={0}
          colorSpeed={1}
          enableMouseInteraction={false}
          mouseInfluence={0.25}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#060a16]/85 via-[#060a16]/40 to-[#060a16]/90" />

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-6">
        <div className="mx-auto flex h-[280px] max-w-5xl flex-col items-center justify-start md:h-[320px]">
          <ElectricBorder
            color="#7df9ff"
            speed={1}
            chaos={0.12}
            thickness={2}
            borderRadius={999}
            className="w-fit"
          >
            <div className="rounded-full bg-[#0a1230]/70 px-6 py-2.5 backdrop-blur-md">
              <p className="text-center text-sm font-medium tracking-wide text-cyan-100">
                We&apos;re here for parents worldwide
              </p>
            </div>
          </ElectricBorder>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
