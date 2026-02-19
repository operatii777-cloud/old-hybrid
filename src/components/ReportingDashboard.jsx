import React, { useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from 'axios';
import { exportAgGridToCSV, exportAgGridToExcel } from '../utils/exportUtils';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

const ReportingDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const gridRef = useRef();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersResponse = await axios.get('/api/comenzi', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end
        }
      });
      
      setOrders(ordersResponse.data.data || []);
      
      // Calculate statistics
      const ordersData = ordersResponse.data.data || [];
      calculateStats(ordersData);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = ordersData.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const statusCounts = ordersData.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    
    setStats({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      statusCounts
    });
  };

  // Column definitions for AG Grid
  const columnDefs = [
    { 
      headerName: 'ID Comandă', 
      field: 'id', 
      width: 180,
      checkboxSelection: true,
      headerCheckboxSelection: true
    },
    { 
      headerName: 'Masă', 
      field: 'masa_id', 
      width: 100 
    },
    { 
      headerName: 'Ospătar', 
      field: 'ospatar_id', 
      width: 120 
    },
    { 
      headerName: 'Data', 
      field: 'data', 
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString('ro-RO');
      }
    },
    { 
      headerName: 'Status', 
      field: 'status', 
      width: 120,
      cellStyle: (params) => {
        const colors = {
          'plasata': { backgroundColor: '#fef3c7', color: '#92400e' },
          'confirmata': { backgroundColor: '#dbeafe', color: '#1e40af' },
          'livrata': { backgroundColor: '#d1fae5', color: '#065f46' },
          'anulata': { backgroundColor: '#fee2e2', color: '#991b1b' }
        };
        return colors[params.value] || {};
      }
    },
    { 
      headerName: 'Total', 
      field: 'total', 
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '0.00 RON';
        return `${params.value.toFixed(2)} RON`;
      },
      cellStyle: { fontWeight: 'bold', textAlign: 'right' }
    },
    { 
      headerName: 'Discount', 
      field: 'discount', 
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '0.00 RON';
        return `${params.value.toFixed(2)} RON`;
      }
    },
    {
      headerName: 'Acțiuni',
      width: 150,
      cellRenderer: (params) => {
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleViewInvoice(params.data.id)}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Factură PDF
            </button>
          </div>
        );
      }
    }
  ];

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true
  };

  const handleViewInvoice = async (orderId) => {
    try {
      const response = await axios.get(`/api/invoices/${orderId}`);
      const invoiceData = response.data.data;
      await downloadInvoicePDF(invoiceData);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Eroare la generarea facturii');
    }
  };

  const handleExportCSV = () => {
    if (gridRef.current?.api) {
      exportAgGridToCSV(gridRef.current.api, 'raport-comenzi.csv');
    }
  };

  const handleExportExcel = () => {
    if (gridRef.current?.api) {
      exportAgGridToExcel(gridRef.current.api, 'raport-comenzi.xlsx');
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapoarte și Analiză</h1>
        <p className="text-gray-600">Dashboard pentru vizualizare și export date</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Vânzări</h3>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalRevenue?.toFixed(2) || '0.00'} RON
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Comenzi</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Valoare Medie Comandă</h3>
          <p className="text-2xl font-bold text-gray-900">
            {stats.avgOrderValue?.toFixed(2) || '0.00'} RON
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status Comenzi</h3>
          <div className="text-sm space-y-1">
            {Object.entries(stats.statusCounts || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="capitalize">{status}:</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Început
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Sfârșit
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Se încarcă datele...</p>
            </div>
          ) : (
            <AgGridReact
              ref={gridRef}
              rowData={orders}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={20}
              rowSelection="multiple"
              animateRows={true}
              suppressRowClickSelection={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportingDashboard;
