# RONGLEO LIFE LOG — IMPLEMENTATION SPEC
## Quan Sát v2 / Life Event Logger
### Source: `rongleo-habit-tracker` → Target: `rongleo-life-log`

---

## 0. IMPLEMENTATION CONTEXT

### Current source project

The existing project is the uploaded `rongleo-habit-tracker` (Quan Sát), a small React + Vite + Tailwind CSS app.

Known current stack:

- React 18
- Vite 5
- Tailwind CSS 3
- JavaScript / JSX
- localStorage
- offline-first
- no backend
- no authentication

The existing app currently models:

```text
habits
logs
enc_messages
```

and already has:

- quick `+1` logging
- custom quantity + note
- daily log list
- mini 7-day chart
- encouragement messages
- habit CRUD
- JSON export/import
- localStorage persistence
- mobile-first layout
- desktop layout

### Target project

The target working directory is:

```text
D:\WORK\projects\ai-sandbox\rongleo-life-log
```

The old compressed project is located under:

```text
D:\WORK\projects\ai-sandbox\rongleo-life-log\rongleo-habit-tracker
```

The target root is intentionally empty.

---

# 1. MISSION

Transform the old **Quan Sát / Habit Tracker** into a broader:

# LIFE EVENT LOGGER

Working product name:

**Quan Sát**

Core idea:

> Một chạm để ghi lại cuộc sống.

English:

> One tap. Your life, recorded.

The application must NOT become a conventional habit tracker.

It should allow a user to record arbitrary events from daily life quickly and later inspect:

```text
EVENT
  ↓
TIMELINE
  ↓
CALENDAR
  ↓
STATISTICS
  ↓
PATTERNS / INSIGHTS
```

The product philosophy is:

> Observe first. Interpret later. Do not judge the user.

Do NOT add streaks, points, badges, pressure, or gamified "success/failure" mechanics.

---

# 2. IMPORTANT IMPLEMENTATION RULE

Do NOT blindly rewrite the old application.

First inspect the existing code and preserve useful behavior.

The old app contains valuable DNA:

- instant logging
- local-first storage
- raw log history
- custom quantities
- notes
- export/import
- lightweight UI
- no account requirement
- no streak
- non-judgmental philosophy

Refactor the architecture while preserving these strengths.

Do not continue growing everything inside one giant `App.jsx`.

---

# 3. PRODUCT MODEL

Replace:

```text
Habit
  ↓
Log
```

with:

```text
EventDefinition
  ↓
Event
```

### EventDefinition

Defines what the user can record.

Example:

```json
{
  "id": "water",
  "name": "Uống nước",
  "emoji": "💧",
  "category": "body",
  "type": "count",
  "unit": "ml",
  "defaultValue": 250,
  "favorite": true,
  "active": true,
  "createdAt": "..."
}
```

### Event

A real occurrence.

Example:

```json
{
  "id": "evt_001",
  "eventDefinitionId": "water",
  "timestamp": "2026-09-19T22:03:00+07:00",
  "value": 250,
  "unit": "ml",
  "durationSeconds": null,
  "rating": null,
  "note": "",
  "createdAt": "..."
}
```

Important:

**Raw events are the source of truth.**

Do not make daily aggregates the primary stored data.

---

# 4. EVENT TYPES

The system supports five types:

```text
moment
count
measurement
duration
rating
```

These are internal data/UX types.

The user should NOT normally be asked:

> "Choose event type."

The EventDefinition already knows its type.

---

## 4.1 MOMENT

Simple occurrence.

Examples:

```text
🚿 Tắm
💊 Uống thuốc
🍷 Rượu bia
📞 Gọi điện
🤝 Gặp khách
```

One tap records the event.

---

## 4.2 COUNT

An event with quantity.

Example:

```text
💧 Uống nước
```

Default:

```text
+250 ml
```

Quick tap should immediately record 250 ml.

A secondary control can allow:

```text
150 ml
250 ml
350 ml
500 ml
750 ml
1000 ml
```

or custom input.

---

## 4.3 MEASUREMENT

Examples:

```text
⚖️ Cân nặng
🩸 Đường huyết
❤️ Huyết áp
📏 Vòng eo
🌡️ Nhiệt độ
```

