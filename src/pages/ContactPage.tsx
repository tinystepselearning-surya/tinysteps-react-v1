// @ts-nocheck
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import { getRouteConfig } from '../lib/seo';
import ElectricBorder from '../components/ui/ElectricBorder';
import SoftAurora from '../components/ui/SoftAurora';
import AutoLinkedText from '../components/seo/AutoLinkedText';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '../constants/publicContact';

const contactSeo = getRouteConfig('/contact');
const contactSeoTitle = contactSeo?.title ?? 'Contact Us | Tiny Steps Learning';
const contactSeoDescription =
  contactSeo?.description ??
  'Contact Tiny Steps Learning, a premium online English learning school for children aged 3–12 offering structured phonics, grammar, reading, sentence formation, communication, and public speaking programs.';
const contactCanonicalPath = contactSeo?.canonicalPath ?? '/contact';
const contactCanonicalUrl = `https://tinystepslearning.com${contactCanonicalPath}`;

const ContactPage: FC = () => {
  return (
    <div className="relative overflow-hidden bg-[#060a16]">
      <Meta title={contactSeoTitle} description={contactSeoDescription} canonical={contactCanonicalUrl} />
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

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-6">
        <div className="mx-auto flex flex-col items-center justify-center pt-[100px] sm:pt-[120px] md:pt-[160px]">
          <ElectricBorder
            color="#7df9ff"
            speed={1}
            chaos={0.12}
            thickness={2}
            borderRadius={999}
            className="mb-6 w-fit"
          >
            <div className="rounded-full bg-[#0a1230]/70 px-6 py-2.5 backdrop-blur-md">
              <p className="text-center text-sm font-medium tracking-wide text-cyan-100">
              We&apos;re here for parents worldwide
              </p>
            </div>
          </ElectricBorder>

          <h1 className="text-center text-4xl font-bold text-white sm:text-5xl">Contact Tiny Steps Learning</h1>
          <p className="mt-4 max-w-xl text-center text-lg text-slate-300">
            <AutoLinkedText text="Questions about programs, placement, or admissions? Email us or book a free assessment." />
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href={PUBLIC_CONTACT_MAILTO} className="inline-flex rounded-full bg-cyan-600 px-6 py-3 font-semibold text-white transition hover:bg-cyan-500">
              {PUBLIC_CONTACT_EMAIL}
            </a>
            <Link to="/contact?book=1" className="inline-flex rounded-full border border-cyan-500/30 bg-[#0a1230]/50 px-6 py-3 font-semibold text-white backdrop-blur-md transition hover:bg-[#0a1230]/80">
              Book Free Assessment
            </Link>
          </div>

          <div className="mt-20 w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <h2 className="text-center text-xl font-bold text-white">What parents usually visit next</h2>
            <div className="mt-6 grid gap-4 text-center sm:grid-cols-2 md:grid-cols-4">
              <Link to="/phonics" className="rounded-xl bg-white/5 p-4 text-sm font-medium text-cyan-50 transition hover:bg-white/10">Phonics Classes</Link>
              <Link to="/grammar" className="rounded-xl bg-white/5 p-4 text-sm font-medium text-cyan-50 transition hover:bg-white/10">Grammar Classes</Link>
              <Link to="/speaking" className="rounded-xl bg-white/5 p-4 text-sm font-medium text-cyan-50 transition hover:bg-white/10">Public Speaking</Link>
              <Link to="/why-tiny-steps" className="rounded-xl bg-white/5 p-4 text-sm font-medium text-cyan-50 transition hover:bg-white/10">Why Tiny Steps?</Link>
              <Link to="/courses" className="rounded-xl bg-white/5 p-4 text-sm font-medium text-cyan-50 transition hover:bg-white/10">All Courses</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};export default ContactPage;
