import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title: string;
}

const REPORT_REASONS = [
  {
    id: 'misinformation',
    label: 'Thông tin sai lệch, lừa đảo',
  },
  {
    id: 'offensive',
    label: 'Nội dung nhạy cảm, bạo lực',
  },
  {
    id: 'hate_speech',
    label: 'Ngôn từ thù ghét, xúc phạm',
  },
  {
    id: 'spam',
    label: 'Spam / Quảng cáo trái phép',
  },
  {
    id: 'copyright',
    label: 'Vi phạm bản quyền',
  },
  {
    id: 'other',
    label: 'Lý do khác',
  },
];

export function ReportDialog({ isOpen, onClose, onSubmit, title }: ReportDialogProps) {
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
      <div className="bg-white rounded-[20px] max-w-[550px] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#E01515] text-white px-6 py-4 flex items-center justify-between rounded-t-[20px]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:opacity-80 transition-opacity"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-[#4A5565] mb-6">
            Vui lòng chọn lý do bạn muốn báo cáo nội dung này. Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.
          </p>

          <div className="space-y-3">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.id}
                className={`block px-4 py-3 rounded-[10px] border-2 cursor-pointer transition-all ${
                  selectedReason === reason.id
                    ? 'border-[#E01515] bg-[#FEF2F2] text-[#E01515]'
                    : 'border-[#D1D5DC] hover:border-[#E01515]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedReason === reason.id
                      ? 'border-[#E01515]'
                      : 'border-[#D1D5DC]'
                  }`}>
                    {selectedReason === reason.id && (
                      <div className="w-3 h-3 rounded-full bg-[#E01515]" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="reason"
                    value={reason.id}
                    checked={selectedReason === reason.id}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="sr-only"
                  />
                  <span className="font-medium">{reason.label}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[#D1D5DC]">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-[10px] border border-[#D1D5DC] text-[#4A5565] hover:bg-[#F3F3F5] transition-colors font-semibold"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors font-semibold"
            >
              Gửi báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}