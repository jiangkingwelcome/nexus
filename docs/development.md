# 开发指南

## 代码规范

### 命名规范

- **文件名**: 使用 kebab-case（如 `user-service.ts`）
- **类名**: 使用 PascalCase（如 `UserService`）
- **变量/函数**: 使用 camelCase（如 `getUserById`）
- **常量**: 使用 UPPER_SNAKE_CASE（如 `MAX_RETRY_COUNT`）

### 代码风格

- 使用 ESLint + Prettier 进行代码格式化
- 每个文件不超过 300 行
- 函数不超过 50 行

## Git 工作流

### 分支命名

- `main` - 主分支，生产环境代码
- `develop` - 开发分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支
- `hotfix/*` - 紧急修复分支

### Commit 规范

使用 Conventional Commits 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Type 类型：**

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行覆盖率报告
npm run test:coverage
```

### 测试规范

- 测试文件与源文件同名，后缀为 `.test.ts` 或 `.spec.ts`
- 单元测试覆盖率目标 >= 80%

## 部署

### 环境

- **开发环境**: dev.example.com
- **测试环境**: staging.example.com
- **生产环境**: example.com

### 部署流程

1. 代码合并到 `main` 分支
2. CI/CD 自动构建
3. 自动部署到对应环境