The event stores a numerical measurement.

Do not assume medical meaning.

The app is a logger, not a medical diagnostic system.

---

## 4.4 DURATION

Examples:

```text
💼 Làm việc
🚶 Đi bộ
🏃 Chạy
🧘 Thiền
📚 Học
😴 Ngủ
```

Support:

### Quick duration

```text
+15m
+30m
+60m
```

and, where useful:

### Start / Stop

```text
▶ Bắt đầu
...
■ Kết thúc
```

The first MVP implementation may support quick duration first, then start/stop.

---

## 4.5 RATING

Examples:

```text
🙂 Tâm trạng
⚡ Năng lượng
😰 Stress
🎯 Tập trung
```

Use a 1-5 scale or emoji scale.

Store numeric rating.

---

# 5. NAVIGATION

Use exactly four primary bottom-navigation destinations:

```text
👆 Ghi nhận
◷ Dòng thời gian
▦ Lịch
▥ Thống kê
```

Do not add a fifth primary tab in MVP.

Settings and management should be accessible from the appropriate top-level action/menu.

---

# 6. SCREEN 1 — GHI NHẬN

This is the most important screen.

Header:

```text
Hôm nay

Thứ Hai, ngày 14 tháng 9, 2026
```

Optional compact summary:

```text
11 sự kiện hôm nay
```

Top-right:

```text
＋
```

---

## 6.1 QUICK LOG GRID

Show only a compact set of favorite/frequent events.

Target:

**8-12 buttons**, not 40 or 300.

Example:

```text
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│   💧   │ │   🍜   │ │   ☕   │ │   💼   │
│ Uống   │ │  Ăn    │ │ Cà phê │ │ Làm    │
└────────┘ └────────┘ └────────┘ └────────┘

┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│   🚶   │ │   🏃   │ │   💊   │ │   🙂   │
│ Đi bộ  │ │ Vận    │ │ Thuốc  │ │ Mood   │
└────────┘ └────────┘ └────────┘ └────────┘
```

The exact number can adapt to screen width.

---

# 7. QUICK LOG PRINCIPLE

Common event:

```text
1 tap → event created
```

Count event:

```text
1 tap → default quantity created
```

Measurement:

```text
2-3 taps
```

New event:

```text
≤10 seconds target
```

Never make a user open a form for a common event.

---

# 8. RECENT EVENTS

Below the quick grid:

```text
Gần đây

💧 Uống nước
☕ Cà phê
💼 Làm việc
🚶 Đi bộ
🍜 Ăn
```

Recent items should be calculated from actual usage.

---

# 9. FAVORITES

Users can pin events.

Priority order for Quick Log:

```text
Favorites
↓
Recently used
↓
Frequently used
↓
Other active events
```

The system should make the interface increasingly personalized without requiring manual configuration.

---

# 10. ADD EVENT

Tap:

```text
＋
```

opens:

```text
Thêm hoạt động

[ 🔎 Tìm hoạt động... ]

Gần đây

💧 Nước     ☕ Cà phê
💼 Làm việc 🚶 Đi bộ

Body
💧 🚽 🚿 🪥

Food
🍚 🍜 🍎 🍳

Work
💼 💻 📞 📧

Movement
🚶 🏃 🚴 🏋️

...
```

This must be emoji-first.

The emoji is the main visual identifier.

---

# 11. EMOJI LIBRARY

Initial library target:

**300+ event definitions/suggestions.**

Important:

Do NOT render all 300 simultaneously.

The library exists as searchable structured data.

Use:

```text
favorites
recent
frequency
category
search
aliases
```

to keep the visible UI small.

---

# 12. EMOJI SEARCH

Search must understand:

- Vietnamese
- English
- aliases
- event names
- category

Examples:

```text
nước
→ 💧 Uống nước

water
→ 💧 Uống nước

coffee
→ ☕ Cà phê

cà phê
→ ☕

ăn
→ 🍜 🍚 🍽️

work
→ 💼 Làm việc

làm việc
→ 💼
```

Do not require exact matching.

---

# 13. EMOJI LIBRARY CATEGORIES

Create a structured seed library with at least these categories:

```text
body
food
drink
health
sleep
movement
work
learning
social
emotion
mind
digital
finance
travel
home
entertainment
pain_symptom
achievement
```

