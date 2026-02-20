// RESTAURANT APP HYBRID - ADMIN DASHBOARD  
// Interfața cu sidebar navigation ca în Restaurant App Hybrid Original
// Optimized with lazy loading for better performance

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRestaurantStore } from '../stores/restaurantStore';

// Lazy load all components for better code splitting and performance
const ExtendedFeatures = lazy(() => import('../components/ExtendedFeatures'));
const BIDashboard = lazy(() => import('../components/BIDashboard'));
const NIRPage = lazy(() => import('../components/NIRPage'));
const TransferPage = lazy(() => import('../components/TransferPage'));
const EditareRetetePage = lazy(() => import('../components/EditareRetetePage'));
const CatalogRetetePage = lazy(() => import('../components/CatalogRetetePage'));
const EditareProdusePage = lazy(() => import('../components/EditareProdusePage'));
const VerificareRetetePage = lazy(() => import('../components/VerificareRetetePage'));
const ActualizarePage = lazy(() => import('../components/ActualizarePage'));
const ActualizarePretPage = lazy(() => import('../components/ActualizarePretPage'));
const BackupPage = lazy(() => import('../components/BackupPage'));
const InventarPage = lazy(() => import('../components/InventarPage'));
const RapoarteStocuriPage = lazy(() => import('../components/RapoarteStocuriPage'));
const RapoarteInventarPage = lazy(() => import('../components/RapoarteInventarPage'));
const JurnalIntrariPage = lazy(() => import('../components/JurnalIntrariPage'));
const DescManualaPage = lazy(() => import('../components/DescManualaPage'));
const DescarcareVanzarePage = lazy(() => import('../components/DescarcareVanzarePage'));
const ConsumPage = lazy(() => import('../components/ConsumPage'));
const ConfigurareSystemPage = lazy(() => import('../components/ConfigurareSystemPage'));
const ReturPage = lazy(() => import('../components/ReturPage'));
const FacturiPage = lazy(() => import('../components/FacturiPage'));
const RaportFurnizoriPage = lazy(() => import('../components/RaportFurnizoriPage'));
const RaportVanzariPage = lazy(() => import('../components/RaportVanzariPage'));
const CuratareDatePage = lazy(() => import('../components/CuratareDatePage'));
const IstoricNIRPage = lazy(() => import('../components/IstoricNIRPage'));
const IstoricTransferPage = lazy(() => import('../components/IstoricTransferPage'));
const IstoricReturPage = lazy(() => import('../components/IstoricReturPage'));
const SetariPage = lazy(() => import('../components/SetariPage'));
const SincronizarePage = lazy(() => import('../components/SincronizarePage'));
const ReservationsManagement = lazy(() => import('../components/ReservationsManagement'));
const FisaTehnicaPage = lazy(() => import('../components/FisaTehnicaPage'));
const HACCPPage = lazy(() => import('../components/HACCPPage'));
const TrasabilitatePage = lazy(() => import('../components/TrasabilitatePage'));
const MateriiPrimePage = lazy(() => import('../components/MateriiPrimePage'));
const SubRetetePage = lazy(() => import('../components/SubRetetePage'));
const ReportingDashboard = lazy(() => import('../components/ReportingDashboard'));

