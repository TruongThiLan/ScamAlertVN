import { ScamCategory, Post, User } from '../types';

export const scamCategories: ScamCategory[] = [
  {
    id: '1',
    name: 'Lừa đảo qua điện thoại',
    description: 'Các hình thức lừa đảo qua cuộc gọi điện thoại',
    color: '#E01515',
  },
  {
    id: '2',
    name: 'Lừa đảo trực tuyến',
    description: 'Lừa đảo qua mạng xã hội, website, ứng dụng',
    color: '#E01515',
  },
  {
    id: '3',
    name: 'Lừa đảo đầu tư',
    description: 'Đầu tư tiền ảo, forex, sàn giao dịch giả mạo',
    color: '#E01515',
  },
  {
    id: '4',
    name: 'Lừa đảo tín dụng đen',
    description: 'Cho vay nặng lãi, đe dọa khủng bố',
    color: '#E01515',
  },
  {
    id: '5',
    name: 'Lừa đảo việc làm',
    description: 'Tuyển dụng giả, làm việc online kiếm tiền nhanh',
    color: '#E01515',
  },
  {
    id: '6',
    name: 'Lừa đảo mua sắm',
    description: 'Bán hàng giả, không giao hàng sau khi nhận tiền',
    color: '#E01515',
  },
  {
    id: '7',
    name: 'Lừa đảo giả danh',
    description: 'Giả danh công an, tòa án, ngân hàng',
    color: '#E01515',
  },
  {
    id: '8',
    name: 'Lừa đảo bất động sản',
    description: 'Lừa đảo trong giao dịch mua bán nhà đất',
    color: '#E01515',
  },
];

const mockUser1: User = {
  id: '2',
  email: 'user@example.com',
  name: 'Nguyễn Văn A',
  role: 'user',
  createdAt: '2025-01-15T10:00:00Z',
  reputationScore: 1250,
  violationCount: 0,
};

const mockUser2: User = {
  id: '3',
  email: 'user2@example.com',
  name: 'Lê Thị Bích',
  role: 'user',
  createdAt: '2025-02-20T14:30:00Z',
  reputationScore: 42,
  violationCount: 0,
};

const mockUser3: User = {
  id: '4',
  email: 'user3@example.com',
  name: 'Trần Minh Tâm',
  role: 'user',
  createdAt: '2025-03-01T09:15:00Z',
  reputationScore: 128,
  violationCount: 0,
};

const mockUser4: User = {
  id: '5',
  email: 'user4@example.com',
  name: 'Lê Văn C',
  role: 'user',
  createdAt: '2025-01-20T10:00:00Z',
  reputationScore: 200,
  violationCount: 0,
};

export const mockUsers: User[] = [mockUser1, mockUser2, mockUser3, mockUser4];

