import { X } from 'lucide-react';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSaveDraft: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onClose,
  onDiscard,
  onSaveDraft,
}: UnsavedChangesDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[20px] max-w-[414px] w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Bạn có thay đổi chưa được lưu</h2>
            <p className="text-[#4A5565]">Bạn muốn làm gì với những thay đổi này?</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#99A1AF] hover:text-[#E01515] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={onSaveDraft}
            className="w-full py-3 rounded-[10px] bg-[#E01515] text-white font-semibold hover:bg-[#C10007] transition-colors"
          >
            Lưu bản nháp
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-3 rounded-[10px] border border-[#E01515] text-[#E01515] font-semibold hover:bg-[#FFF5F5] transition-colors"
          >
            Bỏ bài viết
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-[10px] text-[#4A5565] font-semibold hover:bg-[#F3F3F5] transition-colors"
          >
            Tiếp tục chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}