Each definition should contain:

```text
id
name
emoji
category
type
unit
defaultValue
aliases[]
active
favorite
createdAt
```

---

# 14. EMOJI SEED LIBRARY

Build a rich initial library.

At minimum include examples from the following groups.

## BODY

```text
💧 Uống nước
🥤 Uống đồ uống
🚰 Uống nước
🚽 Tiểu tiện
💩 Đại tiện
🚿 Tắm
🛁 Ngâm bồn
🧼 Rửa tay
🪥 Đánh răng
🦷 Chăm sóc răng
🧴 Skincare
💇 Cắt tóc
🪒 Cạo râu
```

## FOOD

```text
🍚 Cơm
🍜 Mì
🍲 Bữa ăn
🍛 Ăn trưa
🍳 Ăn sáng
🥗 Salad
🥪 Đồ ăn nhẹ
🍎 Trái cây
🍌 Chuối
🍊 Cam
🍉 Dưa hấu
🥑 Bơ
🥚 Trứng
🥩 Thịt
🍗 Gà
🐟 Cá
🍣 Sushi
🍕 Pizza
🍔 Fast food
🍰 Bánh
🍫 Chocolate
🍬 Kẹo
🍦 Kem
```

## DRINK

```text
💧 Nước
☕ Cà phê
🍵 Trà
🧋 Trà sữa
🥛 Sữa
🧃 Nước trái cây
🥤 Nước ngọt
🍺 Bia
🍷 Rượu vang
🥃 Rượu mạnh
🍸 Cocktail
```

## HEALTH

```text
💊 Uống thuốc
💉 Tiêm
🩸 Đường huyết
❤️ Huyết áp
⚖️ Cân nặng
📏 Vòng eo
🌡️ Nhiệt độ
```

## SLEEP

```text
😴 Ngủ
🛌 Nằm nghỉ
🌙 Đi ngủ
🌅 Thức dậy
💤 Ngủ trưa
⏰ Thức giấc
😪 Buồn ngủ
```

## MOVEMENT

```text
🚶 Đi bộ
🏃 Chạy
🚴 Đạp xe
🏊 Bơi
🏋️ Tập gym
🤸 Tập thể dục
🧘 Yoga
🧘 Thiền
⚽ Bóng đá
🏀 Bóng rổ
🎾 Tennis
🏸 Cầu lông
🥊 Boxing
🧗 Leo núi
```

## WORK

```text
💼 Làm việc
💻 Máy tính
🖥️ Desktop
📞 Gọi điện
📱 Điện thoại
📧 Email
📨 Trả lời email
📝 Viết
📊 Phân tích
📈 Báo cáo
🗂️ Hồ sơ
📁 Tài liệu
📋 Họp
🤝 Gặp khách
🏢 Văn phòng
💰 Kinh doanh
🧑‍💻 Coding
🐛 Debug
🚀 Deploy
```

## LEARNING

```text
📚 Học
📖 Đọc sách
✍️ Viết
🎧 Nghe
🗣️ Nói
🇬🇧 English
🎓 Học tập
🔬 Nghiên cứu
🔎 Research
📝 Ghi chú
🎥 Xem video
🎙️ Podcast
```

## SOCIAL

```text
❤️ Thân mật
👨‍👩‍👧 Gia đình
👨‍👧 Với con
👥 Bạn bè
🤝 Gặp bạn
🗣️ Trò chuyện
📞 Gọi điện
💬 Nhắn tin
🎉 Tiệc
🎂 Sinh nhật
💐 Hẹn hò
```

## EMOTION

```text
😀 Vui
😊 Hạnh phúc
🙂 Bình thường
😐 Không cảm xúc
😔 Buồn
😢 Khóc
😡 Tức giận
😤 Bực
😰 Lo lắng
😨 Sợ
😎 Tự tin
🥳 Phấn khích
🤩 Hứng thú
😴 Mệt
🥱 Buồn ngủ
🫠 Quá tải
❤️ Yêu
```

## MIND

```text
🧠 Suy nghĩ
💡 Ý tưởng
🎯 Tập trung
🧘 Thiền
🙏 Biết ơn
📝 Journaling
🤔 Suy nghĩ
✨ Cảm hứng
🔥 Động lực
😌 Thư giãn
🌿 Bình yên
```

