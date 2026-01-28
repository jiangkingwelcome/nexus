# Nexus OS - 后端基础设施搭建指南

## 1. 架构概述 (Architecture Overview)

本项目采用 **双后端 (Dual-Backend)** 架构，运行于 Docker 环境中。核心理念是 **"文件与数据分离"**。

| 组件 | 角色 | 端口 | 核心职责 |
| :--- | :--- | :--- | :--- |
| **Alist** | 文件网关 | `5244` | 聚合各大网盘 (阿里/百度/夸克)，提供统一 WebDAV/HTTP 接口，负责大文件直链分发。 |
| **PocketBase** | 数据中心 | `8090` | 提供结构化数据库 (SQLite)，负责存储用户配置、阅读进度、笔记、标签及多端同步状态。 |

---

## 2. 部署配置 (Deployment)

### 2.1 环境要求

* **服务器:** Linux (香港节点推荐，网络通畅)
* **依赖:** Docker, Docker Compose
* **防火墙:** 需放行 TCP 端口 `5244` (Alist) 和 `8090` (PocketBase)

### 2.2 Docker Compose 配置

在服务器创建目录 `/root/nexus`，新建 `docker-compose.yml`：

```yaml
version: '3.3'
services:
  # --- 文件网关服务 ---
  alist:
    image: 'xhofe/alist:latest'
    container_name: alist
    restart: always
    volumes:
      - './alist_data:/opt/alist/data'
    ports:
      - '5244:5244'
    environment:
      - PUID=0
      - PGID=0
      - UMASK=022

  # --- 数据后端服务 ---
  pocketbase:
    image: 'pocketbase/pocketbase:latest'
    container_name: pocketbase
    restart: always
    command:
      # 生产环境建议设置加密Key
      - --encryptionEnv=PB_ENCRYPTION_KEY
    volumes:
      - './pb_data:/pb/pb_data'
    ports:
      - '8090:8090'
```

### 2.3 启动服务

```bash
# 创建项目目录
mkdir -p /root/nexus
cd /root/nexus

# 创建 docker-compose.yml 文件后启动
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

---

## 3. 服务配置

### 3.1 Alist 初始化

首次启动后获取管理员密码：

```bash
docker logs alist 2>&1 | grep "password"
```

访问 `http://<服务器IP>:5244` 进行配置：

1. 使用初始密码登录管理后台
2. 修改管理员密码
3. 添加存储源 (阿里云盘/百度网盘/夸克网盘等)

### 3.2 PocketBase 初始化

访问 `http://<服务器IP>:8090/_/` 进入管理面板：

1. 创建管理员账户
2. 设计数据表结构 (Collections)
3. 配置 API 规则

---

## 4. 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Nexus OS 客户端                        │
│                   (macOS / iOS / Android)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Docker 容器环境                          │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │       Alist         │    │        PocketBase           │ │
│  │    (文件网关)        │    │        (数据中心)            │ │
│  │                     │    │                             │ │
│  │  • 网盘聚合          │    │  • 用户数据                  │ │
│  │  • WebDAV 接口      │    │  • 阅读进度                  │ │
│  │  • 直链分发          │    │  • 笔记/标签                 │ │
│  │                     │    │  • 同步状态                  │ │
│  │    Port: 5244       │    │    Port: 8090               │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│              │                          │                    │
│              ▼                          ▼                    │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │    ./alist_data     │    │       ./pb_data             │ │
│  │    (配置持久化)       │    │     (SQLite 数据库)          │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        云存储服务                             │
│     阿里云盘  │  百度网盘  │  夸克网盘  │  其他 WebDAV          │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 常用命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启单个服务
docker-compose restart alist
docker-compose restart pocketbase

# 查看实时日志
docker-compose logs -f alist
docker-compose logs -f pocketbase

# 更新镜像
docker-compose pull
docker-compose up -d
```

---

## 6. 数据备份

### 6.1 备份

```bash
# 停止服务
docker-compose down

# 备份数据目录
tar -czvf nexus_backup_$(date +%Y%m%d).tar.gz alist_data pb_data

# 重启服务
docker-compose up -d
```

### 6.2 恢复

```bash
# 停止服务
docker-compose down

# 解压备份
tar -xzvf nexus_backup_YYYYMMDD.tar.gz

# 重启服务
docker-compose up -d
```
