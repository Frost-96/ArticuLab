# 用户认证API实现计划

## 项目概述
在 `/src/app/api/auth` 目录下实现基于邮箱和密码的用户注册和登录API接口，使用JWT认证和bcrypt密码哈希。

## 技术栈
- Next.js 14+ (App Router)
- Prisma (数据库ORM)
- JWT (JSON Web Tokens)
- bcrypt (密码哈希)
- TypeScript

## API接口设计

### 1. 用户注册接口
**端点**: `POST /api/auth/register`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**验证规则**:
- 邮箱格式验证
- 密码至少8位，包含字母和数字
- 邮箱不能重复

**响应**:
- 成功 (201):
```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```
- 错误 (400/409):
```json
{
  "success": false,
  "error": "错误信息"
}
```

### 2. 用户登录接口
**端点**: `POST /api/auth/login`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**验证规则**:
- 邮箱格式验证
- 密码验证
- 用户存在性检查

**响应**:
- 成功 (200):
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": null,
      "avatar": null,
      "englishLevel": null,
      "membershipTier": "free"
    },
    "token": "jwt_token_here"
  }
}
```
- 错误 (401):
```json
{
  "success": false,
  "error": "邮箱或密码错误"
}
```

## 工具函数设计

### 1. 密码验证工具 (`/src/lib/auth/password.ts`)
```typescript
// 密码强度验证：至少8位，包含字母和数字
export function validatePasswordStrength(password: string): boolean

// 密码哈希
export async function hashPassword(password: string): Promise<string>

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean>
```

### 2. JWT工具 (`/src/lib/auth/jwt.ts`)
```typescript
// 生成JWT token
export function generateToken(userId: string, email: string): string

// 验证JWT token
export function verifyToken(token: string): { userId: string; email: string } | null

// 从请求头提取token
export function extractTokenFromHeader(authHeader: string | null): string | null
```

### 3. 邮箱验证工具 (`/src/lib/auth/validation.ts`)
```typescript
// 邮箱格式验证
export function validateEmail(email: string): boolean
```

## 文件结构
```
src/app/api/auth/
├── register/
│   └── route.ts          # 注册接口
├── login/
│   └── route.ts          # 登录接口
└── middleware.ts         # 认证中间件（可选）

src/lib/auth/
├── password.ts           # 密码相关工具函数
├── jwt.ts               # JWT相关工具函数
└── validation.ts        # 验证工具函数
```

## 数据库考虑
基于现有的Prisma schema，User模型已经有以下字段：
- `id` (String) - 主键
- `email` (String) - 唯一
- `password` (String?) - 可为空（用于OAuth用户）
- 其他用户信息字段

**注意**: 不需要修改数据库模型，因为password字段已经存在。

## 实现步骤

### 阶段1: 创建工具函数
1. 创建 `/src/lib/auth` 目录
2. 实现密码验证和哈希工具
3. 实现JWT生成和验证工具
4. 实现邮箱验证工具

### 阶段2: 实现注册接口
1. 创建 `/src/app/api/auth/register/route.ts`
2. 实现请求验证
3. 实现密码强度检查
4. 实现用户创建逻辑
5. 生成JWT token
6. 返回响应

### 阶段3: 实现登录接口
1. 创建 `/src/app/api/auth/login/route.ts`
2. 实现请求验证
3. 实现用户查找
4. 实现密码验证
5. 生成JWT token
6. 返回响应

### 阶段4: 更新现有接口
1. 修改 `/src/app/api/users/me/route.ts` 使用JWT认证
2. 创建认证中间件或工具函数
3. 测试现有功能

### 阶段5: 测试和文档
1. 创建API测试用例
2. 编写API文档
3. 更新环境变量配置

## 环境变量配置
需要在 `.env.local` 中添加：
```
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

## 错误处理
- 400: 请求参数错误
- 401: 认证失败
- 409: 资源冲突（如邮箱已存在）
- 500: 服务器内部错误

## 安全考虑
1. 密码使用bcrypt哈希存储
2. JWT token有过期时间
3. 敏感信息不在响应中暴露
4. 输入验证和清理
5. 速率限制（未来考虑）

## 测试用例
### 注册接口测试
1. 正常注册流程
2. 邮箱格式错误
3. 密码强度不足
4. 邮箱已存在
5. 请求体缺失字段

### 登录接口测试
1. 正常登录流程
2. 邮箱不存在
3. 密码错误
4. 请求体缺失字段

## 后续扩展功能
1. 密码重置功能
2. 邮箱验证
3. 第三方登录（Google, GitHub）
4. 刷新token机制
5. 多设备登录管理

## 依赖安装
需要安装的npm包：
```bash
npm install bcrypt jsonwebtoken
# 或
pnpm add bcrypt jsonwebtoken
```

注意：`bcrypt` 可能需要编译，可以考虑使用 `bcryptjs` 作为替代。