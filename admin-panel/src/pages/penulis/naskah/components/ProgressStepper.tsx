import React from 'react';
import './ProgressStepper.css';

interface Step {
  id: number;
  title: string;
  icon: string;
}

interface ProgressStepperProps {
  currentStep: number;
  steps: Step[];
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStep, steps }) => {
  return (
    <div className="progress-stepper">
      {steps.map((step, index) => {
        const isCompleted = index + 1 < currentStep;
        const isCurrent = index + 1 === currentStep;
        const isPending = index + 1 > currentStep;

        return (
          <div 
            key={step.id} 
            className={`step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
          >
            <div className="step-circle">
              {isCompleted ? (
                <span className="check-icon">✓</span>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="step-label">
              <span className="step-title">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`connector ${isCompleted ? 'completed' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressStepper;
