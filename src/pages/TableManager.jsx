import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Download, Copy, Table as TableIcon, QrCode } from 'lucide-react';

const TableManager = () => {
  const [tables, setTables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({
    tableNumber: '',
    tableName: '',
    capacity: 4
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tables'), (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const generateTableQR = (tableId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/menu/${tableId}`;
  };

  const createTable = async () => {
    if (!newTable.tableNumber || !newTable.tableName) return;

    try {
      const tableData = {
        tableNumber: newTable.tableNumber.toUpperCase(),
        tableName: newTable.tableName,
        capacity: parseInt(newTable.capacity),
        isActive: true,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'tables'), tableData);
      
      // Update with QR code data
      const qrData = generateTableQR(docRef.id);
      await updateDoc(docRef, {
        qrData: qrData
      });

      setNewTable({ tableNumber: '', tableName: '', capacity: 4 });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };

  const deleteTable = async (tableId) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      await deleteDoc(doc(db, 'tables', tableId));
    }
  };

  const downloadQRCode = (tableId, tableNumber) => {
    const svg = document.getElementById(`qrcode-${tableId}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `table-${tableNumber}-qrcode.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyQRUrl = (tableId) => {
    const url = generateTableQR(tableId);
    navigator.clipboard.writeText(url).then(() => {
      alert('QR URL copied to clipboard!');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-600 mt-1">Create and manage table QR codes</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Table</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <TableIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{table.tableName}</h3>
                    <p className="text-gray-600 text-sm">Table {table.tableNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Capacity: {table.capacity || 4}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    table.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {table.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteTable(table.id)}
                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete table"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-xl">
              <QRCodeSVG
                id={`qrcode-${table.id}`}
                value={generateTableQR(table.id)}
                size={140}
                level="H"
                includeMargin
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => downloadQRCode(table.id, table.tableNumber)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors font-medium"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => copyQRUrl(table.id)}
                className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-sm flex items-center justify-center space-x-2 hover:bg-blue-200 transition-colors font-medium"
              >
                <Copy className="h-4 w-4" />
                <span>Copy URL</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <QrCode className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tables yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first table to generate QR codes for customers to scan and order
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-200"
          >
            Create Your First Table
          </button>
        </div>
      )}

      {/* Add Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Table</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Number *</label>
                <input
                  type="text"
                  value={newTable.tableNumber}
                  onChange={(e) => setNewTable({...newTable, tableNumber: e.target.value})}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3 border"
                  placeholder="e.g., T01, A12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Name *</label>
                <input
                  type="text"
                  value={newTable.tableName}
                  onChange={(e) => setNewTable({...newTable, tableName: e.target.value})}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3 border"
                  placeholder="e.g., Window Side, Garden View"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <select
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({...newTable, capacity: e.target.value})}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3 border"
                >
                  {[2, 4, 6, 8, 10].map(num => (
                    <option key={num} value={num}>{num} people</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                onClick={createTable}
                disabled={!newTable.tableNumber || !newTable.tableName}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105 transition-all duration-200"
              >
                Create Table
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewTable({ tableNumber: '', tableName: '', capacity: 4 });
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManager;