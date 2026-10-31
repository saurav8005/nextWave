import React from 'react';
import { styles } from '../styles';

export default function QuestionCard({
  questionItem,
  index,
  onFieldChange,
  onOptionChange,
}) {
  const isFlagged = questionItem.status.includes('Flagged');
  const isApproved = questionItem.status === 'Approved';

  return (
    <div
      style={{
        ...styles.questionCard,
        borderLeft: isApproved
          ? '6px solid #16a34a'
          : isFlagged
          ? '6px solid #dc2626'
          : '6px solid #f59e0b',
      }}
    >
      {/* Top Bar: Question Type & Verification Status */}
      <div style={styles.flexBetween}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={styles.typeBadge}>
            Q{index + 1} • {questionItem.type}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isApproved
                ? '#16a34a'
                : isFlagged
                ? '#dc2626'
                : '#d97706',
            }}
          >
            {isApproved
              ? '✓ Grounded in Source Text'
              : '⚠ Failed: Tests Untaught Material'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={styles.labelInline}>Reviewer Decision:</label>
          <select
            style={{
              ...styles.select,
              backgroundColor: isApproved
                ? '#dcfce7'
                : isFlagged
                ? '#fee2e2'
                : '#fef3c7',
            }}
            value={questionItem.status}
            onChange={(e) =>
              onFieldChange(questionItem.id, 'status', e.target.value)
            }
          >
            <option value="Approved">Approved (Valid)</option>
            <option value="Pending Review">Pending Edit</option>
            <option value="Flagged (Untaught Material)">
              Failed (Not Taught in Material)
            </option>
          </select>
        </div>
      </div>

      {/* Code Snippet Editor (Rendered only for Code Analysis) */}
      {questionItem.type === 'Code Analysis' && (
        <div style={{ marginTop: 12 }}>
          <label style={styles.fieldLabel}>Code Snippet (Editable):</label>
          <textarea
            style={styles.codeTextarea}
            rows={4}
            value={questionItem.code || ''}
            onChange={(e) =>
              onFieldChange(questionItem.id, 'code', e.target.value)
            }
          />
        </div>
      )}

      {/* Question Prompt */}
      <div style={{ marginTop: 12 }}>
        <label style={styles.fieldLabel}>Question Prompt:</label>
        <input
          type="text"
          style={styles.input}
          value={questionItem.question}
          onChange={(e) =>
            onFieldChange(questionItem.id, 'question', e.target.value)
          }
        />
      </div>

      {/* Options Grid */}
      <div style={{ marginTop: 12 }}>
        <label style={styles.fieldLabel}>Answer Options:</label>
        <div style={styles.optionsGrid}>
          {questionItem.options.map((opt, optIdx) => (
            <div
              key={optIdx}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span style={styles.optionLetter}>
                {String.fromCharCode(65 + optIdx)}
              </span>
              <input
                type="text"
                style={styles.input}
                value={opt}
                onChange={(e) =>
                  onOptionChange(questionItem.id, optIdx, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Answer Key & Source Grounding Quote */}
      <div style={styles.grid2}>
        <div>
          <label style={styles.fieldLabel}>Verified Answer:</label>
          <input
            type="text"
            style={styles.input}
            value={questionItem.answer}
            onChange={(e) =>
              onFieldChange(questionItem.id, 'answer', e.target.value)
            }
          />
        </div>

        <div>
          <label style={styles.fieldLabel}>
            Exact Quote from Reading Material (Proof it is taught):
          </label>
          <input
            type="text"
            style={{
              ...styles.input,
              backgroundColor: isFlagged ? '#fef2f2' : '#f8fafc',
            }}
            value={questionItem.sourceQuote || ''}
            onChange={(e) =>
              onFieldChange(questionItem.id, 'sourceQuote', e.target.value)
            }
          />
        </div>
      </div>

      {/* Reviewer Audit Note */}
      <div style={{ marginTop: 10 }}>
        <label style={styles.fieldLabel}>Reviewer Audit Notes:</label>
        <input
          type="text"
          style={styles.input}
          value={questionItem.reviewerComment || ''}
          onChange={(e) =>
            onFieldChange(questionItem.id, 'reviewerComment', e.target.value)
          }
        />
      </div>
    </div>
  );
}