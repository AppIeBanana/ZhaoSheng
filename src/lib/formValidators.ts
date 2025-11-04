// 学生信息表单数据类型
export interface StudentFormData {
  examType: string;
  userType: string;
  province: string;
  ethnicity: string;
  score: string;
  phone: string;
}

// 验证错误类型
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * 验证学生信息表单
 * @param formData 表单数据对象
 * @returns 验证错误对象，为空表示验证通过
 */
export function validateStudentForm(formData: StudentFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // 考试类型验证
  if (!formData.examType) {
    errors.examType = "请选择考试类型";
  }

  // 考生类型验证
  if (!formData.userType) {
    errors.userType = "请选择考生类型";
  }

  // 生源省份验证
  if (!formData.province) {
    errors.province = "请选择生源省份";
  }

  // 民族验证
  if (!formData.ethnicity) {
    errors.ethnicity = "请选择民族";
  }

  // 手机号验证 - 必填且格式正确
  if (!formData.phone) {
    errors.phone = "请输入手机号";
  } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
    errors.phone = "请输入有效的手机号码";
  }

  // 分数验证 - 选填，但如果填写了则必须是有效的数字
  if (formData.score && (isNaN(Number(formData.score)) || Number(formData.score) < 0)) {
    errors.score = "请输入有效的分数";
  }

  return errors;
}

/**
 * 验证手机号格式
 * @param phone 手机号字符串
 * @returns 是否为有效手机号
 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 验证分数格式
 * @param score 分数字符串
 * @returns 是否为有效分数
 */
export function isValidScore(score: string): boolean {
  if (!score) return true; // 分数为选填
  const numScore = Number(score);
  return !isNaN(numScore) && numScore >= 0;
}