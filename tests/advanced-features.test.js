/**
 * Advanced Features Completeness Tests
 * Validates that all 15 advanced hospitality features are present:
 * 1.  Hospitality Digital Identity Layer
 * 2.  Global Payment Orchestration Engine
 * 3.  Real-Time Supply Chain Network
 * 4.  Labor Optimization AI
 * 5.  Live Operation Control Center (HQ War Room)
 * 6.  Self-Healing Infrastructure
 * 7.  Experience Engine (IoT)
 * 8.  Dark Kitchen / Cloud Kitchen Mode
 * 9.  Revenue Science Layer
 * 10. Franchise Domination System
 * 11. API Economy Mode
 * 12. Global Data Network Effect
 * 13. Predictive Risk Engine
 * 14. Financial Control Layer (CFO Mode)
 * 15. Hospitality Superapp Mode
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COMPONENTS = path.join(ROOT, 'src', 'components');
const ROUTES = path.join(ROOT, 'backend', 'routes', 'admin');
const ROUTES_INDEX = path.join(ROOT, 'backend', 'routes', 'index.js');

const featureMatrix = [
  { id: 1,  name: 'Digital Identity Layer',             component: 'DigitalIdentityPage.jsx',         route: 'digital-identity.js',         apiPath: '/api/digital-identity' },
  { id: 2,  name: 'Payment Orchestration Engine',       component: 'PaymentOrchestrationPage.jsx',    route: 'payment-orchestration.js',    apiPath: '/api/payment-orchestration' },
  { id: 3,  name: 'Supply Chain Network',               component: 'SupplyChainPage.jsx',             route: 'supply-chain.js',             apiPath: '/api/supply-chain' },
  { id: 4,  name: 'Labor Optimization AI',              component: 'LaborAIPage.jsx',                 route: 'labor-ai.js',                 apiPath: '/api/labor-ai' },
  { id: 5,  name: 'HQ War Room (Live Control Center)',  component: 'HQWarRoomPage.jsx',               route: 'hq-warroom.js',               apiPath: '/api/hq-warroom' },
  { id: 6,  name: 'Self-Healing Infrastructure',        component: 'SelfHealingPage.jsx',             route: 'self-healing.js',             apiPath: '/api/self-healing' },
  { id: 7,  name: 'Experience Engine (IoT)',            component: 'ExperienceEnginePage.jsx',        route: 'experience-engine.js',        apiPath: '/api/experience-engine' },
  { id: 8,  name: 'Dark Kitchen / Cloud Kitchen',       component: 'DarkKitchenPage.jsx',             route: 'dark-kitchen.js',             apiPath: '/api/dark-kitchen' },
  { id: 9,  name: 'Revenue Science Layer',              component: 'RevenueSciencePage.jsx',          route: 'revenue-science.js',          apiPath: '/api/revenue-science' },
  { id: 10, name: 'Franchise Domination System',        component: 'FranchisePage.jsx',               route: 'franchise.js',                apiPath: '/api/franchise' },
  { id: 11, name: 'API Economy Mode',                   component: 'ApiEconomyPage.jsx',              route: 'api-economy.js',              apiPath: '/api/api-economy' },
  { id: 12, name: 'Global Data Network Effect',         component: 'GlobalDataNetworkPage.jsx',       route: 'global-data-network.js',      apiPath: '/api/global-data-network' },
  { id: 13, name: 'Predictive Risk Engine',             component: 'RiskEnginePage.jsx',              route: 'risk-engine.js',              apiPath: '/api/risk-engine' },
  { id: 14, name: 'Financial Control Layer (CFO Mode)', component: 'FinancialControlPage.jsx',        route: 'financial-control.js',        apiPath: '/api/financial-control' },
  { id: 15, name: 'Hospitality Superapp Mode',          component: 'SuperappPage.jsx',                route: 'superapp.js',                 apiPath: '/api/superapp' },
];

const routesIndexContent = fs.readFileSync(ROUTES_INDEX, 'utf8');

describe('Advanced Features – Frontend Components', () => {
  featureMatrix.forEach(({ id, name, component }) => {
    test(`Feature ${id}: ${name} – component file exists`, () => {
      const filePath = path.join(COMPONENTS, component);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test(`Feature ${id}: ${name} – component is non-empty`, () => {
      const filePath = path.join(COMPONENTS, component);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content.length).toBeGreaterThan(100);
    });
  });
});

describe('Advanced Features – Backend Route Files', () => {
  featureMatrix.forEach(({ id, name, route }) => {
    test(`Feature ${id}: ${name} – route file exists`, () => {
      const filePath = path.join(ROUTES, route);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

describe('Advanced Features – Routes Registered in index.js', () => {
  featureMatrix.forEach(({ id, name, apiPath }) => {
    test(`Feature ${id}: ${name} – API path "${apiPath}" registered`, () => {
      expect(routesIndexContent).toContain(`'${apiPath}'`);
    });
  });
});

describe('Advanced Features – AdminDashboard Navigation', () => {
  const dashboardPath = path.join(ROOT, 'src', 'pages', 'AdminDashboard.jsx');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

  const menuKeys = [
    'digital-identity',
    'payment-orchestration',
    'supply-chain',
    'labor-ai',
    'hq-warroom',
    'self-healing',
    'experience-engine',
    'dark-kitchen',
    'revenue-science',
    'franchise',
    'api-economy',
    'global-data-network',
    'risk-engine',
    'financial-control',
    'superapp',
  ];

  menuKeys.forEach(key => {
    test(`Menu key "${key}" is present in AdminDashboard`, () => {
      expect(dashboardContent).toContain(`'${key}'`);
    });
  });
});
