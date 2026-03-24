import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Users, TrendingUp, AlertTriangle } from 'lucide-react';

const statsCards = [
  {
    id: '1',
    title: 'Tổng số bài viết',
    value: '1,234',
    icon: FileText,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: '2',
    title: 'Người dùng hoạt động',
    value: '567',
    icon: Users,
    color: '#22C55E',
    bgColor: '#F0FDF4',
  },
  {
    id: '3',
    title: 'Bài viết chờ duyệt',
    value: '23',
    icon: TrendingUp,
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    id: '4',
    title: 'Báo cáo vi phạm',
    value: '45',
    icon: AlertTriangle,
    color: '#E01515',
    bgColor: '#FFF5F5',
  },
];

const monthlyData = [
  { month: 'T1', posts: 120, users: 85 },
  { month: 'T2', posts: 145, users: 92 },
  { month: 'T3', posts: 189, users: 98 },
  { month: 'T4', posts: 156, users: 105 },
  { month: 'T5', posts: 167, users: 112 },
  { month: 'T6', posts: 201, users: 98 },
];

const categoryDistribution = [
  { name: 'Lừa đảo qua điện thoại', value: 45, color: '#E01515' },
  { name: 'Lừa đảo trực tuyến', value: 78, color: '#F59E0B' },
  { name: 'Lừa đảo đầu tư', value: 32, color: '#3B82F6' },
  { name: 'Lừa đảo tín dụng đen', value: 21, color: '#22C55E' },
  { name: 'Lừa đảo việc làm', value: 56, color: '#8B5CF6' },
  { name: 'Lừa đảo mua sắm', value: 89, color: '#EC4899' },
  { name: 'Lừa đảo giả danh', value: 43, color: '#14B8A6' },
  { name: 'Lừa đảo bất động sản', value: 18, color: '#F97316' },
];

const trendData = [
  { month: 'T1', posts: 98, users: 85 },
  { month: 'T2', posts: 105, users: 92 },
  { month: 'T3', posts: 112, users: 98 },
  { month: 'T4', posts: 108, users: 105 },
  { month: 'T5', posts: 118, users: 112 },
  { month: 'T6', posts: 125, users: 120 },
];

const categoryTable = [
  { id: 'cat-1', category: 'Lừa đảo mua sắm', posts: 89, growth: '+10%', percentage: '23.8%' },
  { id: 'cat-2', category: 'Lừa đảo trực tuyến', posts: 78, growth: '+6%', percentage: '20.9%' },
  { id: 'cat-3', category: 'Lừa đảo việc làm', posts: 56, growth: '+15%', percentage: '15.0%' },
  { id: 'cat-4', category: 'Lừa đảo qua điện thoại', posts: 45, growth: '+18%', percentage: '12.0%' },
  { id: 'cat-5', category: 'Lừa đảo giả danh', posts: 43, growth: '+13%', percentage: '11.5%' },
  { id: 'cat-6', category: 'Khác', posts: 63, growth: '+10%', percentage: '16.8%' },
];

export function AdminStatistics() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Báo cáo và thống kê hệ thống</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <Icon className="h-6 w-6" style={{ color: card.color }} />
                </div>
              </div>
              <div className="text-sm text-[#99A1AF] mb-1">{card.title}</div>
              <div className="text-3xl font-bold text-[#1E293B]">{card.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Monthly Stats */}
        <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6">
          <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Thống kê theo tháng</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#99A1AF" />
              <YAxis stroke="#99A1AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #D1D5DC',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="posts" fill="#E01515" name="Bài viết" radius={[4, 4, 0, 0]} />
              <Bar dataKey="users" fill="#22C55E" name="Người dùng mới" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6">
          <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Phân bố theo danh mục</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #D1D5DC',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 mb-8">
        <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Xu hướng tăng trưởng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#99A1AF" />
            <YAxis stroke="#99A1AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #D1D5DC',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="posts" 
              stroke="#E01515" 
              strokeWidth={2}
              name="Bài viết" 
              dot={{ fill: '#E01515', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="users" 
              stroke="#22C55E" 
              strokeWidth={2}
              name="Người dùng" 
              dot={{ fill: '#22C55E', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Table */}
      <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6">
        <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Bảng thống kê chi tiết</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D1D5DC]">
              <th className="text-left py-3 px-4 text-sm font-medium text-[#4A5565]">Danh mục</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#4A5565]">Số bài viết</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#4A5565]">Tăng trưởng</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[#4A5565]">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody>
            {categoryTable.map((row) => (
              <tr key={row.id} className="border-b border-[#D1D5DC] last:border-0 hover:bg-[#F9FAFB]">
                <td className="py-3 px-4 text-sm text-[#1E293B]">{row.category}</td>
                <td className="py-3 px-4 text-sm text-[#1E293B]">{row.posts}</td>
                <td className="py-3 px-4 text-sm text-[#22C55E] font-medium">{row.growth}</td>
                <td className="py-3 px-4 text-sm text-[#1E293B]">{row.percentage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}