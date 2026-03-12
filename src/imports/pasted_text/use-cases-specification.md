
1. Đăng nhập
Use case ID
1
Use case name
Đăng nhập
Description
Là người dùng, tôi muốn đăng nhập vào hệ thống.
Actors
Quản trị viên hệ thống và người dùng đã đăng ký tài khoản
Priority
Cao
Triggers
Người dùng chọn chức năng “Đăng nhập” trên hệ thống.
Pre-conditions
- Người dùng đã có tài khoản hợp lệ trên hệ thống.
- Tài khoản chưa bị khóa hoặc chưa bị xóa.
Post-conditions
Người dùng đăng nhập thành công vào hệ thống.
Main flow
1. Người dùng chọn “Đăng nhập”.
2. Hệ thống hiển thị form đăng nhập.
3. Người dùng nhập: Tên đăng nhập / Email và Mật khẩu.
4. Người dùng nhấn nút “Đăng nhập”.
5. Hệ thống kiểm tra dữ liệu.
6. Hệ thống chuyển hướng người dùng vào trang chủ hệ thống.
Alternative flows
4a. Người dùng chọn “Quên mật khẩu”
4a1. Hệ thống hiển thị form nhập email
4a2. Người dùng nhập email đã đăng ký
4a3. Người dùng nhấn “Gửi yêu cầu”
4a4. Hệ thống kiểm tra email
4a5. Hệ thống gửi liên kết đặt lại mật khẩu đến email
4a6. Người dùng truy cập liên kết đặt lại mật khẩu
4a7. Hệ thống hiển thị form đặt mật khẩu mới
4a8. Người dùng nhập mật khẩu mới
4a9. Hệ thống kiểm tra mật khẩu
4a10.Hệ thống cập nhật mật khẩu, quay lại bước 3
Exception flows
4a3a. Hệ thống không tìm thấy email => Hệ thống hiển thị thông báo lỗi.
4a9a. Mật khẩu không hợp lệ (tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số) => Hệ thống yêu cầu nhập lại
5a. Nội dung trống => Hệ thống yêu cầu nhập lại.
5b. Dữ liệu không hợp lệ => Hệ thống hiển thị thông báo: “Tên đăng nhập hoặc mật khẩu không đúng”.
5c. Tài khoản đang bị khóa => Hệ thống hiển thị thông báo: “Tài khoản của bạn đã bị khóa do vi phạm”.
5d. Tài khoản đã bị xoá => Hệ thống hiển thị thông báo: “Tài khoản đã bị xoá khỏi hệ thống”.
 Business rules
- Tài khoản bị khóa hoặc bị xóa không được đăng nhập.
- Chức năng “Quên mật khẩu” chỉ áp dụng cho email đã đăng ký.
- Mật khẩu mới phải tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.
 Non-functional Requirements
N/A






2. Quản lý người dùng
2.1. Khóa / mở khóa tài khoản người dùng vi phạm

Use case ID
2.1
Use case name
Khoá / mở tài khoản người dùng vi phạm
Description
Là Quản trị viên hệ thống , tôi muốn khóa tạm thời hoặc mở lại tài khoản của người dùng khi người đó vi phạm hoặc đã được xử lý xong vi phạm.
Actors
Quản trị viên hệ thống
Priority
Cao
Triggers
Quản trị viên chọn chức năng “Khóa/mở khóa tài khoản người dùng” trên hệ thống.
Pre-conditions
- Quản trị viên đã đăng nhập hệ thống.
- Tài khoản người dùng tồn tại trong hệ thống.
Post-conditions
- Trạng thái tài khoản được cập nhật (Bị khoá/Hoạt động).
- Lịch sử thay đổi trạng thái được lưu vào hệ thống log.
Main flow
1. Quản trị viên truy cập “Quản lý người dùng”.
2. Hệ thống hiển thị danh sách người dùng và công cụ tìm kiếm.
3. Quản trị viên chọn tài khoản người dùng.
4. Quản trị viên chọn chức năng “Khóa / Mở khóa tài khoản”.
5. Hệ thống hiển thị form yêu cầu chọn: Loại hình (Khóa/Mở), Lý do, và Thời hạn (nếu là khóa).
6. Quản trị viên nhập form
7. Quản trị viên chọn nút “Xác nhận”.
8. Hệ thống kiểm tra dữ liệu.
9. Hệ thống cập nhật trạng thái và gửi thông báo tự động cho người dùng.
Alternative flows
7a. Huỷ thao tác
7a1. Quản trị viên chọn nút “Huỷ”.
7a2. Hệ thống đóng form và không thay đổi trạng thái tài khoản.
Exception flows
8a. Dữ liệu không hợp lệ => Hệ thống yêu cầu nhập lại.
 Business rules