// Loading component for better UX during lazy loading
const ComponentLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-gray-600">Se încarcă...</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { ospatar } = useRestaurantStore();
  const [activeMenuItem, setActiveMenuItem] = useState('main');
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [expandedNir, setExpandedNir] = useState(false); // submeniu NIR (sub Intrări)
  const [expandedDescarcare, setExpandedDescarcare] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!ospatar || ospatar.rol !== 'MANAGER') {
      navigate('/', { replace: true });
    }
  }, [ospatar, navigate]);

  if (!ospatar) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-black">
        <p className="text-lg">Se verifică accesul… Redirecționare către login.</p>
      </div>
    );
  }

  const handleMenuClick = (menuItem, hasSubmenu = false) => {
    if (hasSubmenu) {
      setExpandedMenu(expandedMenu === menuItem ? null : menuItem);
      setActiveMenuItem(menuItem);
      if (menuItem !== 'intrari') setExpandedNir(false); // închide NIR când deschizi alt submeniu
    } else {
      setActiveMenuItem(menuItem);
      const utilitareItems = ['config-sistem', 'verificare-retete', 'actualizare-pret', 'backup', 'inventar', 'curatare-date', 'setari'];
      const logisticaItems = ['materii-prime', 'haccp', 'trasabilitate'];
      const reteteCItems = ['editare-retete', 'catalog-retete', 'editare-produse', 'verificare', 'actualizare', 'sub-retete', 'fise-tehnice'];
      if (menuItem !== 'nir-magazie' && menuItem !== 'nir-gestiuni') setExpandedNir(false);
      setExpandedMenu(
        utilitareItems.includes(menuItem) ? 'utilitare' :
        logisticaItems.includes(menuItem) ? 'logistica' :
        reteteCItems.includes(menuItem) ? 'retete' : null
      );
      setExpandedDescarcare(['sincronizare', 'desc-manuala', 'desc-vanzare', 'consum'].includes(menuItem));
    }
  };

  const handleDescarcareToggle = (e) => {
    e.stopPropagation();
    setExpandedDescarcare((prev) => !prev);
    setActiveMenuItem('descarcare');
  };

  const handleNirToggle = (e) => {
    e.stopPropagation();
    setExpandedNir((prev) => !prev);
    setActiveMenuItem('nir');
  };

  const renderMainContent = () => {
    const content = (() => {
      switch (activeMenuItem) {
        case 'main':
          return <MainDashboard onMenuSelect={setActiveMenuItem} />;
        case 'editare-materii':
          return <EditareMaterii />;
        case 'stocuri':
          return <StocuriGestiuni />;
        case 'transfer':
          return <TransferPage />;
        case 'retur':
          return <ReturPage onIesire={() => setActiveMenuItem('main')} />;
        case 'nir':
        case 'nir-magazie':
        case 'nir-gestiuni':
          return (
            <NIRPage
              mode={activeMenuItem === 'nir-gestiuni' ? 'gestiuni' : 'magazie'}
            />
          );
        case 'furnizori':
          return <FurnizoriOriginal />;
        case 'retete':
        case 'editare-retete':
          return <EditareRetetePage />;
        case 'catalog-retete':
          return <CatalogRetetePage />;
        case 'editare-produse':
          return <EditareProdusePage />;
        case 'verificare':
        case 'verificare-retete':
          return <VerificareRetetePage />;
        case 'actualizare':
          return <ActualizarePage />;
        case 'actualizare-pret':
          return <ActualizarePretPage />;
        case 'extended-features':
          return <ExtendedFeatures />;
        case 'bi-dashboard':
          return <BIDashboard />;
        case 'backup':
          return <BackupPage />;
        case 'inventar':
          return <InventarPage />;
        case 'rapoarte-stocuri':
          return <RapoarteStocuriPage />;
        case 'rapoarte-inventar':
          return <RapoarteInventarPage />;
        case 'jurnal-intrari':
          return <JurnalIntrariPage />;
        case 'rapoarte-vanzari':
          return <RaportVanzariPage />;
        case 'desc-manuala':
          return <DescManualaPage />;
        case 'desc-vanzare':
          return <DescarcareVanzarePage />;
        case 'consum':
          return <ConsumPage />;
        case 'istoric-nir':
          return <IstoricNIRPage />;
        case 'istoric-transfer':
          return <IstoricTransferPage />;
        case 'istoric-retur':
          return <IstoricReturPage />;
        case 'config-sistem':
          return <ConfigurareSystemPage />;
        case 'facturi':
        case 'lista-facturi':
          return <FacturiPage />;
        case 'rapoarte-furnizori':
          return <RaportFurnizoriPage />;
        case 'curatare-date':
          return <CuratareDatePage />;
        case 'setari':
          return <SetariPage />;
        case 'sincronizare':
          return <SincronizarePage />;
        case 'rezervari':
          return <ReservationsManagement />;
        case 'reporting-dashboard':
          return <ReportingDashboard />;
        case 'fise-tehnice':
          return <FisaTehnicaPage />;
        case 'haccp':
          return <HACCPPage />;
        case 'trasabilitate':
          return <TrasabilitatePage />;
        case 'materii-prime':
          return <MateriiPrimePage />;
        case 'sub-retete':
          return <SubRetetePage />;
        case 'rapoarte':
          return <div className="p-8"><h2 className="text-2xl font-bold">Rapoarte</h2><p>Interfață rapoarte în dezvoltare...</p></div>;
        case 'descarcare':
          return <div className="p-8"><h2 className="text-2xl font-bold">Descărcare</h2><p>Interfață descărcare în dezvoltare...</p></div>;
        case 'istoric':
          return <div className="p-8"><h2 className="text-2xl font-bold">Istoric</h2><p>Interfață istoric în dezvoltare...</p></div>;
        default:
          return <MainDashboard onMenuSelect={setActiveMenuItem} />;
      }
    })();

    // Wrap with Suspense for lazy-loaded components
    return (
      <Suspense fallback={<ComponentLoader />}>
        {content}
      </Suspense>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 min-h-full w-full">
      {/* Sidebar Menu - Stânga (poate fi ascuns) */}
      <div
        data-testid="admin-sidebar"
        className={`${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden shrink-0 bg-gray-200 border-r-2 border-gray-400 flex flex-col transition-[width] duration-300 ease-in-out`}
      >
        <div className="w-64 flex flex-col h-full min-w-0">
          {/* Header + buton închidere */}
          <div className="p-4 border-b-2 border-gray-400 bg-gradient-to-b from-orange-100 to-yellow-50 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-center text-black">Program gestiune pentru restaurante</h1>
              <p className="text-xs text-center text-black">Restaurant App Hybrid v1.0</p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="shrink-0 p-1.5 rounded hover:bg-gray-300 text-gray-600 hover:text-black transition-colors"
              title="Ascunde meniul"
              aria-label="Ascunde meniul"
            >
              <span className="text-lg leading-none">◀</span>
            </button>
          </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          {/* Intrări */}
          <div className="border-b border-gray-300">
            <button
              onClick={() => handleMenuClick('intrari', true)}
              className="w-full p-3 text-left font-bold bg-blue-100 hover:bg-blue-200 border-b border-gray-300 flex justify-between items-center text-black"
            >
              Intrări
              <span className="text-xs text-black">{expandedMenu === 'intrari' ? '▼' : '▶'}</span>
            </button>
            {expandedMenu === 'intrari' && (
              <div className="bg-blue-50">
                <button onClick={() => handleMenuClick('editare-materii')} 
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-blue-100 text-black ${activeMenuItem === 'editare-materii' ? 'bg-blue-300 font-bold' : ''}`}>
                  Editare
                </button>
                <button onClick={() => handleMenuClick('stocuri')} 
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-blue-100 text-black ${activeMenuItem === 'stocuri' ? 'bg-blue-300 font-bold' : ''}`}>
                  Stocuri
                </button>
                <button onClick={() => handleMenuClick('transfer')} 
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-blue-100 text-black ${activeMenuItem === 'transfer' ? 'bg-blue-300 font-bold' : ''}`}>
                  Transfer
                </button>
                <button onClick={() => handleMenuClick('retur')} 
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-blue-100 text-black ${activeMenuItem === 'retur' ? 'bg-blue-300 font-bold' : ''}`}>
                  Retur
                </button>
                <div className="pl-6">
                  <button
                    type="button"
                    onClick={handleNirToggle}
                    className="w-full p-2 text-left text-sm hover:bg-blue-100 flex justify-between items-center text-black"
                  >
                    NIR
                    <span className="text-xs pr-2 text-black">{expandedNir ? '▼' : '▶'}</span>
                  </button>
                  {expandedNir && (
                    <div className="bg-blue-100" data-testid="nir-submenu">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMenuClick('nir-magazie'); }}
                        data-testid="menu-nir-magazie"
                        className={`w-full p-1 pl-4 text-left text-xs hover:bg-blue-200 text-black ${activeMenuItem === 'nir-magazie' ? 'bg-blue-400 font-bold' : ''}`}
                      >
                        Magazie
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMenuClick('nir-gestiuni'); }}
                        data-testid="menu-nir-gestiuni"
                        className={`w-full p-1 pl-4 text-left text-xs hover:bg-blue-200 text-black ${activeMenuItem === 'nir-gestiuni' ? 'bg-blue-400 font-bold' : ''}`}
                      >
                        Gestiuni
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => handleMenuClick('furnizori')} 
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-blue-100 text-black ${activeMenuItem === 'furnizori' ? 'bg-blue-300 font-bold' : ''}`}>
                  Furnizori
                </button>
              </div>
            )}
          </div>

          {/* Rețete */}
          <div className="border-b border-gray-300">
            <button
              onClick={() => handleMenuClick('retete', true)}
              className="w-full p-3 text-left font-bold bg-green-100 hover:bg-green-200 border-b border-gray-300 flex justify-between items-center text-black"
            >
              Rețete
              <span className="text-xs text-black">{expandedMenu === 'retete' ? '▼' : '▶'}</span>
            </button>
            {expandedMenu === 'retete' && (
              <div className="bg-green-50" data-testid="retete-submenu">
                <button onClick={() => handleMenuClick('editare-retete')} 
                  data-testid="menu-editare-retete"
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-green-100 text-black ${activeMenuItem === 'editare-retete' ? 'bg-green-300 font-bold' : ''}`}>
                  Editare Retete
                </button>
                <button onClick={() => handleMenuClick('catalog-retete')} 
                  data-testid="menu-catalog-retete"
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-green-100 text-black ${activeMenuItem === 'catalog-retete' ? 'bg-green-300 font-bold' : ''}`}>
                  Catalog Retete
                </button>
                <button onClick={() => handleMenuClick('editare-produse')} 
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-green-100 text-black ${activeMenuItem === 'editare-produse' ? 'bg-green-300 font-bold' : ''}`}>
                  Editare Produse
                </button>
                <button onClick={() => handleMenuClick('verificare')} 
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-green-100 text-black ${activeMenuItem === 'verificare' ? 'bg-green-300 font-bold' : ''}`}>
                  Verificare
                </button>
                <button onClick={() => handleMenuClick('actualizare')} 
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-green-100 text-black ${activeMenuItem === 'actualizare' ? 'bg-green-300 font-bold' : ''}`}>
                  Actualizare
                </button>
                <button onClick={() => handleMenuClick('sub-retete')} 
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-green-100 text-black ${activeMenuItem === 'sub-retete' ? 'bg-green-300 font-bold' : ''}`}>
                  🥘 Sub-Rețete
                </button>
                <button onClick={() => handleMenuClick('fise-tehnice')} 
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-green-100 text-black ${activeMenuItem === 'fise-tehnice' ? 'bg-green-300 font-bold' : ''}`}>
                  📋 Fișe Tehnice
                </button>
              </div>
            )}
          </div>

          {/* Logistică */}
          <div className="border-b border-gray-300">
            <button
              onClick={() => handleMenuClick('logistica', true)}
              className="w-full p-3 text-left font-bold bg-teal-100 hover:bg-teal-200 border-b border-gray-300 flex justify-between items-center text-black"
            >
              🛡️ Logistică &amp; HACCP
              <span className="text-xs text-black">{expandedMenu === 'logistica' ? '▼' : '▶'}</span>
            </button>
            {expandedMenu === 'logistica' && (
              <div className="bg-teal-50">
                <button onClick={() => handleMenuClick('materii-prime')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-teal-100 text-black ${activeMenuItem === 'materii-prime' ? 'bg-teal-300 font-bold' : ''}`}>
                  🧪 Ingrediente &amp; Alergeni
                </button>
                <button onClick={() => handleMenuClick('haccp')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-teal-100 text-black ${activeMenuItem === 'haccp' ? 'bg-teal-300 font-bold' : ''}`}>
                  🛡️ Control HACCP
                </button>
                <button onClick={() => handleMenuClick('trasabilitate')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-teal-100 text-black ${activeMenuItem === 'trasabilitate' ? 'bg-teal-300 font-bold' : ''}`}>
                  🔍 Trasabilitate
                </button>
              </div>
            )}
          </div>

          {/* Descărcare */}
          <div className="border-b border-gray-300">
            <button
              type="button"
              onClick={handleDescarcareToggle}
              className="w-full p-3 text-left font-bold bg-purple-100 hover:bg-purple-200 border-b border-gray-300 flex justify-between items-center text-black"
            >
              Descărcare
              <span className="text-xs text-black">{expandedDescarcare ? '▼' : '▶'}</span>
            </button>
            {expandedDescarcare && (
              <div className="bg-purple-50">
                <button
                  type="button"
                  onClick={() => handleMenuClick('desc-manuala')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-purple-100 text-black ${activeMenuItem === 'desc-manuala' ? 'bg-purple-300 font-bold' : ''}`}
                >
                  Descărcare manuală
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuClick('desc-vanzare')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-purple-100 text-black ${activeMenuItem === 'desc-vanzare' ? 'bg-purple-300 font-bold' : ''}`}
                >
                  Descărcare vânzare
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuClick('consum')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-purple-100 text-black ${activeMenuItem === 'consum' ? 'bg-purple-300 font-bold' : ''}`}
                >
                  Consum
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuClick('sincronizare')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-purple-100 text-black ${activeMenuItem === 'sincronizare' ? 'bg-purple-300 font-bold' : ''}`}
                >
                  Sincronizare
                </button>
              </div>
            )}
          </div>

          {/* Utilitare */}
          <div className="border-b border-gray-300">
            <button
              onClick={() => handleMenuClick('utilitare', true)}
              className="w-full p-3 text-left font-bold bg-orange-100 hover:bg-orange-200 border-b border-gray-300 flex justify-between items-center text-black"
            >
              Utilitare
              <span className="text-xs text-black">{expandedMenu === 'utilitare' ? '▼' : '▶'}</span>
            </button>
            {expandedMenu === 'utilitare' && (
              <div className="bg-orange-50">
                <button onClick={() => handleMenuClick('config-sistem')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-orange-100 text-black ${activeMenuItem === 'config-sistem' ? 'bg-orange-300 font-bold' : ''}`}>
                  Configurare
                </button>
                <button onClick={() => handleMenuClick('verificare-retete')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-orange-100 text-black ${activeMenuItem === 'verificare-retete' ? 'bg-orange-300 font-bold' : ''}`}>
                  Verificare Rețete
                </button>
                <button onClick={() => handleMenuClick('actualizare-pret')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-orange-100 text-black ${activeMenuItem === 'actualizare-pret' ? 'bg-orange-300 font-bold' : ''}`}>
                  Actualizare Preț
                </button>
                <button onClick={() => handleMenuClick('backup')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-orange-100 text-black ${activeMenuItem === 'backup' ? 'bg-orange-300 font-bold' : ''}`}>
                  Backup
                </button>
                <button onClick={() => handleMenuClick('inventar')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-orange-100 text-black ${activeMenuItem === 'inventar' ? 'bg-orange-300 font-bold' : ''}`}>
                  Inventar
                </button>
                <button onClick={() => handleMenuClick('curatare-date')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-orange-100 text-black ${activeMenuItem === 'curatare-date' ? 'bg-orange-300 font-bold' : ''}`}>
                  Curățare date
                </button>
                <button onClick={() => handleMenuClick('setari')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-orange-100 text-black ${activeMenuItem === 'setari' ? 'bg-orange-300 font-bold' : ''}`}>
                  Setări
                </button>
              </div>
            )}
          </div>

          {/* Rapoarte */}
          <div className="border-b border-gray-300">
            <button
              onClick={() => handleMenuClick('rapoarte', true)}
              className="w-full p-3 text-left font-bold bg-yellow-100 hover:bg-yellow-200 border-b border-gray-300 flex justify-between items-center text-black"
            >
              Rapoarte
              <span className="text-xs text-black">{expandedMenu === 'rapoarte' ? '▼' : '▶'}</span>
            </button>
            {expandedMenu === 'rapoarte' && (
              <div className="bg-yellow-50" data-testid="rapoarte-submenu">
                <button onClick={() => handleMenuClick('reporting-dashboard')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'reporting-dashboard' ? 'bg-yellow-300 font-bold' : ''}`}>
                  📊 Dashboard Rapoarte
                </button>
                <button onClick={() => handleMenuClick('lista-facturi')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'lista-facturi' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Lista facturi
                </button>
                <button onClick={() => handleMenuClick('rapoarte-furnizori')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'rapoarte-furnizori' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Raport furnizori
                </button>
                <button onClick={() => handleMenuClick('rapoarte-stocuri')}
                  data-testid="menu-rapoarte-stocuri"
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'rapoarte-stocuri' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Stocuri
                </button>
                <button onClick={() => handleMenuClick('rapoarte-inventar')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'rapoarte-inventar' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Inventar
                </button>
                <button onClick={() => handleMenuClick('jurnal-intrari')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'jurnal-intrari' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Jurnal intrări
                </button>
                <button onClick={() => handleMenuClick('rapoarte-vanzari')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'rapoarte-vanzari' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Vânzări & Jurnal casă
                </button>
                <button onClick={() => handleMenuClick('desc-manuala')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'desc-manuala' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Desc. manuală
                </button>
                <button onClick={() => handleMenuClick('desc-vanzare')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'desc-vanzare' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Desc. vânzare
                </button>
                <button onClick={() => handleMenuClick('consum')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'consum' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Consum
                </button>
                <button onClick={() => handleMenuClick('istoric-nir')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'istoric-nir' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Istoric NIR
                </button>
                <button onClick={() => handleMenuClick('istoric-transfer')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'istoric-transfer' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Istoric TRANSFER
                </button>
                <button onClick={() => handleMenuClick('istoric-retur')}
                  className={`w-full p-2 pl-6 text-left text-sm hover:bg-yellow-100 text-black ${activeMenuItem === 'istoric-retur' ? 'bg-yellow-300 font-bold' : ''}`}>
                  Istoric RETUR
                </button>
              </div>
            )}
          </div>

          {/* Istoric */}
          <button
            onClick={() => handleMenuClick('istoric')}
            className={`w-full p-3 text-left font-bold hover:bg-gray-300 border-b border-gray-300 text-black ${activeMenuItem === 'istoric' ? 'bg-gray-400' : 'bg-gray-200'}`}
          >
            Istoric
          </button>

          {/* BI Dashboard */}
          <button
            onClick={() => handleMenuClick('bi-dashboard')}
            className={`w-full p-3 text-left font-bold hover:bg-gray-300 border-b border-gray-300 text-black ${activeMenuItem === 'bi-dashboard' ? 'bg-gray-400' : 'bg-gray-200'}`}
          >
            📊 Business Intelligence
          </button>

          {/* Extended Features */}
          <button
            onClick={() => handleMenuClick('extended-features')}
            className={`w-full p-3 text-left font-bold hover:bg-gray-300 border-b border-gray-300 text-black ${activeMenuItem === 'extended-features' ? 'bg-gray-400' : 'bg-gray-200'}`}
          >
            🚀 Funcționalități Extinse
          </button>

          {/* Reservations */}
          <button
            onClick={() => handleMenuClick('rezervari')}
            className={`w-full p-3 text-left font-bold hover:bg-gray-300 border-b border-gray-300 text-black ${activeMenuItem === 'rezervari' ? 'bg-gray-400' : 'bg-gray-200'}`}
          >
            📅 Gestionare Rezervări
          </button>
        </div>

        {/* Footer Menu */}
        <div className="border-t-2 border-gray-400">
          <button
            onClick={() => navigate('/')}
            className="w-full p-3 text-left font-bold bg-red-100 hover:bg-red-200 text-black"
          >
            Ieșire
          </button>
        </div>
        </div>
      </div>

      {/* Buton reafășare meniu când sidebar e ascuns */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 py-4 px-2 bg-gray-300 hover:bg-gray-400 border border-gray-500 rounded-r-lg shadow text-black text-sm font-medium transition-colors"
          title="Afișează meniul"
          aria-label="Afișează meniul"
        >
          ▶ Meniu
        </button>
      )}

      {/* Main Content Area - Dreapta - fundal deschis ca să se vadă conținutul (evită ecran negru) */}
      <div data-testid="admin-main-content" className="flex-1 min-h-0 flex flex-col bg-gray-100 border-l border-gray-300">
        <div className="flex-1 min-h-0 overflow-auto bg-gray-100 p-0">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}

// ===== MAIN DASHBOARD COMPONENT =====
function MainDashboard({ onMenuSelect }) {
  const navigate = useNavigate();
  
  return (
    <div className="bg-blue-100 text-black min-h-full p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-blue-900">Program gestiune pentru restaurante</h1>
        <p className="text-lg text-blue-700">Restaurant App Hybrid v1.0</p>
      </div>

      {/* Nav Bar - Butoane pe un rând */}
      <div className="flex justify-center gap-4 mb-12 max-w-6xl mx-auto">
        <button
          onClick={() => onMenuSelect('facturi')}
          className="px-8 py-4 bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition border-2 border-blue-800"
        >
          FACTURI
        </button>
        <button
          onClick={() => onMenuSelect('retete')}
          className="px-8 py-4 bg-gradient-to-br from-green-500 to-green-700 text-white text-2xl font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition border-2 border-green-800"
        >
          RETETE
        </button>
        <button
          onClick={() => onMenuSelect('rapoarte')}
          className="px-8 py-4 bg-gradient-to-br from-yellow-500 to-yellow-700 text-white text-2xl font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition border-2 border-yellow-800"
        >
          RAPOARTE
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-gradient-to-br from-red-500 to-red-700 text-white text-2xl font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition border-2 border-red-800"
        >
          IESIRE
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-lg p-8 mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Selectează o opțiune din sidebar sau din butoanele de mai sus</h2>
          <p className="text-gray-600">Folosește meniul din stânga pentru a naviga prin toate funcționalitățile aplicației.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-blue-700">
        <p>Restaurant App Hybrid | Powered by QrOms</p>
      </div>
    </div>
  );
}

// ===== 1. NIR MAGAZIE (POZA 1) =====
function NIRMagazie() {
  const [materii, setMaterii] = React.useState([]);
  const [selectedMaterial, setSelectedMaterial] = React.useState(null);
  const [nirItems, setNirItems] = React.useState([]);
  const [formData, setFormData] = React.useState({
    data: new Date().toISOString().split('T')[0],
    fact_nr: '',
    nir_nr: '',
    furnizor: ''
  });

  React.useEffect(() => {
    loadMaterii();
  }, []);

  const loadMaterii = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load materii:', err);
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded text-black">
      <h2 className="text-xl font-bold mb-4 text-black">IntNirM</h2>

      {/* Header cu Data, Fact.nr, N.I.R., Furnizor */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div>
          <label className="italic text-black">Data</label>
          <div className="flex gap-1">
            <input type="date" value={formData.data} 
              onChange={(e) => setFormData({...formData, data: e.target.value})}
              className="w-full border p-1 text-black" />
            <button className="px-2 border bg-white text-xs text-black">Nir nou</button>
          </div>
        </div>
        <div>
          <label className="italic text-black">Fact. nr:</label>
          <input type="text" value={formData.fact_nr}
            onChange={(e) => setFormData({...formData, fact_nr: e.target.value})}
            className="w-full border p-1 text-black" />
        </div>
        <div>
          <label className="italic text-black">N.I.R.:</label>
          <input type="text" value={formData.nir_nr}
            onChange={(e) => setFormData({...formData, nir_nr: e.target.value})}
            className="w-full border p-1 text-black" />
        </div>
        <div>
          <label className="italic text-black">Furnizor:</label>
          <input type="text" value={formData.furnizor}
            onChange={(e) => setFormData({...formData, furnizor: e.target.value})}
            className="w-full border p-1 text-black" />
        </div>
      </div>

      {/* Layout 2 coloane */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2">
          <div className="border-2 border-black bg-white h-80">
            <table className="w-full text-xs">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-1 text-black">Nr.</th>
                  <th className="border p-1 text-black">Denumire</th>
                  <th className="border p-1 text-black">U.M.</th>
                  <th className="border p-1 text-black">Cant.</th>
                  <th className="border p-1 text-black">Pr. un.</th>
                  <th className="border p-1 text-black">Cota</th>
                  <th className="border p-1 text-black">Valoare</th>
                  <th className="border p-1 text-black">TVA</th>
                  <th className="border p-1 text-black">Cod.M.P.</th>
                </tr>
              </thead>
              <tbody>
                {nirItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border p-1 text-black">{idx + 1}</td>
                    <td className="border p-1 text-black">{item.denumire}</td>
                    <td className="border p-1 text-black">{item.um}</td>
                    <td className="border p-1 text-black">{item.cant}</td>
                    <td className="border p-1 text-black">{item.pret}</td>
                    <td className="border p-1 text-black">{item.cota}</td>
                    <td className="border p-1 text-black">{item.valoare}</td>
                    <td className="border p-1 text-black">{item.tva}</td>
                    <td className="border p-1 text-black">{item.cod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="mb-2 text-right">
            <button className="px-4 py-1 border bg-white italic text-black">Cautare</button>
          </div>
          <div className="border-2 border-black bg-white h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <tbody>
                {materii.map((m, idx) => (
                  <tr key={idx} onClick={() => setSelectedMaterial(m)}
                    className={`cursor-pointer border-b hover:bg-blue-100 ${
                      selectedMaterial?.cod === m.cod ? 'bg-blue-200' : ''}`}>
                    <td className="p-1">{m.denumire}</td>
                    <td className="p-1 text-right">{m.um}</td>
                    <td className="p-1 text-right">{m.pret?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Butoane jos */}
      <div className="flex justify-between">
        <div className="flex gap-4 items-center">
          <button className="px-6 py-2 border bg-white italic text-black">Validare</button>
          <span className="text-black">=</span>
          <div className="flex gap-2">
            <label className="italic text-black">Suma platita:</label>
            <input className="w-32 border p-1 text-black" />
          </div>
        </div>
        <button className="px-6 py-2 border bg-white italic text-black">Iesire</button>
      </div>
    </div>
  );
}

// ===== 2. NIR GESTIUNI (POZA 2) =====
function NIRGestiuni() {
  const [materii, setMaterii] = React.useState([]);
  const [selectedMaterial, setSelectedMaterial] = React.useState(null);
  const [nirItems, setNirItems] = React.useState([]);
  const [formData, setFormData] = React.useState({
    data: new Date().toISOString().split('T')[0],
    fact_nr: '',
    nir_nr: '',
    furnizor: ''
  });

  React.useEffect(() => {
    loadMaterii();
  }, []);

  const loadMaterii = async () => {
    try {
      const res = await axios.get('/api/magazie/materii-prime');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load materii:', err);
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-4">Introducere N.I.R.</h2>

      {/* Header cu Data, Fact.nr, N.I.R., Furnizor */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div>
          <label className="italic text-black">Data</label>
          <div className="flex gap-1">
            <input type="date" value={formData.data} 
              onChange={(e) => setFormData({...formData, data: e.target.value})}
              className="w-full border p-1 text-black" />
            <button className="px-2 border bg-white text-xs">Nir nou</button>
          </div>
        </div>
        <div>
          <label className="italic text-black">Fact. nr:</label>
          <input type="text" value={formData.fact_nr}
            onChange={(e) => setFormData({...formData, fact_nr: e.target.value})}
            className="w-full border p-1 text-black" />
        </div>
        <div>
          <label className="italic text-black">N.I.R.:</label>
          <input type="text" value={formData.nir_nr}
            onChange={(e) => setFormData({...formData, nir_nr: e.target.value})}
            className="w-full border p-1 text-black" />
        </div>
        <div>
          <label className="italic text-black">Furnizor:</label>
          <input type="text" value={formData.furnizor}
            onChange={(e) => setFormData({...formData, furnizor: e.target.value})}
            className="w-full border p-1 text-black" />
        </div>
      </div>

      {/* Layout 2 coloane */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2">
          <div className="border-2 border-black bg-white h-80">
            <table className="w-full text-xs">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-1 text-black">Nr.</th>
                  <th className="border p-1 text-black">Denumire</th>
                  <th className="border p-1 text-black">U.M.</th>
                  <th className="border p-1 text-black">Cant.</th>
                  <th className="border p-1 text-black">Pr. un.</th>
                  <th className="border p-1 text-black">Cota</th>
                  <th className="border p-1 text-black">Valoare</th>
                  <th className="border p-1 text-black">TVA</th>
                  <th className="border p-1 text-black">Cod.M.P.</th>
                </tr>
              </thead>
              <tbody>
                {nirItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border p-1 text-black">{idx + 1}</td>
                    <td className="border p-1 text-black">{item.denumire}</td>
                    <td className="border p-1 text-black">{item.um}</td>
                    <td className="border p-1 text-black">{item.cant}</td>
                    <td className="border p-1 text-black">{item.pret}</td>
                    <td className="border p-1 text-black">{item.cota}</td>
                    <td className="border p-1 text-black">{item.valoare}</td>
                    <td className="border p-1 text-black">{item.tva}</td>
                    <td className="border p-1 text-black">{item.cod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="mb-2 text-right">
            <button className="px-4 py-1 border bg-white italic text-black">Cautare</button>
          </div>
          <div className="border-2 border-black bg-white h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <tbody>
                {materii.map((m, idx) => (
                  <tr key={idx} onClick={() => setSelectedMaterial(m)}
                    className={`cursor-pointer border-b hover:bg-blue-100 ${
                      selectedMaterial?.cod === m.cod ? 'bg-blue-200' : ''}`}>
                    <td className="p-1">{m.denumire}</td>
                    <td className="p-1 text-right">{m.um}</td>
                    <td className="p-1 text-right">{m.pret?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Butoane jos */}
      <div className="flex justify-between">
        <div className="flex gap-4 items-center">
          <button className="px-6 py-2 border bg-white italic text-black">Validare</button>
          <span className="text-black">=</span>
          <div className="flex gap-2">
            <label className="italic text-black">Suma platita:</label>
            <input className="w-32 border p-1 text-black" />
          </div>
        </div>
        <button className="px-6 py-2 border bg-white italic text-black">Iesire</button>
      </div>
    </div>
  );
}

// ===== 3. FURNIZORI ORIGINAL (POZA 3) =====
function FurnizoriOriginal() {
  const [furnizori, setFurnizori] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [formData, setFormData] = React.useState({
    denumire: 'LANDI RENZO IT',
    cod_fiscal: '',
    reg_com: '',
    adresa_sediu: '',
    judetul: '',
    cont: '',
    furnizor_nou: '',
    banca: '',
    pers_contact: '',
    telefon: '',
    mobil: '',
    fax: '',
    bi_seria: '',
    bi_numar: '',
    mijloc_transport: ''
  });

  React.useEffect(() => {
    loadFurnizori();
  }, []);

  const loadFurnizori = async () => {
    try {
      const res = await axios.get('/api/magazie/furnizori');
      setFurnizori(res.data);
    } catch (err) {
      console.error('Eroare load furnizori:', err);
    }
  };

  const handleSelect = (furn) => {
    setSelected(furn);
    setFormData({
      denumire: furn.denumire || '',
      cod_fiscal: furn.cod_fiscal || '',
      reg_com: furn.reg_com || '',
      adresa_sediu: furn.adresa || '',
      judetul: furn.judetul || '',
      cont: furn.cont || '',
      furnizor_nou: '',
      banca: furn.banca || '',
      pers_contact: furn.pers_conta || '',
      telefon: furn.telefon || '',
      mobil: furn.tel_mobil || '',
      fax: furn.tel_fax || '',
      bi_seria: furn.bi_serie || '',
      bi_numar: furn.bi_numar || '',
      mijloc_transport: furn.auto || ''
    });
  };

  const handleSalvare = async () => {
    try {
      const payload = {
        denumire: formData.denumire,
        cod_fiscal: formData.cod_fiscal,
        reg_com: formData.reg_com,
        adresa: formData.adresa_sediu,
        judetul: formData.judetul,
        cont: formData.cont,
        banca: formData.banca,
        telefon: formData.telefon,
        tel_mobil: formData.mobil,
        tel_fax: formData.fax,
        pers_conta: formData.pers_contact,
        bi_serie: formData.bi_seria,
        bi_numar: formData.bi_numar,
        auto: formData.mijloc_transport
      };

      if (selected) {
        await axios.put(`/api/magazie/furnizori/${selected.id}`, payload);
        alert('Furnizor actualizat!');
      } else {
        await axios.post('/api/magazie/furnizori', payload);
        alert('Furnizor adăugat!');
      }
      loadFurnizori();
    } catch (err) {
      alert('Eroare salvare: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded text-black">
      <h2 className="text-xl font-bold mb-4 text-black">Furnizori</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* Lista furnizori stânga */}
        <div className="border-2 border-black bg-white h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                <th className="border p-1 text-black">COD</th>
                <th className="border p-1 text-black">DENUMIRE</th>
              </tr>
            </thead>
            <tbody>
              {furnizori.map((f, idx) => (
                <tr key={idx} onClick={() => handleSelect(f)}
                  className={`cursor-pointer hover:bg-blue-100 ${
                    selected?.id === f.id ? 'bg-blue-200' : ''}`}>
                  <td className="border p-1 text-black">{f.cod_client || idx + 1}</td>
                  <td className="border p-1 text-black">{f.denumire}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form dreapta */}
        <div className="space-y-2">
          <div><label className="italic text-black">Denumire:</label>
            <input type="text" value={formData.denumire}
              onChange={(e) => setFormData({...formData, denumire: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div><label className="italic text-black">Cod Fiscal:</label>
            <input type="text" value={formData.cod_fiscal}
              onChange={(e) => setFormData({...formData, cod_fiscal: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div><label className="italic text-black">Reg. Com.:</label>
            <input type="text" value={formData.reg_com}
              onChange={(e) => setFormData({...formData, reg_com: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div><label className="italic text-black">Adresa Sediu:</label>
            <input type="text" value={formData.adresa_sediu}
              onChange={(e) => setFormData({...formData, adresa_sediu: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="italic text-black">Judetul:</label>
              <input type="text" value={formData.judetul}
                onChange={(e) => setFormData({...formData, judetul: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
            <div><label className="italic text-black">Cont:</label>
              <input type="text" value={formData.cont}
                onChange={(e) => setFormData({...formData, cont: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="italic text-black">Furnizor Nou:</label>
              <input type="text" value={formData.furnizor_nou}
                onChange={(e) => setFormData({...formData, furnizor_nou: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
            <div><label className="italic text-black">Banca:</label>
              <input type="text" value={formData.banca}
                onChange={(e) => setFormData({...formData, banca: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
          </div>
          <div><label className="italic text-black">Pers. contact:</label>
            <input type="text" value={formData.pers_contact}
              onChange={(e) => setFormData({...formData, pers_contact: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="italic text-black">Telefon:</label>
              <input type="text" value={formData.telefon}
                onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
            <div><label className="italic text-black">Mobil:</label>
              <input type="text" value={formData.mobil}
                onChange={(e) => setFormData({...formData, mobil: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
            <div><label className="italic text-black">Fax:</label>
              <input type="text" value={formData.fax}
                onChange={(e) => setFormData({...formData, fax: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="italic text-black">B.I. Seria:</label>
              <input type="text" value={formData.bi_seria}
                onChange={(e) => setFormData({...formData, bi_seria: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
            <div><label className="italic text-black">B.I. Numar:</label>
              <input type="text" value={formData.bi_numar}
                onChange={(e) => setFormData({...formData, bi_numar: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
          </div>
          <div><label className="italic text-black">Mijloc de transport:</label>
            <input type="text" value={formData.mijloc_transport}
              onChange={(e) => setFormData({...formData, mijloc_transport: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
        </div>
      </div>

      {/* Butoane jos */}
      <div className="flex justify-between mt-4">
        <button className="px-6 py-2 border bg-white italic">Iesire</button>
        <button onClick={handleSalvare} className="px-6 py-2 bg-red-600 text-white font-bold">
          Salvare
        </button>
      </div>
    </div>
  );
}

// ===== 3. RETETE ORIGINAL (POZA 4) =====
function ReteteOriginal() {
  const [selectedProdus, setSelectedProdus] = React.useState(null);
  const [ingrediente, setIngrediente] = React.useState([
    { denumire: 'J&B RARE', cant: 700, um: 'ml', pret: 58.24, gest: 1 },
    { denumire: 'BURN 0.25', cant: 4, um: 'buc', pret: 13.64, gest: 4 }
  ]);
  const [produsData, setProdusData] = React.useState({
    cod: '126',
    denumire: '1ST WHISKY+4BURN',
    departament: '1',
    pret: '170',
    tva: '0%',
    nr_buc: '1',
    pret_calculat: '71.88',
    adaos: '137%'
  });

  const handleAdaugare = () => alert('Funcție Adăugare ingredient nou');
  const handleModificare = () => alert('Funcție Modificare ingredient selectat');
  const handleSterge = () => alert('Funcție Ștergere ingredient');
  const handleSalvare = () => alert('Funcție Salvare rețetă');
  const handleTiparine = () => alert('Funcție Tipărire rețetă');
  const handleListaProduse = () => alert('Funcție Listă produse');

  return (
    <div className="bg-gray-100 p-4 rounded text-black">
      <h2 className="text-xl font-bold mb-4 text-black">Retete</h2>

      {/* Butoane sus */}
      <div className="flex gap-2 mb-4">
        <button onClick={handleAdaugare} 
          className="px-4 py-2 font-bold text-white shadow-lg" style={{backgroundColor: '#E91E63'}}>
          Adaugare
        </button>
        <button onClick={handleModificare} 
          className="px-4 py-2 bg-blue-600 text-white font-bold shadow-lg">
          Modificare
        </button>
        <button onClick={handleSterge} 
          className="px-4 py-2 font-bold text-white shadow-lg" style={{backgroundColor: '#E91E63'}}>
          Sterge
        </button>
        <button onClick={handleSalvare} 
          className="px-4 py-2 bg-red-600 text-white font-bold shadow-lg">
          Salvare
        </button>
        <button onClick={handleTiparine} 
          className="px-4 py-2 bg-gray-500 text-white font-bold shadow-lg">
          Tiparire
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tabel ingrediente stânga */}
        <div>
          <table className="w-full border-2 border-black text-sm bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-1 text-black">Denumire</th>
                <th className="border p-1 text-black">Cant.</th>
                <th className="border p-1 text-black">U.M.</th>
                <th className="border p-1 text-black">Pret</th>
                <th className="border p-1 text-black">Gest.</th>
              </tr>
            </thead>
            <tbody>
              {ingrediente.map((ing, idx) => (
                <tr key={idx} className={idx === 0 ? 'bg-blue-300' : ''}>
                  <td className="border p-1 text-black">{ing.denumire}</td>
                  <td className="border p-1 text-right">{ing.cant}</td>
                  <td className="border p-1 text-black">{ing.um}</td>
                  <td className="border p-1 text-right">{ing.pret}</td>
                  <td className="border p-1 text-center">{ing.gest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form dreapta */}
        <div className="space-y-2">
          <div className="text-center">
            <button onClick={handleListaProduse} 
              className="px-4 py-2 border bg-white font-bold text-black shadow-lg">
              Lista Produse
            </button>
          </div>
          
          <div><label className="italic text-black">Cod:</label>
            <input type="text" value={produsData.cod} readOnly 
              className="w-full border p-1 bg-gray-100 text-black" />
          </div>
          <div><label className="italic text-black">Denumire:</label>
            <input type="text" value={produsData.denumire}
              onChange={(e) => setProdusData({...produsData, denumire: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div><label className="italic text-black">Departament:</label>
            <input type="text" value={produsData.departament}
              onChange={(e) => setProdusData({...produsData, departament: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div><label className="italic text-black">Pret:</label>
            <input type="text" value={produsData.pret}
              onChange={(e) => setProdusData({...produsData, pret: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div><label className="italic text-black">T.V.A.:</label>
            <input type="text" value={produsData.tva}
              onChange={(e) => setProdusData({...produsData, tva: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div><label className="italic text-black">Nr. buc.:</label>
            <input type="text" value={produsData.nr_buc}
              onChange={(e) => setProdusData({...produsData, nr_buc: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div><label className="italic text-black">Pret calculat:</label>
            <input type="text" value={produsData.pret_calculat}
              onChange={(e) => setProdusData({...produsData, pret_calculat: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
          <div><label className="italic text-black">Adaos:</label>
            <input type="text" value={produsData.adaos}
              onChange={(e) => setProdusData({...produsData, adaos: e.target.value})}
              className="w-full border p-1 text-black" />
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <button className="px-6 py-2 border bg-white italic text-black shadow-lg">Iesire</button>
      </div>
    </div>
  );
}

// ===== 4. VERIFICARE RETETE (POZA 5-6) =====
function VerificareRetete() {
  const [isRunning, setIsRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [produsefaraRetete, setProdusefaraRetete] = React.useState([
    'BERGENBER UNFILTRE',
    'STELLA ARTOIS 400ML',
    'STELLA ARTOIS 330ML',
    'BALLANTINES 50ML',
    'CUTTY SARK 50ML',
    'GLENGRANT 10Y',
    'MARTINI ROSE',
    'TEACHERS'
  ]);

  const handleStart = () => {
    setIsRunning(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="bg-gray-100 p-4 rounded min-h-screen text-black">
      <h2 className="text-xl font-bold mb-4 text-black">Verificare retete</h2>

      <div className="text-center mb-4">
        <button onClick={handleStart} disabled={isRunning}
          className="px-8 py-2 border-2 border-gray-400 bg-white font-bold text-black shadow-lg">
          Start
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full bg-white border-2 border-gray-400 h-8">
          <div className="h-full bg-blue-500 transition-all duration-300" 
            style={{width: `${progress}%`}}>
          </div>
        </div>
      </div>

      {/* Lista produse fără rețete */}
      <div className="bg-white border-2 border-gray-400 h-64 overflow-y-auto p-2">
        {produsefaraRetete.map((produs, idx) => (
          <p key={idx} className="text-sm text-black">Nu exista reteta la: {produs}</p>
        ))}
      </div>

      <div className="text-center mt-4">
        <button className="px-6 py-2 border bg-white italic text-black shadow-lg">Iesire</button>
      </div>
    </div>
  );
}


// ===== EDITARE MATERII PRIME (FOTO 1) =====
function EditareMaterii() {
  const [materii, setMaterii] = React.useState([
    { cod: '12', denumire: 'CAFEA', um: 'Kg', cantitate: 90 },
    { cod: '13', denumire: 'SCORȚIȘOARĂ', um: 'Kg', cantitate: 20 },
    { cod: '14', denumire: 'MENTA', um: 'Kg', cantitate: 166.33 },
    { cod: '15', denumire: 'ZAHAR VANILAT', um: 'Kg', cantitate: 30 },
    { cod: '16', denumire: 'JAMESON', um: 'Litru', cantitate: 85.95 },
    { cod: '17', denumire: 'AMRETTO DISARONO', um: 'Litru', cantitate: 90.87 },
    { cod: '18', denumire: 'BACARDI SUPERIOR', um: 'Litru', cantitate: 96.26 },
    { cod: '19', denumire: 'BAILEY\'S', um: 'Litru', cantitate: 60 }
  ]);
  
  const [selectedMaterie, setSelectedMaterie] = React.useState(materii[0]);
  const [formData, setFormData] = React.useState({
    cod: '12',
    denumire: 'CAFEA',
    um: 'Kg',
    pret: '90',
    grupa: 'Bar',
    exp: '',
    stoc_minim: '',
    cota_tva: '0',
    procesare_stoc: false
  });
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSelectMaterie = (materie) => {
    setSelectedMaterie(materie);
    setFormData({
      cod: materie.cod,
      denumire: materie.denumire,
      um: materie.um,
      pret: materie.cantitate.toString(),
      grupa: 'Bar',
      exp: '',
      stoc_minim: '',
      cota_tva: '0',
      procesare_stoc: false
    });
  };

  const handleAdaugare = () => alert('Funcție Adăugare material nou');
  const handleModificare = () => alert('Funcție Modificare material selectat');
  const handleSalvare = () => alert('Funcție Salvare modificări');

  return (
    <div className="bg-gray-100 p-4 rounded text-black">
      <h2 className="text-xl font-bold mb-4 text-black">Editare Materii Prime</h2>

      {/* Căutare */}
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Căutare"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 p-2 border rounded text-black"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Tabel materii stânga */}
        <div>
          <div className="mb-2 flex justify-between">
            <span className="text-black font-bold">Stoc gestiuni</span>
            <span className="text-black font-bold">Stoc magazie</span>
          </div>
          <div className="border-2 border-black bg-white h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <tbody>
                {materii.filter(m => m.denumire.toLowerCase().includes(searchTerm.toLowerCase())).map((materie, idx) => (
                  <tr key={idx} 
                    onClick={() => handleSelectMaterie(materie)}
                    className={`cursor-pointer border-b hover:bg-blue-100 ${
                      selectedMaterie?.cod === materie.cod ? 'bg-blue-200' : ''}`}>
                    <td className="border p-1 text-black w-8">{materie.cod}</td>
                    <td className="border p-1 text-black">{materie.denumire}</td>
                    <td className="border p-1 text-black text-center w-16">{materie.um}</td>
                    <td className="border p-1 text-black text-right w-16">{materie.cantitate}</td>
                    <td className="border p-1 text-black text-right w-8">
                      {idx === 0 ? '▲' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulare dreapta */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="italic text-black">Cod</label>
              <input type="text" value={formData.cod}
                onChange={(e) => setFormData({...formData, cod: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
            <div>
              <label className="italic text-black">Denumire</label>
              <input type="text" value={formData.denumire}
                onChange={(e) => setFormData({...formData, denumire: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="italic text-black">U.M.</label>
              <select value={formData.um}
                onChange={(e) => setFormData({...formData, um: e.target.value})}
                className="w-full border p-1 text-black">
                <option value="Kg">Kg</option>
                <option value="Litru">Litru</option>
                <option value="buc">buc</option>
              </select>
            </div>
            <div>
              <label className="italic text-black">Preț</label>
              <input type="text" value={formData.pret}
                onChange={(e) => setFormData({...formData, pret: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="italic text-black">Grupa</label>
              <select value={formData.grupa}
                onChange={(e) => setFormData({...formData, grupa: e.target.value})}
                className="w-full border p-1 text-black">
                <option value="Bar">Bar</option>
                <option value="Bucatarie">Bucătărie</option>
                <option value="Alte">Alte</option>
              </select>
            </div>
            <div>
              <label className="italic text-black">Exp.</label>
              <input type="text" value={formData.exp}
                onChange={(e) => setFormData({...formData, exp: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="italic text-black">Stoc minim</label>
              <input type="text" value={formData.stoc_minim}
                onChange={(e) => setFormData({...formData, stoc_minim: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
            <div>
              <label className="italic text-black">Cota TVA</label>
              <input type="text" value={formData.cota_tva}
                onChange={(e) => setFormData({...formData, cota_tva: e.target.value})}
                className="w-full border p-1 text-black" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" 
              checked={formData.procesare_stoc}
              onChange={(e) => setFormData({...formData, procesare_stoc: e.target.checked})}
              className="text-black" />
            <label className="italic text-black">Procesare stoc</label>
          </div>

          {/* Butoane */}
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdaugare} 
              className="px-4 py-2 font-bold text-white shadow-lg" style={{backgroundColor: '#E91E63'}}>
              Adăugare
            </button>
            <button onClick={handleModificare} 
              className="px-4 py-2 bg-blue-600 text-white font-bold shadow-lg">
              Modificare
            </button>
            <button onClick={handleSalvare} 
              className="px-4 py-2 bg-red-600 text-white font-bold shadow-lg">
              Salvare
            </button>
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <button className="px-6 py-2 border bg-white italic text-black shadow-lg">Iesire</button>
      </div>
    </div>
  );
}

function StocuriGestiuni() {
  const [gestiuneSelectata, setGestiuneSelectata] = React.useState('GESTIUNI');
  const [materii, setMaterii] = React.useState([]);
  const [nirEntries, setNirEntries] = React.useState([]);

  const [formData, setFormData] = React.useState({
    stoc_curent: '0',
    val: '0',
    furnizor: '',
    factura_nr: '',
    data_fact: '',
    nir: '',
    cant_initiala: '',
    pret: '',
    valoare: '',
    tva: '',
    cant_curenta: '',
    data_exp: ''
  });

  const [selectedMaterie, setSelectedMaterie] = React.useState(null);

  React.useEffect(() => {
    loadStocuri();
    loadNIR();
  }, []);

  const loadStocuri = async () => {
    try {
      const res = await axios.get('/api/magazie/stocuri');
      setMaterii(res.data);
    } catch (err) {
      console.error('Eroare load stocuri:', err);
    }
  };

  const loadNIR = async () => {
    try {
      const res = await axios.get('/api/magazie/nir');
      setNirEntries(res.data);
    } catch (err) {
      console.error('Eroare load NIR:', err);
    }
  };

  const handleSelectMaterie = (materie) => {
    setSelectedMaterie(materie);
    setFormData({
      ...formData,
      stoc_curent: materie.stoc.toString(),
      cant_curenta: materie.stoc.toString()
    });
  };

  const handleAdaugare = () => alert('Funcție Adăugare stoc');
  const handleModificare = () => alert('Funcție Modificare stoc');
  const handleSalvare = () => alert('Funcție Salvare stoc');
  const handleStergere = () => alert('Funcție Ștergere stoc');

  return (
    <div className="bg-gray-100 p-4 rounded text-black">
      <h2 className="text-xl font-bold mb-4 text-black">Stocuri</h2>

      {/* Dropdown GESTIUNI */}
      <div className="mb-4">
        <select 
          value={gestiuneSelectata}
          onChange={(e) => setGestiuneSelectata(e.target.value)}
          className="px-4 py-2 bg-blue-600 text-white font-bold border-2 border-blue-800 rounded shadow-lg text-center"
          style={{ minWidth: '200px' }}>
          <option value="GESTIUNI">GESTIUNI</option>
          <option value="MAGAZIE">MAGAZIE</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tabel materii stânga - cu scroll vertical */}
        <div>
          <div className="border-2 border-black bg-white h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="border p-1 text-black min-w-12">Cod</th>
                  <th className="border p-1 text-black min-w-40">Denumire</th>
                  <th className="border p-1 text-black min-w-12">UM</th>
                  <th className="border p-1 text-black min-w-16">Stoc</th>
                </tr>
              </thead>
              <tbody>
                {materii.map((materie, idx) => (
                  <tr key={idx} 
                    onClick={() => handleSelectMaterie(materie)}
                    className={`cursor-pointer border-b hover:bg-blue-100 ${
                      selectedMaterie?.cod === materie.cod ? 'bg-blue-200' : ''}`}>
                    <td className="border p-1 text-black">{materie.cod}</td>
                    <td className="border p-1 text-black">{materie.denumire}</td>
                    <td className="border p-1 text-black text-center">{materie.um}</td>
                    <td className="border p-1 text-black text-right">{materie.stoc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel NIR în dreapta sus - cu scroll orizontal și vertical */}
        <div>
          <div className="border-2 border-black bg-white h-80 overflow-auto mb-4">
            <table className="w-full text-xs min-w-max">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="border p-1 text-black text-xs min-w-16">NR_FACT</th>
                  <th className="border p-1 text-black text-xs min-w-16">NR_NIR</th>
                  <th className="border p-1 text-black text-xs min-w-20">DATA_FACT</th>
                  <th className="border p-1 text-black text-xs min-w-16">CANT_F</th>
                  <th className="border p-1 text-black text-xs min-w-12">CANT</th>
                  <th className="border p-1 text-black text-xs min-w-16">PRET</th>
                  <th className="border p-1 text-black text-xs min-w-16">VALOARE</th>
                  <th className="border p-1 text-black text-xs min-w-16">GESTIUNE</th>
                </tr>
              </thead>
              <tbody>
                {nirEntries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-blue-50">
                    <td className="border p-1 text-black text-xs whitespace-nowrap">{entry.nr_fact}</td>
                    <td className="border p-1 text-black text-xs whitespace-nowrap">{entry.nr_nir}</td>
                    <td className="border p-1 text-black text-xs whitespace-nowrap">{entry.data_fact}</td>
                    <td className="border p-1 text-black text-xs text-right">{entry.cant_f}</td>
                    <td className="border p-1 text-black text-xs text-right">{entry.cant}</td>
                    <td className="border p-1 text-black text-xs text-right">{entry.pret}</td>
                    <td className="border p-1 text-black text-xs text-right">{entry.valoare}</td>
                    <td className="border p-1 text-black text-xs whitespace-nowrap">{entry.gestiune}</td>
                  </tr>
                ))}
                {nirEntries.length === 0 && (
                  <tr>
                    <td colSpan="8" className="border p-2 text-center text-gray-500 text-xs italic">
                      Nu există înregistrări NIR
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Câmpuri detaliate pentru gestionare stoc */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="flex gap-2">
          <label className="italic text-black text-sm">Stoc curent</label>
          <input type="text" value={formData.stoc_curent} readOnly
            className="w-16 border p-1 text-black text-xs bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <label className="italic text-black text-sm">Val.</label>
          <input type="text" value={formData.val}
            onChange={(e) => setFormData({...formData, val: e.target.value})}
            className="w-16 border p-1 text-black text-xs" />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-6 gap-2">
        <div>
          <label className="italic text-black text-sm">Furnizor</label>
          <input type="text" value={formData.furnizor}
            onChange={(e) => setFormData({...formData, furnizor: e.target.value})}
            className="w-full border p-1 text-black text-xs" />
        </div>
        <div>
          <label className="italic text-black text-sm">Factura Nr</label>
          <input type="text" value={formData.factura_nr}
            onChange={(e) => setFormData({...formData, factura_nr: e.target.value})}
            className="w-full border p-1 text-black text-xs" />
        </div>
        <div>
          <label className="italic text-black text-sm">Data fact</label>
          <input type="date" value={formData.data_fact}
            onChange={(e) => setFormData({...formData, data_fact: e.target.value})}
            className="w-full border p-1 text-black text-xs" />
        </div>
        <div>
          <label className="italic text-black text-sm">N.I.R.</label>
          <input type="text" value={formData.nir}
            onChange={(e) => setFormData({...formData, nir: e.target.value})}
            className="w-full border p-1 text-black text-xs" />
        </div>
        <div>
          <label className="italic text-black text-sm">Cant. Initiala</label>
          <input type="text" value={formData.cant_initiala}
            onChange={(e) => setFormData({...formData, cant_initiala: e.target.value})}
            className="w-full border p-1 text-black text-xs" />
        </div>
        <div>
          <label className="italic text-black text-sm">Pret</label>
          <input type="text" value={formData.pret}
            onChange={(e) => setFormData({...formData, pret: e.target.value})}
            className="w-full border p-1 text-black text-xs" />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2">
        <div>
          <label className="italic text-black text-sm">Valoare</label>
          <input type="text" value={formData.valoare}
            onChange={(e) => setFormData({...formData, valoare: e.target.value})}
            className="w-full border p-1 text-black text-xs" />
        </div>
        <div>
          <label className="italic text-black text-sm">T.V.A.</label>
          <input type="text" value={formData.tva}
            onChange={(e) => setFormData({...formData, tva: e.target.value})}
            className="w-full border p-1 text-black text-xs" />
        </div>
        <div>
          <label className="italic text-black text-sm">Cant. curenta</label>
          <input type="text" value={formData.cant_curenta}
            onChange={(e) => setFormData({...formData, cant_curenta: e.target.value})}
            className="w-full border p-1 text-black text-xs" />
        </div>
        <div>
          <label className="italic text-black text-sm">Data Exp.</label>
          <input type="date" value={formData.data_exp}
            onChange={(e) => setFormData({...formData, data_exp: e.target.value})}
            className="w-full border p-1 text-black text-xs" />
        </div>
      </div>

      {/* Butoane */}
      <div className="flex gap-2 mt-4">
        <button onClick={handleAdaugare} 
          className="px-4 py-2 font-bold text-white shadow-lg" style={{backgroundColor: '#E91E63'}}>
          Adaugare
        </button>
        <button onClick={handleModificare} 
          className="px-4 py-2 bg-blue-600 text-white font-bold shadow-lg">
          Modificare
        </button>
        <button onClick={handleSalvare} 
          className="px-4 py-2 bg-red-600 text-white font-bold shadow-lg">
          Salvare
        </button>
        <button className="px-6 py-2 border bg-white italic text-black shadow-lg">
          Iesire
        </button>
        <button onClick={handleStergere} 
          className="px-4 py-2 bg-red-800 text-white font-bold shadow-lg">
          Stergere
        </button>
      </div>
    </div>
  );
}

function TransferGestiuni() {
  const [produse, setProduse] = React.useState([
    'ABSINTH', 'ABSOLUT', 'AMRETTO DISARONO', 'ASTI MARTINI', 
    'BACARDI 8Y', 'BACARDI BLACK', 'BACARDI GOLD', 'BACARDI SUPERIOR'
  ]);
  
  const [produsSelectat, setProdusSelectat] = React.useState('ABSINTH');
  const [transferHistory, setTransferHistory] = React.useState([
    { cant_int: '', cant_c: '', pret: '' },
    { cant_int: '', cant_c: '', pret: '' },
    { cant_int: '', cant_c: '', pret: '' }
  ]);

  const [nirHistory, setNirHistory] = React.useState([
    { p_nr: '', data: '', data_exp: '' },
    { p_nr: '', data: '', data_exp: '' },
    { p_nr: '', data: '', data_exp: '' }
  ]);

  const [formData, setFormData] = React.useState({
    cantitate_existenta: '0',
    data: '03/02/2026',
    cant_transferat: '',
    gestiunea_nr: '1',
    nota_transfer: ''
  });

  const handleTransfer = () => {
    alert('Transfer executat pentru ' + produsSelectat);
  };

  const handleIesire = () => {
    // Logic pentru ieșire
  };

  return (
    <div className="bg-gray-100 p-4 rounded text-black">
      <h2 className="text-xl font-bold mb-4 text-black">Transfer din Magazie în Gestiuni</h2>

      {/* Dropdown Produs */}
      <div className="mb-4">
        <label className="italic text-black mr-2">Produs</label>
        <select 
          value={produsSelectat}
          onChange={(e) => setProdusSelectat(e.target.value)}
          className="px-4 py-2 border-2 border-gray-400 bg-white text-black font-bold rounded shadow-lg"
          style={{ minWidth: '300px' }}>
          {produse.map((produs, idx) => (
            <option key={idx} value={produs}>{produs}</option>
          ))}
        </select>
        <span className="ml-4 text-black font-bold">63</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Tabel stânga */}
        <div>
          <div className="border-2 border-black bg-white h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="border p-1">Cant.int</th>
                  <th className="border p-1">Cant_c</th>
                  <th className="border p-1">Pret.un</th>
                  <th className="border p-1">Valoare</th>
                  <th className="border p-1">TVA</th>
                  <th className="border p-1">Fact.Nr</th>
                  <th className="border p-1">N.I.R.Nr</th>
                  <th className="border p-1">Data</th>
                  <th className="border p-1">Data exp</th>
                </tr>
              </thead>
              <tbody>
                {transferHistory.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border p-1 text-black">{item.cant_int}</td>
                    <td className="border p-1 text-black">{item.cant_c}</td>
                    <td className="border p-1 text-black">{item.pret}</td>
                    <td className="border p-1 text-black"></td>
                    <td className="border p-1 text-black"></td>
                    <td className="border p-1 text-black"></td>
                    <td className="border p-1 text-black"></td>
                    <td className="border p-1 text-black"></td>
                    <td className="border p-1 text-black"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel dreapta */}
        <div>
          <div className="border-2 border-black bg-white h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="border p-1">P_Nr</th>
                  <th className="border p-1">Data</th>
                  <th className="border p-1">Data exp</th>
                </tr>
              </thead>
              <tbody>
                {nirHistory.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border p-1 text-black">{item.p_nr}</td>
                    <td className="border p-1 text-black">{item.data}</td>
                    <td className="border p-1 text-black">{item.data_exp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Câmpuri pentru transfer */}
      <div className="mt-6 grid grid-cols-6 gap-4 items-end">
        <div>
          <label className="italic text-black text-sm">Cantitate Existentă</label>
          <input type="text" value={formData.cantitate_existenta} readOnly
            className="w-full border p-1 text-black bg-gray-100" />
        </div>
        <div>
          <label className="italic text-black text-sm">Data</label>
          <input type="text" value={formData.data}
            onChange={(e) => setFormData({...formData, data: e.target.value})}
            className="w-full border p-1 text-black" />
        </div>
        <div>
          <label className="italic text-black text-sm">Cant. de Transferat</label>
          <input type="text" value={formData.cant_transferat}
            onChange={(e) => setFormData({...formData, cant_transferat: e.target.value})}
            className="w-full border p-1 text-black" />
        </div>
        <div>
          <label className="italic text-black text-sm">în gestiunea nr</label>
          <input type="text" value={formData.gestiunea_nr}
            onChange={(e) => setFormData({...formData, gestiunea_nr: e.target.value})}
            className="w-full border p-1 text-black" />
        </div>
        <div>
          <label className="italic text-black text-sm">Nota de Transfer</label>
          <input type="text" value={formData.nota_transfer}
            onChange={(e) => setFormData({...formData, nota_transfer: e.target.value})}
            className="w-full border p-1 text-black" />
        </div>
        <div>
          <button onClick={handleTransfer}
            className="px-4 py-2 bg-green-600 text-white font-bold rounded shadow-lg">
            ✓ Transfer
          </button>
        </div>
      </div>

      <div className="text-center mt-6">
        <button onClick={handleIesire}
          className="px-6 py-2 bg-red-600 text-white font-bold rounded shadow-lg">
          ✗ Iesire
        </button>
      </div>
    </div>
  );
}
