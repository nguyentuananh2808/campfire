# Campfire UI system

## Direction

Warm editorial social app: gần gũi, rõ ràng và có chiều sâu vừa đủ. Giữ bảng màu lửa trại và `Be Vietnam Pro`; không thay bằng palette xanh/OLED hoặc Inter từ gợi ý tự động vì không phù hợp nhận diện và yêu cầu light/dark parity.

## Principles

- Content first: nền phẳng, chỉ một lớp tint nhẹ; không dùng glow/radial decoration trên mọi card.
- One accent: cam đỏ cho hành động chính và trạng thái active; vàng chỉ là highlight nhỏ.
- Restrained geometry: radius 8/12/16/20, card phổ thông 16; pill chỉ dành cho badge/chip/avatar.
- Quiet elevation: border rõ, shadow ngắn và nhẹ; không dùng glass blur tràn lan.
- Typography: body 16px/1.55; heading đậm vừa, tracking tối thiểu; không dùng chữ khổng lồ nếu không phải landing page.
- Icons: SVG nét 1.8–2; emoji chỉ là nội dung chat/sticker, không làm icon điều hướng hay trạng thái hệ thống.
- Motion 120–220ms, chỉ opacity/transform; hỗ trợ reduced motion.
- Mobile: touch target 44px, safe area, không horizontal overflow; kiểm tra 360/390/430px.

## Component rules

- Top bar 64px mobile / 68px desktop, nền opaque có border; logo không xoay/glow khi hover.
- Mobile nav dock gần cạnh dưới, radius 16; active dùng surface tint + một indicator, không gradient.
- Hero là section có border và surface, không phải banner gradient. H1 tối đa 2.5rem trên app screen.
- Primary button dùng màu `--primary`; hover dùng `--primary-strong`. Không gradient.
- Cards có border 1px, radius 16, shadow nhẹ; danh sách dày dùng radius 12.
- Form giữ label thật, input 46–48px, focus ring rõ; error nằm gần field.
- Chat bubble tối đa 78% desktop / 88% mobile, radius 16/4; composer gọn và không che nội dung.
