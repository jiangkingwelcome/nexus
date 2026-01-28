import React from 'react';
import { SearchIcon } from './Icons';

interface HeaderProps {
  name: string;
}

const Header: React.FC<HeaderProps> = ({ name }) => {
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 9) return '早上好';
    if (hours < 12) return '上午好';
    if (hours < 18) return '下午好';
    return '晚上好';
  };

  return (
    <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-1">
          {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
          {getGreeting()}, <span className="block md:inline text-indigo-600">{name}</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2.5 rounded-full bg-white shadow-sm border border-slate-100 active:scale-95 transition-transform text-slate-600 hover:text-indigo-600">
          <SearchIcon className="w-5 h-5" />
        </button>
        <div className="relative cursor-pointer active:scale-95 transition-transform group">
           <img 
             src="https://picsum.photos/100/100?random=user" 
             alt="Profile" 
             className="w-11 h-11 rounded-full border-2 border-white shadow-md object-cover group-hover:border-indigo-100 transition-colors"
           />
           <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;