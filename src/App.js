import React, { useState, useEffect, useCallback } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Explore from './pages/Explore';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Cookies from './pages/Cookies';
import DataManagement from './pages/DataManagement';
import ContentManagement from './pages/ContentManagement';
import FilesUpload from './pages/FilesUpload';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Filter from './components/Filter';
import LoadSpinner from './components/LoadSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import CookieBanner from './components/CookieBanner';
import VegetationGallery from './pages/VegetationGallery';
import { useTranslation } from 'react-i18next';
import api from './services/api';

function App() {
  const [eeVisible, setEEVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exploreError, setExploreError] = useState(false);
  const [noItalicTerms, setNoItalicTerms] = useState([]);
  const [mergedData, setMergedData] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const location = useLocation();
  const { t } = useTranslation();
  const showSideMenu = ['/cargar-archivos', '/administrar-datos', '/administrar-contenido', '/explorar'].includes(location.pathname);

  const fetchTerms = useCallback(async () => {
    try {
      const data = await api.get('/list-terms');
      setNoItalicTerms(data.terms);
    } catch {
      setExploreError(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const result = await api.get('/get-merged-data');
      setMergedData(result);
      setFilteredSpecies(result);
    } catch {
      setExploreError(true);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.pathname === '/explorar') {
      setIsLoading(true);
      setExploreError(false);
      setFilteredSpecies([]);
      setSelectedSpecies([]);
      setNoItalicTerms([]);
      Promise.all([fetchData(), fetchTerms()]).finally(() => setIsLoading(false));
    } else if (location.pathname === '/administrar-datos') {
      setSelectedData([]);
      setFilteredData([]);
    } else {
      setIsLoading(true);
      setMergedData(null);
      setSelectedSpecies([]);
      setFilteredSpecies([]);
      setFilteredData([]);
      setSelectedData([]);
    }
  }, [location.pathname, fetchData, fetchTerms]);

  const handleFileDropdownSelect = (data) => {
    setSelectedData(data);
    setFilteredData(data);
    setIsLoading(false);
  };

  const handleFilterDataChange = (filtered) => {
    setFilteredData((prev) =>
      JSON.stringify(prev) !== JSON.stringify(filtered) ? filtered : prev
    );
  };

  const handleOnSpeciesSelect = (speciesSelected) => setSelectedSpecies(speciesSelected);

  const handleFilterChange = (filtered) => {
    setFilteredSpecies((prev) =>
      JSON.stringify(prev) !== JSON.stringify(filtered) ? filtered : prev
    );
  };

  const menuOptions = [
    { id: 'filter', name: 'Filtro', component: <Filter data={mergedData} onSpeciesSelect={handleOnSpeciesSelect} onFilterChange={handleFilterChange} />, icon: 'filter_alt' },
    { id: 'dataManagementFilter', name: 'Filtro', component: <Filter data={selectedData} onSpeciesSelect={handleOnSpeciesSelect} onFilterChange={handleFilterDataChange} />, icon: 'filter_alt' },
    { id: 'dataManagement', name: 'Administrar datos', icon: 'database', link: '/administrar-datos' },
    { id: 'contentManagement', name: 'Administrar contenido', icon: 'settings', link: '/administrar-contenido' },
    { id: 'uploadFiles', name: 'Cargar archivos', icon: 'upload', link: '/cargar-archivos' },
  ];

  return (
    <div className="App">
      <Header />

      <div className="flex w-full min-h-screen sm:overflow-auto md:overflow-hidden mt-16">
        {showSideMenu && (
          <Sidebar managementData={selectedData} exploreData={mergedData} menuOptions={menuOptions} />
        )}

        <main className="flex-grow bg-[#F9FBFA] overflow-y-auto">
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route
              path="/explorar"
              element={
                isLoading ? (
                  <div className="flex bg-[#F9FBFA] justify-center items-center min-h-screen">
                    <LoadSpinner />
                  </div>
                ) : (
                  <Explore data={mergedData} filteredSpecies={filteredSpecies} selectedSpecies={selectedSpecies} noItalicTerms={noItalicTerms} hasError={exploreError} />
                )
              }
            />
            <Route path="/sobre-nosotros" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/galeria" element={<VegetationGallery />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/cargar-archivos" element={<ProtectedRoute element={<FilesUpload />} />} />
            <Route path="/administrar-contenido" element={<ProtectedRoute element={<ContentManagement />} />} />
            <Route path="/administrar-datos" element={<ProtectedRoute element={<DataManagement onFileDropdownSelect={handleFileDropdownSelect} filteredSpecies={filteredData} />} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      <footer className="bg-[#0C1811] flex justify-center relative">
        <Footer />
        <span
          className="text-[#F9FBFA] absolute bottom-2 right-2"
          onClick={() => setEEVisible(!eeVisible)}
        >
          V 1.0.0
        </span>
        {eeVisible && (
          <div className="absolute bottom-12 right-2 bg-[#F9FBFA] text-[#0C1811] p-2 rounded shadow-lg">
            {t('ee')}
          </div>
        )}
      </footer>

      <CookieBanner />
    </div>
  );
}

export default App;
