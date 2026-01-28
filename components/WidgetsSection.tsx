import React from 'react';
import { AI_WIDGETS } from '../constants';
import { WidgetItem } from '../types';

interface WidgetsSectionProps {
  onWidgetClick?: (widget: WidgetItem) => void;
}

const WidgetsSection: React.FC<WidgetsSectionProps> = ({ onWidgetClick }) => {
  return (
    <section className="mt-6 mb-8">
      <div className="px-6 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">AI 小组件</h2>
        <button className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">编辑</button>
      </div>
      
      {/* Responsive Container: Horizontal Scroll on Mobile, Grid on Desktop */}
      <div className="flex overflow-x-auto hide-scrollbar px-6 pb-4 gap-4 snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible">
        {AI_WIDGETS.map((widget) => (
          <div 
            key={widget.id} 
            className="flex-shrink-0 flex flex-col items-center gap-2 snap-start group cursor-pointer"
            onClick={() => onWidgetClick && onWidgetClick(widget)}
          >
            <button 
              className={`w-16 h-16 sm:w-20 sm:h-20 ${widget.color} rounded-2xl shadow-lg shadow-indigo-500/10 flex items-center justify-center active:scale-95 transition-all duration-200 border border-white/10 group-hover:shadow-indigo-500/20 group-hover:-translate-y-1`}
            >
              <div className="transform transition-transform group-hover:scale-110">
                {widget.icon}
              </div>
            </button>
            <span className="text-xs font-medium text-slate-600 text-center max-w-[64px] truncate group-hover:text-indigo-600 transition-colors">
              {widget.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WidgetsSection;