- Tài khoản chỉ có hai trạng thái hợp lệ: Hoạt động và Bị khóa.
- Khi khóa hoặc mở khóa tài khoản, lý do là bắt buộc.
- Nếu chọn Khóa tài khoản, phải nhập thời hạn khóa hợp lệ trong tương lai.
- Không cho phép khóa tài khoản đã bị khóa hoặc mở khóa tài khoản đang hoạt động.
- Người dùng bị khoá sẽ không thể đăng nhập hoặc đăng bài.
 Non-functional Requirements
N/A



2.2. Gửi thông báo vi phạm

Use case ID
2.2
Use case name
Gửi thông báo vi phạm
Description
Là Quản trị viên hệ thống , tôi muốn gửi thông báo vi phạm đến người dùng khi họ vi phạm nội quy diễn đàn.
Actors
Quản trị viên hệ thống
Priority
Cao
Triggers
Quản trị viên chọn chức năng “Gửi thông báo vi phạm” trên hệ thống.
Pre-conditions
- Quản trị viên đã đăng nhập hệ thống.
- Tài khoản người dùng tồn tại trong hệ thống.
Post-conditions
- Thông được gửi và lưu trong hệ thống.
- Người dùng nhận được cảnh báo.
Main flow
1. Quản trị viên truy cập “Quản lý người dùng”.
2. Hệ thống hiển thị danh sách người dùng và công cụ tìm kiếm.
3. Quản trị viên chọn tài khoản người dùng.
4. Quản trị viên chọn chức năng “Gửi thông báo vi phạm”.
5. Hệ thống hiển thị form yêu cầu chọn loại vi phạm và nhập lý do.
6. Quản trị viên chọn loại vi phạm và nhập .
7. Quản trị viên nhấn “Gửi”.
8. Hệ thống kiểm tra dữ liệu.
9. Hệ thống lưu và gửi thông báo.
10. Hệ thống hiển thị thông báo thành công.
Alternative flows
7a. Huỷ thao tác
7a1. Quản trị viên chọn nút “Huỷ”.
7a2. Hệ thống đóng form và không gửi thông báo.
Exception flows
8a. Dữ liệu không hợp lệ => Hệ thống thông báo lỗi và yêu cầu nhập lại.
 Business rules
- Khi gửi thông báo vi phạm, loại vi phạm là bắt buộc.
- Loại vi phạm phải được chọn từ danh sách vi phạm do hệ thống quy định.
 Non-functional Requirements
N/A



2.3. Xoá tài khoản

Use case ID
2.3
Use case name
Xoá tài khoản người dùng
Description
Là Quản trị viên hệ thống , tôi muốn xóa vĩnh viễn tài khoản của người dùng vi phạm nghiêm trọng hoặc tái phạm nhiều lần.
Actors
Quản trị viên hệ thống
Priority
Cao
Triggers
Quản trị viên chọn chức năng “Xoá tài khoản người dùng” trên hệ thống.
Pre-conditions
- Quản trị viên đã đăng nhập hệ thống.
- Tài khoản người dùng tồn tại trong hệ thống.
Post-conditions
- Tài khoản bị xóa khỏi hệ thống.
- Người dùng không thể đăng nhập.
Main flow
1. Quản trị viên truy cập “Quản lý người dùng”.
2. Hệ thống hiển thị danh sách người dùng và công cụ tìm kiếm.
3. Quản trị viên chọn tài khoản người dùng.
4. Quản trị viên chọn chức năng “Xóa tài khoản”.
5. Hệ thống hiển thị form yêu cầu nhập/ chọn lý do.
6. Quản trị viên nhập/chọn lý do.
7. Quản trị viên chọn nút “Xác nhận”.
8. Hệ thống xóa tài khoản.
9. Hệ thống hiển thị thông báo thành công.
Alternative flows
7a. Huỷ thao tác
7a1. Quản trị viên chọn nút “Huỷ”.
7a2. Hệ thống đóng form và không thực hiện xóa tài khoản.
Exception flows
3a. Tài khoản không tồn tại
3a1. Tài khoản đã bị khoá trước đó => Hệ thống hiển thị thông báo lỗi.
 Business rules
- Người dùng không thể đăng nhập lại sau khi bị xóa tài khoản.
- Khi xóa tài khoản, lý do xóa là bắt buộc.
 Non-functional Requirements
N/A





