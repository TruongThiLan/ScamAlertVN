import { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import publicApi from '../../api/publicApi';

// NOTE VAN DAP:
// ScamChecker la cong cu kiem tra nhanh cho khach.
// FE goi publicApi -> /api/public/posts/check_scam/?query=...
// Backend tim query trong cac bai APPROVED va tra ve is_scam + matches.

export function ScamChecker() {
  const [query, setQuery] = useState(''); // noi dung user nhap: link hoac so dien thoai.
  const [loading, setLoading] = useState(false); // hien spinner tren nut kiem tra.
  const [result, setResult] = useState<{
    is_scam: boolean;
    message: string;
    matches: { id: string; title: string }[];
  } | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Vui lòng nhập đường link hoặc số điện thoại để kiểm tra.');
      return;
    }
    
    setError('');
    setLoading(true);
    // Lưu ý: Không reset result ngay lập tức để tránh giao diện bị giật (flicker)
    
    try {
      // encodeURIComponent giup URL/SDT co ky tu dac biet khong lam hong query string.
      const res = await publicApi.get(`public/posts/check_scam/?query=${encodeURIComponent(trimmedQuery)}`);
      setResult(res.data);
    } catch (err: any) {
      setError('Đã có lỗi xảy ra trong quá trình kiểm tra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Live Search (Debounce) cho Scam Checker
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length >= 2) {
        handleCheck();
      } else if (trimmedQuery.length === 0) {
        setResult(null);
        setError('');
      }
    }, 400); // Đợi 0.4s sau khi người dùng ngừng gõ

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Tieu de va mo ta cong cu kiem tra nhanh */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#111827] mb-4">
            Công cụ kiểm tra nhanh
          </h1>
          <p className="text-lg text-[#4A5565]">
            Chủ động bảo vệ bản thân. Hãy nhập số điện thoại hoặc đường link nghi ngờ để kiểm tra xem nó đã từng bị báo cáo lừa đảo hay chưa.
          </p>
        </div>

        {/* Khung form nhap link/SDT can kiem tra */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#D1D5DC] p-6 md:p-8 mb-8">
          <form onSubmit={handleCheck} className="relative">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-[#99A1AF]" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập số điện thoại, URL (VD: shopee-hoan-tien.com)..."
                  className="block w-full pl-11 pr-4 py-4 bg-[#F3F3F5] border border-transparent rounded-[12px] text-base placeholder-[#99A1AF] focus:outline-none focus:ring-2 focus:ring-[#E01515] focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-[#E01515] text-white px-8 py-4 rounded-[12px] font-semibold hover:bg-[#C10007] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E01515] transition-all disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Kiểm tra'}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-[#E01515]">{error}</p>}
          </form>
        </div>

        {result && (
          <>
          {/* Khung ket qua: mau do neu co nguy co, mau xanh neu chua thay rui ro */}
          <div className={`rounded-2xl p-6 md:p-8 border ${result.is_scam ? 'bg-[#FEF2F2] border-[#FCA5A5]' : 'bg-[#F0FDF4] border-[#86EFAC]'} transition-all animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className="flex items-start gap-4">
              <div className={`shrink-0 p-3 rounded-full ${result.is_scam ? 'bg-[#FEE2E2] text-[#E01515]' : 'bg-[#DCFCE7] text-[#16A34A]'}`}>
                {result.is_scam ? <ShieldAlert className="h-8 w-8" /> : <CheckCircle className="h-8 w-8" />}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${result.is_scam ? 'text-[#991B1B]' : 'text-[#166534]'}`}>
                  {result.is_scam ? 'Cảnh báo Nguy hiểm!' : 'Chưa phát hiện rủi ro'}
                </h3>
                <p className={`text-base mb-4 ${result.is_scam ? 'text-[#B91C1C]' : 'text-[#15803D]'}`}>
                  {result.message}
                </p>
                
                {result.is_scam && result.matches && result.matches.length > 0 && (
                  <div className="mt-6 bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-[#991B1B] mb-3 text-sm uppercase tracking-wider">Các bài báo cáo liên quan:</h4>
                    <ul className="space-y-3">
                      {result.matches.map((match) => (
                        <li key={match.id}>
                          <Link 
                            to={`/post/${match.id}`} 
                            className="flex items-start gap-2 text-[#E01515] hover:text-[#991B1B] font-medium group transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 shrink-0 mt-1 opacity-70 group-hover:opacity-100" />
                            <span className="underline-offset-4 group-hover:underline line-clamp-2">{match.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
        )}
        
        <div className="mt-12 text-center text-sm text-[#64748B]">
          <p>Lưu ý: Kết quả kiểm tra chỉ mang tính tham khảo dựa trên dữ liệu cộng đồng.</p>
          <p>Luôn nâng cao cảnh giác với các yêu cầu chuyển tiền hoặc cung cấp thông tin cá nhân.</p>
        </div>
      </div>
    </div>
  );
}
