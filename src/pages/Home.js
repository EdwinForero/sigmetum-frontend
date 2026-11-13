import { React, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ContactForm from '../components/ContactForm.js';
import { BUTTON_PRINCIPAL_CLASS } from '../components/ButtonPrincipal.js';
import { BUTTON_ALTERNATIVE_CLASS } from '../components/ButtonAlternative.js';
import EmailContactGrid from '../components/EmailContactGrid.js';
import LoadSpinner from '../components/LoadSpinner.js';
import LogoLink from '../components/LogoLink.js';
import ScrollIndicator from '../components/ScrollIndicator.js';
import ImageComponent from '../components/ImageComponent.js';
import Reveal from '../components/Reveal.js';
import ASSETS, { assetUrl } from '../config/assets';
import { UNIVERSITIES, ENTITIES } from '../config/institutions';

const COLLABORATORS = {
  uma: [
    'Jaime F. Pereña Ortiz',
    'Á, Enrique Salvo Tierra',
    'Noelia Hidalgo Triana',
    'Andrés V. Pérez Latorre',
    'Marianela Zanolla Balbuena',
    'Teresa Navarro',
    'Yara Katerine Forero Gómez',
    'Ángel Ruiz Valero',
    'Pablo Cozano',
    'Begoña Galindo',
    'Ángel Valencia',
  ],
  ual: ['Juan F. Mota Poveda'],
  ugr: ['Francisco Valle Tendero', 'Juan Lorite Moreno'],
  uhu: ['Pablo Hidalgo Fernández'],
  uja: ['José Antonio Carreira de la Fuente'],
};

// Solo la lista larga (UMA, 11 nombres) se reparte en columnas; las demás van en una, sin partir nombres.
const COLLABORATOR_COLUMNS = ['uma'];
const SECTION = 'page-container py-section md:py-section-lg';
const H2 = 'text-2xl md:text-4xl font-bold leading-tight text-brand-deep';
const H3 = 'text-xl md:text-2xl font-bold leading-tight text-brand-deep';
const GRID = 'mt-stack-lg grid gap-stack-lg sm:grid-cols-2 lg:grid-cols-4';
const ENTITIES_GRID = 'mt-stack-lg grid gap-stack-lg sm:grid-cols-3';
const ITEM = 'flex flex-col items-center gap-stack-sm text-center';

const Home = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const contactHeadingRef = useRef(null);

  // Enlace del pie a /#contacto: `key` repite el desplazamiento si se pulsa dos veces el mismo enlace.
  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    target?.scrollIntoView();
    // El foco pasa al encabezado de la sección (tabIndex -1): el siguiente Tab continúa desde ahí.
    target?.querySelector('h2[tabindex="-1"]')?.focus({ preventScroll: true });
  }, [location.key, location.hash]);

  const handleOnLoad = (state) => {
    setIsLoading(state);
  };

  const [leader, ...otherUniversities] = UNIVERSITIES;

  const names = (id) =>
    COLLABORATORS[id]?.length > 0 && (
      <ul className={`w-full text-center ${COLLABORATOR_COLUMNS.includes(id) ? 'sm:columns-2 lg:columns-3 gap-x-stack-xl' : ''}`}>
        {COLLABORATORS[id].map((name) => (
          <li key={name} className="break-inside-avoid text-base text-ink-soft">{name}</li>
        ))}
      </ul>
    );

  const logo = ({ id, url, asset }) => (
    <LogoLink href={url} src={assetUrl(asset)} alt={t(`institutions.${id}`)} />
  );

  return (
    <>
      <ImageComponent
        directUrl={assetUrl(ASSETS.BANNER)}
        isBackground={true}
        className="relative flex min-h-[calc(100svh-4rem)] flex-col"
      >
        <div className="page-container flex flex-1 flex-col justify-center gap-stack-lg pt-section pb-stack-lg">
          <h1 className="max-w-3xl text-4xl md:text-5xl font-bold leading-tight text-surface">
            {t('home.title')}
          </h1>
          <p className="max-w-prose text-lg md:text-2xl text-surface">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-wrap gap-stack">
            <Link to="/explore" className={BUTTON_PRINCIPAL_CLASS}>{t('home.exploreButton')}</Link>
            <Link to="/gallery" className={BUTTON_ALTERNATIVE_CLASS}>{t('home.galleryButton')}</Link>
          </div>
        </div>
        <div className="flex justify-center pb-stack">
          <ScrollIndicator targetId="home-descripcion" />
        </div>
      </ImageComponent>

      <section id="home-descripcion" tabIndex={-1} className="focus-heading bg-ink py-section md:py-section-lg">
        <p className="page-container text-center text-2xl md:text-4xl font-bold leading-tight text-surface">
          {t('home.descriptionContent')}
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={`${H2} text-center`}>{t('home.projectLeaderTitle')}</h2>
        <Reveal className="mt-stack-lg flex flex-col items-center gap-stack-sm">
          {logo(leader)}
          {names(leader.id)}
        </Reveal>

        <Reveal as="h3" className={`${H3} mt-section text-center`}>{t('home.otherUniversitiesTitle')}</Reveal>
        <div className={GRID}>
          {otherUniversities.map((university, i) => (
            <Reveal key={university.id} index={i} className={ITEM}>
              {logo(university)}
              {names(university.id)}
            </Reveal>
          ))}
        </div>

        <Reveal as="h3" className={`${H3} mt-section text-center`}>{t('home.collaboratingEntitiesTitle')}</Reveal>
        <div className={ENTITIES_GRID}>
          {ENTITIES.map((entity, i) => (
            <Reveal key={entity.id} index={i} className={ITEM}>{logo(entity)}</Reveal>
          ))}
        </div>
      </section>

      <section id="contacto" className={SECTION}>
        <h2 ref={contactHeadingRef} tabIndex={-1} className={`focus-heading ${H2}`}>{t('home.contactTitle')}</h2>
        <div className="mt-stack-lg grid gap-stack-xl md:grid-cols-2">
          <ContactForm onLoad={handleOnLoad} onSent={() => contactHeadingRef.current?.focus()} />
          <div className="flex flex-col gap-stack-lg">
            <div className="border-t border-ink-soft pt-stack-lg">
              <h3 className={H3}>{t('home.emailTitle')}</h3>
              <p className="mt-stack-sm text-base text-ink whitespace-pre-line">{t('home.emailContact')}</p>
              <EmailContactGrid />
            </div>
            <div className="border-t border-b border-ink-soft pt-stack-lg pb-stack-lg">
              <h3 className={H3}>{t('home.locationLabel')}</h3>
              <p className="mt-stack-sm text-base text-ink whitespace-pre-line">{t('home.locationContent')}</p>
            </div>
          </div>
        </div>
      </section>
      {isLoading && (<LoadSpinner/>)}
    </>
  );
};

export default Home;
