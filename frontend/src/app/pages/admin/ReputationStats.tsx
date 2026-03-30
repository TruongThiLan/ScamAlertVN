import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router';
import { reputationStats } from '../../data/mockData';
import { Shield, TrendingUp, TrendingDown, Users } from 'lucide-react';

export function ReputationStatsSection() {
  const { user } = useAuth();

  const totalUsers = reputationStats.length;
  const avgScore = totalUsers > 0 ? Math.round(
    reputationStats.reduce((sum: number, current: any) => sum + current.currentScore, 0) / totalUsers
  ) : 0;

  const sortedStats = [...reputationStats].sort((a, b) => b.currentScore - a.currentScore);

  return (
    <div className="mt-12">
      <div className="mb-6 border-t border-[#D1D5DC] pt-12">
        <h2 className="text-xl font-bold text-[#1E293B]">Thống kê điểm uy tín hệ thống</h2>
        <p className="text-[#4A5565] mt-1">
          Theo dõi và quản lý điểm uy tín của toàn bộ người dùng trong hệ thống
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-[#D1D5DC] p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#4A5565]">Tổng tài khoản đánh giá</p>
            <p className="text-2xl font-bold text-[#1E293B]">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D1D5DC] p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#4A5565]">Điểm uy tín trung bình</p>
            <p className="text-2xl font-bold text-[#1E293B]">{avgScore}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D1D5DC] p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#4A5565]">Người điểm cao nhất</p>
            <p className="text-2xl font-bold text-[#1E293B]">{sortedStats[0]?.currentScore || 0}</p>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="bg-white rounded-xl border border-[#D1D5DC] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#D1D5DC] bg-gray-50/50">
          <h3 className="font-semibold text-[#1E293B]">Chi tiết điểm người dùng</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#D1D5DC] text-xs font-semibold text-[#4A5565] uppercase">
                <th className="px-6 py-4">Người dùng</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-center">Điểm uy tín</th>
                <th className="px-6 py-4 text-center">Tổng điểm cộng</th>
                <th className="px-6 py-4 text-center">Tổng điểm trừ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {sortedStats.map((stat) => (
                <tr key={stat.userId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#1E293B]">
                    {stat.userName}
                  </td>
                  <td className="px-6 py-4 text-[#4A5565] text-sm">
                    {stat.userEmail}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-[#E01515]/10 text-[#E01515]">
                      {stat.currentScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-emerald-600">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      +{stat.totalGained}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-red-600">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      -{stat.totalLost}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
