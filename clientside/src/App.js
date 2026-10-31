import React, { useState } from 'react';
import { styles } from './styles';
import Header from './components/Header';
import ReviewerToolTab from './components/ReviewerToolTab';
import LessonTab from './components/LessonTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('tool');

  return (
    <div style={styles.appWrapper}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'tool' && <ReviewerToolTab />}
      {activeTab === 'lesson' && <LessonTab />}
    </div>
  );
}