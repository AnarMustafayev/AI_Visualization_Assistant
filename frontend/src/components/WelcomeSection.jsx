import React from 'react';
import { Sparkles, Zap, Brain, BarChart3, TrendingUp } from 'lucide-react';

const WelcomeSection = ({ quickPrompts, onPromptClick }) => {
  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Salam! Vizualizasiya Assistentinə xoş gəlmisiniz
        </h2>
      </div>

      {/* Quick Prompts */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Tez Başlama
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickPrompts.map((item, index) => (
            <button
              key={index}
              onClick={() => onPromptClick(item.text)}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="bg-gray-100 group-hover:bg-blue-100 p-2 rounded-lg transition-colors">
                <item.icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
              </div>
              <span className="text-gray-800 group-hover:text-blue-900 font-medium">
                {item.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">NLP Analizi</h4>
          <p className="text-gray-600 text-sm">
            Təbii dil emalı ilə sorğularınız avtomatik olaraq SQL-ə çevrilir
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Ağıllı Vizualizasiya</h4>
          <p className="text-gray-600 text-sm">
            Məlumat strukturuna görə ən uyğun qrafik növü avtomatik seçilir
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">İnteraktiv Analiz</h4>
          <p className="text-gray-600 text-sm">
            Real-time statistika və təfərrüatlı məlumat analizi
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;