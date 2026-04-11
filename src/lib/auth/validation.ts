export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证邮箱格式
 *
 * 输入格式：
 * - email: string - 需要验证的邮箱地址
 *
 * 验证规则：
 * 1. 必须是字符串类型
 * 2. 不能为空
 * 3. 必须符合标准邮箱格式（user@domain.com）
 * 4. 总长度不超过254个字符
 * 5. 本地部分（@之前）不超过64个字符
 *
 * 输出格式：
 * - ValidationResult 对象包含：
 *   - isValid: boolean - 验证是否通过
 *   - errors: string[] - 错误信息数组（验证失败时）
 *
 * 示例：
 * ```
 * const result = validateEmail("test@example.com");
 * // 返回: { isValid: true, errors: [] }
 *
 * const result2 = validateEmail("invalid-email");
 * // 返回: { isValid: false, errors: ["邮箱格式不正确"] }
 * ```
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  // 检查输入类型
  if (typeof email !== 'string') {
    errors.push('邮箱必须是字符串类型');
    return { isValid: false, errors };
  }
  
  // 规范化邮箱：转换为小写并移除空格
  const normalizedEmail = email.trim().toLowerCase();
  
  // 检查空值
  if (normalizedEmail.length === 0) {
    errors.push('邮箱不能为空');
    return { isValid: false, errors };
  }
  
  // 检查邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    errors.push('邮箱格式不正确');
    return { isValid: false, errors }; // 格式无效时直接返回，不进行后续检查
  }
  
  // 格式有效时才进行长度检查
  // 检查邮箱总长度
  if (normalizedEmail.length > 254) {
    errors.push('邮箱地址过长');
  }
  
  // 检查本地部分长度
  const localPart = normalizedEmail.split('@')[0];
  if (localPart && localPart.length > 64) {
    errors.push('邮箱本地部分过长');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 验证认证请求体（注册和登录共用）
 *
 * 输入格式：
 * - body: any - 请求体对象
 * - type: 'register' | 'login' - 请求类型（注册或登录）
 *
 * 验证规则：
 * 1. body必须是对象类型
 * 2. 必须包含email字段（非空）
 * 3. 必须包含password字段（非空）
 * 4. 对于注册请求，可以添加额外的验证规则
 *
 * 输出格式：
 * - ValidationResult 对象包含：
 *   - isValid: boolean - 验证是否通过
 *   - errors: string[] - 错误信息数组（验证失败时）
 *
 * 示例：
 * ```
 * // 登录请求验证
 * const result = validateAuthRequest(
 *   { email: "test@example.com", password: "password123" },
 *   "login"
 * );
 * // 返回: { isValid: true, errors: [] }
 *
 * // 缺少密码字段
 * const result2 = validateAuthRequest(
 *   { email: "test@example.com" },
 *   "register"
 * );
 * // 返回: { isValid: false, errors: ["密码是必填项"] }
 * ```
 */
export function validateAuthRequest(body: any, type: 'register' | 'login'): ValidationResult {
  const errors: string[] = [];
  
  // 检查body是否存在
  if (!body || typeof body !== 'object') {
    errors.push('请求体格式不正确');
    return { isValid: false, errors };
  }
  
  const { email, password } = body;
  
  // 检查必需字段
  if (!email) {
    errors.push('邮箱是必填项');
  }
  
  if (!password) {
    errors.push('密码是必填项');
  }
  
  // 如果是注册，可以添加额外的验证
  if (type === 'register') {
    // 可以在这里添加注册特有的验证
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 清理用户输入 - 移除多余空格和特殊字符
 *
 * 输入格式：
 * - input: string - 需要清理的用户输入字符串
 *
 * 清理规则：
 * 1. 如果不是字符串类型，返回空字符串
 * 2. 移除首尾空格
 * 3. 将多个连续空格替换为单个空格
 * 4. 限制最大长度为1000个字符
 *
 * 输出格式：
 * - string - 清理后的字符串
 *
 * 示例：
 * ```
 * const cleaned = sanitizeInput("  Hello    World  ");
 * // 返回: "Hello World"
 *
 * const cleaned2 = sanitizeInput(123);
 * // 返回: "" (非字符串输入)
 * ```
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/\s+/g, ' ') // 将多个空格替换为单个空格
    .slice(0, 1000); // 限制长度
}

/**
 * 清理邮箱地址 - 转换为小写并移除空格
 *
 * 输入格式：
 * - email: string - 需要清理的邮箱地址
 *
 * 清理规则：
 * 1. 如果不是字符串类型，返回空字符串
 * 2. 移除首尾空格
 * 3. 转换为小写字母
 *
 * 输出格式：
 * - string - 清理后的邮箱地址
 *
 * 示例：
 * ```
 * const cleaned = sanitizeEmail("  Test@Example.COM  ");
 * // 返回: "test@example.com"
 *
 * const cleaned2 = sanitizeEmail(null);
 * // 返回: "" (非字符串输入)
 * ```
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  
  return email.trim().toLowerCase();
}