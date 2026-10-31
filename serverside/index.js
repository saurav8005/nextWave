const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const data = [
  {
    id: 1,
    type: "Theory MCQ",
    question: "What keyword is used to declare a block-scoped variable in JavaScript?",
    options: ["var", "let", "function", "define"],
    answer: "let",
    sourceQuote: "'let' allows you to declare variables that are limited to the scope of a block statement."
  },
  {
    id: 2,
    type: "Theory MCQ",
    question: "Which of the following is NOT a primitive data type in JavaScript?",
    options: ["String", "Number", "Object", "Boolean"],
    answer: "Object",
    sourceQuote: "JavaScript primitives include string, number, bigint, boolean, undefined, symbol, and null."
  },
  {
    id: 3,
    type: "True/False",
    question: "const prevents primitive values from being reassigned.",
    options: ["True", "False"],
    answer: "True",
    sourceQuote: "Variables declared with const cannot be reassigned through reassignment."
  },
  {
    id: 4,
    type: "True/False",
    question: "The '===' operator performs type coercion before comparison.",
    options: ["True", "False"],
    answer: "False",
    sourceQuote: "The strict equality operator (===) checks whether its two operands are equal without type conversion."
  },
  {
    id: 5,
    type: "Code Analysis",
    code: "let x = 5;\n{\n  let x = 10;\n}\nconsole.log(x);",
    question: "What will be printed to the console?",
    options: ["5", "10", "undefined", "ReferenceError"],
    answer: "5",
    sourceQuote: "Block scoping keeps inner declarations isolated from the outer block."
  }
];

app.get('/', (req, res) => {
  res.send('this is home page');
});
app.get('/api/generate', (req, res) => {
  res.json({ questions: data });
});
app.post('/api/generate', (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: "Please provide reading material." });
  }

  setTimeout(() => {
    res.json({ questions: data });
  }, 1000);
});

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});