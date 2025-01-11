import React, { useState, useEffect, useCallback  } from 'react';
import {Route, Routes, useLocation} from 'react-router-dom';
import { Link } from 'react-router-dom';
import Home from './pages/Home.js';
import About from './pages/About.js';
import Explore from './pages/Explore.js';
import NotFound from './pages/NotFound.js';
import Login from './pages/Login.js';
import Cookies from './pages/Cookies.js';
import DataManagement from './pages/DataManagement.js';
import ContentManagement from './pages/ContentManagement.js';
import FilesUpload from './pages/FilesUpload.js';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import Sidebar from './components/Sidebar.js';
import Filter from './components/Filter.js';
import LoadSpinner from './components/LoadSpinner';
import ProtectedRoute from './components/ProtectedRoute.js';
import LanguageSwitcher from './components/LanguageSwitcher.js';
import CookieBanner from './components/CookieBanner.js';
import VegetationGallery from './pages/VegetationGallery.js';
import { useTranslation } from 'react-i18next';

function App() {

  const [eeVisible, setEEVisible] = useState(false);  
  const [isLoading, setIsLoading] = useState(true);
  const [noItalicTerms, setNoItalicTerms] = useState([]);
  const [mergedData, setMergedData] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [faviconUrl, setFaviconUrl] = useState(null);
  const location = useLocation();
  const { t } = useTranslation();
  const showSideMenu = ["/cargar-archivos", "/administrar-datos", "/administrar-contenido", "/explorar"].includes(location.pathname);
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  const handleEEClick = () => {
    setEEVisible(!eeVisible);
  };

  const fetchTerms = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/list-terms`);
      const data = await response.json();
      setNoItalicTerms(data.terms);
    } catch (error) {
      console.error('Error al obtener los términos:', error);
    }
    
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/get-merged-data`);
      const result = await response.json();
      setMergedData(result);
      setFilteredSpecies(result);
    } catch (error) {
      console.error('Error al obtener los datos:', error);
    }
  }, []);

  useEffect(() => {
    const fetchFaviconUrl = async () => {
      try {
        const response = await fetch(`${BASE_URL}/get-image?imageKey=Logo.JPG`);
        const data = await response.json();
        const linkTag = document.querySelector("link[rel='icon']");
        linkTag.href = data.imageUrl;
        setFaviconUrl(data.imageUrl);
      } catch (err) {
        console.error('Error fetching signed favicon URL:', err);
      }
    };
  
    fetchFaviconUrl();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.pathname === '/explorar') {
      setIsLoading(true);
      setFilteredSpecies([]);
      setSelectedSpecies([]);
      setNoItalicTerms([]);
      Promise.all([fetchData(), fetchTerms()])
      .finally(() => {
        setIsLoading(false);
      });
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
    setFilteredData((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(filtered)) {
        return filtered;
      }
      return prev;
    });
  };

  const handleOnSpeciesSelect = (speciesSelected) => {
    setSelectedSpecies(speciesSelected);
  }

  const handleFilterChange = (filteredData) => {
    setFilteredSpecies((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(filteredData)) {
        return filteredData;
      }
      return prev;
    });
  };

  const menuOptions = [
    { id: 'filter', name: 'Filtro',  component: <Filter data={mergedData} onSpeciesSelect={handleOnSpeciesSelect} onFilterChange={handleFilterChange}/>, icon:"filter_alt"},
    { id: 'dataManagementFilter', name: 'Filtro',  component: <Filter data={selectedData} onSpeciesSelect={handleOnSpeciesSelect} onFilterChange={handleFilterDataChange}/>, icon:"filter_alt"},
    { id: 'dataManagement', name: 'Administrar datos', icon:"database", link:"/administrar-datos"},
    { id: 'contentManagement', name: 'Administrar contenido', icon:"settings", link:"/administrar-contenido"},
    { id: 'uploadFiles', name: 'Cargar archivos', icon:"upload", link:"/cargar-archivos"}
  ];

  return (
      <div className="App">
        <header className="fixed top-0 left-0 w-full bg-[#F9FBFA] border-b-2 border-[#15B659] flex items-center justify-between h-16 z-50">
          <Link to="/">
            <div className="flex items-center gap-4">
              <img src={faviconUrl} alt="Imagen" className="max-h-14 ml-4 mix-blend-multiply"/>
              <p className="font-bold text-[#0C1811] text-base sm:text-xl">SIGMETUM-A</p>
            </div>
          </Link>
          <div className="mx-6">
            <LanguageSwitcher />
          </div>
          <div className="flex flex-1 h-full justify-end gap-8 items-center">
            <Navbar />
          </div>
        </header>

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
                      <Explore data={mergedData} filteredSpecies={filteredSpecies} selectedSpecies={selectedSpecies} noItalicTerms={noItalicTerms}/>
                    )
                  }
                />
                <Route path="/sobre-nosotros" element={<About />} />
                <Route path="/login" element={<Login/>} />
                <Route path="/galeria" element={<VegetationGallery/>} />
                <Route path="/cookies" element={<Cookies/>} />
                <Route path="/cargar-archivos" element={<ProtectedRoute element={<FilesUpload/>} />} />
                <Route path="/administrar-contenido" element={<ProtectedRoute element={<ContentManagement/>} />} />
                <Route path="/administrar-datos" element={<ProtectedRoute element={<DataManagement onFileDropdownSelect={handleFileDropdownSelect} filteredSpecies={filteredData} />} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
          </main>
        </div>

        <footer className="bg-[#0C1811] flex justify-center relative">
          <Footer />
          <span 
            className="text-[#F9FBFA] absolute bottom-2 right-2"
            onClick={handleEEClick}>
              V 1.0.0
          </span>
          {eeVisible && (
          <div className="absolute bottom-12 right-2 bg-[#F9FBFA] text-[#0C1811] p-2 rounded shadow-lg">
            {t('ee')}
          </div>
          )}
        </footer>

        <CookieBanner/>
      </div>
  );
}

export default App;