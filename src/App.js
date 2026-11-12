import React, { useState, useEffect, useCallback, useId } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
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
  const [privateSessionOk, setPrivateSessionOk] = useState(false);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const filterTitleId = useId();
  const location = useLocation();
  useDocumentTitle();
  const { t } = useTranslation();
  // React Router acepta la barra final: se quita para comparar rutas.
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const isPrivateRoute = ['/cargar-archivos', '/administrar-datos', '/administrar-contenido'].includes(path);
  const showSideMenu = path === '/explorar' || (isPrivateRoute && privateSessionOk);

  // Nada privado (barra incluida) hasta que ProtectedRoute confirma la sesión; 'checking' no cambia el estado.
  const handlePrivateStatus = useCallback((status) => {
    if (status === 'ok') setPrivateSessionOk(true);
    else if (status === 'denied' || status === 'unavailable') setPrivateSessionOk(false);
  }, []);

  useEffect(() => {
    if (!isPrivateRoute) setPrivateSessionOk(false);
  }, [isPrivateRoute]);

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

  // Misma carga para la entrada en /explorar y para «Reintentar»: sin endpoints nuevos.
  const loadExplore = useCallback(() => {
    setIsLoading(true);
    setExploreError(false);
    setFilteredSpecies([]);
    setSelectedSpecies([]);
    setNoItalicTerms([]);
    Promise.all([fetchData(), fetchTerms()]).finally(() => setIsLoading(false));
  }, [fetchData, fetchTerms]);

  // Con #ancla no se sube al principio: la página de destino lleva la sección a la vista (Home con #contacto).
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [path, location.hash]);

  useEffect(() => {
    if (path === '/explorar') {
      loadExplore();
    } else if (path === '/administrar-datos') {
      setFilteredData([]);
    } else {
      setIsLoading(true);
      setMergedData(null);
      setSelectedSpecies([]);
      setFilteredSpecies([]);
      setFilteredData([]);
    }
  }, [path, loadExplore]);

  // Identidad estable: Filter repite sus efectos (y dos JSON.stringify del dataset) si estas funciones cambian en cada render.
  const handleFileDropdownSelect = useCallback((data) => {
    setFilteredData(data);
    setIsLoading(false);
  }, []);

  const handleOnSpeciesSelect = useCallback((speciesSelected) => setSelectedSpecies(speciesSelected), []);

  const handleFilterChange = useCallback((filtered) => {
    setFilteredSpecies((prev) =>
      JSON.stringify(prev) !== JSON.stringify(filtered) ? filtered : prev
    );
  }, []);

  // Remontar Filter borra su selección y, al montarse, avisa con todos los datos.
  const handleClearFilters = useCallback(() => setFilterResetKey((key) => key + 1), []);

  const menuOptions = [
    { id: 'filter', name: t('privateNav.filters'), component: <Filter key={filterResetKey} data={mergedData} onSpeciesSelect={handleOnSpeciesSelect} onFilterChange={handleFilterChange} titleId={filterTitleId} />, titleId: filterTitleId, icon: 'filter_alt' },
    { id: 'dataManagement', name: t('privateNav.data'), icon: 'database', link: '/administrar-datos' },
    { id: 'contentManagement', name: t('privateNav.content'), icon: 'settings', link: '/administrar-contenido' },
    { id: 'uploadFiles', name: t('privateNav.upload'), icon: 'upload', link: '/cargar-archivos' },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <div className={`App ${showSideMenu ? 'pb-nav md:pb-0' : ''}`}>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:inline-flex focus:min-h-11 focus:min-w-11 focus:items-center focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus-ring rounded-lg bg-surface px-4 py-3 font-bold text-ink"
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
                    <Explore
                      data={mergedData}
                      filteredSpecies={filteredSpecies}
                      selectedSpecies={selectedSpecies}
                      noItalicTerms={noItalicTerms}
                      hasError={exploreError}
                      isLoading={isLoading}
                      onRetry={loadExplore}
                      onClearFilters={handleClearFilters}
                    />
                  }
                />
                <Route path="/sobre-nosotros" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/galeria" element={<VegetationGallery />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/cargar-archivos" element={<ProtectedRoute key="cargar-archivos" onStatusChange={handlePrivateStatus} element={<FilesUpload />} />} />
                <Route path="/administrar-contenido" element={<ProtectedRoute key="administrar-contenido" onStatusChange={handlePrivateStatus} element={<ContentManagement />} />} />
                <Route path="/administrar-datos" element={<ProtectedRoute key="administrar-datos" onStatusChange={handlePrivateStatus} element={<DataManagement onFileDropdownSelect={handleFileDropdownSelect} filteredSpecies={filteredData} />} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>

          <Footer />

          <CookieBanner aboveBottomBar={showSideMenu} />
        </div>
      </ToastProvider>
    </MotionConfig>
  );
}

export default App;
