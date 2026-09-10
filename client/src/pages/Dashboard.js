import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowRight,
  XCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  getDashboardStats,
  getStockTrends,
  getCategoryDistribution,
  getTopProducts,
  getRecentActivity,
  getLowStockProducts
} from '../services/api';
import './Dashboard.css';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, trendsRes, categoryRes, topRes, activityRes, lowStockRes] = await Promise.all([
        getDashboardStats(),
        getStockTrends(),
        getCategoryDistribution(),
        getTopProducts(),
        getRecentActivity(),
        getLowStockProducts()
      ]);

      setStats(statsRes.data);
      setLowStockProducts(lowStockRes.data);

      // Process trends data
      const trendMap = {};
      trendsRes.data.forEach(item => {
        if (!trendMap[item._id.date]) {
          trendMap[item._id.date] = { date: item._id.date, in: 0, out: 0 };
        }
        trendMap[item._id.date][item._id.type] = item.totalQuantity;
      });
      setTrends(Object.values(trendMap).slice(-14));

      // Process category data
      setCategoryData(categoryRes.data.map(item => ({
        name: item.categoryInfo?.name || 'Uncategorized',
        value: item.count,
        quantity: item.totalQuantity
      })));

      setTopProducts(topRes.data);
      setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your inventory status</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalProducts || 0}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.lowStockCount || 0}</span>
            <span className="stat-label">Low Stock Items</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.outOfStock || 0}</span>
            <span className="stat-label">Out of Stock</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">${(stats?.totalValue || 0).toLocaleString()}</span>
            <span className="stat-label">Inventory Value</span>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="low-stock-alert card">
          <div className="alert-header">
            <AlertTriangle size={20} className="alert-icon" />
            <h3>Low Stock Alert</h3>
            <Link to="/products?filter=lowStock" className="view-all">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="low-stock-list">
            {lowStockProducts.slice(0, 5).map(product => (
              <div key={product._id} className="low-stock-item">
                <div className="item-info">
                  <span className="item-name">{product.name}</span>
                  <span className="item-barcode">{product.barcode}</span>
                </div>
                <div className="item-stock">
                  <span className={`stock-count ${product.quantity === 0 ? 'out' : 'low'}`}>
                    {product.quantity} / {product.threshold}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Stock Trends */}
        <div className="card chart-card">
          <h3>Stock Movement (Last 14 Days)</h3>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="in" name="Stock In" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="out" name="Stock Out" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">No data available</div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="card chart-card">
          <h3>Category Distribution</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">No categories yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="bottom-grid">
        {/* Top Products */}
        <div className="card">
          <h3>Top Moving Products</h3>
          {topProducts.length > 0 ? (
            <div className="top-products-list">
              {topProducts.map((product, index) => (
                <div key={product._id} className="top-product-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{product.name}</span>
                  <span className="movement">{product.totalMovement} units</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <TrendingUp size={48} />
              <p>No movement data yet</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3>Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="activity-list">
              {recentActivity.map(transaction => (
                <div key={transaction._id} className="activity-item">
                  <div className={`activity-icon ${transaction.type}`}>
                    <Activity size={16} />
                  </div>
                  <div className="activity-info">
                    <span className="activity-type">
                      Stock {transaction.type === 'in' ? 'In' : transaction.type === 'out' ? 'Out' : 'Adjustment'}
                    </span>
                    <span className="activity-detail">
                      {transaction.products.length} item(s)
                    </span>
                  </div>
                  <span className="activity-time">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Activity size={48} />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
