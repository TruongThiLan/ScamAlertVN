5. Đăng kí tài khoản

Use case ID
5
Use case name
Đăng ký tài khoản
Description
Là khách tôi muốn đăng ký tài khoản mới để tham gia diễn đàn, đăng bài và bình luận các nội dung chia sẻ cách phòng chống lừa đảo.
Actors
Khách
Priority
Cao
Triggers
Khách chọn chức năng “Đăng ký tài khoản” trên giao diện diễn đàn.
Pre-conditions
- Khách chưa đăng nhập vào hệ thống.
Post-conditions
- Tài khoản mới được tạo trong hệ thống.
- Thông tin xác thực (email/số điện thoại) được xác nhận thành công.
Main flow
1. Khách truy cập diễn đàn.
2. Khách chọn chức năng “Đăng ký”.
3. Hệ thống hiển thị form đăng ký gồm:
- Tên đăng nhập
- Email va Số điện thoại
- Mật khẩu
- Xác nhận mật khẩu
4. Khách nhập thông tin đăng ký.
5. Khách chọn “Đăng ký”.
6. Hệ thống kiểm tra tính hợp lệ của dữ liệu đăng ký.
7. Hệ thống gửi mã xác thực (OTP) qua email/số điện thoại của khách.
8. Hệ thống hiển thị màn hình nhập mã xác thực.
9. Khách nhập mã xác thực.
10. Hệ thống kiểm tra mã xác thực hợp lệ và còn hiệu lực.
11. Hệ thống hiển thị thông báo “Đăng ký tài khoản thành công”.
12. Hệ thống chuyển khách đến màn hình Đăng nhập.
Alternative flows
4a. Khách chọn “Hủy”
4a1. Khách chọn “Huỷ” khi đang nhập thông tin đăng ký.
4a2. Hệ thống không lưu dữ liệu và kết thúc Use Case.
Exception flows
6a. Dữ liệu đăng ký không hợp lệ => Hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu nhập lại => Quay lại bước 4.
7a. Hệ thống không gửi mã xác thực về cho người dùng
7a1.
Khách không tiếp tục → Kết thúc use case
Khách chọn “Gửi lại mã” . Hệ thống hiển thị thông báo: “Đã gửi lại mã xác nhận trong email của bạn.Vui lòng nhập lại mã xác nhận”→ Quay lại bước 7  
10a. Mã xác thực không hợp lệ: 
10a1. Hệ thống hiển thị thông báo “Vui lòng nhập lại mã xác thực”
=> Quay lại bước 9.
10b. Khách nhập mã xác thực sau 5 phút mã xác thực hết hạn.
10b1. Hệ thống hiển thị thông báo “ Mã xác thực hết hạn. Yêu cầu gửi lại mã mới” => Quay lại bước 7
Business rules
- Tên đăng nhập phải là duy nhất trong hệ thống.
- Mỗi email hoặc số điện thoại chỉ được sử dụng cho một tài khoản.
- Mật khẩu phải có tối thiểu X ký tự, bao gồm chữ hoa, chữ thường và số.
- Mã xác thực chỉ có hiệu lực trong vòng 5 phút.
- Khách chỉ được hoàn tất đăng ký khi mã xác thực hợp lệ.






6. Tìm kiếm thông tin

Use case ID
6
Use case name
Tìm kiếm thông tin 
Description
Là khách, tôi muốn  tìm kiếm và xem thông tin (bài viết, nội dung chia sẻ) trên diễn đàn bằng từ khóa.
Actors
Khách 
Priority
Trung bình
Triggers
Khách nhập từ khóa và nhấn biểu tượng tìm kiếm (kính lúp).
Pre-conditions


Post-conditions
- Hệ thống hiển thị danh sách kết quả phù hợp với từ khóa tìm kiếm
Main flow
Khách truy cập trang chủ hệ thống.
Khách nhấp vào ô tìm kiếm.
Khách nhập từ khóa tìm kiếm.
Khách nhấn biểu tượng kính lúp.
Hệ thống thực hiện tìm kiếm.
Hệ thống hiển thị kết quả tìm kiếm.
Khách chọn bài viết 
Hệ thống hiển thị thông tin bài viết
Alternative flows
N/A
Exception flows
4a. Khách không nhập từ khóa tìm kiếm mà bấm vào kính lúp
4a1. Hệ thống hiển thị thông báo:”Vui lòng nhập từ tìm kiếm.Vui ”
=> Quay lại bước 3
5a. Hệ thống xảy ra lỗi dữ liệu hoặc đang quá tải
5a1. Hệ thống hiển thị thông báo: “Hệ thống đang gặp vấn đề. Vui lòng thử lại sau” => Kết thúc use case
6a. Hệ thống không hiển thị kết quả tìm kiếm .
6a1. Hệ thống hiển thị thông báo:”Không tìm thấy kết quả.Vui lòng nhập lại”
Nếu tiếp tục tìm kiếm => Quay lại bước 3
Nếu không tìm kiếm => Kết thúc use case
Business rules
Từ khóa tìm kiếm không được để trống.
Hệ thống chỉ tìm kiếm trên các nội dung được phép công khai.
Kết quả tìm kiếm được sắp xếp theo mức độ liên quan.
Khách không cần đăng nhập để sử dụng chức năng tìm kiếm.








