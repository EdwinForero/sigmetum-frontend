import React, { createContext, useContext, useState } from 'react';

const TutorialContext = createContext();

export const useTutorial = () => useContext(TutorialContext);

export const TutorialProvider = ({ children }) => {
  const [runTour, setRunTour] = useState(false);

  const startTutorial = () => {
    setRunTour(true);
  };

  const stopTutorial = () => {
    setRunTour(false);
  };

  return (
    <TutorialContext.Provider value={{ runTour, startTutorial, stopTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
};