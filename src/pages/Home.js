import { React, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import ContactForm from '../components/ContactForm.js';
import ButtonPrincipal from '../components/ButtonPrincipal.js';
import EmailContactGrid from '../components/EmailContactGrid.js';
import LoadSpinner from '../components/LoadSpinner.js';
import ScrollIndicator from '../components/ScrollIndicator.js';
import ImageComponent from '../components/ImageComponent.js';

const Home = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const umaCollaborators = [
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
    'Ángel Valencia'
  ];

  const anotherUniverities = [
    { key: 'UAL.jpg', url: 'https://www.ual.es', collaborators: ['Juan F. Mota Poveda']},
    { key: 'UGR.jpg', url: 'https://www.ugr.es', collaborators: ['Francisco Valle Tendero', 'Juan Lorite Moreno']},
    { key: 'UHU.jpg', url: 'https://www.uhu.es', collaborators: ['Pablo Hidalgo Fernández']},
    { key: 'UJA.jpg', url: 'https://www.ujaen.es', collaborators: ['José Antonio Carreira de la Fuente']}
  ];

  const anotherEntities = [
    { key: 'EFYVE.jpg', url: 'http://www.efyve.com'},
    { key: 'GEOSPACE.jpg', url: 'https://3dgeospace.com'},
    { key: 'MaFo.jpg', url: 'https://malaguenaforestal.com'}
  ];

  const handleOnLoad = (state) => {
    setIsLoading(state);
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <ImageComponent imageKey="Banner.jpg" isBackground={true} className="flex items-center justify-left px-2">
        <div className="flex flex-col gap-5 text-left">
          <h1 className="text-[#F9FBFA] text-4xl font-black sm:text-6xl sm:font-black">
            {t('home.title')}
          </h1>
          <h2 className="text-[#F9FBFA] text-sm font-normal leading-normal sm:text-2xl sm:font-normal sm:leading-normal">
            {t('home.subtitle')}
          </h2>
          <Link to="/explorar">
            <ButtonPrincipal text={t('home.searchButton')} />
          </Link>
        </div>
        </ImageComponent>

      <div className="overflow-hidden">
        <div
          className="min-h-[50vh] px-4 py-4 flex items-center justify-center bg-[#0C1811]"
        >
          <motion.p
          className="text-[#F9FBFA] text-2xl font-bold leading-tight text-center mx-10 py-2 sm:text-4xl sm:mx-40"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}>
            {t('home.descriptionContent')}
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto py-8">
        <motion.h2 
          className="text-[#15B659] tracking-light text-2xl sm:text-4xl font-bold leading-tight text-center mt-12" 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}>
            {t('home.projectLeaderTitle')}
        </motion.h2>
        <motion.div 
          className="gap-8 mt-4 justify-items-center items-center"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}>
          <div className="flex flex-col items-center justify-center p-4">
            <a
              href="https://www.uma.es"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <ImageComponent
                imageKey={"UMA.jpg"}
                className="object-contain mix-blend-multiply max-w-[150px] sm:max-w-[200px]"
              />
            </a>
            {umaCollaborators && umaCollaborators.length > 0 && (
              <div className="mt-2 text-center">
                {umaCollaborators.map((name, idx) => (
                  <p key={idx} className="text-sm text-gray-700">{name}</p>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.h3
          className="text-[#15B659] tracking-light text-xl sm:text-2xl font-bold leading-tight text-center mt-12" 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}>
            {t('home.otherUniversitiesTitle')}
        </motion.h3>
        <motion.div className="flex w-full flex-wrap justify-center gap-6 mt-4"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}>
          {anotherUniverities.map(({ key, url, collaborators }, index) => (
            <div
              key={index}
              className="flex flex-col items-center max-h-24 justify-center w-1/2 sm:w-full md:w-1/4 p-4 mt-8"
            >
              <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                <ImageComponent
                  imageKey={key}
                  className="object-contain mix-blend-multiply max-w-[150px] sm:max-w-[200px]"
                />
              </a>
              {collaborators && collaborators.length > 0 && (
              <div className="mt-2 text-center">
                {collaborators.map((name, idx) => (
                  <p key={idx} className="text-sm text-gray-700">{name}</p>
                ))}
              </div>
              )}
            </div>
          ))}
        </motion.div>

        <motion.h3 
          className="text-[#15B659] tracking-light text-xl sm:text-2xl font-bold leading-tight text-center mt-12" 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}>
            {t('home.collaboratingEntitiesTitle')}
        </motion.h3>

        <motion.div className="flex w-full flex-wrap justify-center gap-6"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}>
          {anotherEntities.map(({ key, url, collaborators }, index) => (
            <div
              key={index}
              className="flex flex-col items-center max-h-24 justify-center w-1/2 sm:w-full md:w-1/4 p-4 mt-8"
            >
              <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                <ImageComponent
                  imageKey={key}
                  className="object-contain mix-blend-multiply max-w-[150px] sm:max-w-[200px]"
                />
              </a>
              {collaborators && collaborators.length > 0 && (
              <div className="mt-2 text-center">
                {collaborators.map((name, idx) => (
                  <p key={idx} className="text-sm text-gray-700">{name}</p>
                ))}
              </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      <div className="overflow-hidden">
        <div
          className="min-h-[80vh] px-4 py-8 flex flex-col items-center justify-center bg-[#F9FBFA]"
        >
          <motion.h2 
          className="text-[#15B659] tracking-light text-2xl sm:text-4xl font-bold leading-tight"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}>
            {t('home.contactTitle')}
          </motion.h2>
          <motion.div className="flex w-full flex-wrap py-8"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}>
            <div className="basis-full md:basis-1/2">
              <ContactForm onLoad={handleOnLoad}/>
            </div>
            <div className="basis-full md:basis-1/2 p-2 grid grid-cols-1 gap-2">
              <div className="border-t border-t-[#14281D] py-5">
                <h3 className="text-[#15B659] tracking-light text-xl sm:text-2xl font-bold leading-tight">
                  {t('home.emailTitle')}
                </h3>
                <span className="text-[#0C1811] text-sm font-normal leading-normal whitespace-pre-line">
                  {t('home.emailContact')}
                </span>
                <EmailContactGrid/>
              </div>

              <div className="border-t border-b border-t-[#14281D] border-b-[#14281D] py-5">
                <h3 className="text-[#15B659] tracking-light text-xl sm:text-2xl font-bold leading-tight">
                  {t('home.locationLabel')}
                </h3>
                <span className="text-[#0C1811] text-sm font-normal leading-normal whitespace-pre-line">
                  {t('home.locationContent')}
                </span>
              </div>
            </div>
          </motion.div>
          </div>
          <ScrollIndicator />
        </div>
        {isLoading && (<LoadSpinner/>)}
    </>
  );
};

export default Home;