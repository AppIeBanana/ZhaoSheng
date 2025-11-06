import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '@/contexts/userContext.tsx';
import { toast } from 'sonner';
import { provinces } from '@/data/provinces.ts';
import { ethnicities } from '@/data/ethnicities.ts';
import { getUserData, getStoredPhone, setCurrentPhone } from '@/lib/storageService';
import SearchableDropdown from '@/components/SearchableDropdown';
import Header from '@/components/Header';
import { validateStudentForm, StudentFormData, ValidationErrors } from '@/lib/formValidators';
import { EXAM_TYPES, USER_TYPES, FORM_FIELDS, INITIAL_FORM_DATA, SUBMIT_STATUS } from '@/lib/formConstants';

export default function InfoCollection() {
  const { userData, updateUserData } = useUserData();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<StudentFormData>(INITIAL_FORM_DATA);
  
  // 当userData变化时，将其设置到formData中
  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        ...userData
      }));
    }
  }, [userData]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // 检查是否已有用户信息
  useEffect(() => {
    const checkExistingUserData = async () => {
      try {
        // 获取当前保存的手机号
        const savedPhone = getStoredPhone();
        
        // 如果有保存的手机号，则尝试通过手机号获取数据
        if (savedPhone) {
          const savedUserData = await getUserData(savedPhone);
          
          if (savedUserData && !formData.examType) {
            // 如果成功获取到数据且表单为空，设置到context中
            await updateUserData(savedUserData);
            console.log('已加载保存的用户信息，可以继续之前的咨询');
          }
        }
      } catch (error) {
        // 静默处理错误，不影响用户体验
        console.debug('检查保存的用户信息时发生错误:', error);
      }
    };
    
    checkExistingUserData();
  }, [updateUserData, formData.examType]);
  
  // 已移除继续使用按钮功能
  
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
    
    // Clear error when ethnicity is selected
    if (errors.ethnicity) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.ethnicity;
        return newErrors;
      });
    }
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 使用验证工具进行表单验证
    const validationErrors = validateStudentForm(formData);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Save form data to context - updateUserData会自动调用saveUserData
      await updateUserData(formData);
      
      // 保存手机号到本地
      setCurrentPhone(formData.phone);
      
      // 先显示成功消息
      toast.success(SUBMIT_STATUS.SUCCESS);
      
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 使用通用Header组件 */}
      <Header showBackButton={false} />
      <div className="px-4 pt-24 pb-8">
      
      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 transform transition-all duration-300 hover:shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">考试类型 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {EXAM_TYPES.map(type => (
                <label key={type.value} className="relative">
                  <input
                    type="radio"
                    name={FORM_FIELDS.EXAM_TYPE}
                    value={type.value}
                    checked={formData.examType === type.value}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className={`
                    block w-full rounded-xl border-2 p-4 text-center transition-all
                    peer-checked:border-blue-500 peer-checked:bg-blue-50
                    peer-checked:text-blue-600 peer-checked:font-medium
                    hover:bg-gray-50 cursor-pointer
                  `}>
                    {type.label}
                  </div>
                </label>
              ))}
            </div>
            {errors.examType && (
              <p className="text-red-500 text-xs mt-1">{errors.examType}</p>
            )}
          </div>
          
          {/* User Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">考生类型 <span className="text-red-500">*</span></label>
            <select
              name={FORM_FIELDS.USER_TYPE}
              value={formData.userType}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 p-4 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {USER_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.userType && (
              <p className="text-red-500 text-xs mt-1">{errors.userType}</p>
            )}
          </div>
          
          {/* Province with SearchableDropdown */}
          <SearchableDropdown
            label="生源省份"
            placeholder="请选择生源省份"
            items={provinces}
            value={formData.province}
            onChange={handleProvinceSelect}
            error={errors.province}
            isRequired={true}
            testId="province-dropdown"
          />
          
          {/* Ethnicity with SearchableDropdown */}
          <SearchableDropdown
            label="民族"
            placeholder="请选择民族"
            items={ethnicities}
            value={formData.ethnicity}
          onChange={handleEthnicitySelect}
          error={errors.ethnicity}
            isRequired={true}
            testId="ethnicity-dropdown"
          />
          
          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">手机号码 <span className="text-red-500">*</span></label>
            <input
              type="tel"
              name={FORM_FIELDS.PHONE}
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
              name={FORM_FIELDS.SCORE}
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
                {SUBMIT_STATUS.SUBMITTING}
              </>
            ) : (
              <>
                {SUBMIT_STATUS.DEFAULT}
                <i className="fa-solid fa-arrow-right ml-2"></i>
              </>
            )}
          </button>
        </form>
      </div>
      
      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        <p>本系统信息仅供参考,具体以学校官方发布为准</p>
        <p className="text-xs whitespace-pre-line">如有疑问,请联系招生热线：0591-83843292 或 18905009495(微信同号)</p>
      </div>
      </div>
    </div>
  );
}