import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ShoppingCart, Minus, Plus, ChefHat, Clock, Star,Utensils } from 'lucide-react';

const CustomerMenu = () => {
  const { tableId } = useParams();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [tableInfo, setTableInfo] = useState(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  useEffect(() => {
    // Fetch table information
    const fetchTableInfo = async () => {
      try {
        const tableDoc = await getDoc(doc(db, 'tables', tableId));
        if (tableDoc.exists()) {
          setTableInfo(tableDoc.data());
        }
      } catch (error) {
        console.error('Error fetching table info:', error);
      }
    };

    fetchTableInfo();

    // Fetch menu items
    const q = query(collection(db, 'menuItems'), where('isAvailable', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMenuItems(items);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(items.map(item => item.categoryId))];
      setCategories(uniqueCategories);
      if (uniqueCategories.length > 0) {
        setActiveCategory(uniqueCategories[0]);
      }
    });

    return () => unsubscribe();
  }, [tableId]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing.quantity > 1) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.id !== itemId);
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    try {
      await addDoc(collection(db, 'orders'), {
        tableId,
        tableNumber: tableInfo?.tableNumber || `T-${tableId.substring(0, 4)}`,
        tableName: tableInfo?.tableName || `Table ${tableInfo?.tableNumber || tableId.substring(0, 4)}`,
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        totalAmount: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
        status: 'pending',
        createdAt: new Date(),
        customerNotified: false
      });

      setCart([]);
      setIsOrderPlaced(true);
      
      // Reset order placed message after 3 seconds
      setTimeout(() => setIsOrderPlaced(false), 3000);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isOrderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <ChefHat className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-4">Your order has been received and is being prepared.</p>
          <p className="text-sm text-gray-500">
            Table: {tableInfo?.tableName || `Table ${tableInfo?.tableNumber || tableId.substring(0, 4)}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Gourmet Restaurant</h1>
                  <p className="text-gray-600 flex items-center space-x-2">
                    <span>Welcome to</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                      {tableInfo?.tableName || `Table ${tableInfo?.tableNumber || tableId.substring(0, 4)}`}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-2 text-yellow-600">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-semibold">4.8</span>
                <span className="text-gray-500">•</span>
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">15-20 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu Section */}
          <div className="lg:w-3/4">
            {/* Category Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-6 mb-8">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-3 rounded-xl whitespace-nowrap font-medium transition-all duration-200 transform hover:scale-105 ${
                    activeCategory === category
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {menuItems
                .filter(item => item.categoryId === activeCategory)
                .map(item => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden group">
                    <div className="relative">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Utensils className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 shadow-lg">
                        <span className="font-bold text-blue-600">${item.price}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{item.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-blue-200"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">Your Order</h2>
                    <p className="text-gray-500 text-sm">{itemCount} items</p>
                  </div>
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Your cart is empty</p>
                    <p className="text-gray-400 text-sm mt-1">Add some delicious items!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-4">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                          <p className="text-blue-600 font-medium">${item.price}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="font-bold text-gray-900 min-w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-1 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-b-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-gray-700">Total:</span>
                    <span className="font-bold text-2xl text-blue-600">${total.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={placeOrder}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-green-200 text-lg"
                  >
                    Place Order
                  </button>
                  <p className="text-center text-gray-500 text-xs mt-3">
                    Your order will be prepared immediately
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMenu;