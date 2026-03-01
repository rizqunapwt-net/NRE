import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import './StepNavigation.css';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
  isSubmitting?: boolean;
  showSubmit?: boolean;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  canProceed,
  isSubmitting = false,
  showSubmit = false,
}) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="step-navigation">
      {!isFirstStep && (
        <Button 
          size="large" 
          onClick={onBack}
          disabled={isSubmitting}
          icon={<ArrowLeftOutlined />}
        >
          Kembali
        </Button>
      )}
      
      <div className="spacer" />
      
      {!isLastStep ? (
        <Button 
          type="primary" 
          size="large" 
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          icon={<ArrowRightOutlined />}
          loading={isSubmitting}
        >
          Lanjut
        </Button>
      ) : showSubmit ? (
        <Button 
          type="primary" 
          size="large" 
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          loading={isSubmitting}
          htmlType="submit"
        >
          Submit Naskah
        </Button>
      ) : null}
    </div>
  );
};

export default StepNavigation;
