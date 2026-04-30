import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  School, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
}

const StatCard = ({ title, value, icon: Icon, trend, trendUp }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <div className={`flex items-center text-sm ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        <span className="ml-1 font-medium">{trend}</span>
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

const DashboardSummary: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back, Admin. Here is what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Preschool Enrollment" 
          value="84" 
          icon={School} 
          trend="12%" 
          trendUp={true} 
        />
        <StatCard 
          title="Monthly Revenue" 
          value="$14,250" 
          icon={TrendingUp} 
          trend="8.4%" 
          trendUp={true} 
        />
        <StatCard 
          title="Total Expenses" 
          value="$5,120" 
          icon={Wallet} 
          trend="2.1%" 
          trendUp={false} 
        />
        <StatCard 
          title="Active Employees" 
          value="18" 
          icon={Users} 
          trend="0%" 
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-bottom border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Investments</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr>
                <td className="px-6 py-4 font-medium">Summer Camp Gear</td>
                <td className="px-6 py-4 text-slate-500">Oct 24, 2023</td>
                <td className="px-6 py-4 font-semibold text-slate-900">$1,200</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">Completed</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Classroom Tech</td>
                <td className="px-6 py-4 text-slate-500">Oct 22, 2023</td>
                <td className="px-6 py-4 font-semibold text-slate-900">$3,450</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">Pending</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Quick Glance - Attendance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">Today's Attendance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm">Students Present</span>
              <span className="font-bold text-blue-600">92%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-600 text-sm">Staff Present</span>
              <span className="font-bold text-emerald-500">100%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <div className="flex items-center gap-3">
              <Calendar className="text-slate-400" size={20} />
              <p className="text-xs text-slate-500">Next Summer Camp session starts in 14 days.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
