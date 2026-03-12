import { useState } from 'react';
import { X, Share2, Copy, Check } from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export function ShareDialog({ isOpen, onClose, postId }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://scamalert.vn/post/${postId}`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[20px] max-w-[500px] w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center">
              <Share2 className="h-6 w-6 text-[#E01515]" />
            </div>
            <h2 className="text-xl font-semibold">Chia sẻ bài viết</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#99A1AF] hover:text-[#E01515] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full px-4 py-3 pr-12 rounded-[10px] bg-[#F3F3F5] border border-[#D1D5DC] text-[#4A5565]"
          />
          <button
            onClick={handleCopy}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-[8px] hover:bg-[#E01515]/10 transition-colors"
            title="Sao chép"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5 text-[#E01515]" />
            )}
          </button>
        </div>

        {copied && (
          <p className="text-sm text-green-600 mt-2">Đã sao chép liên kết!</p>
        )}
      </div>
    </div>
  );
}
