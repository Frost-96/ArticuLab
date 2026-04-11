# API接口浏览器测试方案

## 项目概述
- **项目名称**: ArticuLab
- **技术栈**: Next.js 16.2.1 + TypeScript + Prisma + PostgreSQL
- **开发服务器**: `npm run dev` (默认端口: 3000)

## 现有API接口列表

### 1. 认证接口
- **POST** `/api/auth/register` - 用户注册
- **POST** `/api/auth/login` - 用户登录

### 2. 用户管理接口
- **GET** `/api/users/me` - 获取当前用户信息（需要认证）
- **POST** `/api/users/me/update` - 更新用户信息（需要认证）

## 测试环境准备

### 1. 启动开发服务器
```bash
npm run dev
```
服务器将在 `http://localhost:3000` 启动

### 2. 数据库准备
确保数据库连接正常，可以运行：
```bash
npx prisma db push
npx prisma generate
```

### 3. 测试工具准备
推荐使用以下工具之一：
- **浏览器开发者工具** (Network面板)
- **Postman** 或 **Insomnia**
- **浏览器扩展**: REST Client, Talend API Tester
- **命令行工具**: curl, httpie

## 测试数据准备

### 测试用户数据
```json
{
  "validUser": {
    "email": "test@example.com",
    "password": "Test123!@#"
  },
  "invalidUser": {
    "email": "invalid@example",
    "password": "weak"
  },
  "existingUser": {
    "email": "existing@example.com",
    "password": "Existing123!@#"
  }
}
```

## 详细测试用例

### 测试用例 1: 用户注册接口 (`POST /api/auth/register`)

#### 1.1 正常注册流程
- **请求**:
```json
{
  "email": "newuser@example.com",
  "password": "StrongPass123!@#"
}
```
- **预期响应**:
  - 状态码: 201
  - 包含: `success: true`, `token`, `user`对象

#### 1.2 邮箱格式错误
- **请求**:
```json
{
  "email": "invalid-email",
  "password": "StrongPass123!@#"
}
```
- **预期响应**:
  - 状态码: 400
  - 包含: `success: false`, 错误信息

#### 1.3 密码强度不足
- **请求**:
```json
{
  "email": "test@example.com",
  "password": "weak"
}
```
- **预期响应**:
  - 状态码: 400
  - 包含: `success: false`, 密码强度错误

#### 1.4 邮箱已存在
- **请求**: 使用已注册的邮箱
- **预期响应**:
  - 状态码: 409
  - 包含: `success: false`, "邮箱已被注册"

### 测试用例 2: 用户登录接口 (`POST /api/auth/login`)

#### 2.1 正常登录
- **请求**:
```json
{
  "email": "test@example.com",
  "password": "Test123!@#"
}
```
- **预期响应**:
  - 状态码: 200
  - 包含: `success: true`, `token`, `user`对象

#### 2.2 密码错误
- **请求**: 正确邮箱，错误密码
- **预期响应**:
  - 状态码: 401
  - 包含: `success: false`, "用户名或密码错误"

#### 2.3 用户不存在
- **请求**: 不存在的邮箱
- **预期响应**:
  - 状态码: 401
  - 包含: `success: false`, "用户名或密码错误"

### 测试用例 3: 获取用户信息接口 (`GET /api/users/me`)

#### 3.1 带有效Token访问
- **请求头**:
```
Authorization: Bearer <valid_token>
```
- **预期响应**:
  - 状态码: 200
  - 包含: `success: true`, `data`用户信息

#### 3.2 无Token访问
- **请求**: 不带Authorization头
- **预期响应**:
  - 状态码: 401
  - 包含: `success: false`, "未授权访问"

#### 3.3 无效Token访问
- **请求头**:
```
Authorization: Bearer invalid_token
```
- **预期响应**:
  - 状态码: 401
  - 包含: `success: false`, "未授权访问"

### 测试用例 4: 更新用户信息接口 (`POST /api/users/me/update`)

#### 4.1 正常更新
- **请求头**:
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```
- **请求体**:
```json
{
  "name": "新用户名",
  "englishLevel": "intermediate"
}
```
- **预期响应**:
  - 状态码: 200
  - 包含: `success: true`, 更新后的用户信息

## 测试执行流程

### 步骤1: 环境检查
1. 确认开发服务器运行正常
2. 确认数据库连接正常
3. 准备测试工具

### 步骤2: 注册流程测试
1. 测试正常注册
2. 测试各种错误情况
3. 记录测试结果

### 步骤3: 登录流程测试
1. 使用注册的用户测试登录
2. 测试各种错误情况
3. 获取并保存Token

### 步骤4: 认证接口测试
1. 使用有效Token测试用户信息获取
2. 测试无Token/无效Token情况
3. 测试用户信息更新

### 步骤5: 清理测试数据
1. 删除测试创建的用户
2. 确认数据库状态

## 浏览器测试方法

### 方法1: 使用浏览器开发者工具
1. 打开浏览器，访问 `http://localhost:3000`
2. 按F12打开开发者工具
3. 切换到Network面板
4. 在Console中执行fetch请求:
```javascript
// 注册请求示例
fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!@#'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### 方法2: 使用Postman
1. 创建新的Collection
2. 为每个接口创建Request
3. 设置正确的URL、Method、Headers、Body
4. 使用环境变量管理Token

### 方法3: 使用curl命令行
```bash
# 注册示例
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# 登录示例
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# 获取用户信息（带Token）
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 测试结果验证

### 成功标准
1. 所有正常流程返回预期状态码和数据
2. 所有错误处理返回适当的错误信息和状态码
3. Token验证机制正常工作
4. 数据验证规则正确执行

### 验证要点
- 响应状态码是否正确
- 响应数据结构是否符合预期
- 错误信息是否清晰明确
- Token是否有效且能用于后续请求
- 数据库操作是否正确

## 常见问题排查

### 1. 服务器未启动
- 症状: 请求返回连接错误
- 解决: 运行 `npm run dev`

### 2. 数据库连接错误
- 症状: 注册/登录返回500错误
- 解决: 检查数据库配置，运行 `npx prisma db push`

### 3. CORS问题
- 症状: 浏览器控制台显示CORS错误
- 解决: 确保请求来自同一域名，或配置CORS

### 4. Token无效
- 症状: 认证接口返回401
- 解决: 重新登录获取新Token，检查Token格式

## 后续扩展建议

1. **自动化测试**: 使用Jest + Supertest编写自动化测试
2. **性能测试**: 使用k6或Apache JMeter进行压力测试
3. **安全测试**: 测试SQL注入、XSS等安全漏洞
4. **文档生成**: 使用Swagger/OpenAPI生成API文档

---

*最后更新: 2026-04-11*