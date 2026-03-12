import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ReportUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  userName: string;
}

const REPORT_REASONS = [
  {
    id: 'spam',
    title: 'Spam hoặc quảng cáo',
    description: 'Người dùng đăng bài quảng cáo, spam liên tục',
  },
  {
    id: 'scam',
    title: 'Lừa đảo hoặc gian lận',
    description: 'Người dùng có hành vi lừa đảo, chiếm đoạt tài sản',
  },
  {
    id: 'violation',
    title: 'Vi phạm quy định cộng đồng',
    description: 'Vi phạm điều khoản sử dụng và quy định của diễn đàn',
  },
  {
    id: 'inappropriate',
    title: 'Nội dung không phù hợp',
    description: 'Đăng nội dung nhạy cảm, bạo lực, không phù hợp',
  },
];

export function ReportUserDialog({ isOpen, onClose, onSubmit, userName }: ReportUserDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedReason) {
      alert('Vui lòng chọn lý do báo cáo');
      return;
    }
    onSubmit(selectedReason);
    setSelectedReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[20px] max-w-[750px] w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#D1D5DC] px-6 py-4 flex items-center justify-between rounded-t-[20px]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-[#E01515]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Báo cáo người dùng</h2>
              <p className="text-sm text-[#99A1AF]">Báo cáo về: {userName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#99A1AF] hover:text-[#E01515] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <label className="block font-semibold mb-4">
            Lý do báo cáo <span className="text-[#E01515]">*</span>
          </label>

          <div className="space-y-3">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.id}
                className={`block p-4 rounded-[10px] border-2 cursor-pointer transition-all ${
                  selectedReason === reason.id
                    ? 'border-[#E01515] bg-[#FEF2F2]'
                    : 'border-[#D1D5DC] hover:border-[#E01515]/30'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="sr-only"
                />
                <div className="font-semibold mb-1">{reason.title}</div>
                <div className="text-sm text-[#99A1AF]">{reason.description}</div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[#D1D5DC]">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-[10px] border border-[#D1D5DC] text-[#4A5565] hover:bg-[#F3F3F5] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors"
            >
              Gửi báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
