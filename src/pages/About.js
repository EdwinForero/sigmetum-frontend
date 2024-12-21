import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import ScrollIndicator from '../components/ScrollIndicator';
import ImageComponent from '../components/ImageComponent';

const About = () => {
  const { t } = useTranslation();
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-white group/design-root overflow-x-hidden">

    <div className="bg-[#F9FBFA] px-4 py-5 min-h-[80vh] sm:px-8 sm:py-6 flex flex-1 justify-center items-center">
    <div className="max-w-[960px] flex-1 flex flex-col justify-center items-center">
      <div className="@[480px]:px-4 @[480px]:py-3">
      <div className="w-full h-[400px] bg-no-repeat flex flex-col justify-end overflow-hidden rounded-xl">
        <ImageComponent imageKey="AboutUs.jpg" />
      </div>

        <motion.h2
          className="text-[#15B659] tracking-light text-6xl font-bold leading-tight my-4 text-center"
        >
          {t('aboutUs.title')}
        </motion.h2>
        
        <motion.p
          className="text-[#14281D] text-base text-justify sm:text-lg text-center"
        >
          {t('aboutUs.ourWorkTeam')}
        </motion.p>
          </div>

          
        </div>
      </div>

      <div className="bg-[#F9FBFA] min-h-[50vh] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
        <motion.div
        className='bg-[#15B659] px-10 flex flex-col justify-center items-center h-full'
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.8, delay:0.3 }}>
            <h3 className="text-[#F9FBFA] text-xl sm:text-4xl font-bold leading-tight tracking-[-0.015em] sm:leading-snug pb-2 pt-4">
              {t('aboutUs.projectPurposeSubtitle')}
            </h3>

            <p className="text-[#0C1811] text-sm leading-tight text-justify py-2 sm:text-lg">
              {t('aboutUs.projectPurposeContent')}
            </p>
        </motion.div>

        <motion.div
        className='bg-[#F9FBFA] px-10 flex flex-col justify-center items-center h-full'
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.8, delay: 0.6 }}>
            <h3 className="text-[#15B659] text-xl sm:text-4xl font-bold leading-tight tracking-[-0.015em] sm:leading-snug pb-2 pt-4">
              {t('aboutUs.ourMissionSubtitle')}
            </h3>

            <p className="text-[#0C1811] text-sm leading-tight text-justify py-2 sm:text-lg">
              {t('aboutUs.ourMissionContent')}
            </p>
        </motion.div>

        <motion.div
        className='bg-[#15B659] px-10 flex flex-col justify-center items-center h-full'
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 0.8, delay: 0.9 }}>
            <h3 className="text-[#F9FBFA] text-xl sm:text-4xl font-bold leading-tight tracking-[-0.015em] sm:leading-snug pb-2 pt-4">
              {t('aboutUs.ourValuesSubtitle')}
            </h3>

            <p className="text-[#0C1811] text-sm leading-tight text-justify py-2 sm:text-lg">
              {t('aboutUs.ourValuesContent')}
            </p>
        </motion.div>
      </div>
      <ScrollIndicator />
    </div>
  );
};

export default About;