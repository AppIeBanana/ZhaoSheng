// 考试类型选项
export const EXAM_TYPES = [
  { label: '春季统考', value: '春季统考' },
  { label: '秋季统考', value: '秋季统考' }
];

// 考生类型选项
export const USER_TYPES = [
  { label: '请选择考生类型', value: '' },
  { label: '城镇应届', value: '城镇应届' },
  { label: '城镇往届', value: '城镇往届' },
  { label: '农村应届', value: '农村应届' },
  { label: '农村往届', value: '农村往届' }
];

// 表单字段配置
export const FORM_FIELDS = {
  EXAM_TYPE: 'examType',
  USER_TYPE: 'userType',
  PROVINCE: 'province',
  ETHNICITY: 'ethnicity',
  SCORE: 'score',
  PHONE: 'phone'
};

// 表单验证规则提示
export const VALIDATION_MESSAGES = {
  REQUIRED: '此字段为必填项',
  INVALID_PHONE: '请输入有效的手机号码',
  INVALID_SCORE: '请输入有效的分数'
};

// 初始表单数据
export const INITIAL_FORM_DATA = {
  examType: '',
  userType: '',
  province: '',
  ethnicity: '',
  score: '',
  phone: ''
};

// 表单提交状态文本
export const SUBMIT_STATUS = {
  DEFAULT: '确认并进入咨询',
  SUBMITTING: '处理中...',
  SUCCESS: '提交成功！'
};