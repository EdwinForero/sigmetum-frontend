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
import ToastProvider from './components/ToastProvider';
import VegetationGallery from './pages/VegetationGallery';
import { useTranslation } from 'react-i18next';
import api from './services/api';
import useDocumentTitle from './hooks/useDocumentTitle';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [exploreError, setExploreError] = useState(false);
  const [noItalicTerms, setNoItalicTerms] = useState([]);
  const [mergedData, setMergedData] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const location = useLocation();
  useDocumentTitle();
  const { t } = useTranslation();
  // React Router acepta la barra final: se quita para comparar rutas.
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const isPrivateRoute = ['/cargar-archivos', '/administrar-datos', '/administrar-contenido'].includes(path);
  const showSideMenu = ['/cargar-archivos', '/administrar-datos', '/administrar-contenido', '/explorar'].includes(path);

  const fetchTerms = useCallback(async () => {
    try {
      const data = await api.get('/list-terms');
      setNoItalicTerms(data);
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
    if (path === '/explorar') {
      setIsLoading(true);
      setExploreError(false);
      setFilteredSpecies([]);
      setSelectedSpecies([]);
      setNoItalicTerms([]);
      Promise.all([fetchData(), fetchTerms()]).finally(() => setIsLoading(false));
    } else if (path === '/administrar-datos') {
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
  }, [path, fetchData, fetchTerms]);

  // Identidad estable: Filter repite sus efectos (y dos JSON.stringify del dataset) si estas funciones cambian en cada render.
  const handleFileDropdownSelect = useCallback((data) => {
    setSelectedData(data);
    setFilteredData(data);
    setIsLoading(false);
  }, []);

  const handleFilterDataChange = useCallback((filtered) => {
    setFilteredData((prev) =>
      JSON.stringify(prev) !== JSON.stringify(filtered) ? filtered : prev
    );
  }, []);

  const handleOnSpeciesSelect = useCallback((speciesSelected) => setSelectedSpecies(speciesSelected), []);

  const handleFilterChange = useCallback((filtered) => {
    setFilteredSpecies((prev) =>
      JSON.stringify(prev) !== JSON.stringify(filtered) ? filtered : prev
    );
  }, []);

  const menuOptions = [
    { id: 'filter', name: t('privateNav.filters'), component: <Filter data={mergedData} onSpeciesSelect={handleOnSpeciesSelect} onFilterChange={handleFilterChange} />, icon: 'filter_alt' },
    { id: 'dataManagementFilter', name: t('privateNav.filters'), component: <Filter data={selectedData} onSpeciesSelect={handleOnSpeciesSelect} onFilterChange={handleFilterDataChange} />, icon: 'filter_alt' },
    { id: 'dataManagement', name: t('privateNav.data'), icon: 'database', link: '/administrar-datos' },
    { id: 'contentManagement', name: t('privateNav.content'), icon: 'settings', link: '/administrar-contenido' },
    { id: 'uploadFiles', name: t('privateNav.upload'), icon: 'upload', link: '/cargar-archivos' },
  ];

  return (
    <ToastProvider>
      <div className={`App ${showSideMenu ? 'pb-nav md:pb-0 md:pl-28' : ''}`}>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus-ring rounded-lg bg-surface px-4 py-3 font-bold text-ink"
        >
          {t('skipLink')}
        </a>
        <Header />

        <div className="flex min-h-screen pt-16">
          {showSideMenu && (
            <Sidebar exploreData={mergedData} menuOptions={menuOptions} showLogout={isPrivateRoute} />
          )}

          <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 bg-surface">
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route
                path="/explorar"
                element={
                  isLoading ? (
                    <LoadSpinner />
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

        <Footer />

        <CookieBanner aboveBottomBar={showSideMenu} />
      </div>
    </ToastProvider>
  );
}

export default App;
