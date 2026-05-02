import React from 'react';
import { Globe, MapPin } from 'lucide-react';

const AdTypeFilter = ({ selectedType, onTypeChange }) => {
  const types = [
    { id: null, label: 'الكل', icon: null },
    { id: 'local', label: 'محلي', icon: MapPin },
    { id: 'global', label: 'عالمي', icon: Globe }
  ];

  return (
    <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg">
      {types.map((type) => {
        const Icon = type.icon;
        const isActive = selectedType === type.id;
        
        return (
          <button
            key={type.id || 'all'}
            onClick={() => onTypeChange(type.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isActive
                ? 'bg-[#3b82f6] text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid={`filter-${type.id || 'all'}`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{type.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AdTypeFilter;
