export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证邮箱格式
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
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  
  return email.trim().toLowerCase();
}