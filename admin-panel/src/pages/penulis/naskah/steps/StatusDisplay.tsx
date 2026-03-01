import React from 'react';
import { Timeline, Card, Progress, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import './StatusDisplay.css';

interface StatusDisplayProps {
  step: number;
  manuscriptData?: {
    title?: string;
    [key: string]: any;
  };
}

// Step 2: Admin Review
export const Step2AdminReview: React.FC<StatusDisplayProps> = () => {
  return (
    <div className="status-display">
      <Card className="status-card">
        <div className="status-icon waiting">📝</div>
        <h3 className="status-title">Menunggu Review Admin</h3>
        <p className="status-description">
          Tim admin akan meninjau kelengkapan dan kesesuaian naskah dengan guidelines.
        </p>

        <div className="timeline-box">
          <Timeline
            items={[
              {
                title: 'Naskah Dikirim',
                color: 'green',
                children: 'Sudah selesai',
              },
              {
                title: 'Review Admin',
                color: 'blue',
                children: 'Sedang diproses',
              },
              {
                title: 'Editor Assignment',
                children: 'Akan datang',
              },
            ]}
          />
        </div>

        <div className="status-info">
          <ClockCircleOutlined className="info-icon" />
          <span>Estimasi review: 2-3 hari kerja</span>
        </div>
      </Card>
    </div>
  );
};

// Step 3: Editing
export const Step3Editing: React.FC<StatusDisplayProps> = () => {
  return (
    <div className="status-display">
      <Card className="status-card">
        <div className="status-icon editing">✏️</div>
        <h3 className="status-title">Dalam Proses Editing</h3>

        <div className="editor-info">
          <div className="editor-avatar">👤</div>
          <div className="editor-details">
            <strong>Editor: Sarah Johnson</strong>
            <p>Email: support@ebooksistem.com</p>
          </div>
          <button className="message-btn">💬 Chat Editor</button>
        </div>

        <div className="progress-section">
          <h4>Progress Editing</h4>
          <Progress
            percent={30}
            status="active"
            format={() => 'Bab 3 dari 10'}
          />
          <p className="progress-note">Estimasi selesai: 7 hari lagi</p>
        </div>

        <div className="action-buttons">
          <button className="btn-secondary">📤 Upload Revisi</button>
          <button className="btn-primary">📋 Lihat Catatan Editor</button>
        </div>
      </Card>
    </div>
  );
};

// Step 4: Cover Design
export const Step4CoverDesign: React.FC<StatusDisplayProps> = () => {
  return (
    <div className="status-display">
      <Card className="status-card">
        <div className="status-icon design">🎨</div>
        <h3 className="status-title">Desain Cover</h3>

        <div className="design-options">
          <Card className="option-card selected">
            <h4>Option A: Custom Design</h4>
            <ul>
              <li>✅ Desainer profesional kami buatkan</li>
              <li>✅ 2 revisi included</li>
              <li>✅ Estimasi: 5-7 hari</li>
            </ul>
            <Tag color="blue">Selected</Tag>
          </Card>

          <Card className="option-card">
            <h4>Option B: Submit Sendiri</h4>
            <ul>
              <li>Upload cover design Anda</li>
              <li>Harus meet specifications</li>
              <li>Tim akan review quality</li>
            </ul>
            <button className="btn-outline">Pilih Option Ini</button>
          </Card>
        </div>

        <div className="design-brief">
          <h4>Brief untuk Desainer</h4>
          <p><strong>Style:</strong> Minimalist Modern</p>
          <p><strong>Colors:</strong> Blue, White</p>
          <p><strong>Notes:</strong> Fokus pada typography yang clean dan professional</p>
        </div>
      </Card>
    </div>
  );
};

// Step 5: ISBN Process
export const Step5ISBNProcess: React.FC<StatusDisplayProps> = () => {
  return (
    <div className="status-display">
      <Card className="status-card">
        <div className="status-icon isbn">📚</div>
        <h3 className="status-title">Pengurusan ISBN</h3>

        <div className="isbn-info">
          <div className="isbn-number">
            <strong>ISBN:</strong> <em>Sedang diproses</em>
          </div>
          <Tag color="processing">Submitted to Perpnas</Tag>
        </div>

        <div className="checklist">
          <h4>Dokumen & Requirements</h4>
          <div className="checklist-item completed">
            <CheckCircleOutlined /> Final manuscript approved
          </div>
          <div className="checklist-item completed">
            <CheckCircleOutlined /> Cover design approved
          </div>
          <div className="checklist-item completed">
            <CheckCircleOutlined /> Katalog dalam Terbitan (KDT)
          </div>
          <div className="checklist-item completed">
            <CheckCircleOutlined /> Surat Pernyataan
          </div>
          <div className="checklist-item pending">
            <ClockCircleOutlined /> ISBN Approval dari Perpnas
          </div>
        </div>

        <div className="status-note">
          ⏳ Proses pengurusan ISBN biasanya memakan waktu 3-5 hari kerja
        </div>
      </Card>
    </div>
  );
};

// Step 6: Quality Control
export const Step6QualityControl: React.FC<StatusDisplayProps> = () => {
  return (
    <div className="status-display">
      <Card className="status-card">
        <div className="status-icon qc">🔍</div>
        <h3 className="status-title">Quality Control</h3>

        <p className="qc-description">
          Tim QC memastikan semua standar kualitas terpenuhi sebelum publikasi.
        </p>

        <div className="qc-checklist">
          <div className="qc-item">
            <CheckCircleOutlined className="completed" />
            <span>Formatting check</span>
          </div>
          <div className="qc-item">
            <CheckCircleOutlined className="completed" />
            <span>Typography check</span>
          </div>
          <div className="qc-item">
            <CheckCircleOutlined className="completed" />
            <span>Image quality check</span>
          </div>
          <div className="qc-item">
            <CheckCircleOutlined className="completed" />
            <span>Metadata verification</span>
          </div>
          <div className="qc-item">
            <CheckCircleOutlined className="completed" />
            <span>ISBN placement check</span>
          </div>
          <div className="qc-item active">
            <ClockCircleOutlined className="pending" />
            <span>Final proofreading</span>
          </div>
        </div>

        <div className="qc-progress">
          <Progress percent={83} status="active" />
          <p>5 dari 6 checkpoint selesai</p>
        </div>
      </Card>
    </div>
  );
};

// Step 7: Published!
export const Step7Published: React.FC<StatusDisplayProps> = ({ manuscriptData }) => {
  return (
    <div className="status-display">
      <Card className="status-card success">
        <div className="success-animation">
          <div className="confetti">🎉</div>
        </div>

        <h2 className="success-title">Buku Anda Sudah Terbit!</h2>

        <div className="book-showcase">
          <div className="book-cover-placeholder">
            📘
          </div>
          <div className="book-info">
            <h3>"{manuscriptData?.title || 'Judul Buku'}"</h3>
            <p>ISBN: {manuscriptData?.isbn || 'Menunggu ISBN'}</p>
            <Tag color="success">Published</Tag>
          </div>
        </div>

        <div className="marketplaces">
          <h4>✅ Tersedia di:</h4>
          <div className="marketplace-list">
            <Tag>Gramedia</Tag>
            <Tag>Amazon</Tag>
            <Tag>Google Play Books</Tag>
            <Tag>Apple Books</Tag>
            <Tag>+10 marketplace lainnya</Tag>
          </div>
        </div>

        <div className="next-steps">
          <h4>Next Steps:</h4>
          <ul>
            <li>📊 Monitor penjualan di dashboard author</li>
            <li>💰 Pantau royalti bulanan</li>
            <li>📢 Promosikan buku Anda ke network</li>
            <li>⭐ Dapatkan reviews dari pembaca</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button className="btn-primary">🔗 Lihat di Marketplace</button>
          <button className="btn-secondary">📱 Bagikan ke Social Media</button>
          <button className="btn-outline">📚 Kelola di E-Book Library</button>
        </div>
      </Card>
    </div>
  );
};
