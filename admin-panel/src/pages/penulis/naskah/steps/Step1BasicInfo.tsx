import React, { useState } from 'react';
import { Form, Input, Select, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import './Step1BasicInfo.css';

const { TextArea } = Input;
const { Option } = Select;

interface CoAuthor {
  id: number;
  name: string;
  bio?: string;
}

interface Step1FormData {
  title: string;
  subtitle: string;
  categoryId: number | null;
  targetAge: string;
  language: string;
  estimatedPages: number | null;
  synopsis: string;
  manuscriptFile: File | null;
  coAuthors: CoAuthor[];
}

interface Step1BasicInfoProps {
  formData: Step1FormData;
  onChange: (data: Step1FormData) => void;
  onValidate: (isValid: boolean) => void;
}

const categories = [
  { id: 1, name: 'Fiction' },
  { id: 2, name: 'Non-Fiction' },
  { id: 3, name: 'Business' },
  { id: 4, name: 'Technology' },
  { id: 5, name: 'Self-Help' },
  { id: 6, name: "Children's Books" },
  { id: 7, name: 'Education' },
  { id: 8, name: 'Biography' },
];

const targetAges = [
  { value: 'children', label: 'Children (3-12 years)' },
  { value: 'teen', label: 'Teen (13-17 years)' },
  { value: 'adult', label: 'Adult (18+ years)' },
  { value: 'all_ages', label: 'All Ages' },
];

const languages = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English' },
];

