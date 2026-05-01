import { Shield, TrendingDown, TrendingUp, Users } from 'lucide-react';

export interface ReputationUserStat {
  user_id: number;
  user_name: string;
  user_email: string;
  current_score: number;
  total_gained: number;
  total_lost: number;
}

export interface ReputationStatsData {
  summary: {
    total_users: number;
    avg_score: number;
    highest_score: number;
  };
  users: ReputationUserStat[];
}

interface ReputationStatsSectionProps {
  data: ReputationStatsData;
}

export function ReputationStatsSection({ data }: ReputationStatsSectionProps) {
  const sortedStats = [...data.users].sort((a, b) => b.current_score - a.current_score);

  return (
    <div className="mt-12">
      <div className="mb-6 border-t border-[#D1D5DC] pt-12">
        <h2 className="text-xl font-bold text-[#1E293B]">Thống kê điểm uy tín hệ thống</h2>
        <p className="text-[#4A5565] mt-1">
          Theo dõi và quản lý điểm uy tín của toàn bộ người dùng trong hệ thống
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-[8px] border border-[#D1D5DC] p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-[8px] flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#4A5565]">Tổng tài khoản đánh giá</p>
            <p className="text-2xl font-bold text-[#1E293B]">{data.summary.total_users.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="bg-white rounded-[8px] border border-[#D1D5DC] p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-[8px] flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#4A5565]">Điểm uy tín trung bình</p>
            <p className="text-2xl font-bold text-[#1E293B]">{data.summary.avg_score.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="bg-white rounded-[8px] border border-[#D1D5DC] p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-[8px] flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#4A5565]">Người điểm cao nhất</p>
            <p className="text-2xl font-bold text-[#1E293B]">{data.summary.highest_score.toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[8px] border border-[#D1D5DC] overflow-hidden shadow-sm">
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
              {sortedStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-[#64748B]">
                    Chưa có dữ liệu người dùng.
                  </td>
                </tr>
              ) : (
                sortedStats.map((stat) => (
                  <tr key={stat.user_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#1E293B]">
                      {stat.user_name}
                    </td>
                    <td className="px-6 py-4 text-[#4A5565] text-sm">
                      {stat.user_email}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-[#E01515]/10 text-[#E01515]">
                        {stat.current_score.toLocaleString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-emerald-600">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        +{stat.total_gained.toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-red-600">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        -{stat.total_lost.toLocaleString('vi-VN')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
