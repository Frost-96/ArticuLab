import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证密码强度：至少8位，包含字母和数字
 * 返回详细的验证结果和错误信息
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // 检查输入类型
  if (typeof password !== 'string') {
    errors.push('密码必须是字符串类型');
    return { isValid: false, errors };
  }
  
  // 检查空值
  if (!password || password.trim().length === 0) {
    errors.push('密码不能为空');
    return { isValid: false, errors };
  }
  
  // 检查长度
  if (password.length < 8) {
    errors.push('密码长度至少需要8位');
  }
  
  // 检查是否包含字母
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('密码必须包含至少一个字母');
  }
  
  // 检查是否包含数字
  if (!/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof password !== 'string' || !password.trim()) {
      throw new Error('密码必须是有效的非空字符串');
    }
    
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('密码哈希失败:', error);
    throw new Error('密码处理失败，请稍后重试');
  }
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  try {
    if (typeof password !== 'string' || !password.trim()) {
      console.warn('验证密码：密码输入无效');
      return false;
    }
    
    if (typeof hashedPassword !== 'string' || !hashedPassword.trim()) {
      console.warn('验证密码：哈希密码无效');
      return false;
    }
    
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('密码验证失败:', error);
    return false;
  }
}