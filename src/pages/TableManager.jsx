import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot,updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Download, Copy } from 'lucide-react';

const TableManager = () => {
  const [tables, setTables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({
    tableNumber: '',
    tableName: ''
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
        tableNumber: newTable.tableNumber,
        tableName: newTable.tableName,
        isActive: true,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'tables'), tableData);
      
      // Update with QR code data
      const qrData = generateTableQR(docRef.id);
      await updateDoc(docRef, {
        qrData: qrData
      });

      setNewTable({ tableNumber: '', tableName: '' });
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
        <h1 className="text-3xl font-bold text-gray-900">Table QR Codes</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add Table</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Table {table.tableNumber}</h3>
                <p className="text-gray-600 text-sm">{table.tableName}</p>
              </div>
              <button
                onClick={() => deleteTable(table.id)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex justify-center mb-4">
              <QRCodeSVG
                id={`qrcode-${table.id}`}
                value={generateTableQR(table.id)}
                size={160}
                level="H"
                includeMargin
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => downloadQRCode(table.id, table.tableNumber)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm flex items-center justify-center space-x-1 hover:bg-gray-200"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => copyQRUrl(table.id)}
                className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-sm flex items-center justify-center space-x-1 hover:bg-blue-200"
              >
                <Copy className="h-4 w-4" />
                <span>Copy URL</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Plus className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tables yet</h3>
          <p className="text-gray-500 mb-4">Create your first table to generate QR codes</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Table
          </button>
        </div>
      )}

      {/* Add Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Table</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Table Number</label>
                <input
                  type="text"
                  value={newTable.tableNumber}
                  onChange={(e) => setNewTable({...newTable, tableNumber: e.target.value})}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., T01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Table Name</label>
                <input
                  type="text"
                  value={newTable.tableName}
                  onChange={(e) => setNewTable({...newTable, tableName: e.target.value})}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Window Side"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                onClick={createTable}
                disabled={!newTable.tableNumber || !newTable.tableName}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Table
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewTable({ tableNumber: '', tableName: '' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
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