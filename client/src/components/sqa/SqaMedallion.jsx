'use client';

import React from 'react';

export default function SqaMedallion({ size = 'w-12 h-12', className = '' }) {
  return (
    <div className={`relative rounded-full flex items-center justify-center shrink-0 ${size} ${className}`}>
      {/* SQA Embossed Golden Medallion Graphic */}
      <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-700 shadow-lg shadow-amber-500/20 flex items-center justify-center border border-amber-200/40">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-950 via-brand-900 to-brand-850 flex flex-col items-center justify-center text-center p-1.5 border border-amber-400/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-amber-400/10 to-transparent pointer-events-none" />
          <div className="text-[10px] font-black tracking-widest text-amber-300 uppercase leading-none font-serif">SQA</div>
          <div className="text-[7px] font-bold tracking-tight text-amber-200/90 uppercase leading-tight mt-0.5">EST. 2024</div>
          <div className="w-4 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-0.5" />
          <div className="text-[6px] tracking-tighter text-teal-300 font-medium uppercase scale-90">EXCELLENCE</div>
        </div>
      </div>
    </div>
  );
}

