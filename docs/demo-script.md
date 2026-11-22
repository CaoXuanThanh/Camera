# Kịch bản demo 3 phút

## Chuẩn bị

- Mở cùng một tệp `index.html` ở hai tab Chrome. Đăng nhập tab Quản trị bằng `admin` và tab Phụ huynh bằng `trang@example.test`. Cả hai dùng mật khẩu mẫu `CameraDemo26`.
- Trong Quản trị, chọn **Khôi phục dữ liệu**. Kiểm tra Nguyễn Minh Anh ở 3A1, Nguyễn Gia Bảo ở 3A2 và Trần Khánh Linh đang học ở 4A1. Mở quyền của các tài khoản mẫu nếu đã khóa ở lượt thử trước.
- Để sẵn tab phụ huynh ở **Camera trường học** và tab quản trị ở **Đối soát quyền**. Chạy trước ở 1280 px và 375 px.

| Thời gian | Thao tác và lời dẫn |
| --- | --- |
| 0:00–0:45 | Ở tab Phụ huynh, giới thiệu hai con và ba camera. Mở **Camera lớp 3A1** rồi để video tiếp tục phát. “Danh sách được tính từ lớp của các con đang học. Video minh họa phát ngay từ máy này. Tình trạng thiết bị và trạng thái phát hiện riêng.” |
| 0:45–1:35 | Sang tab Quản trị, xem lô mẫu từ hệ thống trường. Nguyễn Minh Anh chuyển 3A1 → 3A2 và Trần Khánh Linh ngừng học. Kiểm tra hai lượt thu hồi và một lượt cấp trong dữ liệu gốc. Nguyễn Thu Trang mất camera 3A1, Trần Hoàng Nam mất camera sân sinh hoạt, Lê Thanh Hà có thêm 3A2 và vẫn giữ 3A1 qua học sinh còn lại. Bấm **Áp dụng cập nhật**. |
| 1:35–2:20 | Quay lại tab Phụ huynh đang mở camera 3A1. Viewer dừng và hiện **Quyền xem đã bị thu hồi**. Bấm **Về camera trường học** để thấy 3A2 và hành lang vẫn còn. Mở 3A2 để xác nhận video vẫn phát được. |
| 2:20–3:00 | Bấm **Xem nhật ký** ở Quản trị và chỉ vào bản ghi đồng bộ vừa áp dụng. “Cán bộ kiểm tra tác động trước khi duyệt một lượt. Trong bản local, service mô phỏng quyết định quyền. Với camera thật, backend xác thực người dùng và dịch vụ phát video kiểm tra quyền xem.” |

Nếu trình duyệt chặn đồng bộ giữa hai tab mở từ tệp local, hãy diễn tập tuần tự bằng đăng xuất và đăng nhập lại. Chỉ trình bày phần cập nhật danh sách sau khi đăng nhập lại trong ca này. Nếu buổi dựng từ đầu chưa có đối soát lô, dùng **Học sinh & lớp** để chuyển Nguyễn Minh Anh sang 3A2 và trình bày tác động của lượt thay đổi đơn lẻ.

## Kiểm tra thêm sau demo

| Ca | Thao tác và kết quả dự kiến |
| --- | --- |
| Trang và 3A1 trước và sau chuyển lớp | Khôi phục dữ liệu. Trong **Tra cứu quyền**, chọn Nguyễn Thu Trang và **Camera lớp 3A1**. Trước khi áp dụng lô, Nguyễn Minh Anh là hồ sơ tạo quyền xem. Mở Viewer để đối chiếu tên học sinh. Áp dụng lô rồi tra lại cặp này. Tài khoản mất quyền vì lớp hiện tại của các con không khớp lớp gán camera. |
| Nam có quyền xem camera ngoại tuyến | Khôi phục dữ liệu trước khi áp dụng lô. Chọn Trần Hoàng Nam và **Sân sinh hoạt khu B**. Trần Khánh Linh ở 4A1 tạo quyền xem. Tra cứu báo có quyền, thiết bị ngoại tuyến và chưa thể phát. |
| Dashboard tự cập nhật | Chạy lại ca Trang với tab phụ huynh giữ ở Dashboard trong lúc quản trị áp dụng lô. Danh sách bỏ 3A1, giữ 3A2 và hành lang dùng chung ngay trên tab đang mở. |

[Kế hoạch diễn tập 180 phút](dien-tap-180-phut.md)
