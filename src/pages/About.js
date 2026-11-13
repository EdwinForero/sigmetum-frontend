import React from 'react';
import { useTranslation } from 'react-i18next';
import ImageComponent from '../components/ImageComponent';
import Reveal from '../components/Reveal';
import ASSETS, { assetUrl } from '../config/assets';

const CARDS = [
  { title: 'aboutUs.projectPurposeSubtitle', content: 'aboutUs.projectPurposeContent' },
  { title: 'aboutUs.ourMissionSubtitle', content: 'aboutUs.ourMissionContent' },
  { title: 'aboutUs.ourValuesSubtitle', content: 'aboutUs.ourValuesContent' },
];

const About = () => {
  const { t } = useTranslation();

  return (
    <>
      <section className="page-container pt-stack-xl md:pt-section lg:grid lg:grid-cols-3 lg:gap-x-stack-xl lg:gap-y-stack-lg">
        <h1 className="lg:col-span-3 text-4xl md:text-5xl font-bold leading-tight text-brand-deep">
          {t('aboutUs.title')}
        </h1>
        <p className="mt-stack-lg max-w-prose text-lg lg:col-span-2 lg:mt-0 text-ink-soft">
          {t('aboutUs.ourWorkTeam')}
        </p>
        <ImageComponent
          directUrl={assetUrl(ASSETS.ABOUT)}
          alt=""
          width={1200}
          height={500}
          className="mt-stack-xl lg:mt-0 lg:col-span-3 aspect-[12/5] w-full rounded-lg object-cover"
        />
      </section>

      <ul className="page-container grid gap-stack-lg py-section md:grid-cols-3 md:py-section-lg">
        {CARDS.map(({ title, content }, i) => (
          <Reveal as="li" key={title} index={i} className="rounded-lg border border-sage bg-sage-soft p-stack-lg">
            <h2 className="text-2xl font-bold leading-tight text-forest">{t(title)}</h2>
            <p className="mt-stack max-w-prose text-base text-ink">{t(content)}</p>
          </Reveal>
        ))}
      </ul>
    </>
  );
};

export default About;
