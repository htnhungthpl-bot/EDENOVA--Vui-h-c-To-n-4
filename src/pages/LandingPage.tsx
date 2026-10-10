/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HeroSection } from '../components/landing/HeroSection.tsx';
import { BrandValuesSection } from '../components/landing/BrandValuesSection.tsx';
import { FeaturesSection } from '../components/landing/FeaturesSection.tsx';
import { Math4Section } from '../components/landing/Math4Section.tsx';
import { WorkflowSection } from '../components/landing/WorkflowSection.tsx';
import { AIAssistantSection } from '../components/landing/AIAssistantSection.tsx';
import { NavigationTarget, UserRole } from '../types/index.ts';

export interface LandingPageProps {
  onNavigate: (target: NavigationTarget) => void;
  onRoleChange: (role: UserRole) => void;
  onOpenUnimplemented: (featureName: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onRoleChange,
  onOpenUnimplemented,
}) => {
  const scrollToMathSection = () => {
    const el = document.getElementById('math4-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('math4');
    }
  };

  const handleExploreRoles = () => {
    onRoleChange('student');
    onNavigate('student-dashboard');
  };

  return (
    <div className="flex flex-col">
      <HeroSection
        onExploreMath={scrollToMathSection}
        onExploreRoles={handleExploreRoles}
      />
      <BrandValuesSection />
      <FeaturesSection />
      <Math4Section
        onGoToStudentDashboard={() => {
          onRoleChange('student');
          onNavigate('student-dashboard');
        }}
        onOpenUnimplemented={onOpenUnimplemented}
      />
      <WorkflowSection />
      <AIAssistantSection onOpenUnimplemented={onOpenUnimplemented} />
    </div>
  );
};
