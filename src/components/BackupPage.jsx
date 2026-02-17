import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BackupPage = () => {
  const [loading, setLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  const [backupConfig, setBackupConfig] = useState({
    autoBackup: true,
    backupInterval: 24, // ore
    maxBackups: 30,
    includeTables: {
      comenzi: true,
      produse: true,
      stocuri: true,
      facturi: true,
      audit: false
    }
  });

  useEffect(() => {
    loadBackupHistory();
  }, []);

  const loadBackupHistory = () => {
    // Simulare istoric backup-uri
    setBackupHistory([
      { 
        id: 1, 
        filename: 'backup_2026-02-03_11-30-00.db', 
        size: '15.2 MB', 
        created_at: '2026-02-03 11:30:00',
        status: 'success',
        tables: 25
      },
      { 
        id: 2, 
        filename: 'backup_2026-02-02_23-59-58.db', 
        size: '14.8 MB', 
        created_at: '2026-02-02 23:59:58',
        status: 'success',
        tables: 25
      },
      { 
        id: 3, 
        filename: 'backup_2026-02-01_23-59-57.db', 
        size: '14.1 MB', 
        created_at: '2026-02-01 23:59:57',
        status: 'success',
        tables: 25
      },
      { 
        id: 4, 
        filename: 'backup_2026-01-31_23-59-56.db', 
        size: '13.9 MB', 
        created_at: '2026-01-31 23:59:56',
        status: 'failed',
        error: 'Disk full'
      }
    ]);
  };

  const handleBackupNow = async () => {
    setLoading(true);
    
    try {
      // Simulare backup - poate fi conectat la API real
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newBackup = {
        id: Date.now(),
        filename: `backup_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.db`,
        size: '15.7 MB',
        created_at: new Date().toISOString().replace('T', ' ').split('.')[0],
        status: 'success',
        tables: Object.keys(backupConfig.includeTables).filter(key => backupConfig.includeTables[key]).length + 20
      };

      setBackupHistory([newBackup, ...backupHistory]);
      alert('Backup creat cu succes!');
      
    } catch (error) {
      console.error('Backup error:', error);
      alert('Eroare la crearea backup-ului!');
    }
    
    setLoading(false);
  };

  const handleDeleteBackup = (backupId) => {
    if (confirm('Ștergeți acest backup?')) {
      setBackupHistory(backupHistory.filter(b => b.id !== backupId));
      alert('Backup șters cu succes!');
    }
  };

  const handleRestoreBackup = (backup) => {
    if (confirm(`Restaurați backup-ul ${backup.filename}?\n\nAceastă operație va suprascrie datele curente!`)) {
      setLoading(true);
      
      // Simulare restore
      setTimeout(() => {
        alert(`Restore completat cu succes!\n\nFișier: ${backup.filename}\nData: ${backup.created_at}\nTabele: ${backup.tables}`);
        setLoading(false);
      }, 2000);
    }
  };

  const handleConfigChange = (table, checked) => {
    setBackupConfig({
      ...backupConfig,
      includeTables: {
        ...backupConfig.includeTables,
        [table]: checked
      }
    });
  };

  const handleSaveConfig = () => {
    // Simulare salvare configurație
    alert('Configurația backup-ului a fost salvată!');
  };

  const formatFileSize = (size) => {
    return size;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">✅ Succes</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">❌ Eșuat</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">⏳ În curs</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">❓ Necunoscut</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">💾 Backup & Restore</h1>
        <p className="text-black">Gestionarea backup-urilor și restaurarea datelor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acțiuni Backup */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">🔧 Acțiuni</h2>
          
          <div className="space-y-4">
            <button
              onClick={handleBackupNow}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-bold text-lg"
            >
              {loading ? '⏳ Backup în curs...' : '💾 Backup Acum'}
            </button>

            <div className="border-t pt-4">
              <h4 className="font-bold text-black mb-2">📊 Status curent</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-black">Total backup-uri:</span>
                  <span className="text-black font-bold">{backupHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Ultimul backup:</span>
                  <span className="text-black font-bold">
                    {backupHistory.length > 0 ? 
                      new Date(backupHistory[0].created_at).toLocaleDateString() : 
                      'Nu există'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Auto-backup:</span>
                  <span className={`font-bold ${backupConfig.autoBackup ? 'text-green-600' : 'text-red-600'}`}>
                    {backupConfig.autoBackup ? '✅ Activ' : '❌ Inactiv'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Interval:</span>
                  <span className="text-black font-bold">{backupConfig.backupInterval}h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configurație */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">⚙️ Configurație</h2>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={backupConfig.autoBackup}
                  onChange={(e) => setBackupConfig({...backupConfig, autoBackup: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-black">Auto-backup zilnic</span>
              </label>
            </div>

            <div>
              <label className="block text-black font-bold mb-1">Interval (ore):</label>
              <input
                type="number"
                min="1"
                max="168"
                value={backupConfig.backupInterval}
                onChange={(e) => setBackupConfig({...backupConfig, backupInterval: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>

            <div>
              <label className="block text-black font-bold mb-1">Backup-uri maxime:</label>
              <input
                type="number"
                min="5"
                max="100"
                value={backupConfig.maxBackups}
                onChange={(e) => setBackupConfig({...backupConfig, maxBackups: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              />
            </div>

            <div>
              <h4 className="font-bold text-black mb-2">Tabele de inclus:</h4>
              <div className="space-y-1">
                {Object.keys(backupConfig.includeTables).map(table => (
                  <label key={table} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={backupConfig.includeTables[table]}
                      onChange={(e) => handleConfigChange(table, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-black capitalize">{table}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-bold"
            >
              💾 Salvează Config
            </button>
          </div>
        </div>

        {/* Istoric Backup-uri */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-black mb-4">📁 Istoric Backup-uri</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {backupHistory.map(backup => (
              <div key={backup.id} className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-black text-sm truncate mr-2">
                    {backup.filename}
                  </div>
                  {getStatusBadge(backup.status)}
                </div>
                
                <div className="text-xs text-black space-y-1">
                  <div>📅 {backup.created_at}</div>
                  <div>📊 {backup.size} | {backup.tables} tabele</div>
                  {backup.error && (
                    <div className="text-red-600">❌ {backup.error}</div>
                  )}
                </div>
                
                <div className="flex space-x-2 mt-2">
                  {backup.status === 'success' && (
                    <button
                      onClick={() => handleRestoreBackup(backup)}
                      disabled={loading}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      🔄 Restore
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteBackup(backup.id)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    🗑️ Șterge
                  </button>
                </div>
              </div>
            ))}
            
            {backupHistory.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                Nu există backup-uri în istoric.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-bold text-black mb-2">ℹ️ Informații importante</h4>
        <div className="text-sm text-black space-y-1">
          <div>• Backup-urile se stochează în directorul <code className="bg-gray-200 px-1 rounded">./backups/</code></div>
          <div>• Auto-backup-ul rulează zilnic la ora 23:59</div>
          <div>• Backup-urile mai vechi de {backupConfig.maxBackups} zile sunt șterse automat</div>
          <div>• Pentru restaurare, aplicația va fi restartată automat</div>
        </div>
      </div>
    </div>
  );
};

export default BackupPage;