# 谁是垃圾：Next.js + 飞书多维表格 + Vercel Blob

这是一个可部署到 GitHub + Vercel 的运动截图打卡 MVP。

## 功能

- 微信内打开 Vercel 链接
- 用户选择昵称或输入邀请码
- 每天上传运动截图
- 客户端先压缩图片，再通过 Vercel Blob Client Upload 上传
- 上传后进入确认页，确认或修改 OCR mock 结果
- 点击确认后才写入飞书多维表格
- 首页展示今日排行榜、本周排行榜、连续打卡榜
- 个人页展示步数、热量、体重趋势
- 管理员直接在飞书多维表格中修正异常数据

## 目录结构

```txt
app/
  api/
    blob/route.ts
    dashboard/route.ts
    ocr/route.ts
    participants/route.ts
    profile/[userId]/route.ts
    records/route.ts
    records/confirm/route.ts
  admin/page.tsx
  page.tsx
  page.client.tsx
  profile/[userId]/page.tsx
  upload/page.tsx
components/
  Chart.tsx
  UserAvatar.tsx
lib/
  clientImage.ts
  dates.ts
  feishu.ts
  mockOcr.ts
  mockStore.ts
  scoring.ts
  users.ts
  validation.ts
types/
  workout.ts
public/
  hero-bg.png
  fight-bg.svg
```

## 飞书字段

请在飞书多维表格中创建字段：

```txt
record_key
user_id
nickname
date
device_source
steps
calories
duration_min
distance_km
weight
score
screenshot_url
raw_ocr_text
confirmed
is_makeup
risk_flags
admin_status
created_at
```

`admin_status` 建议设为单选：`正常`、`已修正`、`剔除`。

## 环境变量

复制 `.env.example` 到 `.env.local`：

```bash
cp .env.example .env.local
```

然后填写：

```txt
FEISHU_APP_ID=cli_a96d9aaaf17bdcb3
FEISHU_APP_SECRET=你的飞书 app secret
FEISHU_APP_TOKEN=飞书多维表格 app_token
FEISHU_TABLE_ID=飞书 table_id
BLOB_READ_WRITE_TOKEN=Vercel Blob Read Write Token
INVITE_CODE=邀请码
USE_MOCK_FEISHU=false
```

不要把 `.env.local` 提交到 GitHub。

## 本地开发

```bash
npm install
npm run dev
```

打开：

```txt
http://localhost:3000
```

## GitHub 部署步骤

```bash
git init
git add .
git commit -m "initial next workout ranking app"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

## Vercel 部署步骤

1. 打开 Vercel。
2. New Project。
3. 选择 GitHub 仓库。
4. Framework Preset 选择 Next.js。
5. 在 Environment Variables 中添加：
   - `FEISHU_APP_ID`
   - `FEISHU_APP_SECRET`
   - `FEISHU_APP_TOKEN`
   - `FEISHU_TABLE_ID`
   - `BLOB_READ_WRITE_TOKEN`
   - `INVITE_CODE`
   - `USE_MOCK_FEISHU=false`
6. 在 Vercel Storage 创建 Blob Store。
7. 复制 Blob Read Write Token 到 `BLOB_READ_WRITE_TOKEN`。
8. Deploy。

## 安全说明

- 飞书 app secret 和 Vercel Blob token 只在服务端环境变量中使用。
- 前端只调用 `/api/blob` 获取短期上传授权，不会暴露 Blob token。
- 真实 OCR 暂未接入，当前使用 `lib/mockOcr.ts`。
