# Nexus OS - 客户端产品需求与技术规格书

## 1. 产品愿景 (Product Vision)

打造一个**去中心化、无服务器架构**的个人知识操作系统。它不仅仅是一个阅读器，更是一个能运行 AI 生成内容、实现知识互联的**"Web OS"**。

* **核心特性:** 全格式支持、云端直连、多端同步、离线可用 (PWA)。

---

## 2. 功能需求列表 (Features List)

### 2.1 核心浏览体验

* **多视图文件管理:** 支持列表视图、网格视图（封面墙）。
* **全局搜索:** 基于本地 IndexedDB 索引，秒级搜索文件名。
* **面包屑导航:** 快速在层级目录间跳转。

### 2.2 多态内容渲染 (Polymorphic Rendering)

客户端需根据文件后缀自动切换渲染引擎：

| 文件类型 | 后缀 | 渲染方案 | 特殊功能 |
|---------|------|---------|---------|
| **Markdown** | `.md` | marked + highlight.js | 解析 `[[双向链接]]` 并实现跳转，数学公式支持 |
| **AI 微应用** | `.html` | iframe 沙箱 | 全屏运行，postMessage 通信 |
| **流媒体** | `.mp4`, `.mp3` | HTML5 Media | 记忆播放进度，支持倍速 |
| **文档** | `.pdf`, `.epub` | pdf.js / epub.js | 缩放、目录跳转、夜间模式 |

### 2.3 数据同步与交互

* **进度同步:** 记录每一本书/视频的阅读位置，并在 PocketBase 中实时同步。
* **离线缓存:** 支持将常用文件标记为"离线可用"（存入 Cache Storage）。

### 2.4 移动端原生化 (PWA)

* **安装体验:** 支持 iOS/Android 添加到主屏幕。
* **沉浸式:** 隐藏浏览器地址栏，适配刘海屏。
* **启动屏:** 自定义 Splash Screen。

---

## 3. 技术栈 (Tech Stack)

### 3.1 核心框架

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| **Core** | Vue 3 (Script Setup) + TypeScript | 组合式 API，类型安全 |
| **Build** | Vite | 极速开发体验 |
| **UI** | Vant 4 | Mobile First 组件库 |
| **State** | Pinia | 管理当前路径、用户信息 |
| **Router** | Vue Router 4 | Hash/History 模式 |

### 3.2 网络与存储

| 类别 | 技术选型 | 用途 |
|------|---------|------|
| **HTTP Client** | Axios | 文件接口 |
| **Backend SDK** | PocketBase SDK | 数据同步 |
| **Local Storage** | localForage | IndexedDB 封装 |

### 3.3 工具链

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| **CSS** | UnoCSS | 原子化 CSS |
| **Hooks** | VueUse | 常用组合式函数 |
| **Linting** | ESLint + Prettier | 代码规范 |

---

## 4. 关键技术实现方案 (Implementation Details)

### 4.1 目录结构规划

```text
src/
├── api/                    # API 封装
│   ├── files.ts            # 文件接口（自建）
│   └── types.ts            # 类型定义
├── services/               # PocketBase 服务封装
│   ├── pb.ts               # PocketBase 客户端
│   ├── sync.ts             # 同步服务
│   └── auth.ts             # 认证服务
├── components/
│   ├── viewers/            # 渲染器工厂
│   │   ├── MdViewer.vue    # Markdown 渲染器
│   │   ├── PdfViewer.vue   # PDF 渲染器
│   │   ├── EpubViewer.vue  # EPUB 渲染器
│   │   ├── MediaPlayer.vue # 音视频播放器
│   │   └── HtmlRunner.vue  # HTML 沙箱运行器
│   ├── layout/             # 布局组件
│   │   ├── Dock.vue        # 底部导航
│   │   ├── NavBar.vue      # 顶部导航
│   │   └── Breadcrumb.vue  # 面包屑
│   └── common/             # 通用组件
│       ├── FileList.vue    # 文件列表
│       ├── FileGrid.vue    # 文件网格
│       └── SearchBar.vue   # 搜索栏
├── stores/                 # 状态管理
│   ├── path.ts             # 路径状态
│   ├── user.ts             # 用户状态
│   └── settings.ts         # 设置状态
├── views/                  # 页面级组件
│   ├── Home.vue            # 首页
│   ├── Browser.vue         # 文件浏览器
│   ├── Viewer.vue          # 内容查看器
│   └── Settings.vue        # 设置页
├── utils/                  # 工具函数
│   ├── file.ts             # 文件类型判断
│   └── storage.ts          # 本地存储
├── styles/                 # 全局样式
├── App.vue
└── main.ts
```

### 4.2 渲染器工厂模式

