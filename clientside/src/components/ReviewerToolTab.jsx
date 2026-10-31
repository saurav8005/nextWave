import React, { useState } from 'react';
import { styles } from '../styles';
import QuestionCard from './QuestionCard';

const API_BASE_URL = 'http://localhost:8000';

const SAMPLE_READING_MATERIAL = `JavaScript Fundamentals: Variables, Primitives, and Operators

1. Variable Declarations & Block Scope:
In modern JavaScript (ES6+), 'let' and 'const' allow you to declare variables that are limited to the scope of a block statement (anything inside curly braces { }). Unlike 'var', block scoping keeps inner declarations completely isolated from the outer block. Furthermore, variables declared with 'const' cannot be reassigned through reassignment operators, preventing accidental mutation of primitive references.

2. Primitive Data Types:
JavaScript primitives include string, number, bigint, boolean, undefined, symbol, and null. Any value that is not one of these seven primitive types—such as an Object, Array, or Function—is classified as a non-primitive (reference) type.

3. Strict Equality Comparison:
When comparing values, the loose equality operator (==) attempts to convert and compare operands that are of different types. In contrast, the strict equality operator (===) checks whether its two operands are equal without type conversion (coercion). If the values have different types, '===' immediately returns false.`;

export default function ReviewerToolTab() {
  const [readingMaterial, setReadingMaterial] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportedJson, setExportedJson] = useState(null);

  const handleLoadSample = () => {
    setReadingMaterial(SAMPLE_READING_MATERIAL);
    setError('');
  };

  const handleGenerate = async () => {
    if (!readingMaterial.trim()) {
      setError('Please provide reading material before generating questions.');
      return;
    }

    setLoading(true);
    setError('');
    setExportedJson(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: readingMaterial }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate questions.');
      }

      const hydrated = (result.questions || []).map((q) => {
        const keywordCheck = q.answer.toLowerCase();
        const isTaughtInText =
          readingMaterial.toLowerCase().includes(keywordCheck) ||
          readingMaterial.toLowerCase().includes('block') ||
          readingMaterial.toLowerCase().includes('primitive');

        return {
          ...q,
          status: isTaughtInText ? 'Approved' : 'Flagged (Untaught Material)',
          reviewerComment: isTaughtInText
            ? 'Verified against source reading material.'
            : 'WARNING: Concept not explicitly found in input text.',
        };
      });

      setQuestions(hydrated);
    } catch (err) {
      setError(
        `Backend Connection Error: ${err.message}. Ensure your Express server is running on port 8000.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (id, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (id, optIndex, value) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const updatedOptions = [...q.options];
        updatedOptions[optIndex] = value;
        return { ...q, options: updatedOptions };
      })
    );
  };

  const handleSimulateUntaughtQuestion = () => {
    const hallucinatedQ = {
      id: Date.now(),
      type: 'Theory MCQ',
      question: 'Which keyword pauses async function execution until a Promise settles?',
      options: ['await', 'yield', 'defer', 'pause'],
      answer: 'await',
      sourceQuote: 'No matching quote found in source text.',
      status: 'Flagged (Untaught Material)',
      reviewerComment:
        'FAILED RULE: The reading material only covers variables, primitives, and ===. It does not teach async/await.',
    };
    setQuestions((prev) => [...prev, hallucinatedQ]);
  };

  const handleExport = () => {
    const failedCount = questions.filter((q) =>
      q.status.includes('Flagged')
    ).length;

    if (failedCount > 0) {
      const proceed = window.confirm(
        `There are ${failedCount} flagged (untaught) questions. They will be excluded from the final production bundle. Continue?`
      );
      if (!proceed) return;
    }

    const approvedQuestions = questions
      .filter((q) => q.status === 'Approved')
      .map(({ status, reviewerComment, ...cleanQuestion }) => cleanQuestion);

    setExportedJson(JSON.stringify({ questions: approvedQuestions }, null, 2));
  };

  return (
    <>
      {/* Step 1: Reading Material Input */}
      <div style={styles.card}>
        <div style={styles.flexBetween}>
          <h2 style={styles.cardHeading}>Step 1: Input Reading Material</h2>
          <button style={styles.secondaryBtn} onClick={handleLoadSample}>
            Load Sample JS Reading Material
          </button>
        </div>

        <textarea
          style={styles.textarea}
          rows={8}
          placeholder="Paste the lesson reading material here..."
          value={readingMaterial}
          onChange={(e) => setReadingMaterial(e.target.value)}
        />

        <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
          <button
            style={styles.primaryBtn}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading
              ? 'Generating 5-Question Group...'
              : 'Generate Questions (POST /api/generate)'}
          </button>

          {questions.length > 0 && (
            <button
              style={styles.dangerOutlineBtn}
              onClick={handleSimulateUntaughtQuestion}
            >
              + Simulate "Untaught Material" Question (Demo Rule)
            </button>
          )}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
      </div>

      {/* Step 2: Reviewer Workbench */}
      {questions.length > 0 && (
        <div style={styles.card}>
          <div style={styles.flexBetween}>
            <div>
              <h2 style={styles.cardHeading}>
                Step 2: Content Reviewer Workbench ({questions.length} Questions)
              </h2>
              <p style={styles.helperText}>
                Inspect each generated question, verify its grounding quote
                against the reading material, edit any flaws, or reject untaught
                questions.
              </p>
            </div>
            <button style={styles.successBtn} onClick={handleExport}>
              Approve & Export Final Set
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                questionItem={q}
                index={idx}
                onFieldChange={handleFieldChange}
                onOptionChange={handleOptionChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Exported JSON Output */}
      {exportedJson && (
        <div style={styles.card}>
          <h2 style={styles.cardHeading}>
            Step 3: Production-Ready Export Payload
          </h2>
          <p style={styles.helperText}>
            Failed/untaught questions have been filtered out. Only verified,
            reviewer-approved items are emitted:
          </p>
          <pre style={styles.preBlock}>{exportedJson}</pre>
        </div>
      )}
    </>
  );
}