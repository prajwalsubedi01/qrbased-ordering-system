import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Clock, CheckCircle, Truck, Package, Bell, Users, DollarSign,ShoppingCart} from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      
      // Count pending orders for notification
      const pending = ordersData.filter(order => order.status === 'pending').length;
      setPendingCount(pending);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: new Date()
    });
  };

  const filteredOrders = orders.filter(order => 
    filter === 'all' || order.status === filter
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'preparing': return <Package className="h-5 w-5 text-blue-500" />;
      case 'ready': return <Truck className="h-5 w-5 text-orange-500" />;
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusButton = (status, orderId) => {
    switch (status) {
      case 'pending':
        return (
          <button
            onClick={() => updateOrderStatus(orderId, 'preparing')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-200"
          >
            Start Preparing
          </button>
        );
      case 'preparing':
        return (
          <button
            onClick={() => updateOrderStatus(orderId, 'ready')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-orange-200"
          >
            Mark Ready
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => updateOrderStatus(orderId, 'completed')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-green-200"
          >
            Complete Order
          </button>
        );
      default:
        return null;
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp?.toDate) return 'Just now';
    const orderTime = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return orderTime.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          {pendingCount > 0 && (
            <div className="relative">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-2 shadow-lg">
                <Bell className="h-4 w-4" />
                <span>{pendingCount} Pending</span>
              </div>
            </div>
          )}
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-4 py-2 border"
        >
          <option value="all">All Orders ({orders.length})</option>
          <option value="pending">Pending ({pendingCount})</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Revenue</p>
              <p className="text-2xl font-bold">
                ${orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Tables</p>
              <p className="text-2xl font-bold">
                {new Set(orders.filter(o => o.status !== 'completed').map(o => o.tableNumber)).size}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {order.tableName || `Table ${order.tableNumber}`}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Order #{(order.tableNumber || order.id).toUpperCase().substring(0, 8)} • {getTimeAgo(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4 my-4">
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-bold text-blue-600">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">Total: ${order.totalAmount?.toFixed(2)}</p>
                  <p className="text-gray-500 text-sm">{order.items?.length || 0} items</p>
                </div>
                
                <div className="flex space-x-3">
                  {getStatusButton(order.status, order.id)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "No orders have been placed yet." 
                : `No ${filter} orders at the moment.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;