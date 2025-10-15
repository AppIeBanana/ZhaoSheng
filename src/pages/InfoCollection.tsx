import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentData } from '@/contexts/studentContext.tsx';
// import { useWechatAuthContext } from '@/contexts/wechatAuthContext.tsx';
import { toast } from 'sonner';

// Province data
const provinces = [
  "北京市",
  "天津市",
  "河北省",
  "山西省",
  "内蒙古自治区",
  "辽宁省",
  "吉林省",
  "黑龙江省",
  "上海市",
  "江苏省",
  "浙江省",
  "安徽省",
  "福建省",
  "江西省",
  "山东省",
  "河南省",
  "湖北省",
  "湖南省",
  "广东省",
  "广西壮族自治区",
  "海南省",
  "重庆市",
  "四川省",
  "贵州省",
  "云南省",
  "西藏自治区",
  "陕西省",
  "甘肃省",
  "青海省",
  "宁夏回族自治区",
  "新疆维吾尔自治区",
  "台湾省",
  "香港特别行政区",
  "澳门特别行政区"
];

// Ethnicity data (partial list for example)
const ethnicities = [
  "汉族",
  "蒙古族",
  "回族",
  "藏族",
  "维吾尔族",
  "苗族",
  "彝族",
  "壮族",
  "布衣族",
  "朝鲜族",
  "满族",
  "侗族",
  "瑶族",
  "白族",
  "土家族",
  "哈尼族",
  "哈萨克族",
  "傣族",
  "黎族",
  "傈僳族",
  "佤族",
  "畲族",
  "高山族",
  "拉祜族",
  "水族",
  "东乡族",
  "纳西族",
  "景颇族",
  "柯尔克孜族",
  "土族",
  "达斡尔族",
  "仫佬族",
  "羌族",
  "布朗族",
  "撒拉族",
  "毛南族",
  "仡佬族",
  "锡伯族",
  "阿昌族",
  "普米族",
  "塔吉克族",
  "怒族",
  "乌孜别克族",
  "俄罗斯族",
  "鄂温克族",
  "德昂族",
  "保安族",
  "裕固族",
  "京族",
  "塔塔尔族",
  "独龙族",
  "鄂伦春族",
  "赫哲族",
  "门巴族",
  "珞巴族",
  "基诺族",
];

export default function InfoCollection() {
  const navigate = useNavigate();
  const { setStudentData } = useStudentData();
  // const { isAuthenticated } = useWechatAuthContext();
  
  const [formData, setFormData] = useState({
    examType: "",
    studentType: "",
    province: "",
    ethnicity: "",
    score: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 添加搜索关键词状态
  const [provinceSearchTerm, setProvinceSearchTerm] = useState("");
  const [ethnicitySearchTerm, setEthnicitySearchTerm] = useState("");
  // 下拉框展开状态
  const [isProvinceDropdownOpen, setIsProvinceDropdownOpen] = useState(false);
  const [isEthnicityDropdownOpen, setIsEthnicityDropdownOpen] = useState(false);
  
  // 检查是否已有学生信息，如果有则直接跳转到问答页面
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     const savedStudentData = localStorage.getItem('studentData');
  //     if (savedStudentData) {
  //       try {
  //         const parsedData = JSON.parse(savedStudentData);
  //         setStudentData(parsedData);
  //         navigate('/qa');
  //       } catch (error) {
  //         console.error('加载保存的学生信息失败:', error);
  //       }
  //     }
  //   }
  // }, [isAuthenticated, navigate, setStudentData]);
  
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
    setIsProvinceDropdownOpen(false);
    
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
  const handleEthnicitySelect = (ethnicity: string) => {
    setFormData(prev => ({ ...prev, ethnicity }));
    setIsEthnicityDropdownOpen(false);
    
    // Clear error when ethnicity is selected
    if (errors.ethnicity) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.ethnicity;
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
  const filteredEthnicities = ethnicitySearchTerm
    ? ethnicities.filter(ethnicity => 
        ethnicity.includes(ethnicitySearchTerm)
      )
    : ethnicities;
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.examType) newErrors.examType = "请选择考试类型";
    if (!formData.studentType) newErrors.studentType = "请选择考生类型";
    if (!formData.province) newErrors.province = "请选择生源省份";
    if (!formData.ethnicity) newErrors.ethnicity = "请选择民族";
     // 分数为选填，但如果填写了则验证格式
     if (formData.score && (isNaN(Number(formData.score)) || Number(formData.score) < 0)) {
       newErrors.score = "请输入有效的分数";
     }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Save form data to context
      setStudentData(formData);
      
      // Save form data to local storage for future visits
      localStorage.setItem('studentData', JSON.stringify(formData));
      
      // Navigate to Q&A page
      navigate('/qa');
    } catch (error) {
      toast.error("提交失败，请重试");
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-graduation-cap text-white text-2xl"></i>
        </div>
        <h1 className="text-[clamp(1.5rem,5vw,2rem)] font-bold text-gray-800 mb-2">新生信息查询</h1>
        <p className="text-gray-600">请填写以下信息，以便为您提供个性化咨询</p>
      </div>
      
      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 transform transition-all duration-300 hover:shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">考试类型</label>
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
            <label className="block text-sm font-medium text-gray-700">考生类型</label>
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
            <label className="block text-sm font-medium text-gray-700">生源省份</label>
            <div className="relative">
              {/* Province Input */}
              <div 
                className={`
                  w-full rounded-xl border border-gray-300 p-4 text-gray-700 cursor-pointer
                  ${formData.province ? 'text-blue-600' : 'text-gray-400'}
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                `}
                onClick={() => setIsProvinceDropdownOpen(!isProvinceDropdownOpen)}
              >
                {formData.province || "请选择生源省份"}
                <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 transition-transform ${isProvinceDropdownOpen ? 'rotate-180' : ''}`}></i>
              </div>
              
              {/* Dropdown with Search */}
              {isProvinceDropdownOpen && (
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
            <label className="block text-sm font-medium text-gray-700">民族</label>
            <div className="relative">
              {/* Ethnicity Input */}
              <div 
                className={`
                  w-full rounded-xl border border-gray-300 p-4 text-gray-700 cursor-pointer
                  ${formData.ethnicity ? 'text-blue-600' : 'text-gray-400'}
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                `}
                onClick={() => setIsEthnicityDropdownOpen(!isEthnicityDropdownOpen)}
              >
                {formData.ethnicity || "请选择民族"}
                <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 transition-transform ${isEthnicityDropdownOpen ? 'rotate-180' : ''}`}></i>
              </div>
              
              {/* Dropdown with Search */}
              {isEthnicityDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="搜索民族..."
                      value={ethnicitySearchTerm}
                      onChange={(e) => setEthnicitySearchTerm(e.target.value)}
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
                            ${formData.ethnicity === ethnicity 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'hover:bg-gray-100 text-gray-700'}
                          `}
                          onClick={() => handleEthnicitySelect(ethnicity)}
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
            {errors.ethnicity && (
              <p className="text-red-500 text-xs mt-1">{errors.ethnicity}</p>
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
        <p>本系统信息仅供参考，具体以学校官方发布为准</p>
        <p className="mt-1">如有疑问，请联系招生办公室</p>
      </div>
    </div>
  );
}