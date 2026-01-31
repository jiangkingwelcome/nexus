# Nexus OS - 后端基础设施搭建指南

## 1. 架构概述 (Architecture Overview)

本项目采用 **PocketBase** 作为数据后端，文件接口可后续自建对接各网盘 API。

| 组件 | 角色 | 端口 | 核心职责 |
| :--- | :--- | :--- | :--- |
| **PocketBase** | 数据中心 | `8090` | 提供结构化数据库 (SQLite)，负责存储用户配置、阅读进度、笔记、标签及多端同步状态。 |

---

## 2. 部署配置 (Deployment)

### 2.1 环境要求

* **服务器:** Linux (香港节点推荐，网络通畅)
* **依赖:** Docker, Docker Compose
* **防火墙:** 需放行 TCP 端口 `8090` (PocketBase)

### 2.2 Docker Compose 配置

在服务器创建目录 `/root/nexus`，新建 `docker-compose.yml`：

```yaml
version: '3.3'
services:
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

### 3.1 PocketBase 初始化

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
│            ┌─────────────────────────────┐                  │
│            │        PocketBase           │                  │
│            │        (数据中心)            │                  │
│            │                             │                  │
│            │  • 用户数据                  │                  │
│            │  • 阅读进度                  │                  │
│            │  • 笔记/标签                 │                  │
│            │  • 同步状态                  │                  │
│            │    Port: 8090               │                  │
│            └─────────────────────────────┘                  │
│                          │                                  │
│                          ▼                                  │
│            ┌─────────────────────────────┐                  │
│            │       ./pb_data             │                  │
│            │     (SQLite 数据库)          │                  │
│            └─────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart pocketbase

# 查看实时日志
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
tar -czvf nexus_backup_$(date +%Y%m%d).tar.gz pb_data

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
