# API接口浏览器测试 - 分步执行指南

## 准备工作

### 步骤1: 启动开发环境
1. 打开终端，进入项目目录
2. 安装依赖（如果尚未安装）:
   ```bash
   npm install
   # 或使用pnpm
   pnpm install
   ```
3. 启动开发服务器:
   ```bash
   npm run dev
   ```
4. 验证服务器运行:
   - 打开浏览器访问 `http://localhost:3000`
   - 应该能看到应用页面

### 步骤2: 准备数据库
1. 确保数据库配置正确（检查 `.env.local` 文件）
2. 运行数据库迁移:
   ```bash
   npx prisma db push
   ```
3. 生成Prisma客户端:
   ```bash
   npx prisma generate
   ```

### 步骤3: 选择测试工具
根据你的偏好选择一种测试方法：

**选项A: 浏览器开发者工具**（推荐初学者）
- 打开Chrome/Firefox/Edge浏览器
- 按F12打开开发者工具
- 切换到Network面板

**选项B: Postman**（推荐专业测试）
- 下载并安装Postman
- 创建新的Collection
- 设置环境变量

**选项C: 命令行工具**（推荐快速测试）
- 确保已安装curl或httpie
- 准备测试脚本

## 分步测试执行

### 阶段一: 用户注册测试

#### 测试1.1: 正常用户注册
1. **使用浏览器开发者工具**:
   ```javascript
   // 在Console中执行
   fetch('/api/auth/register', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       email: 'testuser@example.com',
       password: 'Test123!@#'
     })
   })
   .then(response => {
     console.log('状态码:', response.status);
     return response.json();
   })
   .then(data => {
     console.log('响应数据:', data);
     if (data.success && data.data.token) {
       console.log('Token:', data.data.token);
       // 保存Token供后续使用
       window.testToken = data.data.token;
     }
   })
   .catch(error => console.error('错误:', error));
   ```

2. **使用Postman**:
   - Method: POST
   - URL: `http://localhost:3000/api/auth/register`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "email": "testuser@example.com",
       "password": "Test123!@#"
     }
     ```
   - 点击Send，检查响应

3. **使用curl**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"testuser@example.com","password":"Test123!@#"}'
   ```

#### 测试1.2: 邮箱格式错误
```javascript
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'invalid-email',
    password: 'Test123!@#'
  })
})
.then(response => {
  console.log('预期状态码: 400, 实际:', response.status);
  return response.json();
})
.then(data => console.log('错误响应:', data));
```

#### 测试1.3: 密码强度不足
```javascript
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test2@example.com',
    password: 'weak'
  })
})
.then(response => {
  console.log('预期状态码: 400, 实际:', response.status);
  return response.json();
})
.then(data => console.log('密码强度错误:', data));
```

### 阶段二: 用户登录测试

#### 测试2.1: 正常登录
1. **使用之前注册的用户**:
   ```javascript
   fetch('/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'testuser@example.com',
       password: 'Test123!@#'
     })
   })
   .then(response => response.json())
   .then(data => {
     console.log('登录响应:', data);
     if (data.success && data.data.token) {
       const token = data.data.token;
       console.log('登录Token:', token);
       // 保存Token
       localStorage.setItem('authToken', token);
       window.authToken = token;
     }
   });
   ```

2. **验证Token获取成功**:
   - 检查响应状态码是否为200
   - 检查响应中是否包含token字段
   - 检查user对象是否包含用户信息

#### 测试2.2: 错误密码测试
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'testuser@example.com',
    password: 'WrongPassword123!'
  })
})
.then(response => {
  console.log('预期状态码: 401, 实际:', response.status);
  return response.json();
})
.then(data => console.log('密码错误响应:', data));
```

#### 测试2.3: 用户不存在测试
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'nonexistent@example.com',
    password: 'SomePassword123!'
  })
})
.then(response => {
  console.log('预期状态码: 401, 实际:', response.status);
  return response.json();
})
.then(data => console.log('用户不存在响应:', data));
```

### 阶段三: 认证接口测试

#### 测试3.1: 获取用户信息（带有效Token）
1. **首先获取Token**（如果尚未获取）:
   ```javascript
   // 假设已登录并保存了Token
   const token = localStorage.getItem('authToken') || window.authToken;
   ```

2. **发送认证请求**:
   ```javascript
   fetch('/api/users/me', {
     method: 'GET',
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   .then(response => {
     console.log('获取用户信息状态码:', response.status);
     return response.json();
   })
   .then(data => {
     console.log('用户信息:', data);
     if (data.success) {
       console.log('当前用户:', data.data);
     }
   });
   ```

#### 测试3.2: 无Token访问测试
```javascript
fetch('/api/users/me', {
  method: 'GET'
  // 不设置Authorization头
})
.then(response => {
  console.log('预期状态码: 401, 实际:', response.status);
  return response.json();
})
.then(data => console.log('未授权响应:', data));
```

#### 测试3.3: 无效Token访问测试
```javascript
fetch('/api/users/me', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer invalid_token_here'
  }
})
.then(response => {
  console.log('预期状态码: 401, 实际:', response.status);
  return response.json();
})
.then(data => console.log('无效Token响应:', data));
```

### 阶段四: 更新用户信息测试

#### 测试4.1: 正常更新用户信息
```javascript
const token = localStorage.getItem('authToken') || window.authToken;

fetch('/api/users/me/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: '测试用户新名称',
    englishLevel: 'intermediate',
    learningGoal: '提高商务英语能力'
  })
})
.then(response => {
  console.log('更新状态码:', response.status);
  return response.json();
})
.then(data => {
  console.log('更新响应:', data);
  if (data.success) {
    console.log('更新后的用户:', data.data);
  }
});
```

