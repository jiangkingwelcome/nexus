# API 文档

## 概述

本文档描述 Nexus 项目的 API 接口规范。

## 基础信息

- **Base URL**: `https://api.example.com/v1`
- **协议**: HTTPS
- **数据格式**: JSON

## 认证

API 使用 Bearer Token 进行认证：

```http
Authorization: Bearer <token>
```

## 通用响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 错误响应

```json
{
  "code": 10001,
  "message": "错误描述",
  "data": null
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 10001 | 参数错误 |
| 10002 | 认证失败 |
| 10003 | 权限不足 |
| 50000 | 服务器内部错误 |

## API 列表

### 用户模块

- [用户登录](./user/login.md)
- [用户注册](./user/register.md)
- [获取用户信息](./user/profile.md)

### 其他模块

[待补充]