7. Xem bài viết


Use case ID
7
Use case name
Xem bài viết
Description
Là khách, tôi muốn xem danh sách các loại hình lừa đảo, lựa chọn một loại cụ thể và đọc nội dung chi tiết các bài viết liên quan để tìm hiểu thông tin.
Actors
Khách
Priority
Trung bình
Triggers
Khách truy cập vào trang chủ diễn đàn.
Pre-conditions

Các bài viết và loại lừa đảo đã được tạo trong hệ thống.


Post-conditions
Nội dung chi tiết bài viết được hiển thị cho Khách.
Main flow
Khách truy cập trang chủ diễn đàn.
Hệ thống hiển thị danh sách bài viết lừa đảo mới nhất.
Khách chọn một bài viết.
Hệ thống hiển thị nội dung chi tiết bài viết.
Tiêu đề bài viết
Nội dung bài viết
Tên tác giả
Thời gian đăng bài
Alternative flows
2a. Khách chọn danh mục lừa đảo
2a1. Khách chọn một loại hình thức lừa đảo từ bộ lọc.
2a1. Hệ thống hiển thị danh sách lừa đảo theo chủ đề.
2a2. Tiếp tục bước 3.
Exception flows
2b. Hệ thống không tải được danh sách loại lừa đảo
2b1.Hệ thống hiển thị thông báo:“Không thể tải dữ liệu. Vui lòng thử lại sau” => Kết thúc use case.
2c. Không có bài viết thuộc loại lừa đảo đã chọn
2c.1.Hệ thống hiển thị thông báo: “Chưa có bài viết cho loại lừa đảo này”
 =>Quay lại bước 2.


Business rules
Chỉ hiển thị bài viết công khai cho Khách.
Mỗi bài viết thuộc ít nhất một loại lừa đảo.
Khách không cần đăng nhập để xem bài viết.
Thông tin bài viết phải được kiểm duyệt trước khi hiển thị.









1.1 Cập nhật thông tin

Use case ID
1.1
Use case name
Cập nhật thông tin cá nhân
Description
Là người dùng tôi muốn cập nhật thông tin cá nhân của mình trên hệ thống diễn đàn nhằm đảm bảo thông tin chính xác và thuận tiện cho việc sử dụng các chức năng của hệ thống
Actors
Người dùng
Priority
Cao
Triggers
Người dùng chọn chức năng “Cập nhật thông tin cá nhân” từ Quản lý thông tin cá nhân.
Pre-conditions
- Người dùng đã đăng nhập thành công vào hệ thống.
- Tài khoản người dùng tồn tại và chưa bị khóa.


Post-conditions
- Thông tin cá nhân của người dùng được cập nhật thành công trong hệ thống.
- Hệ thống hiển thị thông báo cập nhật thành công.
Main flow
1. Người dùng chọn Quản lý thông tin cá nhân.
2. Người dùng chọn chức năng “Cập nhật thông tin cá nhân”.
3. Hệ thống hiển thị form thông tin cá nhân hiện tại, bao gồm:
- Tên đăng nhập
- Email
- Số điện thoại
4. Người dùng chỉnh sửa thông tin mong muốn.
5. Trong quá trình nhập, hệ thống kiểm tra tính hợp lệ của từng trường dữ liệu.
6. Người dùng nhấn nút “Lưu thay đổi”.
7. Hệ thống hiển thị thông báo: “Bạn chắc chắn muốn cập nhật thông tin cá nhân đã chỉnh sửa”.
8. Người dùng chọn “Xác nhận”.
9. Hệ thống lưu thông tin cập nhật.
10. Hệ thống hiển thị thông báo “Cập nhật thông tin  thành công”
Alternative flows
8a. Người dùng chọn “Hủy”
8a1. Hệ thống không lưu thông tin thay đổi và quay lại trang cá nhân.
Exception flows
5a. Dữ liệu đăng ký không hợp lệ 
5a1.Hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu nhập lại => Quay lại bước 4.
9a. Hệ thống không thể cập nhật thông tin do lỗi hệ thống hoặc kết nối.
9a1.Hệ thống hiển thị thông báo:“Cập nhật không thành công. Vui lòng thử lại sau”=> Kết thúc use case.
Business rules
- Tên đăng nhập phải có độ dài từ 6–20 ký tự, chỉ bao gồm chữ cái và chữ số, không chứa khoảng trắng và phải là duy nhất trong hệ thống.
- Email phải đúng định dạng chuẩn và không được trùng với email đã tồn tại trong hệ thống.
- Số điện thoại phải gồm 10 chữ số, bắt đầu bằng các đầu số hợp lệ và không được trùng với số điện thoại khác.
- Các trường bắt buộc không được để trống và phải tuân theo định dạng do hệ thống quy định.








