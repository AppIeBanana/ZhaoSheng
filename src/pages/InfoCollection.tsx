import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentData } from '@/contexts/studentContext.tsx';
// import { useWechatAuthContext } from '@/contexts/wechatAuthContext.tsx';
import { toast } from 'sonner';
import { provinces } from '@/data/provinces.ts';
import { ethnicities } from '@/data/ethnicities.ts';
import { saveStudentDataToRedis, getStudentDataFromRedis } from '@/lib/redis.ts';

export default function InfoCollection() {
  const { studentData, setStudentData } = useStudentData();
  // const { isAuthenticated } = useWechatAuthContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    examType: "",
    studentType: "",
    province: "",
    minzu: "",
    score: "",
    phone: ""
  });
  
  // 当studentData变化时，将其设置到formData中
  useEffect(() => {
    if (studentData) {
      setFormData(prev => ({
        ...prev,
        ...studentData
      }));
    }
  }, [studentData]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 添加搜索关键词状态
  const [provinceSearchTerm, setProvinceSearchTerm] = useState("");
  const [minzuSearchTerm, setMinzuSearchTerm] = useState("");
  // 下拉框展开状态 - 使用一个状态变量来管理当前打开的下拉框
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // 处理下拉框的打开/关闭
  const toggleDropdown = (dropdownType: string) => {
    // 如果点击的是当前打开的下拉框，则关闭；否则打开新的下拉框
    setOpenDropdown(prev => prev === dropdownType ? null : dropdownType);
  };
  
  // 检查是否已有学生信息，但不再自动跳转
  // 注意：我们现在主要通过StudentContext的localStorage持久化来管理数据
  // 这个useEffect可以保留作为后备，但主要逻辑已经在StudentContext中实现
  useEffect(() => {
    const checkExistingStudentData = async () => {
      try {
        // 从本地存储获取数据（作为后备方案）
        const studentData = await getStudentDataFromRedis();
        
        if (studentData && !formData.examType) {
          // 如果成功获取到数据且表单为空，设置到context中
          setStudentData(studentData);
          console.log('已加载保存的学生信息，可以继续之前的咨询');
        }
      } catch (error) {
        // 静默处理错误，不影响用户体验
        console.debug('检查保存的学生信息时发生错误:', error);
      }
    };
    
    checkExistingStudentData();
  }, [setStudentData, formData.examType]);
  
  // 添加一个简单的提示，如果有保存的数据，让用户知道可以继续
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // 处理省份选择
  const handleProvinceSelect = (province: string) => {
    setFormData(prev => ({ ...prev, province }));
    setOpenDropdown(null); // 关闭所有下拉框
    
    // Clear error when province is selected
    if (errors.province) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.province;
        return newErrors;
      });
    }
  };
  
  // 处理民族选择
  const handleMinzuSelect = (minzu: string) => {
    setFormData(prev => ({ ...prev, minzu }));
    setOpenDropdown(null); // 关闭所有下拉框
    
    // Clear error when minzu is selected
    if (errors.minzu) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.minzu;
        return newErrors;
      });
    }
  };
  
  // 过滤省份列表
  const filteredProvinces = provinceSearchTerm
    ? provinces.filter(province => 
        province.includes(provinceSearchTerm)
      )
    : provinces;
  
  // 过滤民族列表
  const filteredEthnicities = minzuSearchTerm
    ? ethnicities.filter(ethnicity => 
        ethnicity.includes(minzuSearchTerm)
      )
    : ethnicities;
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.examType) newErrors.examType = "请选择考试类型";
    if (!formData.studentType) newErrors.studentType = "请选择考生类型";
    if (!formData.province) newErrors.province = "请选择生源省份";
    if (!formData.minzu) newErrors.minzu = "请选择民族";
    // 手机号为必填项，验证格式
    if (!formData.phone) {
      newErrors.phone = "请输入手机号";
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "请输入有效的手机号码";
    }
     // 分数为选填，但如果填写了则验证格式
     if (formData.score && (isNaN(Number(formData.score)) || Number(formData.score) < 0)) {
       newErrors.score = "请输入有效的分数";
     }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Save form data to context
      setStudentData(formData);
      
      // 尝试保存到Redis
      await saveStudentDataToRedis(formData);
      
      // 先显示成功消息
      toast.success("信息提交成功！");
      
      // 使用React Router的导航功能跳转到QA页面
      setTimeout(() => {
        try {
          navigate('/qa');
        } catch (error) {
          console.warn('导航失败:', error);
          toast.info('已保存您的信息，请刷新页面或联系管理员');
        }
      }, 1000);
    } catch (error) {
      toast.error("提交失败，但您的信息已保存在本地");
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-15% h-15% max-w-32 max-h-32 mx-auto mb-4">
          <img src="/imgs/校徽.png" alt="福州软件职业技术学院校徽" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-[clamp(1.5rem,5vw,2rem)] font-bold text-gray-800 mb-2">新生信息查询</h1>
        <p className="text-gray-600">请填写以下信息，以便为您提供个性化咨询</p>
      </div>
      
      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 transform transition-all duration-300 hover:shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">考试类型 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {["春季统考", "秋季统考"].map(type => (
                <label key={type} className="relative">
                  <input
                    type="radio"
                    name="examType"
                    value={type}
                    checked={formData.examType === type}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className={`
                    block w-full rounded-xl border-2 p-4 text-center transition-all
                    peer-checked:border-blue-500 peer-checked:bg-blue-50
                    peer-checked:text-blue-600 peer-checked:font-medium
                    hover:bg-gray-50 cursor-pointer
                  `}>
                    {type}
                  </div>
                </label>
              ))}
            </div>
            {errors.examType && (
              <p className="text-red-500 text-xs mt-1">{errors.examType}</p>
            )}
          </div>
          
          {/* Student Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">考生类型 <span className="text-red-500">*</span></label>
            <select
              name="studentType"
              value={formData.studentType}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 p-4 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">请选择考生类型</option>
              <option value="城镇应届">城镇应届</option>
              <option value="城镇往届">城镇往届</option>
              <option value="农村应届">农村应届</option>
              <option value="农村往届">农村往届</option>
            </select>
            {errors.studentType && (
              <p className="text-red-500 text-xs mt-1">{errors.studentType}</p>
            )}
          </div>
          
          {/* Province with Search and Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">生源省份 <span className="text-red-500">*</span></label>
            <div className="relative">
              {/* Province Input */}
              <div 
                className={`
                  w-full rounded-xl border border-gray-300 p-4 text-gray-700 cursor-pointer
                  ${formData.province ? 'text-blue-600' : 'text-gray-400'}
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                `}
                onClick={() => toggleDropdown('province')}
              >
                {formData.province || "请选择生源省份"}
                <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 transition-transform ${openDropdown === 'province' ? 'rotate-180' : ''}`}></i>
              </div>
              
              {/* Dropdown with Search */}
              {openDropdown === 'province' && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="搜索省份..."
                      value={provinceSearchTerm}
                      onChange={(e) => setProvinceSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  
                  {/* Filtered Province List */}
                  <div className="p-1">
                    {filteredProvinces.length > 0 ? (
                      filteredProvinces.map(province => (
                        <div
                          key={province}
                          className={`
                            block w-full text-left px-4 py-2 rounded-lg transition-colors
                            ${formData.province === province 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'hover:bg-gray-100 text-gray-700'}
                          `}
                          onClick={() => handleProvinceSelect(province)}
                        >
                          {province}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        没有找到匹配的省份
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.province && (
              <p className="text-red-500 text-xs mt-1">{errors.province}</p>
            )}
          </div>
          
          {/* Ethnicity with Search and Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">民族 <span className="text-red-500">*</span></label>
            <div className="relative">
              {/* Ethnicity Input */}
              <div 
                className={`
                  w-full rounded-xl border border-gray-300 p-4 text-gray-700 cursor-pointer
                  ${formData.minzu ? 'text-blue-600' : 'text-gray-400'}
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                `}
                onClick={() => toggleDropdown('minzu')}
              >
                {formData.minzu || "请选择民族"}
                <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 transition-transform ${openDropdown === 'minzu' ? 'rotate-180' : ''}`}></i>
              </div>
              
              {/* Dropdown with Search */}
              {openDropdown === 'minzu' && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="搜索民族..."
                      value={minzuSearchTerm}
                      onChange={(e) => setMinzuSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  
                  {/* Filtered Ethnicity List */}
                  <div className="p-1">
                    {filteredEthnicities.length > 0 ? (
                      filteredEthnicities.map(ethnicity => (
                        <div
                          key={ethnicity}
                          className={`
                            block w-full text-left px-4 py-2 rounded-lg transition-colors
                            ${formData.minzu === ethnicity 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'hover:bg-gray-100 text-gray-700'}
                          `}
                          onClick={() => handleMinzuSelect(ethnicity)}
                        >
                          {ethnicity}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        没有找到匹配的民族
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.minzu && (
              <p className="text-red-500 text-xs mt-1">{errors.minzu}</p>
            )}
          </div>
          
          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">手机号码 <span className="text-red-500">*</span></label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="请输入您的手机号码"
              className="w-full rounded-xl border border-gray-300 p-4 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              maxLength={11}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
          
          {/* Score */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">分数</label>
            <input
              type="number"
              name="score"
              value={formData.score}
              onChange={handleChange}
              placeholder="请输入您的考试分数"
              className="w-full rounded-xl border border-gray-300 p-4 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
     {/* 分数为选填，移除必填错误提示 */}
     {errors.score && (
       <p className="text-red-500 text-xs mt-1">{errors.score}</p>
     )}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full rounded-xl py-4 font-medium text-white transition-all transform
              ${isSubmitting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0'}
              flex items-center justify-center
            `}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                处理中...
              </>
            ) : (
              <>
                确认并进入咨询
                <i className="fa-solid fa-arrow-right ml-2"></i>
              </>
            )}
          </button>
        </form>
      </div>
      
      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        <p>本系统信息仅供参考,具体以学校官方发布为准</p>
        <p className="text-xs whitespace-pre-line">如有疑问,请联系招生热线：0591-83843292 或</p>
        <p className="text-xs whitespace-pre-line">18905009495(微信同号)</p>
      </div>
    </div>
  );
}