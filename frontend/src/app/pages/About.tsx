import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ShieldAlert, Users, Target, Award } from 'lucide-react';

export function About() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Về ScamAlert VN</h1>
          <p className="text-lg text-gray-600">
            Nền tảng cảnh báo và quản lý thông tin lừa đảo tại Việt Nam
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-600" />
                Sứ mệnh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                ScamAlert VN được xây dựng với sứ mệnh bảo vệ cộng đồng khỏi các hình thức lừa đảo 
                ngày càng tinh vi. Chúng tôi cung cấp một nền tảng để mọi người có thể chia sẻ, 
                cảnh báo và tìm hiểu về các chiêu trò lừa đảo đang diễn ra tại Việt Nam.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Chức năng chính
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>
                    <strong>Cảnh báo lừa đảo:</strong> Người dùng có thể đăng bài cảnh báo về các 
                    trường hợp lừa đảo họ gặp phải hoặc phát hiện
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>
                    <strong>Tìm kiếm thông tin:</strong> Tìm kiếm và xem các cảnh báo theo danh mục 
                    lừa đảo khác nhau
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>
                    <strong>Hệ thống điểm uy tín:</strong> Đánh giá độ tin cậy của người dùng dựa 
                    trên hoạt động và chất lượng bài viết
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>
                    <strong>Kiểm duyệt nội dung:</strong> Đội ngũ quản trị viên kiểm tra và phê duyệt 
                    bài viết để đảm bảo chất lượng thông tin
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>
                    <strong>Báo cáo vi phạm:</strong> Người dùng có thể báo cáo các bài viết có nội dung 
                    không phù hợp
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600" />
                Cộng đồng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                ScamAlert VN hoạt động dựa trên sức mạnh của cộng đồng. Mỗi thông tin cảnh báo được 
                chia sẻ đều góp phần bảo vệ hàng nghìn người khác khỏi nguy cơ bị lừa đảo. Chúng tôi 
                khuyến khích mọi người tích cực tham gia, chia sẻ kinh nghiệm và cùng nhau xây dựng 
                một môi trường internet an toàn hơn.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-red-600" />
                Hệ thống điểm uy tín
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Cách tính điểm:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">+</span>
                      <span>Bài viết đạt 1000+ upvote: +1 điểm</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">+</span>
                      <span>Bài viết đạt 3000+ upvote: +3 điểm</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">+</span>
                      <span>Bài viết đạt 5000+ upvote: +5 điểm</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">+</span>
                      <span>Bài viết có bằng chứng được duyệt: +5 điểm</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">+</span>
                      <span>Tài khoản hoạt động trên 30 ngày: +3 điểm</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">-</span>
                      <span>Vi phạm quy định: -10 điểm</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">-</span>
                      <span>Bài viết bị xóa do vi phạm: -10 điểm</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">-</span>
                      <span>Bị báo cáo có căn cứ: -10 điểm</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-center text-gray-700">
                <strong className="text-red-600">Lưu ý:</strong> Hãy luôn cảnh giác và xác minh thông tin 
                trước khi tin tưởng. ScamAlert VN chỉ là nền tảng chia sẻ thông tin, không chịu trách nhiệm 
                về tính chính xác tuyệt đối của các bài viết.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
