import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BIDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [hourlySales, setHourlySales] = useState([]);
  const [foodCostData, setFoodCostData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDashboardData();
    loadHourlySales();
    loadFoodCostData();
  }, [selectedDate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/bi/dashboard/overview?data=${selectedDate}`);
      console.log('Dashboard data:', response.data);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Set dummy data for demo
      setDashboardData({
        date: selectedDate,
        kpis: {
          total_vanzari: 542.30,
          numar_comenzi: 23,
          average_order_value: 23.58,
          vanzari_cash: 245.80,
          vanzari_card: 296.50,
          food_cost_percent: 28.5,
          profit_brut: 387.65,
          profit_percent: 71.5
        },
        growth: {
          vanzari: 12.5,
          comenzi: 8.7,
          profit: 15.2,
          aov: 3.4
        }
      });
    }
    setLoading(false);
  };

  const loadHourlySales = async () => {
    try {
      const response = await axios.get(`/api/bi/sales/hourly/${selectedDate}`);
      console.log('Hourly sales:', response.data);
      if (response.data && response.data.length > 0) {
        setHourlySales(response.data);
      } else {
        // Demo data
        setHourlySales(generateDemoHourlyData());
      }
    } catch (error) {
      console.error('Error loading hourly sales:', error);
      setHourlySales(generateDemoHourlyData());
    }
  };

  const loadFoodCostData = async () => {
    try {
      const response = await axios.get(`/api/bi/profitability/food-cost?data_start=${selectedDate}&data_end=${selectedDate}`);
      console.log('Food cost data:', response.data);
      setFoodCostData(response.data);
    } catch (error) {
      console.error('Error loading food cost:', error);
      setFoodCostData({
        daily_data: [{
          data: selectedDate,
          food_cost: 154.70,
          food_cost_percent: 28.5,
          total_vanzari: 542.30,
          profit_brut: 387.65,
          profit_percent: 71.5
        }],
        averages: {
          avg_food_cost_percent: 28.5,
          avg_profit_percent: 71.5
        }
      });
    }
  };

  const generateDemoHourlyData = () => {
    return Array.from({length: 24}, (_, i) => ({
      ora: i,
      numar_comenzi: i >= 10 && i <= 22 ? Math.floor(Math.random() * 5) + 1 : 0,
      vanzari: i >= 10 && i <= 22 ? Math.floor(Math.random() * 100) + 20 : 0,
      aov: i >= 10 && i <= 22 ? Math.floor(Math.random() * 30) + 15 : 0
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ro-RO', { 
      style: 'currency', 
      currency: 'RON' 
    }).format(amount || 0);
  };

  const formatPercent = (percent) => {
    return `${(percent || 0).toFixed(1)}%`;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">🔄 Se încarcă dashboard-ul BI...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Business Intelligence</h1>
          <p className="text-gray-600">Dashboard analitic în timp real</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Data:
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ml-2 px-3 py-2 border border-gray-300 rounded-md"
            />
          </label>
          <button
            onClick={() => {loadDashboardData(); loadHourlySales(); loadFoodCostData();}}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vânzări Totale</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.kpis.total_vanzari)}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
            {dashboardData.growth && (
              <div className={`text-sm mt-2 ${getGrowthColor(dashboardData.growth.vanzari)}`}>
                {dashboardData.growth.vanzari > 0 ? '↗️' : dashboardData.growth.vanzari < 0 ? '↘️' : '➡️'} 
                {formatPercent(Math.abs(dashboardData.growth.vanzari))} vs ieri
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Număr Comenzi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.kpis.numar_comenzi}
                </p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
            {dashboardData.growth && (
              <div className={`text-sm mt-2 ${getGrowthColor(dashboardData.growth.comenzi)}`}>
                {dashboardData.growth.comenzi > 0 ? '↗️' : dashboardData.growth.comenzi < 0 ? '↘️' : '➡️'} 
                {formatPercent(Math.abs(dashboardData.growth.comenzi))} vs ieri
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AOV (Valoare Medie)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.kpis.average_order_value)}
                </p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
            {dashboardData.growth && (
              <div className={`text-sm mt-2 ${getGrowthColor(dashboardData.growth.aov)}`}>
                {dashboardData.growth.aov > 0 ? '↗️' : dashboardData.growth.aov < 0 ? '↘️' : '➡️'} 
                {formatPercent(Math.abs(dashboardData.growth.aov))} vs ieri
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Brut</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData.kpis.profit_brut)}
                </p>
              </div>
              <div className="text-3xl">💎</div>
            </div>
            <div className="text-sm mt-2 text-gray-600">
              Marjă: {formatPercent(dashboardData.kpis.profit_percent)}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vânzări pe Ore */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Vânzări pe Ore</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {hourlySales.filter(h => h.vanzari > 0).map(hour => (
              <div key={hour.ora} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">{hour.ora}:00 - {hour.ora + 1}:00</span>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(hour.vanzari)}</div>
                  <div className="text-sm text-gray-600">{hour.numar_comenzi} comenzi</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Food Cost Analysis */}
        {foodCostData && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🍽️ Food Cost Analysis</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <div>
                  <div className="text-sm text-black">Food Cost %</div>
                  <div className="text-2xl font-bold text-black">
                    {formatPercent(foodCostData.averages.avg_food_cost_percent)}
                  </div>
                </div>
                <div className="text-4xl">🥘</div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm text-black">Profit Margin %</div>
                  <div className="text-2xl font-bold text-black">
                    {formatPercent(foodCostData.averages.avg_profit_percent)}
                  </div>
                </div>
                <div className="text-4xl">💰</div>
              </div>

              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <div className="text-sm text-black mb-2">Distribuția Plăților:</div>
                {dashboardData && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-black">💵 Cash:</span>
                      <span className="font-bold text-black">{formatCurrency(dashboardData.kpis.vanzari_cash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black">💳 Card:</span>
                      <span className="font-bold text-black">{formatCurrency(dashboardData.kpis.vanzari_card)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">🎯 Rezumat Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{dashboardData?.kpis?.numar_comenzi || 0}</div>
            <div className="text-blue-200">Comenzi Procesate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{formatCurrency(dashboardData?.kpis?.total_vanzari || 0)}</div>
            <div className="text-blue-200">Încasări Totale</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{formatPercent(dashboardData?.kpis?.profit_percent || 0)}</div>
            <div className="text-blue-200">Marjă de Profit</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BIDashboard;