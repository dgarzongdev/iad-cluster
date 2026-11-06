import React from 'react';
import {
  Database,
  BarChart2,
  Wand2,
  GitFork,
  ShieldCheck,
  Users,
  Sparkles,
  LayoutDashboard,
  Download,
  CheckCircle2,
} from 'lucide-react';

export type StepId =
  | 'ingestion'
  | 'eda'
  | 'prep'
  | 'clustering'
  | 'validation'
  | 'profiles'
  | 'gemini'
  | 'dashboard'
  | 'export';

export interface StepDef {
  id: StepId;
  number: number;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  isReady: boolean;
  isCompleted: boolean;
}

interface StepNavigationProps {
  steps: StepDef[];
  activeStep: StepId;
  onSelectStep: (stepId: StepId) => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  activeStep,
  onSelectStep,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 py-2 min-w-max">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            const isClickable = step.isReady || step.isCompleted;

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onSelectStep(step.id)}
                disabled={!isClickable}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                    : step.isCompleted
                    ? 'text-slate-700 bg-slate-100 hover:bg-slate-200/80 cursor-pointer'
                    : 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : step.isCompleted ? 'text-blue-600' : 'text-slate-400'}`} />
                  {step.isCompleted && !isActive && (
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 absolute -top-1 -right-1 bg-white rounded-full" />
                  )}
                </div>
                <span>
                  <strong className="mr-1">{step.number}.</strong>
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
