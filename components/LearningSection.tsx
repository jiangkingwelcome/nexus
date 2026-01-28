import React from 'react';
import { LEARNING_ITEMS } from '../constants';
import { LearningItem } from '../types';

interface LearningSectionProps {
  onItemClick?: (item: LearningItem) => void;
}

const LearningSection: React.FC<LearningSectionProps> = ({ onItemClick }) => {
  return (
    <section className="px-6 pb-32">
       <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">继续学习</h2>
        <button className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">全部文件</button>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        {LEARNING_ITEMS.map((item) => (
          <div 
            key={item.id}
            onClick={() => onItemClick && onItemClick(item)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 active:scale-[0.99] transition-all duration-200 hover:shadow-md hover:border-indigo-100 cursor-pointer group"
          >
            {/* Thumbnail */}
            <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-200 shadow-inner">
              <img 
                src={item.thumbnailUrl} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/10"></div>
              {/* Type Badge */}
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded-md">
                <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                  {item.type === 'Book' ? '书籍' : item.type === 'Video' ? '视频' : '课程'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between py-0.5">
              <div>
                <h3 className="font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  上次阅读 2小时前
                </p>
              </div>

              {/* Progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                  <span>{Math.round((item.current / item.total) * 100)}%</span>
                  <span>{item.current}/{item.total} {item.unit}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(item.current / item.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LearningSection;