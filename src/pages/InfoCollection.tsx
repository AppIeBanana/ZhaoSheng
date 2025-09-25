import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentData } from '@/contexts/studentContext.tsx';
import { toast } from 'sonner';

// Province data
const provinces = [
  "安徽省",
  "北京市",
  "重庆市",
  "福建省",
  "甘肃省",
  "广东省",
  "广西壮族自治区",
  "贵州省",
  "海南省",
  "河北省",
  "河南省",
  "黑龙江省",
  "湖北省",
  "湖南省",
  "吉林省",
  "江苏省",
  "江西省",
  "辽宁省",
  "内蒙古自治区",
  "宁夏回族自治区",
  "青海省",
  "山东省",
  "山西省",
  "陕西省",
  "上海市",
  "四川省",
  "天津市",
  "台湾省",
  "西藏自治区",
  "香港特别行政区",
  "新疆维吾尔自治区",
  "云南省",
  "浙江省",
  "澳门特别行政区"
];

// Ethnicity data (partial list for example)
const ethnicities = [
  "汉族",
  "壮族",
  "维吾尔族",
  "回族",
  "彝族",
  "苗族",
  "满族",
  "土家族",
  "藏族",
  "蒙古族",
  "侗族",
  "布依族",
  "瑶族",
  "白族",
  "朝鲜族",
  "哈尼族",
  "黎族",
  "哈萨克族",
  "傣族",
  "畲族",
  "傈僳族",
  "东乡族",
  "仡佬族",
  "拉祜族",
  "佤族",
  "水族",
  "纳西族",
  "羌族",
  "土族",
  "仫佬族",
  "柯尔克孜族",
  "锡伯族",
  "达斡尔族",
  "景颇族",
  "毛南族",
  "撒拉族",
  "布朗族",
  "塔吉克族",
  "阿昌族",
  "普米族",
  "鄂温克族",
  "怒族",
  "京族",
  "基诺族",
  "德昂族",
  "保安族",
  "俄罗斯族",
  "裕固族",
  "乌孜别克族",
  "门巴族",
  "鄂伦春族",
  "独龙族",
  "赫哲族",
  "高山族",
  "珞巴族",
  "塔塔尔族"
];

export default function InfoCollection() {
  const navigate = useNavigate();
  const { setStudentData } = useStudentData();

  const [formData, setFormData] = useState({
    examType: "",
    studentType: "",
    province: "",
    ethnicity: "",
    score: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.examType) newErrors.examType = "请选择考试类型";
    if (!formData.studentType) newErrors.studentType = "请选择考生类型";
    if (!formData.province) newErrors.province = "请选择生源省份";
    if (!formData.ethnicity) newErrors.ethnicity = "请选择民族";
    if (!formData.score) {
      newErrors.score = "请输入分数";
    } else if (isNaN(Number(formData.score)) || Number(formData.score) < 0) {
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

          {/* Province */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">生源省份</label>
            <select
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 p-4 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">请选择生源省份</option>
              {provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
            {errors.province && (
              <p className="text-red-500 text-xs mt-1">{errors.province}</p>
            )}
          </div>

          {/* Ethnicity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">民族</label>
            <select
              name="ethnicity"
              value={formData.ethnicity}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 p-4 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">请选择民族</option>
              {ethnicities.map(ethnicity => (
                <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
              ))}
            </select>
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