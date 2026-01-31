# PocketBase 数据表设计

> 在 PocketBase 管理面板 (http://localhost:8090/_/) 中创建以下 Collections

---

## 1. reading_progress - 阅读进度表

用于存储用户的阅读/观看进度，实现多端同步。

### 字段设计

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `file_path` | Text | ✅ | 文件完整路径 (唯一标识) |
| `file_name` | Text | ✅ | 文件名 |
| `file_type` | Select | ✅ | 文件类型: `book`, `video`, `audio`, `document` |
| `progress` | Number | ✅ | 进度百分比 0-100 |
| `current_position` | Text | ✅ | 当前位置 (页码/时间戳秒数) |
| `total_length` | Text | ✅ | 总长度 (总页数/总时长秒数) |
| `last_read` | DateTime | ✅ | 最后阅读时间 |

### API 规则

```javascript
// List/Search 规则
@request.auth.id != ""

// View 规则  
@request.auth.id != ""

// Create 规则
@request.auth.id != ""

// Update 规则
@request.auth.id != ""

// Delete 规则
@request.auth.id != ""
```

---

## 2. notes - 笔记表

用于存储用户对文件的笔记。

### 字段设计

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `file_path` | Text | ✅ | 关联的文件路径 |
| `file_name` | Text | ✅ | 文件名 |
| `content` | Editor | ✅ | 笔记内容 (支持富文本) |
| `position` | Text | ❌ | 笔记关联的位置 (可选) |

### API 规则

```javascript
// 同 reading_progress
@request.auth.id != ""
```

---

## 3. bookmarks - 收藏/标签表

用于管理用户的收藏和标签。

### 字段设计

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `file_path` | Text | ✅ | 文件路径 |
| `file_name` | Text | ✅ | 文件名 |
| `is_favorite` | Bool | ✅ | 是否收藏 |
| `tags` | JSON | ✅ | 标签数组 `["标签1", "标签2"]` |

### API 规则

```javascript
// 同上
@request.auth.id != ""
```

---

## 4. system_settings - 系统设置表

用于存储后台管理的系统配置。

### 字段设计

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `library_base_path` | Text | ✅ | 图书馆根路径 |
| `library_bookshelf_path` | Text | ✅ | 书城路径 |
| `cinema_base_path` | Text | ✅ | 电影院根路径 |
| `files_base_path` | Text | ✅ | 文件管理根路径 |
| `app_name` | Text | ✅ | 应用名称 |
| `default_user_name` | Text | ✅ | 默认用户名 |
| `book_formats` | Text | ✅ | 支持的电子书格式 |
| `video_formats` | Text | ✅ | 支持的视频格式 |
| `enable_registration` | Bool | ✅ | 是否开放注册 |
| `max_recent_items` | Number | ✅ | 最近访问数量 |
| `auto_save_interval` | Number | ✅ | 自动保存间隔(秒) |

### API 规则

```javascript
// List/View 规则 - 任何登录用户可读
@request.auth.id != ""

// Create/Update/Delete 规则 - 仅管理员可写
@request.auth.role = "admin"
```

---

## 5. users 表扩展

在默认的 users 表基础上，需要添加以下字段：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `role` | Select | ❌ | 用户角色: `user`, `admin` |
| `name` | Text | ❌ | 用户显示名称 |

---

## 6. 快速创建脚本

在 PocketBase 管理面板的 **Settings > Import collections** 中导入：

```json
[
  {
    "name": "reading_progress",
    "type": "base",
    "schema": [
      { "name": "file_path", "type": "text", "required": true },
      { "name": "file_name", "type": "text", "required": true },
      { "name": "file_type", "type": "select", "required": true, "options": { "values": ["book", "video", "audio", "document"] } },
      { "name": "progress", "type": "number", "required": true, "options": { "min": 0, "max": 100 } },
      { "name": "current_position", "type": "text", "required": true },
      { "name": "total_length", "type": "text", "required": true },
      { "name": "last_read", "type": "date", "required": true }
    ]
  },
  {
    "name": "notes",
    "type": "base",
    "schema": [
      { "name": "file_path", "type": "text", "required": true },
      { "name": "file_name", "type": "text", "required": true },
      { "name": "content", "type": "editor", "required": true },
      { "name": "position", "type": "text", "required": false }
    ]
  },
  {
    "name": "bookmarks",
    "type": "base",
    "schema": [
      { "name": "file_path", "type": "text", "required": true },
      { "name": "file_name", "type": "text", "required": true },
      { "name": "is_favorite", "type": "bool", "required": true },
      { "name": "tags", "type": "json", "required": true }
    ]
  },
  {
    "name": "system_settings",
    "type": "base",
    "schema": [
      { "name": "library_base_path", "type": "text", "required": true },
      { "name": "library_bookshelf_path", "type": "text", "required": true },
      { "name": "cinema_base_path", "type": "text", "required": true },
      { "name": "files_base_path", "type": "text", "required": true },
      { "name": "app_name", "type": "text", "required": true },
      { "name": "default_user_name", "type": "text", "required": true },
      { "name": "book_formats", "type": "text", "required": true },
      { "name": "video_formats", "type": "text", "required": true },
      { "name": "enable_registration", "type": "bool", "required": true },
      { "name": "max_recent_items", "type": "number", "required": true, "options": { "min": 5, "max": 50 } },
      { "name": "auto_save_interval", "type": "number", "required": true, "options": { "min": 10, "max": 300 } }
    ]
  }
]
```

---

## 7. 数据流示意

```
┌─────────────────────────────────────────────────────────────┐
│                      Nexus OS 客户端                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
            ┌─────────────────────────────────────┐
            │           PocketBase                 │
            │           (数据中心)                  │
            ├─────────────────────────────────────┤
            │                                     │
            │  reading_progress 表                 │
            │  ├─ 视频播放进度                      │
            │  ├─ PDF 阅读页码                      │
            │  └─ 电子书位置                        │
            │                                     │
            │  notes 表                            │
            │  └─ 文件笔记                          │
            │                                     │
            │  bookmarks 表                        │
            │  ├─ 收藏夹                            │
            │  └─ 标签分类                          │
            │                                     │
            └─────────────────────────────────────┘
```

---

## 8. 多端同步机制

```
设备 A (手机)                    PocketBase                    设备 B (电脑)
     │                              │                              │
     │  1. 播放视频到 50%            │                              │
     │ ─────────────────────────▶  │                              │
     │                              │  2. 实时推送                  │
     │                              │ ─────────────────────────▶  │
     │                              │                              │  3. 收到更新
     │                              │                              │     显示继续播放
     │                              │                              │
     │                              │  4. 用户在 B 继续到 80%        │
     │                              │ ◀─────────────────────────── │
     │  5. 实时推送                  │                              │
     │ ◀─────────────────────────  │                              │
     │  6. 更新进度显示              │                              │
```

客户端使用 `pb.collection('reading_progress').subscribe('*', callback)` 实现实时同步。
