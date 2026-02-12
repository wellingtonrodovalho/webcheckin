
import React from 'react';
import { FormStep } from '../types';

interface StepIndicatorProps {
  currentStep: FormStep;
}

const steps = [
  { id: FormStep.RESERVATION, label: 'Reserva', icon: 'fa-calendar-check' },
  { id: FormStep.MAIN_GUEST, label: 'Titular', icon: 'fa-user' },
  { id: FormStep.COMPANIONS, label: 'Hóspedes', icon: 'fa-users' },
  { id: FormStep.CONTRACT_PREVIEW, label: 'Contrato', icon: 'fa-file-signature' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="w-full py-6 flex justify-between items-center px-4 max-w-2xl mx-auto">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-300 shadow-sm
              ${currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <i className={`fas ${step.icon}`}></i>
            </div>
            <span className={`text-[10px] mt-2 font-semibold uppercase tracking-wider
              ${currentStep >= step.id ? 'text-blue-600' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-[2px] mx-2 -mt-6 transition-all duration-500
              ${currentStep > step.id ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
