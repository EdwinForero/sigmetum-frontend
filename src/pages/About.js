import React from 'react';
import { useTranslation } from 'react-i18next';
import ImageComponent from '../components/ImageComponent';
import Reveal from '../components/Reveal';
import ASSETS, { assetUrl } from '../config/assets';
import { H1, PROSE, CARD, CARD_TITLE, CARD_TEXT } from '../utilities/contentStyles';

// La más larga va sola debajo, a lo ancho de la rejilla; su texto, con medida de lectura.
const CARDS = [
  { title: 'aboutUs.projectPurposeSubtitle', content: 'aboutUs.projectPurposeContent' },
  { title: 'aboutUs.ourMissionSubtitle', content: 'aboutUs.ourMissionContent' },
  { title: 'aboutUs.ourValuesSubtitle', content: 'aboutUs.ourValuesContent', wide: true },
];

const About = () => {
  const { t } = useTranslation();

  return (
    <>
      <section className="page-container pt-stack-xl md:pt-section lg:grid lg:grid-cols-2 lg:gap-x-stack-lg lg:gap-y-stack-lg">
        <h1 className={`${H1} lg:col-span-2`}>
          {t('aboutUs.title')}
        </h1>
        <ImageComponent
          directUrl={assetUrl(ASSETS.ABOUT)}
          alt=""
          width={1200}
          height={500}
          className="mt-stack-lg aspect-[12/5] w-full rounded-lg object-cover lg:col-start-2 lg:row-start-2 lg:mt-0 lg:aspect-auto lg:h-0 lg:min-h-full"
        />
        <p className={`${PROSE} mt-stack-lg lg:col-start-1 lg:row-start-2 lg:mt-0`}>
          {t('aboutUs.ourWorkTeam')}
        </p>
      </section>

      <ul role="list" className="page-container grid gap-stack-lg py-section md:py-section-lg lg:grid-cols-2">
        {CARDS.map(({ title, content, wide }, i) => (
          <Reveal as="li" key={title} index={i} className={wide ? `${CARD} lg:col-span-2` : CARD}>
            <h2 className={CARD_TITLE}>{t(title)}</h2>
            <p className={CARD_TEXT}>{t(content)}</p>
          </Reveal>
        ))}
      </ul>
    </>
  );
};

export default About;
