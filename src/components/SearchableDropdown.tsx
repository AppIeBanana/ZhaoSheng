import React, { useState } from 'react';

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  items: string[];
  value: string;
  onChange: (selected: string) => void;
  error?: string;
  isRequired?: boolean;
  testId?: string;
}

export default function SearchableDropdown({
  label,
  placeholder,
  items,
  value,
  onChange,
  error,
  isRequired = false,
  testId
}: SearchableDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // 过滤列表项
  const filteredItems = searchTerm
    ? items.filter(item => item.includes(searchTerm))
    : items;

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    setSearchTerm(''); // 重置搜索词
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // 打开时重置搜索词
      setSearchTerm('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 处理外部点击关闭下拉框
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(`[data-testid="${testId || 'searchable-dropdown'}"]`)) {
      setIsOpen(false);
    }
  };

  // 当组件挂载时添加事件监听器，卸载时移除
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, testId]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>
      <div className="relative" data-testid={testId || 'searchable-dropdown'}>
        {/* Dropdown Input */}
        <div
          className={`
            w-full rounded-xl border ${error ? 'border-red-300' : 'border-gray-300'} 
            p-4 text-gray-700 cursor-pointer focus:ring-2 
            ${value ? 'text-blue-600' : 'text-gray-400'}
            focus:ring-blue-500 focus:border-blue-500 transition-all
          `}
          onClick={toggleDropdown}
        >
          {value || placeholder}
          <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>

        {/* Dropdown with Search */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder={`搜索${label}...`}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full rounded-lg border border-gray-300 p-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>

            {/* Filtered Items List */}
            <div className="p-1">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <div
                    key={item}
                    className={`
                      block w-full text-left px-4 py-2 rounded-lg transition-colors
                      ${value === item
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-100 text-gray-700'}
                    `}
                    onClick={() => handleSelect(item)}
                  >
                    {item}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  没有找到匹配的{label}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}