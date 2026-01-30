# 遊戲開發方案（前端／後端／實踐）

## 目標
以現有企劃文件為範圍，確保「基礎迴圈、策略系統、獨立系統」皆有可落地的技術路徑與實作節奏。

## 方案 A：Web MVP（最快驗證）
- 前端：React + Vite + Tailwind
- 後端：Node.js + Express
- 資料庫：PostgreSQL + Prisma
- 即時：先不做（用輪詢或排程）
- 部署：Vercel（前端）＋ Render（後端/DB）
- 適用：基礎迴圈、任務、資產、房地產、成就
- 特點：最快上線、成本最低

## 方案 B：即時互動版（含聊天室/社交）
- 前端：Vue 3 + Pinia
- 後端：NestJS + Socket.IO
- 資料庫：PostgreSQL
- 快取：Redis（冷卻/觸發率/排行榜）
- 部署：Fly.io 或 Render + Redis
- 適用：聊天室、社交、即時事件
- 特點：互動性強、營運彈性高

## 方案 C：長期擴展（穩定與可維護）
- 前端：Next.js（App Router）
- 後端：FastAPI + Celery
- 資料庫：PostgreSQL
- 任務：背景排程（打卡/離線收益）
- 部署：Docker + VPS（或 AWS/GCP）
- 適用：大型更新、數據分析、營運功能
- 特點：架構清晰、長期維護友好

## 方案 D：行動優先（跨平台）
- 前端：Flutter
- 後端：Supabase（Auth + Postgres + Realtime）
- 部署：App Store / Google Play
- 適用：輕量放置＋社交互動
- 特點：跨平台、開發效率高

## 共通實作里程碑（建議）
1. P0（2–3 週）：登入、打卡、放置任務、資產基礎
2. P1（3–4 週）：任務系統、房地產、成就/稱號
3. P2（3–4 週）：公司管理、招募、社交/聊天室
4. P3（持續）：經濟平衡、活動、付費與留存

## 架構切換方式
- 目前實作：方案 A（apps/web + apps/api）
- 方案 B/C/D：預留在 apps/solutions/ 底下
- 啟動方式：
  - 方案 A：npm run dev:a
  - 方案 B/C/D：npm run dev:b / dev:c / dev:d（尚未實作）
