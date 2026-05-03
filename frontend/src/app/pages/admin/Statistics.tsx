import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, FileText, Loader2, TrendingUp, Users } from 'lucide-react';
import api from '../../../api/axiosInstance';
import { Button } from '../../components/ui/button';
import { ReputationStatsSection, type ReputationStatsData } from './ReputationStats';

// NOTE VAN DAP:
// AdminStatistics doc mot endpoint tong hop /api/statistics/.
// Backend da tinh san overview, monthly_activity, growth_trend,
// category_distribution va reputation de FE chi render chart/table.

interface OverviewStats {
  total_posts: number;
  active_users: number;
  pending_posts: number;
  total_reports: number;
}

interface MonthlyActivity {
  month: string;
  posts: number;
  users: number;
  reports: number;
}

interface GrowthTrend {
  month: string;
  posts: number;
  users: number;
}

interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

interface CategoryTableRow {
  id: string;
  category: string;
  posts: number;
  growth: string;
  growth_value: number;
  percentage: string;
}

interface StatisticsResponse {
  overview: OverviewStats;
  monthly_activity: MonthlyActivity[];
  growth_trend: GrowthTrend[];
  category_distribution: CategoryDistribution[];
  category_table: CategoryTableRow[];
  reputation: ReputationStatsData;
}

const emptyStats: StatisticsResponse = {
  overview: {
    total_posts: 0,
    active_users: 0,
    pending_posts: 0,
    total_reports: 0,
  },
  monthly_activity: [],
  growth_trend: [],
  category_distribution: [],
  category_table: [],
  reputation: {
    summary: {
      total_users: 0,
      avg_score: 0,
      highest_score: 0,
    },
    users: [],
  },
};

function formatNumber(value: number) {
  return value.toLocaleString('vi-VN');
}

export function AdminStatistics() {
  const [stats, setStats] = useState<StatisticsResponse>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<StatisticsResponse>('statistics/');
      setStats(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        Object.values(err?.response?.data ?? {}).flat().join(' ') ||
        'Không thể tải dữ liệu thống kê.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statsCards = useMemo(() => [
    {
      id: 'posts',
      title: 'Tổng số bài viết',
      value: formatNumber(stats.overview.total_posts),
      icon: FileText,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
    },
    {
      id: 'users',
      title: 'Người dùng hoạt động',
      value: formatNumber(stats.overview.active_users),
      icon: Users,
      color: '#22C55E',
      bgColor: '#F0FDF4',
    },
    {
      id: 'pending',
      title: 'Bài viết chờ duyệt',
      value: formatNumber(stats.overview.pending_posts),
      icon: TrendingUp,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
    {
      id: 'reports',
      title: 'Báo cáo vi phạm',
      value: formatNumber(stats.overview.total_reports),
      icon: AlertTriangle,
      color: '#E01515',
      bgColor: '#FFF5F5',
    },
  ], [stats.overview]);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Báo cáo và thống kê hệ thống</h1>
        <div className="flex items-center justify-center py-24 text-[#64748B]">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Đang tải dữ liệu thống kê...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Báo cáo và thống kê hệ thống</h1>
        <div className="bg-white rounded-[8px] border border-[#FECACA] p-6 text-[#991B1B]">
          <p className="font-semibold">Không thể tải thống kê</p>
          <p className="text-sm mt-1">{error}</p>
          <Button onClick={fetchStats} className="mt-4 bg-[#E01515] hover:bg-[#C10007] text-white">
            Tải lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Báo cáo và thống kê hệ thống</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-[8px] border border-[#D1D5DC] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-[8px] flex items-center justify-center"
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-[8px] border border-[#D1D5DC] p-6">
          <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Thống kê theo tháng</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthly_activity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#99A1AF" />
              <YAxis stroke="#99A1AF" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DC',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="posts" fill="#E01515" name="Bài viết" radius={[4, 4, 0, 0]} />
              <Bar dataKey="users" fill="#22C55E" name="Người dùng mới" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-[8px] border border-[#D1D5DC] p-6">
          <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Phân bố theo danh mục</h2>
          {stats.category_distribution.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-[#64748B]">
              Chưa có bài viết thuộc danh mục nào.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.category_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stats.category_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DC',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[8px] border border-[#D1D5DC] p-6 mb-8">
        <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Xu hướng tăng trưởng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.growth_trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#99A1AF" />
            <YAxis stroke="#99A1AF" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #D1D5DC',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="posts"
              stroke="#E01515"
              strokeWidth={2}
              name="Tổng bài viết lũy kế"
              dot={{ fill: '#E01515', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#22C55E"
              strokeWidth={2}
              name="Tổng người dùng lũy kế"
              dot={{ fill: '#22C55E', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-[8px] border border-[#D1D5DC] p-6">
        <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Bảng thống kê chi tiết</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D1D5DC]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#4A5565]">Danh mục</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#4A5565]">Số bài viết</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#4A5565]">Tăng trưởng tháng này</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#4A5565]">Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {stats.category_table.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-sm text-[#64748B]">
                    Chưa có dữ liệu danh mục.
                  </td>
                </tr>
              ) : (
                stats.category_table.map((row) => (
                  <tr key={row.id} className="border-b border-[#D1D5DC] last:border-0 hover:bg-[#F9FAFB]">
                    <td className="py-3 px-4 text-sm text-[#1E293B]">{row.category}</td>
                    <td className="py-3 px-4 text-sm text-[#1E293B]">{formatNumber(row.posts)}</td>
                    <td className={`py-3 px-4 text-sm font-medium ${row.growth_value >= 0 ? 'text-[#22C55E]' : 'text-[#E01515]'}`}>
                      {row.growth}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#1E293B]">{row.percentage}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReputationStatsSection data={stats.reputation} />
    </div>
  );
}