export const categories = scamCategories;

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Chiêu trò lừa đảo việc làm online "dễ dàng kiếm tiền"',
    content: `Các đối tượng lừa đảo đang tuyển việc làm online với mức lương hấp dẫn, không yêu cầu kinh nghiệm. Sau khi liên hệ, họ yêu cầu nạp phí đào tạo, phí tài liệu hoặc mua sản phẩm để bắt đầu công việc. Sau khi nhận tiền, các đối tượng sẽ cắt liên lạc hoặc dùng ra nhiều lý do để không trả lương. Mọi người cần hết sức cảnh giác với các lời mời chào "việc nhẹ lương cao" trên mạng xã hội.`,
    category: scamCategories[4],
    author: mockUser1,
    status: 'approved',
    createdAt: '2026-01-30T23:00:00Z',
    updatedAt: '2026-01-30T23:00:00Z',
    likes: 46,
    comments: [
      {
        id: 'c1',
        postId: '1',
        author: mockUser2,
        content: 'Mọi người cần thận trọng này, chúng nó cũng giả dạnh cả công an để gọi điện yêu cầu cung cấp mã OTP đấy.',
        createdAt: '2026-01-30T23:05:00Z',
      },
      {
        id: 'c2',
        postId: '1',
        author: mockUser3,
        content: 'Đúng rồi bạn, mình cũng vừa bị gọi điện như thế. May mà tỉnh táo không làm theo.',
        createdAt: '2026-01-30T23:07:00Z',
      },
    ],
  },
  {
    id: '2',
    title: 'Cảnh báo: Trang web đầu tư Forex giả mạo lừa đảo hàng tỷ đồng',
    content: `Mới đây, tôi phát hiện một trang web có tên là \"VN Forex Pro\" đang lừa đảo nhiều người. 
    
Họ quảng cáo trên Facebook hứa hẹn lợi nhuận 30-50% mỗi tháng từ việc đầu tư forex. Ban đầu cho rút tiền nhỏ để tạo lòng tin, nhưng khi nạp số tiền lớn thì không thể rút được.

Trang web: vnforexpro[.]com (đừng truy cập)
Số điện thoại liên hệ: 0999.xxx.xxx
Facebook: VN Forex Investment

Các dấu hiệu nhận biết:
- Hứa hẹn lợi nhuận quá cao
- Yêu cầu nạp tiền qua tài khoản cá nhân
- Không có giấy phép kinh doanh
- Website mới tạo chưa đầy 2 tháng

Mọi người cẩn thận và chia sẻ để nhiều người biết!`,
    category: scamCategories[2],
    author: mockUser1,
    status: 'approved',
    createdAt: '2026-03-10T14:30:00Z',
    updatedAt: '2026-03-10T14:30:00Z',
    likes: 45,
    comments: [
      {
        id: 'c3',
        postId: '2',
        author: mockUser2,
        content: 'Cảm ơn bạn đã chia sẻ! Mình suýt nữa bị lừa trang này.',
        createdAt: '2026-03-10T15:00:00Z',
      },
      {
        id: 'c4',
        postId: '2',
        author: mockUser3,
        content: 'Bạn đã báo công an chưa? Nên trình báo để xử lý những kẻ lừa đảo này.',
        createdAt: '2026-03-10T16:20:00Z',
      },
    ],
  },
  {
    id: '3',
    title: 'Lừa đảo tuyển dụng làm việc tại nhà với mức lương cao',
    content: `Cảnh báo về các trang tuyển dụng giả mạo đang hoạt động tràn lan.

Họ đăng tin tuyển nhân viên làm việc tại nhà với mức lương 8-15 triệu/tháng chỉ cần:
- Có điện thoại hoặc máy tính
- Làm việc 2-3 giờ/ngày
- Không cần kinh nghiệm

Khi liên hệ, họ yêu cầu:
1. Nộp phí đào tạo 500k-2 triệu
2. Mua tài khoản/công cụ làm việc
3. Đặt cọc để nhận tài liệu

Sau khi nộp tiền thì bị chặn liên lạc hoàn toàn.

Lời khuyên:
- Công ty chính thống KHÔNG BAO GIỜ thu phí tuyển dụng
- Lương cao quá so với công việc = lừa đảo
- Kiểm tra thông tin công ty kỹ trước khi liên hệ`,
    category: scamCategories[4],
    author: mockUser2,
    status: 'approved',
    createdAt: '2026-03-11T09:15:00Z',
    updatedAt: '2026-03-11T09:15:00Z',
    likes: 32,
    comments: [],
  },
  {
    id: '4',
    title: 'Giả mạo ngân hàng gọi điện yêu cầu cập nhật thông tin',
    content: `Hôm qua tôi nhận được cuộc gọi từ số 19001234 tự xưng là nhân viên ngân hàng Vietcombank.

Họ nói:
- Tài khoản của tôi có giao dịch bất thường
- Cần cập nhật thông tin để tránh bị khóa
- Yêu cầu cung cấp mã OTP vừa nhận được

May mắn là tôi đã nhận biết và KHÔNG cung cấp thông tin. Sau đó gọi lại hotline chính thức của ngân hàng, họ xác nhận đây là lừa đảo.

Lưu ý:
- Ngân hàng KHÔNG BAO GIỜ gọi yêu cầu mã OTP
- KHÔNG cung cấp thông tin thẻ, mật khẩu qua điện thoại
- Luôn gọi lại số hotline CHÍNH THỨC để xác minh

Số điện thoại lừa đảo: 19001234 (giả mạo)`,
    category: scamCategories[6],
    author: mockUser3,
    status: 'approved',
    createdAt: '2026-03-12T08:00:00Z',
    updatedAt: '2026-03-12T08:00:00Z',
    likes: 67,
    comments: [
      {
        id: 'c5',
        postId: '4',
        author: mockUser1,
        content: 'Mình cũng từng nhận cuộc gọi tương tự. Rất nguy hiểm!',
        createdAt: '2026-03-12T08:30:00Z',
      },
    ],
  },
  {
    id: '5',
    title: 'Shop bán hàng online nhận tiền không giao hàng',
    content: `Tôi bị lừa khi mua điện thoại trên Facebook.

Thông tin shop lừa đảo:
- Tên FB: Điện Thoại Giá Rẻ VN
- Số tài khoản: 0123456789 - Nguyễn Văn X - Vietinbank

Họ bán iPhone 15 Pro Max giá chỉ 15 triệu (rẻ hơn thị trường nhiều). Sau khi chuyển tiền, họ hẹn giao hàng nhưng luôn lý do hoãn lại. Giờ đã chặn tôi hoàn toàn.

Bài học:
- Không mua hàng giá quá rẻ so với thị trường
- Nên gặp mặt trực tiếp hoặc dùng sàn TMĐT uy tín
- Kiểm tra kỹ thông tin người bán`,
    category: scamCategories[5],
    author: mockUser1,
    status: 'pending',
    createdAt: '2026-03-12T10:00:00Z',
    updatedAt: '2026-03-12T10:00:00Z',
    likes: 12,
    comments: [],
  },
  {
    id: '6',
    title: 'Lừa đảo qua Zalo giả danh cơ quan công an',
    content: `Cảnh báo: Có kẻ lừa đảo giả danh công an gọi điện và nhắn Zalo.

Họ nói:
- Tôi bị tình nghi liên quan đến vụ án rửa tiền
- Phải chuyển tiền vào \"tài khoản bảo vệ\" để chứng minh vô tội
- Không được tắt máy hay nói với ai

Đây là thủ đoạn lừa đảo cũ nhưng vẫn có nhiều người mắc bẫy.

LƯU Ý QUAN TRỌNG:
- Công an KHÔNG BAO GIỜ xử lý vụ án qua điện thoại
- KHÔNG có \"tài khoản bảo vệ\" nào cả
- Nếu nghi ngờ, hãy đến trụ sở công an để xác minh

Đừng để sợ hãi khiến bạn mất tiền!`,
    category: scamCategories[6],
    author: mockUser2,
    status: 'approved',
    createdAt: '2026-03-11T16:45:00Z',
    updatedAt: '2026-03-11T16:45:00Z',
    likes: 89,
    comments: [],
  },
];