## DIGITAL

```text
📱 Điện thoại
💻 Laptop
🌐 Internet
📧 Email
💬 Chat
📸 Chụp ảnh
🎥 Video
🎧 Nghe nhạc
🎮 Chơi game
📺 TV
▶️ YouTube
📱 Social media
```

## FINANCE

```text
💰 Nhận tiền
💸 Chi tiền
💳 Thanh toán
🏦 Ngân hàng
📈 Đầu tư
📉 Lỗ
💵 Thu nhập
🧾 Hóa đơn
🛒 Mua sắm
🏷️ Mua hàng
```

## TRAVEL

```text
🚶 Đi bộ
🚗 Lái xe
🏍️ Xe máy
🚕 Taxi
🚌 Xe buýt
🚆 Tàu
✈️ Máy bay
🛵 Di chuyển
🗺️ Đi đâu đó
📍 Đến nơi
🏠 Về nhà
🏨 Khách sạn
🌴 Du lịch
```

## HOME

```text
🏠 Ở nhà
🧹 Dọn nhà
🧺 Giặt đồ
🍳 Nấu ăn
🧽 Rửa chén
🛒 Đi chợ
📦 Nhận hàng
🔧 Sửa chữa
🌱 Chăm cây
🐕 Chăm thú
```

## ENTERTAINMENT

```text
🎬 Xem phim
📺 Xem TV
🎮 Chơi game
🎵 Nghe nhạc
🎧 Podcast
📖 Đọc
🎨 Vẽ
🎸 Chơi nhạc
🎤 Hát
🎭 Giải trí
🍿 Xem phim
🎉 Đi chơi
```

## PAIN / SYMPTOMS

```text
🤕 Đau đầu
😖 Đau
🤢 Buồn nôn
🤮 Nôn
😵 Chóng mặt
😫 Mệt
😴 Thiếu ngủ
😰 Stress
🔥 Nóng
🥶 Lạnh
🤧 Cảm
🤒 Sốt
💢 Khó chịu
```

## ACHIEVEMENT / POSITIVE

```text
✅ Hoàn thành
🎯 Đạt mục tiêu
🏆 Thành công
⭐ Quan trọng
🔥 Tiến bộ
💡 Ý tưởng hay
🎉 Tin vui
💰 Kiếm tiền
🚀 Launch
👏 Thành tựu
❤️ Khoảnh khắc đáng nhớ
```

The implementation should expand this to approximately 300+ definitions by adding useful variants, aliases, and contextually distinct events rather than meaningless emoji spam.

---

# 15. CUSTOM EVENT

Users can create an event:

```text
Tên
[ Đi gặp khách ]

Emoji
[ 🤝 ]

Category
[ Công việc ]

Type
[ Moment ]

[ Lưu ]
```

For advanced types:

```text
Count
→ unit + default value

Measurement
→ unit

Duration
→ unit/time behavior

Rating
→ scale
```

The user should not need to understand the technical type system.

Use friendly labels if the type must be shown.

---

# 16. TIMELINE

Second tab:

```text
Dòng thời gian
```

Newest first.

Example:

```text
22:03  💧 Uống nước
22:01  💧 Uống nước
22:00  💧 Uống nước
21:32  😴 Giấc ngủ
21:31  🏃 Vận động
21:30  🍜 Bữa ăn
21:29  ☕ Cà phê
```

Each item should show:

- emoji
- name
- time
- value if relevant
- note if present

---

# 17. TIMELINE GROUPING

If many identical events occur close together, support compact grouping.

Example:

```text
💧 Uống nước × 7
```

with expandable details.

Do not make the timeline unreadable when a user records many events.

---

# 18. EVENT DETAIL

Tap event:

```text
💧

Uống nước

19/09/2026
22:03

250 ml

[ Sửa ]
[ Xóa ]
```

Optional note.

Editing must preserve the original event ID.

---

# 19. UNDO

After quick logging show a small temporary toast:

```text
💧 Uống nước đã ghi nhận

Hoàn tác
```

Duration:

3-5 seconds.

This is important because rapid logging increases accidental taps.

