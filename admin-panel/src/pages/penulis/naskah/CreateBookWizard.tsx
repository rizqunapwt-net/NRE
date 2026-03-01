import React, { useState } from 'react';
import { message } from 'antd';
import api from '../../../api';
import ProgressStepper from './components/ProgressStepper';
import StepNavigation from './components/StepNavigation';
import Step1BasicInfo from './steps/Step1BasicInfo';
import { 
  Step2AdminReview, 
  Step3Editing, 
  Step4CoverDesign, 
  Step5ISBNProcess, 
  Step6QualityControl, 
  Step7Published 
} from './steps/StatusDisplay';
import './CreateBookWizard.css';

const wizardSteps = [
  { id: 1, title: 'Isi Form', icon: '📝' },
  { id: 2, title: 'Diterima', icon: '✅' },
  { id: 3, title: 'Editing', icon: '✏️' },
  { id: 4, title: 'Cover', icon: '🎨' },
  { id: 5, title: 'ISBN', icon: '📚' },
  { id: 6, title: 'QC', icon: '🔍' },
  { id: 7, title: 'Publish', icon: '🎉' },
];

interface Step1FormData {
  title: string;
  subtitle: string;
  categoryId: number | null;
  targetAge: string;
  language: string;
  estimatedPages: number | null;
  synopsis: string;
  manuscriptFile: File | null;
  coAuthors: any[];
}

const initialFormData: Step1FormData = {
  title: '',
  subtitle: '',
  categoryId: null,
  targetAge: 'general',
  language: 'id',
  estimatedPages: null,
  synopsis: '',
  manuscriptFile: null,
  coAuthors: [],
};

interface CreateBookWizardProps {
  existingManuscript?: unknown; // If editing existing draft
}

type ApiError = { response?: { data?: { message?: string } } };

const CreateBookWizard: React.FC<CreateBookWizardProps> = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Step1FormData>(initialFormData);
  const [canProceed, setCanProceed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manuscriptId, setManuscriptId] = useState<number | null>(null);

  const handleNext = async () => {
    if (currentStep === 1 && canProceed) {
      // Submit manuscript
      await submitManuscript();
    } else if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitManuscript = async () => {
    setIsSubmitting(true);

    try {
      // Step 1: Create manuscript draft
      const createRes = await api.post('/v1/user/manuscripts', {
        title: formData.title,
        subtitle: formData.subtitle,
        category_id: formData.categoryId,
        target_age: formData.targetAge,
        language: formData.language,
        estimated_pages: formData.estimatedPages,
        synopsis: formData.synopsis,
      });
      const newManuscriptId = createRes.data.data.id;
      setManuscriptId(newManuscriptId);

      // Step 2: Upload file if present
      if (formData.manuscriptFile) {
        const fd = new FormData();
        fd.append('file', formData.manuscriptFile as File);
        await api.post(`/v1/user/manuscripts/${newManuscriptId}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Step 3: Submit for review
      await api.post(`/v1/user/manuscripts/${newManuscriptId}/submit`);

      message.success('Naskah berhasil disubmit! Menunggu review admin.');
      setCurrentStep(2);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      message.error(apiError.response?.data?.message || 'Gagal submit naskah');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepComponent = () => {
    switch(currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            formData={formData}
            onChange={setFormData}
            onValidate={(isValid) => setCanProceed(isValid)}
          />
        );
      case 2:
        return <Step2AdminReview step={2} manuscriptData={{ ...formData, id: manuscriptId }} />;
      case 3:
        return <Step3Editing step={3} manuscriptData={{ ...formData, id: manuscriptId }} />;
      case 4:
        return <Step4CoverDesign step={4} manuscriptData={{ ...formData, id: manuscriptId }} />;
      case 5:
        return <Step5ISBNProcess step={5} manuscriptData={{ ...formData, id: manuscriptId }} />;
      case 6:
        return <Step6QualityControl step={6} manuscriptData={{ ...formData, id: manuscriptId }} />;
      case 7:
        return <Step7Published step={7} manuscriptData={{ ...formData, id: manuscriptId }} />;
      default:
        return null;
    }
  };

  // For steps 2-7, navigation is read-only (no back button needed in most cases)
  const showNavigation = currentStep === 1 || currentStep === 7;

  return (
    <div className="create-book-wizard">
      <div className="wizard-header">
        <h1 className="wizard-title">Buat Buku Baru</h1>
        <p className="wizard-subtitle">Ikuti langkah-langkah berikut untuk submit naskah Anda</p>
      </div>

      <ProgressStepper 
        currentStep={currentStep}
        steps={wizardSteps}
      />

      <div className="wizard-content">
        {renderStepComponent()}
      </div>

      {showNavigation && (
        <StepNavigation
          currentStep={currentStep}
          totalSteps={7}
          onNext={handleNext}
          onBack={handleBack}
          canProceed={canProceed}
          isSubmitting={isSubmitting}
          showSubmit={currentStep === 1}
        />
      )}
    </div>
  );
};

export default CreateBookWizard;
