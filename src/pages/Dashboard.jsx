import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Clock,
  Bell,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';

// Import your bell sound
import bellSound from '../assets/bell-notification.mp4';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    activeTables: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previousPendingCount, setPreviousPendingCount] = useState(0);
  const audioRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(bellSound);
    audioRef.current.volume = 0.3;
  }, []);

  useEffect(() => {
    // Real-time stats for orders
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      let total = 0;
      let pending = 0;
      let revenue = 0;
      const activeTableNumbers = new Set();
      const orders = [];
      const newNotifications = [];

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = { id: change.doc.id, ...change.doc.data() };
          
          // If this is a brand new order (not from initial load), add notification
          if (order.createdAt && order.createdAt.toDate) {
            const orderTime = order.createdAt.toDate();
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            if (orderTime > fiveMinutesAgo && order.status === 'pending') {
              newNotifications.push({
                id: order.id,
                type: 'new_order',
                message: `New order from ${order.tableName || `Table ${order.tableNumber}`}`,
                tableNumber: order.tableNumber,
                amount: order.totalAmount,
                timestamp: orderTime,
                read: false
              });
            }
          }
        }
      });

      snapshot.docs.forEach(doc => {
        const order = { id: doc.id, ...doc.data() };
        total++;
        revenue += order.totalAmount || 0;
        
        if (order.status === 'pending') {
          pending++;
        }
        
        if (order.status !== 'completed' && order.status !== 'cancelled') {
          activeTableNumbers.add(order.tableNumber);
        }
        
        if (orders.length < 5) {
          orders.push(order);
        }
      });

      // Play sound when new pending orders arrive
      if (soundEnabled && pending > previousPendingCount) {
        playNotificationSound();
      }
      setPreviousPendingCount(pending);

      // Add new notifications to existing ones
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
        setUnreadCount(prev => prev + newNotifications.length);
      }

      setStats({ 
        totalOrders: total, 
        pendingOrders: pending, 
        revenue,
        activeTables: activeTableNumbers.size
      });
      setRecentOrders(orders);
    });

    return () => unsubscribeOrders();
  }, [soundEnabled, previousPendingCount]);

  const playNotificationSound = () => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.log('Audio play failed:', error);
      });
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    if (!notifications.find(n => n.id === notificationId)?.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl transition-all duration-200 ${
              soundEnabled 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={soundEnabled ? 'Mute notifications' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transform transition-all duration-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-150 group ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {notification.message}
                            </p>
                            <p className="text-blue-600 font-semibold text-sm mt-1">
                              ${notification.amount?.toFixed(2)}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Read
                              </button>
                            )}
                            <button
                              onClick={() => clearNotification(notification.id)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Dismiss"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={ShoppingCart}
          title="Total Orders"
          value={stats.totalOrders}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Clock}
          title="Pending Orders"
          value={stats.pendingOrders}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
        />
        <StatCard
          icon={DollarSign}
          title="Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatCard
          icon={Users}
          title="Active Tables"
          value={stats.activeTables}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          {stats.pendingOrders > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {stats.pendingOrders} pending
            </span>
          )}
        </div>
        <div className="p-6">
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent orders</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map(order => (
                <div 
                  key={order.id} 
                  className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                    order.status === 'pending' 
                      ? 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.tableName || `Table ${order.tableNumber}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items?.length || 0} items • {order.createdAt?.toDate().toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.totalAmount?.toFixed(2)}</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      order.status === 'ready' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;