---

# 20. CALENDAR

Third tab:

```text
Lịch
```

Month view.

Selected day:

```text
Thứ Hai, ngày 14 tháng 9, 2026

Sự kiện trong ngày (11)
```

Then event list.

Days with events need a visual indicator.

Possible:

```text
14
● 11
```

Do not use excessive colors.

---

# 21. CALENDAR DATA

Calendar must be generated from raw events.

Do not maintain a separate manual calendar database.

---

# 22. STATISTICS

Fourth tab:

```text
Thống kê
```

Time ranges:

```text
7 ngày
30 ngày
90 ngày
Tất cả
```

Statistics should be event-type-aware.

---

## MOMENT

Show:

```text
Tổng số lần
Trung bình/ngày
Lần gần nhất
Khoảng cách trung bình
```

## COUNT

Show:

```text
Tổng
Trung bình/ngày
Số lần
Trung bình/lần
```

## DURATION

Show:

```text
Tổng thời gian
Trung bình/session
Số session
```

## MEASUREMENT

Show:

```text
Latest
Min
Max
Average
Trend
```

## RATING

Show:

```text
Average
Highest
Lowest
Distribution
```

---

# 23. IMPORTANT STATISTICS PRINCIPLE

Do not use judgmental labels such as:

```text
Good
Bad
Success
Failure
Better
Worse
```

as universal interpretations.

For example, increased water consumption and increased smoking cannot share the same semantic "increase = bad".

The old app's:

```text
improve
same
worse
```

logic must NOT become part of the generic event engine.

If interpretation is added later, it must be event-definition-specific and explicitly configured.

---

# 24. SEARCH

Global search should find:

- event name
- alias
- category
- note
- emoji

Example:

```text
🔎 cà phê
```

results:

```text
☕ Cà phê
19/09 21:29

☕ Cà phê
19/09 08:12
```

Search should cover historical events.

---

# 25. FILTER

Timeline/search should support:

```text
All
Category
Event
Date range
```

Example:

```text
Category:
[Body]
[Food]
[Work]
[Movement]
[Mood]
```

---

# 26. EVENT MANAGEMENT

Provide a management screen for definitions.

Sections:

```text
⭐ Yêu thích

💧 Uống nước
☕ Cà phê
💼 Làm việc
🚶 Đi bộ

────────

Tất cả

Body
Food
Work
...
```

Actions:

- favorite
- unfavorite
- activate/deactivate
- edit
- duplicate
- delete

Do not delete raw historical events merely because an EventDefinition is deactivated/deleted.

If an EventDefinition is deleted, historical events should retain enough snapshot data to render safely.

Preferred event storage:

```json
{
  "eventDefinitionId": "water",
  "nameSnapshot": "Uống nước",
  "emojiSnapshot": "💧",
  "..."
}
```

This prevents old history from breaking when definitions change.

---

# 27. DATA STORAGE

MVP remains offline-first.

Use localStorage initially.

Storage keys should be versioned.

Recommended:

```text
rongleo_life_log
```

with a single versioned object OR clearly versioned separate keys.

Preferred:

```json
{
  "schemaVersion": 2,
  "eventDefinitions": [],
  "events": [],
  "settings": {}
}
```

Do not continue using the old:

```text
habits
logs
enc_messages
```

as the v2 primary schema.

---

# 28. MIGRATION FROM V1

The new app should be able to import the old Quan Sát data format.

Old:

```json
{
  "version": 1,
  "data": {
    "habits": [],
    "logs": [],
    "messages": []
  }
}
```

Migration:

```text
habit
  ↓
EventDefinition
```

Example:

```json
{
  "id": "h1",
  "name": "Hút thuốc",
  "unit": "điếu"
}
```

becomes:

```json
{
  "id": "legacy_h1",
  "name": "Hút thuốc",
  "emoji": "🚬",
  "category": "health",
  "type": "count",
  "unit": "điếu",
  "defaultValue": 1,
  "active": true
}
```

Old log:

```json
{
  "id": "l1",
  "habit_id": "h1",
  "quantity": 2,
  "note": "cà phê sáng",
  "created_at": "..."
}
```

becomes:

```json
{
  "id": "l1",
  "eventDefinitionId": "legacy_h1",
  "value": 2,
  "unit": "điếu",
  "note": "cà phê sáng",
  "timestamp": "...",
  "nameSnapshot": "Hút thuốc",
  "emojiSnapshot": "🚬"
}
```

Old encouragement messages should be preserved in a migration archive only if useful, but they are NOT part of the new generic event engine.

---

# 29. EXPORT / IMPORT

Keep the old backup philosophy.

Export:

```text
JSON
```

Suggested format:

```json
{
  "app": "rongleo-life-log",
  "schemaVersion": 2,
  "exportedAt": "...",
  "eventDefinitions": [],
  "events": [],
  "settings": {}
}
```

Import modes:

```text
Replace
Merge
```

Merge must deduplicate by event ID / definition ID.

Show preview before import:

```text
Event definitions: 42
Events: 3,182
```

Do not destroy current data without explicit confirmation.

---

# 30. PRIVACY

No account.

No server.

No automatic upload.

All user events remain local in MVP.

Potentially sensitive event types include:

- health
- medication
- mood
- sexual activity
- finance
- notes

Therefore:

- no public sharing
- no analytics containing event contents
- no external API calls for event data in MVP

Future:

```text
App lock
Face ID / fingerprint
Encrypted backup
```

---

# 31. EMPTY STATES

Timeline:

```text
🌱

Chưa có gì hôm nay.

Một chạm để bắt đầu ghi lại ngày của bạn.
```

Statistics:

```text
📊

Chưa đủ dữ liệu.

Ghi nhận vài ngày để bắt đầu thấy nhịp sống của bạn.
```

Search:

```text
🔎

Không tìm thấy hoạt động.
```

Avoid "No data" style messages.

---

# 32. FIRST RUN

Maximum three onboarding screens.

### 1

```text
📱

Ghi lại cuộc sống
bằng một chạm.
```

### 2

```text
💧 ☕ 💼 🚶 🙂

Bạn ghi nhận.
App xây dựng timeline.
```

### 3

```text
📊

Sau một thời gian,
bạn có thể nhìn thấy
nhịp sống của chính mình.

[Bắt đầu]
```

Keep onboarding skippable.

---

# 33. VISUAL DESIGN

Maintain the visual spirit of the supplied screenshots:

- soft off-white/light gray background
- white cards
- large black typography
- subtle gray secondary text
- rounded cards
- large emoji
- minimal borders
- gentle shadows
- clean bottom navigation
- mobile-first
- Vietnamese UI

Avoid excessive colors.

Use color primarily for:

- selected navigation
- active state
- warnings/errors
- lightweight data visualization

Do not turn every category into a different color.

---

# 34. EMOJI UI RULE

Emoji is a functional identifier.

Recommended visual hierarchy:

```text
Emoji: 32-48px
Name: 14-17px
Secondary data: 12-14px
```

The user should recognize an event visually before reading its name.

Do not replace emoji with generic line icons for the main event library.

---

# 35. RESPONSIVE

### Mobile

Primary target.

Use:

- bottom navigation
- thumb-friendly tap targets
- 2-4 column event grid depending on width
- bottom sheets/modals where appropriate

### Desktop

Support:

- centered content area
- optional left sidebar or wider bottom navigation adaptation
- keyboard-friendly search
- larger timeline width

Do not design desktop first.

---

# 36. ACCESSIBILITY

Every emoji event button must have a readable text label.

Example:

```html
<button aria-label="Uống nước">
```

Do not depend on emoji alone for accessibility.

Minimum tap target:

```text
44x44 px
```

Prefer larger.

Ensure text contrast is readable.

---

# 37. PERFORMANCE

The app must remain responsive with:

```text
10,000+ events
100+ event definitions
```

Do not recompute expensive statistics on every render.

Create memoized selectors/utilities.

For MVP localStorage is acceptable.

If performance becomes a problem, migration to IndexedDB can be considered later.

Do not prematurely add a backend.

---

# 38. ARCHITECTURE

Do not keep all code in App.jsx.

Recommended structure:

