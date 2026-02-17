import React, { useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from 'axios';

const ReservationsManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    num_people: 2,
    table_id: '',
    notes: ''
  });
  const gridRef = useRef();

  useEffect(() => {
    fetchReservations();
    fetchTables();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reservations');
      setReservations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get('/api/mese');
      setTables(response.data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/reservations', formData);
      alert('Rezervare creată cu succes!');
      setShowForm(false);
      setFormData({
        client_name: '',
        client_phone: '',
        client_email: '',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        num_people: 2,
        table_id: '',
        notes: ''
      });
      fetchReservations();
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert(error.response?.data?.error || 'Eroare la crearea rezervării');
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      await axios.put(`/api/reservations/${reservationId}`, {
        status: newStatus
      });
      fetchReservations();
      alert('Status actualizat!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Eroare la actualizarea statusului');
    }
  };

  const handleDelete = async (reservationId) => {
    if (!confirm('Sigur doriți să ștergeți această rezervare?')) return;
    
    try {
      await axios.delete(`/api/reservations/${reservationId}`);
      fetchReservations();
      alert('Rezervare ștearsă!');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Eroare la ștergerea rezervării');
    }
  };

  const columnDefs = [
    { 
      headerName: 'Client', 
      field: 'client_name', 
      width: 150,
      filter: true
    },
    { 
      headerName: 'Telefon', 
      field: 'client_phone', 
      width: 130 
    },
    { 
      headerName: 'Email', 
      field: 'client_email', 
      width: 180 
    },
    { 
      headerName: 'Data', 
      field: 'date', 
      width: 120,
      filter: 'agDateColumnFilter'
    },
    { 
      headerName: 'Ora', 
      field: 'time', 
      width: 100 
    },
    { 
      headerName: 'Persoane', 
      field: 'num_people', 
      width: 100,
      cellStyle: { textAlign: 'center' }
    },
    { 
      headerName: 'Masă', 
      field: 'table_name', 
      width: 100 
    },
    { 
      headerName: 'Status', 
      field: 'status', 
      width: 130,
      cellRenderer: (params) => {
        const statusColors = {
          'pending': 'bg-yellow-100 text-yellow-800',
          'confirmed': 'bg-blue-100 text-blue-800',
          'completed': 'bg-green-100 text-green-800',
          'cancelled': 'bg-red-100 text-red-800'
        };
        const colorClass = statusColors[params.value] || 'bg-gray-100 text-gray-800';
        return (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: 'Acțiuni',
      width: 250,
      cellRenderer: (params) => {
        return (
          <div className="flex gap-1">
            {params.data.status === 'pending' && (
              <button
                onClick={() => handleStatusChange(params.data.id, 'confirmed')}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirmă
              </button>
            )}
            {params.data.status === 'confirmed' && (
              <button
                onClick={() => handleStatusChange(params.data.id, 'completed')}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                Finalizează
              </button>
            )}
            <button
              onClick={() => handleStatusChange(params.data.id, 'cancelled')}
              className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Anulează
            </button>
            <button
              onClick={() => handleDelete(params.data.id)}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              Șterge
            </button>
          </div>
        );
      }
    }
  ];

  const defaultColDef = {
    sortable: true,
    resizable: true
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestionare Rezervări</h1>
          <p className="text-gray-600">Administrare rezervări mese restaurant</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Închide Formular' : '+ Rezervare Nouă'}
        </button>
      </div>

      {/* Reservation Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Rezervare Nouă</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nume Client *
              </label>
              <input
                type="text"
                required
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon *
              </label>
              <input
                type="tel"
                required
                value={formData.client_phone}
                onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.client_email}
                onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ora *
              </label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Număr Persoane *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.num_people}
                onChange={(e) => setFormData({...formData, num_people: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Masă (opțional)
              </label>
              <select
                value={formData.table_id}
                onChange={(e) => setFormData({...formData, table_id: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Selectează masa</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>
                    {table.nume} (Capacitate: {table.capacitate})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observații
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Creează Rezervare
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reservations Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Se încarcă datele...</p>
            </div>
          ) : (
            <AgGridReact
              ref={gridRef}
              rowData={reservations}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={20}
              animateRows={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationsManagement;