```typescript
// utils/file.ts
export type FileType = 'markdown' | 'pdf' | 'epub' | 'video' | 'audio' | 'html' | 'image' | 'unknown'

export function getFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const typeMap: Record<string, FileType> = {
    md: 'markdown',
    pdf: 'pdf',
    epub: 'epub',
    mp4: 'video',
    webm: 'video',
    mp3: 'audio',
    flac: 'audio',
    html: 'html',
    htm: 'html',
    jpg: 'image',
    png: 'image',
    gif: 'image',
    webp: 'image',
  }
  
  return typeMap[ext || ''] || 'unknown'
}
```

```vue
<!-- components/viewers/ViewerFactory.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { getFileType } from '@/utils/file'
import MdViewer from './MdViewer.vue'
import PdfViewer from './PdfViewer.vue'
import EpubViewer from './EpubViewer.vue'
import MediaPlayer from './MediaPlayer.vue'
import HtmlRunner from './HtmlRunner.vue'

const props = defineProps<{
  filename: string
  url: string
}>()

const viewerComponent = computed(() => {
  const type = getFileType(props.filename)
  
  const componentMap = {
    markdown: MdViewer,
    pdf: PdfViewer,
    epub: EpubViewer,
    video: MediaPlayer,
    audio: MediaPlayer,
    html: HtmlRunner,
  }
  
  return componentMap[type] || null
})
</script>

<template>
  <component 
    :is="viewerComponent" 
    :url="url" 
    :filename="filename"
    v-if="viewerComponent" 
  />
  <div v-else class="unsupported">不支持的文件格式</div>
</template>
```

### 4.3 文件 API 封装

```typescript
// api/files.ts
// 文件接口桩，后续接入自建 API（直接对接各网盘 API）

export interface FileListItem {
  name: string
  size: number
  is_dir: boolean
  modified: string
}

// 获取目录列表（待实现）
export async function listFiles(path: string): Promise<FileListItem[]> {
  // TODO: 对接自建文件接口
  return []
}

// 获取文件直链（待实现）
export async function getFileUrl(path: string): Promise<string> {
  // TODO: 对接自建文件接口
  throw new Error('文件接口待实现')
}
```

### 4.4 PocketBase 同步服务

```typescript
// services/sync.ts
import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_PB_URL)

export interface ReadingProgress {
  id?: string
  file_path: string
  progress: number      // 阅读进度 0-100
  position: string      // 位置信息 (页码/时间戳)
  updated_at: string
}

// 保存阅读进度
export async function saveProgress(progress: ReadingProgress) {
  const existing = await pb.collection('progress').getFirstListItem(
    `file_path = "${progress.file_path}"`,
    { requestKey: null }
  ).catch(() => null)

  if (existing) {
    return pb.collection('progress').update(existing.id, progress)
  } else {
    return pb.collection('progress').create(progress)
  }
}

// 获取阅读进度
export async function getProgress(filePath: string): Promise<ReadingProgress | null> {
  return pb.collection('progress').getFirstListItem(
    `file_path = "${filePath}"`,
    { requestKey: null }
  ).catch(() => null)
}
```

---

## 5. PWA 配置

### 5.1 manifest.json

```json
{
  "name": "Nexus OS",
  "short_name": "Nexus",
  "description": "个人知识操作系统",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#1a1a1a",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 5.2 Service Worker 缓存策略

```typescript
// sw.ts (使用 workbox)
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

// 预缓存静态资源
precacheAndRoute(self.__WB_MANIFEST)

// 文件请求 - 网络优先
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/files'),
  new NetworkFirst({ cacheName: 'files-api' })
)

// 媒体文件 - 缓存优先
registerRoute(
  ({ request }) => request.destination === 'video' || request.destination === 'audio',
  new CacheFirst({ cacheName: 'media-cache' })
)
```

---

## 6. 核心用户流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   启动 APP   │────▶│  加载目录    │────▶│  选择文件    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
           ┌───────────────┐
           │  判断文件类型   │
           └───────────────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌───────┐     ┌───────────┐   ┌───────────┐
│  .md  │     │ .pdf/.epub│   │ .mp4/.mp3 │
└───────┘     └───────────┘   └───────────┘
    │               │               │
    ▼               ▼               ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ MdViewer  │ │ PdfViewer │ │MediaPlayer│
└───────────┘ └───────────┘ └───────────┘
    │               │               │
    └───────────────┴───────────────┘
                    │
                    ▼
           ┌───────────────┐
           │  同步阅读进度   │
           │ (PocketBase)  │
           └───────────────┘
```

---

## 7. 里程碑计划

| 阶段 | 目标 | 核心功能 |
|------|------|---------|
| **v0.1** | MVP | 文件浏览 + Markdown 渲染 |
| **v0.2** | 多格式 | PDF/EPUB/媒体播放 |
| **v0.3** | 同步 | PocketBase 进度同步 |
| **v0.4** | PWA | 离线缓存 + 安装体验 |
| **v1.0** | 正式版 | 双向链接 + 知识图谱 |
