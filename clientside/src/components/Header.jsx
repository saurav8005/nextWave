import React from 'react';
import { styles } from '../styles';

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>Content Reviewer & Assessment Studio</h1>
        <p style={styles.subtitle}>
          Full-Stack Question Generation & Live Interactive Camera Studio
        </p>
      </div>

      <div style={styles.tabGroup}>
        <button
          style={activeTab === 'tool' ? styles.activeTab : styles.tabButton}
          onClick={() => setActiveTab('tool')}
        >
          1. Reviewer Tool & Input Demo
        </button>
        <button
          style={activeTab === 'lesson' ? styles.activeTab : styles.tabButton}
          onClick={() => setActiveTab('lesson')}
        >
          2. Live Camera Lesson Studio
        </button>
      </div>
    </header>
  );
}