#### 测试4.2: 验证更新结果
```javascript
// 重新获取用户信息验证更新
fetch('/api/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('验证更新结果:');
    console.log('用户名:', data.data.name);
    console.log('英语水平:', data.data.englishLevel);
    console.log('学习目标:', data.data.learningGoal);
  }
});
```

## 完整测试流程脚本

### 浏览器控制台完整测试脚本
```javascript
// 完整测试流程 - 复制到浏览器控制台执行
async function runFullAPITest() {
  console.log('=== 开始API接口完整测试 ===');
  
  // 1. 测试注册
  console.log('\n1. 测试用户注册...');
  const registerResponse = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test_${Date.now()}@example.com`,
      password: 'Test123!@#'
    })
  });
  const registerData = await registerResponse.json();
  console.log('注册结果:', registerData);
  
  if (!registerData.success) {
    console.error('注册失败，停止测试');
    return;
  }
  
  const testToken = registerData.data.token;
  console.log('获取到Token:', testToken.substring(0, 20) + '...');
  
  // 2. 测试登录
  console.log('\n2. 测试用户登录...');
  const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: registerData.data.user.email,
      password: 'Test123!@#'
    })
  });
  const loginData = await loginResponse.json();
  console.log('登录结果:', loginData.success ? '成功' : '失败');
  
  // 3. 测试获取用户信息
  console.log('\n3. 测试获取用户信息...');
  const userInfoResponse = await fetch('/api/users/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${testToken}`
    }
  });
  const userInfoData = await userInfoResponse.json();
  console.log('用户信息:', userInfoData.success ? '获取成功' : '获取失败');
  
  // 4. 测试更新用户信息
  console.log('\n4. 测试更新用户信息...');
  const updateResponse = await fetch('/api/users/me/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify({
      name: '测试用户_' + Date.now(),
      englishLevel: 'advanced'
    })
  });
  const updateData = await updateResponse.json();
  console.log('更新结果:', updateData.success ? '成功' : '失败');
  
  // 5. 验证无Token访问
  console.log('\n5. 测试无Token访问...');
  const noAuthResponse = await fetch('/api/users/me', { method: 'GET' });
  console.log('无Token状态码:', noAuthResponse.status);
  
  console.log('\n=== 测试完成 ===');
  console.log('总结:');
  console.log('- 注册:', registerData.success ? '?' : '?');
  console.log('- 登录:', loginData.success ? '?' : '?');
  console.log('- 获取用户信息:', userInfoData.success ? '?' : '?');
  console.log('- 更新用户信息:', updateData.success ? '?' : '?');
  console.log('- 无Token保护:', noAuthResponse.status === 401 ? '?' : '?');
}

// 执行测试
runFullAPITest().catch(console.error);
```

## 测试结果记录表

创建以下表格记录测试结果：

| 测试用例 | 预期结果 | 实际结果 | 状态 | 备注 |
|---------|---------|---------|------|------|
| 注册-正常流程 | 201 Created | | | |
| 注册-邮箱格式错误 | 400 Bad Request | | | |
| 注册-密码强度不足 | 400 Bad Request | | | |
| 登录-正常流程 | 200 OK | | | |
| 登录-密码错误 | 401 Unauthorized | | | |
| 登录-用户不存在 | 401 Unauthorized | | | |
| 获取用户信息-有效Token | 200 OK | | | |
| 获取用户信息-无Token | 401 Unauthorized | | | |
| 获取用户信息-无效Token | 401 Unauthorized | | | |
| 更新用户信息-正常 | 200 OK | | | |

## 故障排除指南

### 常见问题1: 服务器未响应
- **症状**: 请求超时或返回网络错误
- **检查**:
  1. 确认 `npm run dev` 正在运行
  2. 检查终端是否有错误信息
  3. 访问 `http://localhost:3000` 确认服务器正常

### 常见问题2: 数据库错误
- **症状**: 注册/登录返回500错误
- **检查**:
  1. 确认数据库服务运行中
  2. 检查 `.env.local` 中的数据库连接字符串
  3. 运行 `npx prisma db push` 更新数据库

### 常见问题3: CORS错误
- **症状**: 浏览器控制台显示CORS策略错误
- **解决**: 确保请求来自同一域名（localhost:3000）

### 常见问题4: Token无效
- **症状**: 认证接口返回401
- **检查**:
  1. Token格式是否正确（Bearer + 空格 + Token）
  2. Token是否过期
  3. 重新登录获取新Token

## 高级测试技巧

### 1. 使用环境变量管理测试数据
```javascript
// 在浏览器中设置测试配置
window.API_CONFIG = {
  baseURL: 'http://localhost:3000',
  testUser: {
    email: 'test@example.com',
    password: 'Test123!@#'
  }
};
```

### 2. 创建可重用的测试函数
```javascript
class APITester {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.token = null;
  }
  
  async register(email, password) {
    const response = await fetch(`${this.baseURL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }
  
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.success) this.token = data.data.token;
    return data;
  }
  
  async getUserInfo() {
    if (!this.token) throw new Error('未登录');
    const response = await fetch(`${this.baseURL}/api/users/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }
}

// 使用示例
const tester = new APITester();
tester.register('test@example.com', 'Test123!@#')
  .then(() => tester.login('test@example.com', 'Test123!@#'))
  .then(() => tester.getUserInfo())
  .then(userInfo => console.log(userInfo));
```

## 下一步建议

1. **自动化测试**: 创建测试脚本，一键运行所有测试用例
2. **性能测试**: 测试接口响应时间和并发处理能力
3. **安全测试**: 测试SQL注入、XSS等安全漏洞
4. **文档生成**: 基于测试结果生成API文档

---

*测试愉快！如有问题，请参考项目文档或联系开发团队。*