const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
  formData,
  onChange,
  onValidate,
}) => {
  const [form] = Form.useForm();
  const [wordCount, setWordCount] = useState(0);
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>(formData.coAuthors || []);

  const handleSynopsisChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    
    const isValid = words >= 200;
    if (!isValid && words > 0) {
      message.warning(`Sinopsis minimal 200 kata. Saat ini: ${words} kata`);
    }
    
    onValidate(!!(words >= 200 && formData.title?.trim()));
  };

  const handleFileChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'removed') {
      onChange({ ...formData, manuscriptFile: null });
    } else if (info.file.originFileObj) {
      onChange({ ...formData, manuscriptFile: info.file.originFileObj });
      onValidate(!!(formData.title?.trim() && wordCount >= 200));
    }
  };

  const uploadProps: UploadProps = {
    maxCount: 1,
    accept: '.doc,.docx,.pdf',
    onChange: handleFileChange,
    beforeUpload: (file) => {
      const isValidType = ['application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'].includes(file.type);
      
      if (!isValidType) {
        message.error('Hanya file .doc, .docx, atau .pdf yang diperbolehkan');
        return false;
      }
      
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error('Ukuran file maksimal 50MB');
        return false;
      }
      
      return true;
    },
  };

  const addCoAuthor = () => {
    const newCoAuthor = { id: Date.now(), name: '', bio: '' };
    const updated = [...coAuthors, newCoAuthor];
    setCoAuthors(updated);
    onChange({ ...formData, coAuthors: updated });
  };

  const removeCoAuthor = (id: number) => {
    const updated = coAuthors.filter(ca => ca.id !== id);
    setCoAuthors(updated);
    onChange({ ...formData, coAuthors: updated });
  };

  const updateCoAuthor = (id: number, field: keyof CoAuthor, value: string) => {
    const updated = coAuthors.map(ca => 
      ca.id === id ? { ...ca, [field]: value } : ca
    );
    setCoAuthors(updated);
    onChange({ ...formData, coAuthors: updated });
  };

  return (
    <div className="step-1-basic-info">
      <Form
        form={form}
        layout="vertical"
        size="large"
        initialValues={formData}
        onValuesChange={(changedValues, allValues) => {
          onChange(allValues);
          if (changedValues.title) {
            onValidate(changedValues.title?.trim() && wordCount >= 200);
          }
        }}
      >
        <div className="form-section">
          <h3 className="section-title">Informasi Buku</h3>
          
          <Form.Item
            label={<span className="required-label">Judul Buku <span className="required">*</span></span>}
            name="title"
            rules={[
              { required: true, message: 'Judul buku wajib diisi' },
              { max: 200, message: 'Judul maksimal 200 karakter' }
            ]}
          >
            <Input placeholder="Contoh: Belajar TypeScript untuk Pemula" />
          </Form.Item>

          <Form.Item
            label="Sub-judul (Opsional)"
            name="subtitle"
          >
            <Input placeholder="Contoh: Panduan Lengkap dari Nol sampai Mahir" />
          </Form.Item>

          <Form.Item
            label={<span className="required-label">Kategori <span className="required">*</span></span>}
            name="categoryId"
            rules={[{ required: true, message: 'Kategori wajib dipilih' }]}
          >
            <Select placeholder="Pilih kategori buku" showSearch filterOption>
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="required-label">Target Pembaca <span className="required">*</span></span>}
            name="targetAge"
            rules={[{ required: true, message: 'Target pembaca wajib dipilih' }]}
          >
            <Select placeholder="Pilih target pembaca">
              {targetAges.map(age => (
                <Option key={age.value} value={age.value}>{age.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="required-label">Bahasa <span className="required">*</span></span>}
            name="language"
            rules={[{ required: true, message: 'Bahasa wajib dipilih' }]}
          >
            <Select placeholder="Pilih bahasa">
              {languages.map(lang => (
                <Option key={lang.value} value={lang.value}>{lang.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Estimasi Jumlah Halaman (Opsional)"
            name="estimatedPages"
          >
            <Input type="number" min={50} max={1000} placeholder="Contoh: 250" />
          </Form.Item>
        </div>

        <div className="form-section">
          <h3 className="section-title">Sinopsis / Deskripsi</h3>
          
          <Form.Item
            label={<span className="required-label">Sinopsis <span className="required">*</span></span>}
            name="synopsis"
            rules={[
              { required: true, message: 'Sinopsis wajib diisi' },
              { min: 200, message: 'Sinopsis minimal 200 kata' }
            ]}
          >
            <TextArea
              rows={8}
              placeholder="Tulis sinopsis buku Anda minimal 200 kata. Jelaskan tentang apa buku ini, mengapa orang harus membacanya, dan apa yang membuat buku ini unik."
              onChange={handleSynopsisChange}
              showCount={{
                formatter: ({ count }) => `${count} kata`,
              }}
            />
          </Form.Item>
          
          <div className="word-count-hint">
            {wordCount > 0 && wordCount < 200 && (
              <span className="warning-text">
                ⚠️ Sinopsis masih {200 - wordCount} kata lagi untuk memenuhi minimum
              </span>
            )}
            {wordCount >= 200 && (
              <span className="success-text">
                ✅ Sinopsis sudah memenuhi syarat ({wordCount} kata)
              </span>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Upload Naskah</h3>
          
          <Form.Item
            label={<span className="required-label">File Naskah <span className="required">*</span></span>}
            name="manuscriptFile"
            rules={[{ required: true, message: 'File naskah wajib diupload' }]}
          >
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click atau drag & drop file di sini</p>
              <p className="ant-upload-hint">
                Format: .doc, .docx, atau .pdf (Max 50MB)
              </p>
            </Upload.Dragger>
          </Form.Item>
        </div>

        <div className="form-section">
          <h3 className="section-title">Penulis Tambahan (Opsional)</h3>
          <p className="section-description">
            Jika ada co-author atau penulis pendamping, tambahkan di bawah ini
          </p>
          
          {coAuthors.map((coAuthor, index) => (
            <div key={coAuthor.id} className="co-author-item">
              <div className="co-author-header">
                <span>Penulis #{index + 1}</span>
                <button 
                  type="button" 
                  className="remove-btn"
                  onClick={() => removeCoAuthor(coAuthor.id)}
                >
                  Hapus
                </button>
              </div>
              <Input
                placeholder="Nama lengkap"
                value={coAuthor.name}
                onChange={(e) => updateCoAuthor(coAuthor.id, 'name', e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <TextArea
                placeholder="Bio singkat (opsional)"
                value={coAuthor.bio}
                onChange={(e) => updateCoAuthor(coAuthor.id, 'bio', e.target.value)}
                rows={2}
              />
            </div>
          ))}
          
          <button 
            type="button" 
            className="add-co-author-btn"
            onClick={addCoAuthor}
          >
            + Tambah Penulis Lain
          </button>
        </div>
      </Form>
    </div>
  );
};

export default Step1BasicInfo;
