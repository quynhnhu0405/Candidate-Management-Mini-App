# Cách dùng công cụ AI và các hạn chế / thách thức kỹ thuật

Dự án: Candidate Management Mini App (React + Express + PostgreSQL + Gemini)

## 1. AI đã hỗ trợ tôi như thế nào trong quá trình phát triển

Tôi sử dụng **Claude Code** làm công cụ AI hỗ trợ lập trình. Phần việc cốt lõi của tôi là phân tích yêu cầu, đưa ra ý tưởng và quyết định thiết kế, chia nhỏ đầu việc, rà soát code, kiểm thử và chịu trách nhiệm về sản phẩm cuối cùng. Tôi chủ động đọc yêu cầu, xác định phạm vi và ưu tiên chức năng, lên ý tưởng về kiến trúc và trải nghiệm người dùng, rồi giao các yêu cầu cụ thể cho Claude Code. Claude Code hỗ trợ triển khai những phần được giao, giải thích lựa chọn kỹ thuật và gợi ý cách xử lý lỗi; tôi xem lại, điều chỉnh và tích hợp kết quả vào sản phẩm.

Quy trình làm việc của tôi:

1. **Tự phân tích và quyết định:** đối chiếu đặc tả với thời gian thực hiện, chốt cấu trúc frontend/backend, dữ liệu và luồng nghiệp vụ; ghi lại các giả định khi PDF không rõ.
2. **Giao việc có phạm vi rõ ràng:** yêu cầu Claude Code triển khai từng phần nhỏ theo kiến trúc đã chọn, thay vì để AI tự quyết định toàn bộ sản phẩm.
3. **Đọc và làm chủ code:** kiểm tra các thay đổi, đối chiếu với quy ước dự án, yêu cầu giải thích những phần chưa rõ và chỉnh lại để phù hợp với cấu trúc chung.
4. **Tự kiểm chứng kết quả:** chạy ứng dụng, gọi API, kiểm tra giao diện và chạy test; khi có lỗi, tôi tái hiện lỗi, xem nguyên nhân và xác nhận cách sửa bằng cách chạy lại.

**Claude Code hỗ trợ triển khai** các phần như module backend (controller, service, schema Zod, TypeORM entity, migration, seed), giao diện React, tích hợp Gemini ở backend, xử lý lỗi, test và tài liệu. Các đề xuất của AI không được xem là đúng mặc định: tôi kiểm tra lại hành vi, bảo mật, quy tắc dữ liệu và mức độ phù hợp với yêu cầu trước khi chấp nhận.

**Các quyết định và định hướng do tôi chủ động đưa ra:**

- Chọn TypeORM thay cho Prisma theo quyết định công nghệ của dự án; phát triển với PostgreSQL cài sẵn trên máy thay vì phụ thuộc Docker.
- Ưu tiên hoàn thành CRUD và các chức năng bắt buộc trước; tách riêng client/server để API key chỉ được dùng ở backend.
- Chốt các trường dữ liệu, trạng thái tuyển dụng, cách tìm kiếm không phân biệt dấu tiếng Việt, phân trang và lựa chọn số dòng mỗi trang.
- Quyết định hỗ trợ giao diện en/vi/ko và giữ các thông báo lỗi API theo một định dạng thống nhất.
- Với chức năng AI, xác định dữ liệu đầu vào, yêu cầu đầu ra không bịa thông tin, giới hạn độ dài kinh nghiệm, timeout, rate limit và cách hiển thị lỗi.

## 2. Chức năng chưa hoàn thành và thách thức kỹ thuật

### 2.1 Chức năng chưa hoàn thành / hạn chế

- **Chưa triển khai (deploy):** ứng dụng chỉ chạy local.
- **Không có đăng nhập / phân quyền và upload CV** (nằm ngoài phạm vi đề bài).
- **Bản tóm tắt có thể ít hơn 3 dòng** khi mô tả kinh nghiệm quá ít thông tin. Hệ thống chỉ giới hạn tối đa 5 dòng chứ không ép tối thiểu 3 dòng, vì ép sẽ khiến AI bịa thêm thông tin.
- **Bản tóm tắt có thể bị cũ:** nếu sửa mô tả kinh nghiệm sau khi tóm tắt, bản cũ vẫn giữ cho đến khi bấm "Tạo lại".
- **Ngôn ngữ của bản tóm tắt** theo ngôn ngữ của mô tả kinh nghiệm, không theo ngôn ngữ đang chọn trên giao diện.

### 2.2 Thách thức kỹ thuật và cách giải quyết

| Thách thức | Nguyên nhân | Cách giải quyết |
|---|---|---|
| Thư viện `@google/genai` không import được vào backend | Thư viện chỉ hỗ trợ ESM, backend dùng CommonJS (lỗi TS1479) | Nạp bằng `import()` động và dùng `resolution-mode` cho phần khai báo kiểu |
| Tìm kiếm không phân biệt dấu (gõ `quy` ra `Quý`) | Extension `unaccent` của PostgreSQL bị chính sách bảo mật Windows chặn, và còn phải cài trên mọi database | Dùng hàm `translate()` có sẵn của PostgreSQL với bảng ký tự tiếng Việt, bỏ dấu từ khoá ở Node, không cần cài thêm gì |
