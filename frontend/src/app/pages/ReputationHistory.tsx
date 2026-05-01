import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';
import { Clock, TrendingUp, TrendingDown, History, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import api from '../../api/axiosInstance';
import type { ReputationHistory as ReputationHistoryEntry } from '../types';

export function ReputationHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReputationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('users/reputation-history/');
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setHistory(data);
      } catch (error) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
  );

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#F9FAFB] py-8">
      <div className="max-w-4xl mx-auto px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#E01515]/10 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-[#E01515]" />
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-[#1E293B]">Lịch sử điểm uy tín</h1>
              <p className="text-[#4A5565] text-sm mt-1">
                Theo dõi quá trình đóng góp và đánh giá của bạn trên hệ thống
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[16px] p-6 border border-[#D1D5DC] mb-8 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">Điểm uy tín hiện tại</h2>
            <p className="text-sm text-[#4A5565]">Được lấy trực tiếp từ tài khoản của bạn</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[40px] font-bold text-[#E01515] leading-none">
              {user.reputationScore ?? user.reputation_score ?? 0}
            </span>
            <span className="text-[#4A5565] font-medium">điểm</span>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#D1D5DC] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#D1D5DC] bg-gray-50/50">
            <h3 className="font-semibold text-[#1E293B]">Chi tiết giao dịch điểm</h3>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-[#4A5565]">
                <Loader2 className="w-5 h-5 animate-spin text-[#E01515]" />
                Đang tải lịch sử điểm...
              </div>
            ) : sortedHistory.length === 0 ? (
              <div className="p-8 text-center text-[#4A5565]">
                Bạn chưa có ghi nhận thay đổi điểm uy tín nào.
              </div>
            ) : (
              sortedHistory.map((item) => (
                <div key={item.id} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${item.score_change > 0 ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                    {item.score_change > 0 ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-base font-medium text-[#1E293B]">
                      {item.action_type}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-[#6B7280]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {format(new Date(item.created_time), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  </div>

                  <div className={`font-semibold text-lg flex items-center ${item.score_change > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                    {item.score_change > 0 ? '+' : ''}{item.score_change}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
