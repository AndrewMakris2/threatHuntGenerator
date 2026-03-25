import React from 'react';
import { Check } from 'lucide-react';
import './ProfileStepper.css';

const STEPS = [
  { id: 0, label: 'Company',     short: '1' },
  { id: 1, label: 'Stack',       short: '2' },
  { id: 2, label: 'Cloud & OS',  short: '3' },
  { id: 3, label: 'Risk',        short: '4' },
  { id: 4, label: 'Threats',     short: '5' },
  { id: 5, label: 'Review',      short: '6' },
];

export { STEPS };

export default function ProfileStepper({ currentStep, completedSteps = [] }) {
  return (
    <div className="profile-stepper">
      {STEPS.map((step, idx) => {
        const isActive    = currentStep === idx;
        const isCompleted = completedSteps.includes(idx) || currentStep > idx;
        const isLast      = idx === STEPS.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="stepper-step">
              <div
                className={`stepper-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                {isCompleted ? <Check size={14} /> : step.short}
              </div>
              <div
                className={`stepper-label ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                {step.label}
              </div>
            </div>
            {!isLast && (
              <div className={`stepper-line ${isCompleted ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