```text
src/
├── app/
│   └── App.jsx
│
├── data/
│   ├── eventLibrary.js
│   ├── categories.js
│   └── seed.js
│
├── domain/
│   ├── eventTypes.js
│   ├── eventService.js
│   ├── selectors.js
│   ├── statistics.js
│   └── migration.js
│
├── storage/
│   ├── storage.js
│   ├── exportImport.js
│   └── migrations.js
│
├── components/
│   ├── EventButton.jsx
│   ├── EventGrid.jsx
│   ├── EventPicker.jsx
│   ├── EmojiPicker.jsx
│   ├── EventCard.jsx
│   ├── TimelineItem.jsx
│   ├── Calendar.jsx
│   ├── StatisticCard.jsx
│   ├── Toast.jsx
│   └── Modal.jsx
│
├── pages/
│   ├── CapturePage.jsx
│   ├── TimelinePage.jsx
│   ├── CalendarPage.jsx
│   └── StatisticsPage.jsx
│
├── styles/
│   └── ...
│
└── main.jsx
```

Exact structure can be adjusted if Claude finds a cleaner architecture.

Do not create unnecessary abstraction layers.

---

# 39. LEGACY CLEANUP

Remove or refactor:

- generic `habit` terminology in user-facing UI
- universal improve/same/worse logic
- encouragement engine as a core feature
- habit-specific dashboard assumptions
- single-unit-only data model

Do NOT delete useful old functionality without replacement.

---

# 40. OLD FEATURE MAPPING

| Quan Sát v1 | Quan Sát v2 |
|---|---|
| Habit | EventDefinition |
| Log | Event |
| +1 | Quick Log |
| + Khác | Custom Value |
| Nhật ký | Timeline |
| Dashboard | Capture |
| Mini Chart | Event Statistics |
| Encouragement | Removed from core |
| Settings | Event Management + Data |
| JSON Export | JSON Export |
| JSON Import | JSON Import + Migration |
| localStorage | Versioned local storage |

---

# 41. DO NOT IMPLEMENT YET

Do not implement:

- AI chat
- AI insights
- Supabase
- login
- cloud sync
- social
- sharing
- streaks
- badges
- achievements
- push reminders
- wearable integration
- location tracking
- photo diary
- voice logging

The product must first prove that the event logging loop is excellent.

---

# 42. PHASED IMPLEMENTATION

## Phase 0 — Inspect

Before coding:

1. Inspect old source.
2. Identify reusable logic.
3. Identify current storage schema.
4. Identify current UI patterns.
5. Identify migration requirements.
6. Produce a short implementation plan.

Do not ask the user unnecessary questions if the spec already answers them.

---

## Phase 1 — Architecture

Create:

- new folder structure
- event schema
- storage abstraction
- migration layer
- event library
- categories
- selectors

Keep the app functional after each major step.

---

## Phase 2 — Capture

Implement:

- Home
- Quick Log
- Favorites
- Recent
- Add Event
- Emoji library
- Search
- Custom event
- Count interaction
- Moment interaction

This is the highest priority.

---

## Phase 3 — Timeline

Implement:

- chronological events
- grouping
- filters
- event detail
- edit
- delete
- undo

---

## Phase 4 — Calendar

Implement:

- month navigation
- event count indicators
- selected day
- day event list

---

## Phase 5 — Statistics

Implement:

- 7d
- 30d
- 90d
- all
- type-specific statistics
- event detail statistics

---

## Phase 6 — Data

Implement:

- export
- import
- merge
- replace
- legacy migration
- schema versioning

---

## Phase 7 — Polish

Test:

- mobile
- desktop
- empty state
- long names
- many events
- 10,000 event performance
- accidental tap
- import/export
- migration
- reload persistence

---

# 43. ACCEPTANCE CRITERIA

## Capture

- [ ] Common event logs in one tap.
- [ ] No unnecessary modal for common event.
- [ ] Count event logs default quantity immediately.
- [ ] User can customize quantity.
- [ ] User can add a note.
- [ ] Undo works.
- [ ] Recent events update automatically.
- [ ] Favorite events appear quickly.

## Add Event

- [ ] Emoji-first.
- [ ] Search works in Vietnamese.
- [ ] Search works in English.
- [ ] Category navigation works.
- [ ] 300+ definitions available.
- [ ] UI does not render all 300 simultaneously.
- [ ] Custom event works.

## Timeline

