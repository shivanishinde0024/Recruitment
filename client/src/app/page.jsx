'use client';

import React, { useState } from 'react';
import Header from '../components/sqa/Header';
import HeroSection from '../components/sqa/HeroSection';
import AboutSection from '../components/sqa/AboutSection';
import PillarsSection from '../components/sqa/PillarsSection';
import InteractiveLabs from '../components/sqa/InteractiveLabs';
import CounselorCrmView from '../components/sqa/CounselorCrmView';
import Footer from '../components/sqa/Footer';
import ConsultationModal from '../components/sqa/ConsultationModal';
import ApplyModal from '../components/sqa/ApplyModal';
import WizardModal from '../components/sqa/WizardModal';
import { toast } from 'react-toastify';

export default function SqaLandingPage() {
  const [activeView, setActiveView] = useState('frontend'); // 'frontend' | 'backend'
  const [leadsCount, setLeadsCount] = useState(4);

  // Modals state
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState('Pillar 1: Career Roadmap');
  const [selectedTrack, setSelectedTrack] = useState('General Diagnostic');

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Placement Candidate Drive');

  const [wizardModalOpen, setWizardModalOpen] = useState(false);

  // Live HTTP activity logs
  const [serverLogs, setServerLogs] = useState([
    {
      method: 'GET',
      endpoint: '/api/v1/sqa/certificates/verify/SQA-2026-AI01',
      status: 200,
      latency: 18,
      time: new Date().toLocaleTimeString()
    },
    {
      method: 'GET',
      endpoint: '/api/v1/health',
      status: 200,
      latency: 12,
      time: new Date().toLocaleTimeString()
    }
  ]);

  const addServerLog = (method, endpoint, status, latency) => {
    const newLog = {
      method,
      endpoint,
      status,
      latency: latency || Math.floor(15 + Math.random() * 30),
      time: new Date().toLocaleTimeString()
    };
    setServerLogs((prev) => [newLog, ...prev.slice(0, 24)]);
  };

  const handleOpenConsultation = (pillar, track) => {
    setSelectedPillar(pillar || 'Pillar 1: Career Roadmap');
    setSelectedTrack(track || 'General Diagnostic');
    setConsultModalOpen(true);
  };

  const handleOpenApply = (role) => {
    setSelectedRole(role || 'Placement Candidate Drive');
    setApplyModalOpen(true);
  };

  const handleWizardFinish = (pillar, track) => {
    handleOpenConsultation(pillar, track);
  };

  const handleDownloadHtml = () => {
    toast.info('Downloading complete standalone SQA HTML package...');
    const link = document.createElement('a');
    link.href = '/sqa-landing-clean.html';
    link.download = 'Success_Quest_Academy_V3.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sqa-landing-root min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased selection:bg-teal-600 selection:text-white w-full overflow-x-hidden">
      {/* Header Navigation */}
      <Header
        onOpenConsultation={handleOpenConsultation}
        onOpenWizard={() => setWizardModalOpen(true)}
        onSwitchToFrontend={() => setActiveView('frontend')}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {activeView === 'frontend' ? (
          <div id="view-frontend">
            {/* Hero Showcase */}
            <HeroSection
              onOpenConsultation={handleOpenConsultation}
              onOpenApply={handleOpenApply}
              onOpenWizard={() => setWizardModalOpen(true)}
            />

            {/* About Us */}
            <AboutSection />

            {/* 5 Strategic Academic Pillars */}
            <PillarsSection
              onOpenConsultation={handleOpenConsultation}
              onOpenApply={handleOpenApply}
            />

            {/* Interactive Experimental Suite (Calculators, AI Sandbox, Certificate Terminal) */}
            <InteractiveLabs />
          </div>
        ) : (
          /* Counselor & Admissions CRM View */
          <CounselorCrmView
            onOpenConsultation={handleOpenConsultation}
            serverLogs={serverLogs}
            onClearLogs={() => setServerLogs([])}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenConsultation={handleOpenConsultation}
        onSwitchToBackend={() => {
          setActiveView('backend');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDownloadHtml={handleDownloadHtml}
      />

      {/* Consultation Lead Modal */}
      <ConsultationModal
        isOpen={consultModalOpen}
        onClose={() => setConsultModalOpen(false)}
        initialPillar={selectedPillar}
        initialTrack={selectedTrack}
        onLeadAdded={() => {
          setLeadsCount((prev) => prev + 1);
          addServerLog('POST', '/api/v1/sqa/leads', 201, 24);
        }}
      />

      {/* Candidate Placement Application Modal */}
      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        targetRole={selectedRole}
        onApplicationAdded={() => {
          addServerLog('POST', '/api/v1/sqa/applications', 201, 28);
        }}
      />

      {/* Career Diagnostic Wizard Modal */}
      <WizardModal
        isOpen={wizardModalOpen}
        onClose={() => setWizardModalOpen(false)}
        onFinish={handleWizardFinish}
      />
    </div>
  );
}
