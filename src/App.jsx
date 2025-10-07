import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MenuManager from './pages/MenuManager';
import TableManager from './pages/TableManager';
import Orders from './pages/Orders';
import CustomerMenu from './pages/CustomerMenu';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Customer facing route */}
          <Route path="/menu/:tableId" element={<CustomerMenu />} />
          
          {/* Admin routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="menu" element={<MenuManager />} />
            <Route path="tables" element={<TableManager />} />
            <Route path="orders" element={<Orders />} />
          </Route>
          
          <Route path="/" element={<Login />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;