- [ ] Newest first.
- [ ] Event value shown when relevant.
- [ ] Notes shown when present.
- [ ] Delete works.
- [ ] Edit works.
- [ ] Grouping works for repetitive events.

## Calendar

- [ ] Month navigation.
- [ ] Event indicators.
- [ ] Selecting date loads events.
- [ ] Correct timezone/date handling.

## Statistics

- [ ] 7/30/90/all.
- [ ] Correct calculations.
- [ ] Type-specific calculations.
- [ ] No universal "good/bad" interpretation.

## Data

- [ ] Reload persists data.
- [ ] Export works.
- [ ] Import replace works.
- [ ] Import merge works.
- [ ] Old v1 backup can migrate.
- [ ] Historical events survive definition changes.

## Offline

- [ ] Core functionality works with network disabled.
- [ ] No server dependency.

---

# 44. CRITICAL UX TESTS

Claude must manually test these flows.

### Test 1

User wants:

> "Uống nước."

Expected:

```text
Open app
→ tap 💧
→ done
```

Target:

**1 tap**

---

### Test 2

User wants:

> "Uống 500ml."

Expected:

```text
tap 💧
→ choose 500ml
```

Target:

**≤2 interactions**

---

### Test 3

User wants:

> "Đi gặp khách."

Expected:

```text
+
→ search/select 🤝
→ create
```

Target:

**≤10 seconds**

---

### Test 4

User asks:

> "Hôm nay tao làm gì?"

Expected:

```text
Timeline
```

Target:

**1 tap**

---

### Test 5

User asks:

> "7 ngày qua tao uống nước thế nào?"

Expected:

```text
Statistics
→ Uống nước
```

Target:

**≤2 taps**

---

# 45. LARGE-DATA TEST

Create test data:

```text
100 event definitions
10,000 events
```

Verify:

- Capture remains instant.
- Timeline remains usable.
- Calendar remains usable.
- Search remains responsive.
- Statistics remain acceptable.
- No browser freeze.

---

# 46. IMPORTANT DESIGN QUESTION

The central UX problem is:

> How can the app have 300+ possible activities while allowing the user to record common activities in approximately one second?

The solution should combine:

```text
Favorites
+
Recent
+
Frequency
+
Categories
+
Emoji
+
Aliases
+
Search
```

Do not solve this by simply displaying more buttons.

---

# 47. PRODUCT NORTH STAR

Every UX decision should answer:

> Does this make it faster and more natural to record life, and easier to understand later?

If not, deprioritize it.

The product loop is:

```text
RECORD
  ↓
REMEMBER
  ↓
UNDERSTAND
```

Not:

```text
RECORD
  ↓
JUDGE
  ↓
FEEL GUILTY
```

---

# 48. CLAUDE CODE WORKFLOW

Before implementation, Claude should:

1. Inspect the entire existing project.
2. Explain what can be reused.
3. Explain what must be replaced.
4. Propose the migration architecture.
5. Implement incrementally.
6. Run `npm install` if needed.
7. Run `npm run build`.
8. Fix build errors.
9. Check browser console errors.
10. Verify localStorage persistence.
11. Verify import/export.
12. Verify mobile layout.

Do not stop after writing code.

The implementation is considered incomplete until:

```text
npm run build
```

passes.

---

# 49. OUTPUT EXPECTED FROM CLAUDE

At completion provide:

```text
1. What changed
2. New architecture
3. Files created
4. Files changed
5. Legacy features preserved
6. Migration behavior
7. Event library size
8. UX decisions
9. Build result
10. Known limitations
11. Next recommended phase
```

Do not invent completed features.

---

# 50. FINAL PRODUCT DEFINITION

Quan Sát is:

> A private, offline-first personal event logger that lets people record ordinary life with one tap and later see their own timeline, calendar, statistics, and eventually patterns.

Its defining interaction is:

```text
SEE
 ↓
TAP
 ↓
RECORDED
```

Its defining interface is:

```text
emoji-first
+
quick capture
+
timeline
```

Its defining philosophy is:

```text
Observe.
Do not judge.
```

Its defining technical principle is:

```text
Raw events are the source of truth.
```

Its defining UX constraint is:

```text
Common event = 1 tap.
```