1.2 Đổi mật khẩu

Use case ID
1.2
Use case name
Đổi mật khẩu
Description
Là người dùng tôi muốn đổi mật khẩu hiện tại.
Actors
Người dùng đã đăng nhập
Priority
Cao
Triggers
Người dùng chọn chức năng “Đổi mật khẩu” tại trang quản lý thông tin cá nhân
Pre-conditions
Người dùng đã đăng nhập thành công.
Tài khoản người dùng tồn tại và chưa bị khóa.


Post-conditions
Mật khẩu mới được cập nhật trong hệ thống.
Người dùng sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo.
Main flow
Người dùng chọn Quản lý thông tin cá nhân.
Người dùng chọn chức năng Đổi mật khẩu.
Hệ thống hiển thị form đổi mật khẩu gồm:
+ Mật khẩu hiện tại
+ Mật khẩu mới
+ Xác nhận mật khẩu mới
Người dùng nhập thông tin vào form.
Người dùng nhấn nút “Đổi mật khẩu”.
Hệ thống kiểm tra:
+ Mật khẩu hiện tại có đúng không.
+ Mật khẩu mới có hợp lệ không.
+ Mật khẩu mới và xác nhận mật khẩu mới có trùng nhau không.
Hệ thống hiển thị hộp thoại xác nhận “Bạn chắc chắn muốn đổi mật khẩu .Sau khi đổi bạn cần sử dụng mật khẩu mới để đăng nhập.
Người dùng nhấn “Xác nhận”.
Hệ thống cập nhật mật khẩu mới.
Hệ thống hiển thị thông báo “Đổi mật khẩu thành công”.
Alternative flows
8a. Người dùng nhấn nút “Hủy”
=> Hệ thống hiển thị màn hình trước đó
=> Kết thúc use case
Exception flows
6a. Mật khẩu hiện tại không đúng
6a1.Hệ thống hiển thị thông báo:“Mật khẩu cũ không đúng. Vui lòng nhập lại.”
Người dùng nhập lại → Quay lại bước 4
Người dùng không nhập lại → Kết thúc use case
6a. Mật khẩu mới không đủ tính bảo mật
6a1. Hệ thống hiển thị thông báo:“Vui lòng nhập mật khẩu có tối thiểu 8 ký tự, bao gồm chữ, số và ký tự đặc biệt.”
Người dùng nhập lại → Quay lại bước 4
Người dùng không nhập lại → Kết thúc use case
6b. Mật khẩu mới trùng với mật khẩu cũ
6b1. Hệ thống hiển thị thông báo:“Mật khẩu mới không được trùng mật khẩu cũ.”
Người dùng nhập lại → Quay lại bước 4
Người dùng không nhập lại → Kết thúc use case
6c. Mật khẩu mới và xác nhận mật khẩu mới không trùng nhau
6c1.Hệ thống hiển thị thông báo:“Mật khẩu mới không khớp. Vui lòng nhập lại.”
Người dùng nhập lại → Quay lại bước 4
Người dùng không nhập lại → Kết thúc use case
9a. Hệ thống gặp lỗi không thể cập nhật
91. Hệ thống hiển thị thông báo:” Không thể đổi mật khẩu. Vui lòng thử lại sau”
→ Kết thúc use case


Business rules
Mật khẩu phải có đủ 8 ký tự(bao gồm chữ, số và ký tự đặc biệt).
Mật khẩu mới và xác nhận mật khẩu mới phải trùng khớp với nhau






