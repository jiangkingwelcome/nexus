# Nexus OS 技术文档

欢迎阅读 Nexus OS 项目的技术文档。

## 项目简介

Nexus OS 是一个跨平台的个人数据管理系统：

- **PocketBase** - 数据中心，管理用户数据与同步状态
- **文件接口** - 待自建，可对接各类网盘 API

## 文档目录

### 基础设施

- [后端基础设施搭建指南](./Backend_Infrastructure_Setup.md) - Docker 部署 PocketBase
- [PocketBase 数据表设计](./PocketBase_Schema.md) - 数据表结构与同步机制

### 产品与设计

- [客户端产品需求与技术规格](./Client_PRD_and_TechSpec.md) - PRD + 技术架构 + 实现方案
- [前端功能开发清单](./Frontend_Features.md) - 前端 Todo List + 里程碑规划

### 项目文档

- [项目概述](./overview.md) - 项目简介与架构说明
- [快速开始](./getting-started.md) - 环境配置与启动指南
- [开发指南](./development.md) - 开发规范与最佳实践
- [API 文档](./api/README.md) - 接口文档

## 技术栈

| 层级 | 技术 |
|------|------|
| 数据后端 | PocketBase (SQLite) |
| 文件接口 | 自建（待实现） |
| 容器化 | Docker Compose |
| 客户端 | macOS / iOS / Android |

## 文档约定

- 所有文档使用 Markdown 格式编写
- 代码示例需包含完整的上下文
- 更新文档时请同步更新相关链接

## 贡献

如有问题或建议，请提交 Issue 或 Pull Request。
