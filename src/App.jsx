import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Edit3, CheckCircle, Loader2, Sparkles, AlertTriangle, Play, Pause, RotateCcw,
  Brain, PenTool, Layers, ArrowRight, ArrowLeft, Wand2, Download, Upload, Plus, Trash2, X, Save, Award, Clock, Settings, RefreshCw,
  ListChecks, Library, ChevronDown, ChevronUp, Tags, Gamepad2, CheckCircle2, XCircle, ShieldAlert, Columns, Lightbulb,
  PanelRightOpen, PanelRightClose, BarChart3, Wrench, Copy, TrendingDown, Target, Filter, Circle, Search, AlertCircle,
  FileText, MessageSquareDiff, MessageSquare, Send, BookMarked, Languages, FastForward, Highlighter, BookPlus
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
let app, auth, db, appId;
try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
} catch (e) {
  console.error("Firebase init error:", e);
}

const TOPICS = [
  { id: 'education', name: 'Education (Giáo dục)' },
  { id: 'environment', name: 'Environment (Môi trường)' },
  { id: 'technology', name: 'Technology (Công nghệ)' },
  { id: 'society', name: 'Society (Xã hội)' },
  { id: 'health', name: 'Health (Sức khỏe)' },
  { id: 'work', name: 'Work (Công việc)' },
  { id: 'crime', name: 'Crime (Tội phạm)' }
];

const SUBTOPICS = {
  education: [
    { id: 'edu_role', name: 'Vai trò của giáo dục' },
    { id: 'edu_method', name: 'Phương pháp & Môn học' },
    { id: 'edu_behavior', name: 'Hành vi & Kỷ luật' },
    { id: 'edu_policy', name: 'Chính sách & Chi phí' }
  ],
  environment: [
    { id: 'env_prob', name: 'Vấn đề môi trường (Ô nhiễm, ấm lên toàn cầu)' },
    { id: 'env_sol', name: 'Giải pháp bảo vệ môi trường' },
    { id: 'env_animal', name: 'Bảo vệ động vật & Tuyệt chủng' }
  ],
  technology: [
    { id: 'tech_impact', name: 'Tác động của công nghệ đến đời sống' },
    { id: 'tech_ai', name: 'Trí tuệ nhân tạo (AI) & Tự động hóa' },
    { id: 'tech_comm', name: 'Giao tiếp trực tuyến vs Trực tiếp' }
  ],
  society: [
    { id: 'soc_culture', name: 'Văn hóa & Toàn cầu hóa' },
    { id: 'soc_generation', name: 'Khoảng cách thế hệ' },
    { id: 'soc_housing', name: 'Nhà ở & Đô thị hóa' }
  ],
  health: [
    { id: 'health_diet', name: 'Chế độ ăn uống & Tập luyện' },
    { id: 'health_gov', name: 'Trách nhiệm của chính phủ với y tế' },
    { id: 'health_stress', name: 'Áp lực công việc & Sức khỏe tinh thần' }
  ],
  work: [
    { id: 'work_balance', name: 'Cân bằng công việc & Cuộc sống' },
    { id: 'work_remote', name: 'Làm việc từ xa' },
    { id: 'work_satisfaction', name: 'Sự hài lòng trong công việc vs Lương' }
  ],
  crime: [
    { id: 'crime_punishment', name: 'Hình phạt & Nhà tù' },
    { id: 'crime_juvenile', name: 'Tội phạm vị thành niên' },
    { id: 'crime_prevention', name: 'Phòng chống tội phạm' }
  ]
};

const SAMPLE_PROMPTS = {
  edu_role: "Some people believe that the main aim of university education is to help graduates find better jobs, while others think that university education has much wider benefits for individuals and society. Discuss both views and give your opinion.",
  env_prob: "Global warming is one of the most serious issues that the world is facing today. What are the causes of global warming and what measures can governments and individuals take to tackle the issue?",
  tech_ai: "Some people believe that artificial intelligence will eventually replace human workers in most industries. To what extent do you agree or disagree?",
  soc_culture: "The increase in international travel and business has led to a situation where people are adopting a single global culture. Do you think the advantages of this outweigh the disadvantages?",
  health_gov: "Some people say that it is the responsibility of individuals to take care of their own health and diet. Others think that governments should make sure that their citizens are healthy. Discuss both views and give your opinion."
};

// --- GEMINI API HELPERS ---
const apiKey = ""; 
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

async function fetchWithRetry(url, options, retries = 5) {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
}

const parseGeminiResponse = (text) => {
  try {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", text);
    throw e;
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('practice'); 
  
  // Practice State
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [prompt, setPrompt] = useState('');
  const [essay, setEssay] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  
  // --- GUIDED MODE STATES ---
  const [guidedStep, setGuidedStep] = useState(0); 
  const [isGeneratingGuidedData, setIsGeneratingGuidedData] = useState(false);
  const [guidedData, setGuidedData] = useState(null);
  
  const [guidedGameAnswers, setGuidedGameAnswers] = useState({});
  const [guidedGameResults, setGuidedGameResults] = useState({});
  const [guidedGamePassed, setGuidedGamePassed] = useState(false);
  const [guidedGameError, setGuidedGameError] = useState(''); 
  
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState(null);
  const [translationAttempts, setTranslationAttempts] = useState({});
  const [translationEvals, setTranslationEvals] = useState({});
  const [isEvaluatingTranslation, setIsEvaluatingTranslation] = useState({});

  // Sidebars State (Pro Mode)
  const [showSampleSidebar, setShowSampleSidebar] = useState(false);
  const [showVocabSidebar, setShowVocabSidebar] = useState(false);
  const [showGuidedRefSidebar, setShowGuidedRefSidebar] = useState(false);
  // Modal cho cấu trúc 40/60
  const [showStructureModal, setShowStructureModal] = useState(false);

  const editorRef = useRef(null);
  const promptRef = useRef(null);
  
  // Timer State
  const [timeRemaining, setTimeRemaining] = useState(40 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluationsHistory, setEvaluationsHistory] = useState([]);
  const [evalTab, setEvalTab] = useState('scores'); 
  
  // Interactive Correction State
  const [activeCommentIndex, setActiveCommentIndex] = useState(null);
  const [correctionAttempts, setCorrectionAttempts] = useState({});
  const commentRefs = useRef({});

  // Data State (Cloud)
  const [sampleEssays, setSampleEssays] = useState([]);
  const [vocabularies, setVocabularies] = useState([]);
  
  // Modals & UI States
  const [showParaphraseModal, setShowParaphraseModal] = useState(false);
  const [paraphraseInput, setParaphraseInput] = useState('');
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [paraphraseResult, setParaphraseResult] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDataString, setImportDataString] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [expandedSampleId, setExpandedSampleId] = useState(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [isSavingSample, setIsSavingSample] = useState(false);
  const [editingSample, setEditingSample] = useState(null);
  const [mindMapData, setMindMapData] = useState(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [suggestedPromptVocabs, setSuggestedPromptVocabs] = useState([]);
  const [isGeneratingPromptVocabs, setIsGeneratingPromptVocabs] = useState(false);
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [newVocab, setNewVocab] = useState({ topic: '', subtopic: '', phrase: '', translation: '', example1: '', example2: '' });
  const [isCleaningVocab, setIsCleaningVocab] = useState(false);

  // --- UI NOTIFICATIONS & ALERTS ---
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3000);
  };

  // --- TEXT SELECTION (HIGHLIGHT) ---
  const [selectionPopup, setSelectionPopup] = useState({ show: false, text: '', x: 0, y: 0 });
  const [isAutoVocab, setIsAutoVocab] = useState(true);
  const [isGeneratingVocabDetails, setIsGeneratingVocabDetails] = useState(false);

  // Filters & Quiz State
  const [vocabFilterTopic, setVocabFilterTopic] = useState('');
  const [vocabFilterSubtopic, setVocabFilterSubtopic] = useState('');
  const [sampleFilterTopic, setSampleFilterTopic] = useState('');
  const [sampleFilterSubtopic, setSampleFilterSubtopic] = useState('');
  const [sampleSearchQuery, setSampleSearchQuery] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [quizSubtopic, setQuizSubtopic] = useState('');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [showHints, setShowHints] = useState({}); 
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [newSample, setNewSample] = useState({ topic: '', subtopic: '', prompt: '', content: '', bandScore: 8.0 });

  // --- FIREBASE AUTHENTICATION & SYNC ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth init failed:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db || !appId) return;
    const samplesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sample_essays');
    const unsubscribeSamples = onSnapshot(samplesRef, (snapshot) => {
      const samplesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      samplesData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setSampleEssays(samplesData);
    });
    const vocabRef = collection(db, 'artifacts', appId, 'users', user.uid, 'vocabulary');
    const unsubscribeVocab = onSnapshot(vocabRef, (snapshot) => {
      const vocabData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      vocabData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setVocabularies(vocabData);
    });
    const evalsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'evaluations');
    const unsubscribeEvals = onSnapshot(evalsRef, (snapshot) => {
      const evalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      evalsData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setEvaluationsHistory(evalsData);
    });
    return () => { unsubscribeSamples(); unsubscribeVocab(); unsubscribeEvals(); };
  }, [user]);

  useEffect(() => { setWordCount(essay.trim().split(/\s+/).filter(word => word.length > 0).length); }, [essay]);
  useEffect(() => { if (promptRef.current) { promptRef.current.style.height = 'auto'; promptRef.current.style.height = `${promptRef.current.scrollHeight}px`; } }, [prompt]);
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) timerRef.current = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
    else if (timeRemaining === 0) { setIsTimerRunning(false); clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, timeRemaining]);

  // --- TEXT SELECTION (HIGHLIGHT) LISTENER ---
  useEffect(() => {
    const handleMouseUp = (e) => {
      if (e.target.closest('#quick-save-vocab-btn')) return;

      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text && text.length > 0 && text.length < 60 && text.split(' ').length <= 6) {
          setSelectionPopup({ show: true, text: text, x: e.clientX, y: e.clientY - 50 });
        } else {
          setSelectionPopup(prev => ({ ...prev, show: false }));
        }
      }, 50);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleOpenQuickSaveVocab = () => {
    setNewVocab({ topic: '', subtopic: '', phrase: selectionPopup.text, translation: '', example1: '', example2: '' });
    setIsAutoVocab(true); 
    setShowVocabModal(true);
    setSelectionPopup({ ...selectionPopup, show: false }); 
    window.getSelection().removeAllRanges(); 
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const normalizeString = (str) => str ? str.trim().replace(/\s+/g, ' ').toLowerCase() : "";
  const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const clean1 = str1.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(Boolean);
    const clean2 = str2.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(Boolean);
    if (clean1.length === 0 || clean2.length === 0) return 0;
    const intersection = clean1.filter(word => clean2.includes(word));
    const union = new Set([...clean1, ...clean2]);
    return (intersection.length / union.size) * 100;
  };
  const matchedSample = prompt.trim() ? sampleEssays.find(s => normalizeString(s.prompt || s.title) === normalizeString(prompt)) : null;

  const handleGeneratePrompt = () => {
    let filteredSamples = sampleEssays;
    if (selectedTopic) filteredSamples = filteredSamples.filter(s => s.topic === selectedTopic);
    if (selectedSubtopic) filteredSamples = filteredSamples.filter(s => s.subtopic === selectedSubtopic);

    if (filteredSamples.length > 0) {
      const randomSample = filteredSamples[Math.floor(Math.random() * filteredSamples.length)];
      setPrompt(randomSample.prompt || randomSample.title || '');
    } else {
      showToast("Chưa có bài mẫu nào trong Kho. Lấy đề mặc định.", "info");
      setPrompt(selectedSubtopic && SAMPLE_PROMPTS[selectedSubtopic] ? SAMPLE_PROMPTS[selectedSubtopic] : "Some people think that technology is driving people apart, while others believe it is bringing people closer together. Discuss both views and give your opinion.");
    }
    setEssay(''); setTimeRemaining(40 * 60); setIsTimerRunning(false); setEvaluationResult(null);
    setGuidedData(null); setGuidedStep(0); 
    closeAllSidebars();
  };

  const closeAllSidebars = () => {
    setShowSampleSidebar(false); setShowVocabSidebar(false); setShowGuidedRefSidebar(false);
  };

  // --- GUIDED MODE LOGIC ---
  const handleStartGuidedMode = async () => {
    if (!prompt.trim()) return showToast("Vui lòng Tạo Đề Bài hoặc nhập đề trước.", "error");
    
    setIsGeneratingGuidedData(true);
    setGuidedGameAnswers({});
    setGuidedGameResults({});
    setGuidedGamePassed(false);
    setGuidedGameError(''); 
    setSelectedIdeaIndex(null);
    setTranslationAttempts({});
    setTranslationEvals({});
    setIsEvaluatingTranslation({});

    const systemInstruction = `You are an expert IELTS tutor creating a guided lesson for a beginner-to-intermediate student (5.0 - 6.0) based on this prompt: "${prompt}".
    CRITICAL RULES:
    1. 'highlightWords' must have EXACTLY 5 advanced IELTS words from the passage.
    2. 'exercises' must have EXACTLY 2 items of DIFFERENT types (e.g., 'matching' and 'true_false'), each with 3-4 questions.
    3. 'outlines' must follow the 40/60 EGOSFI structure (Body 1: 40%, Body 2: 60%). Each outline must have exactly 5 sentences.
    4. The 'readingPassage' MUST be a journalistic feature article (strictly between 350 and 450 words), accessible to intermediate learners (B1/B2), MUST include SUBHEADINGS, and MUST NOT sound like an IELTS essay.`;

    try {
      const result = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Generate the guided lesson JSON based on the system instructions." }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                readingPassage: { type: "STRING", description: "The 350-450 word feature article." },
                highlightWords: { type: "ARRAY", items: { type: "STRING" } },
                exercises: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      type: { type: "STRING" },
                      instruction: { type: "STRING" },
                      items: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            question: { type: "STRING" },
                            answer: { type: "STRING" }
                          },
                          required: ["question", "answer"]
                        }
                      }
                    },
                    required: ["type", "instruction", "items"]
                  }
                },
                outlines: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      sentences: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            vn: { type: "STRING" },
                            keywords: { type: "STRING" },
                            en: { type: "STRING" }
                          },
                          required: ["vn", "keywords", "en"]
                        }
                      }
                    },
                    required: ["title", "sentences"]
                  }
                }
              },
              required: ["readingPassage", "highlightWords", "exercises", "outlines"]
            }
          }
        })
      });
      
      let rawText = result.candidates[0].content.parts[0].text;
      const data = parseGeminiResponse(rawText);
      
      setGuidedData(data);
      setGuidedStep(1); 
      
    } catch (error) {
      console.error("Lỗi Parsing hoặc API:", error);
      showToast("Lỗi kết nối. Vui lòng bấm thử lại (AI bị quá tải hoặc phản hồi bị lỗi).", "error");
    } finally {
      setIsGeneratingGuidedData(false);
    }
  };

  const handleExerciseAnswerChange = (exIndex, itemIndex, value) => {
    setGuidedGameAnswers(prev => ({
      ...prev,
      [exIndex]: {
        ...(prev[exIndex] || {}),
        [itemIndex]: value
      }
    }));
  };

  const handleCheckGuidedGame = () => {
    let allCorrect = true;
    const newResults = {};
    setGuidedGameError(''); 
    
    guidedData.exercises.forEach((ex, exIndex) => {
      newResults[exIndex] = {};
      ex.items.forEach((item, itemIndex) => {
        const userAnswer = (guidedGameAnswers[exIndex]?.[itemIndex] || '').toLowerCase().trim();
        const correctAnswer = item.answer.toLowerCase().trim();
        
        let isCorrect = false;
        if (ex.type === 'true_false') {
          isCorrect = userAnswer === correctAnswer;
        } else {
          const cleanUser = userAnswer.replace(/[^\w\s]/g, '');
          const cleanTarget = correctAnswer.replace(/[^\w\s]/g, '');
          isCorrect = cleanUser && (cleanUser === cleanTarget || cleanTarget.includes(cleanUser));
        }

        newResults[exIndex][itemIndex] = isCorrect;
        if (!isCorrect) allCorrect = false;
      });
    });

    setGuidedGameResults(newResults);

    if (allCorrect) {
      setGuidedGamePassed(true);
    } else {
      setGuidedGameError("Có một vài câu trả lời chưa chính xác. Hệ thống đã hiển thị đáp án chuẩn (💡) bên dưới để bạn tham khảo nhé!");
    }
  };

  const handleEvaluateTranslation = async (ideaIdx, sIdx) => {
    const userText = translationAttempts[`${ideaIdx}-${sIdx}`];
    if (!userText || !userText.trim()) return showToast("Vui lòng dịch câu trước khi kiểm tra.", "error");

    const sentenceData = guidedData.outlines[ideaIdx].sentences[sIdx];
    
    setIsEvaluatingTranslation(prev => ({...prev, [`${ideaIdx}-${sIdx}`]: true}));

    const systemInstruction = `You are an expert IELTS writing tutor. 
    The student translated this Vietnamese sentence: "${sentenceData.vn}"
    The expected/golden translation is: "${sentenceData.en}"
    The student's translation is: "${userText}"

    Task: Evaluate the student's translation. 
    Return a strictly formatted JSON object with this exact structure:
    {
      "isGood": boolean (true if it's grammatically correct and clearly conveys the main idea, false if it has major errors),
      "feedback": "Short encouraging feedback in Vietnamese, pointing out grammar/vocab errors if any. Suggest how to fix them.",
      "paraphrase": "A band 7.5+ paraphrase of the sentence (academic but clear)"
    }`;

    try {
      const result = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Evaluate translation and generate JSON." }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const evalData = parseGeminiResponse(result.candidates[0].content.parts[0].text);
      setTranslationEvals(prev => ({...prev, [`${ideaIdx}-${sIdx}`]: evalData}));
    } catch(e) {
      showToast("Lỗi khi kiểm tra câu dịch. Vui lòng thử lại.", "error");
    } finally {
      setIsEvaluatingTranslation(prev => ({...prev, [`${ideaIdx}-${sIdx}`]: false}));
    }
  };

  const jumpToProMode = () => {
    setIsGuidedMode(false);
    if (guidedData) {
      setShowGuidedRefSidebar(true);
      setShowSampleSidebar(false); setShowVocabSidebar(false);
    }
  };

  const checkVocabUsage = (basePhrase, essayText) => {
    if(!essayText) return false;
    const text = essayText.toLowerCase();
    const phrase = basePhrase.toLowerCase().trim();
    if(text.includes(phrase)) return true;
    const words = phrase.split(' ');
    if (words.length > 0) {
       const firstWord = words[0]; const lastWord = words[words.length - 1];
       const restAfterFirst = words.slice(1).join(' '); const restBeforeLast = words.slice(0, -1).join(' ');
       const stemFirst = firstWord.endsWith('e') ? firstWord.slice(0, -1) : firstWord;
       const stemLastY = lastWord.endsWith('y') ? lastWord.slice(0, -1) + 'ies' : lastWord;
       const variations = [
          `${firstWord}s ${restAfterFirst}`.trim(), `${firstWord}es ${restAfterFirst}`.trim(),
          `${firstWord}d ${restAfterFirst}`.trim(), `${firstWord}ed ${restAfterFirst}`.trim(),
          `${stemFirst}ed ${restAfterFirst}`.trim(), `${stemFirst}ing ${restAfterFirst}`.trim(),
          `${firstWord}ing ${restAfterFirst}`.trim(), `${restBeforeLast} ${lastWord}s`.trim(),
          `${restBeforeLast} ${lastWord}es`.trim(), `${restBeforeLast} ${stemLastY}`.trim()
       ];
       return variations.some(v => text.includes(v));
    }
    return false;
  };

  const handleSuggestPromptVocab = async () => { 
    if (!prompt.trim()) return showToast("Vui lòng nhập đề bài trước.", "error");
    closeAllSidebars(); setShowVocabSidebar(true);
    if (suggestedPromptVocabs.length > 0) return; 
    setIsGeneratingPromptVocabs(true);
    const userVocabString = vocabularies.length > 0 ? vocabularies.map(v => `- ${v.phrase} (${v.translation})`).join('\n') : "Kho từ vựng trống.";
    const systemInstruction = `You are an expert IELTS teacher. Analyze the given Task 2 prompt and suggest exactly 10 highly academic, topic-specific vocabulary phrases, idioms, or collocations that would boost the Lexical Resource score to Band 8.0+.
    CRITICAL RULES FOR VOCABULARY SELECTION:
    1. USER'S BANK PRIORITY: Here is the user's personal vocabulary bank:\n${userVocabString}
    2. MIXING RATIO: You MUST prioritize selecting EXACTLY 7 phrases from the user's bank provided above that are relevant to the prompt. If the bank has fewer than 7 words or lacks relevant words, pick as many suitable ones as possible.
    3. NEW ADDITIONS: Generate EXACTLY 3 NEW highly academic phrases (or more to make exactly 10 if the bank fell short) that are NOT in the user's bank.
    4. BASE FORM ONLY: Provide the phrases strictly in their BASE/INFINITIVE form.`;
    try {
      const result = await fetchWithRetry(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Prompt: ${prompt}` }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "OBJECT", properties: { phrase: { type: "STRING" }, meaning: { type: "STRING" }, source: { type: "STRING" } }, required: ["phrase", "meaning", "source"] } } }
        })
      });
      setSuggestedPromptVocabs(parseGeminiResponse(result.candidates[0].content.parts[0].text));
    } catch (error) { showToast("Lỗi kết nối AI.", "error"); setShowVocabSidebar(false); } finally { setIsGeneratingPromptVocabs(false); }
  };

  const handleOpenParaphraseFromSelection = () => { 
    if (!editorRef.current) return;
    const selectedText = essay.substring(editorRef.current.selectionStart, editorRef.current.selectionEnd);
    if (!selectedText || selectedText.trim().length < 5) return showToast("Vui lòng bôi đen một câu trong bài viết.", "error");
    setParaphraseInput(selectedText.trim()); setParaphraseResult(null); setShowParaphraseModal(true);
  };

  const handleParaphrase = async () => { 
    if (!paraphraseInput.trim()) return;
    setIsParaphrasing(true); setParaphraseResult(null);
    const systemPrompt = `Bạn là chuyên gia luyện thi IELTS. Viết lại (paraphrase) câu sau theo 2 phong cách (Band 6.5+ và Band 7.5+). Câu gốc: "${paraphraseInput}"`;
    try {
      const result = await fetchWithRetry(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { band65: { type: "OBJECT", properties: { text: { type: "STRING" }, reason: { type: "STRING" } } }, band75: { type: "OBJECT", properties: { text: { type: "STRING" }, reason: { type: "STRING" } } } }, required: ["band65", "band75"] } }
        })
      });
      setParaphraseResult(parseGeminiResponse(result.candidates[0].content.parts[0].text));
    } catch (error) { showToast("Lỗi AI.", "error"); } finally { setIsParaphrasing(false); }
  };

  const handleEvaluate = async () => { 
    if (wordCount < 100) return showToast("Vui lòng viết ít nhất 100 từ.", "error");
    setIsEvaluating(true); setIsTimerRunning(false); setEvalTab('scores'); setActiveCommentIndex(null); setCorrectionAttempts({});
    let samplesContext = sampleEssays.length > 0 ? "\n\n--- REFERENCE SAMPLES ---\n" + sampleEssays.map((s, idx) => `[Sample ${idx + 1}]\n${s.content}`).join('\n') : "";
    const systemInstruction = `You are a strict but dedicated IELTS examiner grading Task 2. Analyze the essay strictly based on the official IELTS Writing Task 2 Band Descriptors (Updated May 2023).
You must provide: 1. SCORING & FEEDBACK. 2. SENTENCE-BY-SENTENCE CORRECTIONS (CRITICAL RULE: 'original' MUST BE EXACT MATCH). 3. POLISHED ESSAY (Strictly 4 paragraphs, BALANCE 40/60 STRUCTURE, natural style like Simon/Kien Luyen). ${samplesContext}`;
    try {
      const result = await fetchWithRetry(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Prompt: ${prompt}\nEssay: ${essay}` }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { overallBand: { type: "NUMBER" }, trScore: { type: "NUMBER" }, trFeedback: { type: "STRING" }, ccScore: { type: "NUMBER" }, ccFeedback: { type: "STRING" }, lrScore: { type: "NUMBER" }, lrFeedback: { type: "STRING" }, graScore: { type: "NUMBER" }, graFeedback: { type: "STRING" }, strengths: { type: "ARRAY", items: { type: "STRING" } }, weaknesses: { type: "ARRAY", items: { type: "STRING" } }, detailedCorrections: { type: "ARRAY", items: { type: "OBJECT", properties: { original: { type: "STRING" }, hint: { type: "STRING" }, corrected: { type: "STRING" }, explanation: { type: "STRING" } }, required: ["original", "hint", "corrected", "explanation"] } }, polishedEssay: { type: "STRING" } }, required: ["overallBand", "trScore", "trFeedback", "ccScore", "ccFeedback", "lrScore", "lrFeedback", "graScore", "graFeedback", "strengths", "weaknesses", "detailedCorrections", "polishedEssay"] } }
        })
      });
      const evaluation = parseGeminiResponse(result.candidates[0].content.parts[0].text);
      setEvaluationResult(evaluation);
      if (user && db && appId) await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'evaluations'), { prompt, wordCount, overallBand: evaluation.overallBand, trScore: evaluation.trScore, ccScore: evaluation.ccScore, lrScore: evaluation.lrScore, graScore: evaluation.graScore, createdAt: new Date().toISOString() });
    } catch (error) { showToast("Lỗi chấm điểm.", "error"); } finally { setIsEvaluating(false); }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); showToast("Đã copy!", "success"); };
  const handleCommentHover = (idx) => setActiveCommentIndex(idx);
  const scrollToComment = (idx) => { setActiveCommentIndex(idx); if (commentRefs.current[idx]) commentRefs.current[idx].scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const normalizeForCheck = (str) => str.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");
  const handleSubmitCorrection = (idx) => setCorrectionAttempts(prev => ({ ...prev, [idx]: { ...prev[idx], submitted: true } }));

  const renderHighlightedEssay = () => { 
    if (!evaluationResult?.detailedCorrections?.length) return <div className="whitespace-pre-wrap">{essay}</div>;
    const textLower = essay.toLowerCase();
    const correctionsWithIndex = evaluationResult.detailedCorrections.map((c, i) => ({ ...c, originalIndex: i, pos: textLower.indexOf(c.original.toLowerCase()), length: c.original.length })).filter(c => c.pos !== -1).sort((a, b) => a.pos - b.pos);
    if (!correctionsWithIndex.length) return <div className="whitespace-pre-wrap">{essay}</div>; 
    let elements = [], lastIndex = 0;
    correctionsWithIndex.forEach((c) => {
      if (c.pos >= lastIndex) {
        elements.push(<span key={`text-${lastIndex}`}>{essay.substring(lastIndex, c.pos)}</span>);
        const attempt = correctionAttempts[c.originalIndex];
        let highlightColor = 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-b-2 border-rose-300';
        if (attempt?.submitted) {
           const isCorrect = normalizeForCheck(attempt.text || '') === normalizeForCheck(c.corrected);
           highlightColor = isCorrect ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-b-2 border-emerald-300' : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-b-2 border-amber-300';
        }
        elements.push(
          <mark key={`mark-${c.originalIndex}`} className={`cursor-pointer transition-all duration-300 rounded px-1 py-0.5 relative group ${activeCommentIndex === c.originalIndex ? 'bg-white border-2 border-indigo-400 shadow-md z-10' : ''} ${highlightColor}`} onMouseEnter={() => handleCommentHover(c.originalIndex)} onMouseLeave={() => handleCommentHover(null)} onClick={() => scrollToComment(c.originalIndex)}>
            {essay.substring(c.pos, c.pos + c.length)}
            {activeCommentIndex !== c.originalIndex && <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none z-50">Click để xem lỗi</div>}
          </mark>
        );
        lastIndex = c.pos + c.length;
      }
    });
    elements.push(<span key={`text-${lastIndex}`}>{essay.substring(lastIndex)}</span>);
    return <div className="whitespace-pre-wrap leading-relaxed">{elements}</div>;
  };

  const handleSaveSample = async () => {
    if (!newSample.topic || !newSample.prompt.trim() || !newSample.content.trim()) return showToast("Vui lòng nhập đủ thông tin bắt buộc!", "error");
    setIsSavingSample(true);
    try {
      if (user && db && appId) {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sample_essays'), {
          ...newSample,
          createdAt: new Date().toISOString()
        });
        showToast("Đã lưu bài mẫu thành công!", "success");
        setShowSampleModal(false);
        setNewSample({ topic: '', subtopic: '', prompt: '', content: '', bandScore: 8.0 });
      } else {
        showToast("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi khi lưu bài mẫu.", "error");
    } finally {
      setIsSavingSample(false);
    }
  };

  const handleSaveCustomVocab = async () => {
    if (!newVocab.topic || !newVocab.phrase.trim()) return showToast("Vui lòng chọn chủ đề và nhập từ vựng!", "error");
    if (isAutoVocab) {
      setIsGeneratingVocabDetails(true);
      const systemInstruction = `You are an expert IELTS Lexical Resource tutor.
      Analyze the English phrase/word: "${newVocab.phrase}".
      Return a strictly formatted JSON object with:
      - "basePhrase": The clean, base/infinitive form of the phrase.
      - "translation": A precise Vietnamese meaning suitable for academic context.
      - "example1": A high-quality IELTS Band 8.0 example sentence using this phrase.
      - "example2": Another different high-quality IELTS context example sentence.`;
      
      try {
        const result = await fetchWithRetry(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Generate vocabulary details." }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { basePhrase: { type: "STRING" }, translation: { type: "STRING" }, example1: { type: "STRING" }, example2: { type: "STRING" } }, required: ["basePhrase", "translation", "example1", "example2"] } }
          })
        });
        const aiData = parseGeminiResponse(result.candidates[0].content.parts[0].text);
        if (user && db && appId) {
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'vocabulary'), {
            topicId: newVocab.topic, subtopicId: newVocab.subtopic, phrase: aiData.basePhrase || newVocab.phrase, translation: aiData.translation, examples: [aiData.example1, aiData.example2], createdAt: new Date().toISOString()
          });
          showToast("Đã lưu từ vựng thành công!", "success");
          setShowVocabModal(false);
          setNewVocab({ topic: '', subtopic: '', phrase: '', translation: '', example1: '', example2: '' });
        }
      } catch (error) { showToast("Lỗi khi AI tạo nghĩa. Vui lòng thử lại hoặc nhập tay.", "error"); } finally { setIsGeneratingVocabDetails(false); }
    } else {
      if (!newVocab.translation.trim()) return showToast("Vui lòng nhập nghĩa Tiếng Việt!", "error");
      try {
        if (user && db && appId) {
          const examples = [];
          if (newVocab.example1.trim()) examples.push(newVocab.example1);
          if (newVocab.example2.trim()) examples.push(newVocab.example2);
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'vocabulary'), {
            topicId: newVocab.topic, subtopicId: newVocab.subtopic, phrase: newVocab.phrase, translation: newVocab.translation, examples: examples, createdAt: new Date().toISOString()
          });
          showToast("Đã lưu từ vựng thành công!", "success");
          setShowVocabModal(false);
          setNewVocab({ topic: '', subtopic: '', phrase: '', translation: '', example1: '', example2: '' });
        }
      } catch (error) { showToast("Lỗi khi lưu từ vựng.", "error"); }
    }
  };

  const handleCleanVocabBaseForm = async () => { showToast("Tính năng Chuẩn hóa từ gốc đang được bảo trì trong phiên bản này.", "info"); };

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true); setQuizSubmitted(false); setUserAnswers({}); setShowHints({}); setQuizScore(0);
    let pool = vocabularies.filter(v => v.topicId === quizTopic);
    if (quizSubtopic) pool = pool.filter(v => v.subtopicId === quizSubtopic);
    const vocabListString = pool.length > 0 ? pool.map(v => `${v.phrase} (${v.translation})`).join(', ') : "Sử dụng từ vựng IELTS học thuật chung (vì kho của người dùng đang trống)";
    const systemInstruction = `You are an IELTS teacher creating a Fill-in-the-blank quiz. Based on this vocabulary pool: [${vocabListString}] Generate EXACTLY 10 questions. Return JSON format: { "questions": [ { "question": "Sentence with a _____ (blank)", "correctAnswer": "The exact word/phrase", "hint": "A short English hint", "explanation": "Why this word fits in Vietnamese" } ] }`;
    try {
      const result = await fetchWithRetry(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Create 10 quiz questions." }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      const data = parseGeminiResponse(result.candidates[0].content.parts[0].text);
      setQuizQuestions(data.questions || []);
    } catch (e) { showToast("Lỗi tạo bài tập. Vui lòng thử lại.", "error"); } finally { setIsGeneratingQuiz(false); }
  };

  const handleQuizSubmit = () => {
    let score = 0;
    quizQuestions.forEach((q, i) => {
      const userAns = (userAnswers[i] || '').trim().toLowerCase();
      const correctAns = q.correctAnswer.trim().toLowerCase();
      if (userAns === correctAns) score++;
    });
    setQuizScore(score); setQuizSubmitted(true);
  };

  const triggerDelete = (colName, id) => setDeleteConfirm({ colName, id });

  const confirmDeleteAction = async () => {
    if (!deleteConfirm) return;
    try {
      if (user && db && appId) {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, deleteConfirm.colName, deleteConfirm.id));
        showToast("Đã xóa thành công!", "success");
      }
    } catch (e) { showToast("Lỗi khi xóa tài liệu.", "error"); } finally { setDeleteConfirm(null); }
  };

  const handleUpdateSample = async () => {
    if (!editingSample.topic || !editingSample.prompt.trim() || !editingSample.content.trim()) return showToast("Vui lòng nhập đủ thông tin bắt buộc!", "error");
    try {
      if (user && db && appId) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sample_essays', editingSample.id), {
          topic: editingSample.topic, subtopic: editingSample.subtopic, prompt: editingSample.prompt, content: editingSample.content, updatedAt: new Date().toISOString()
        });
        showToast("Cập nhật bài mẫu thành công!", "success");
        setEditingSample(null);
      }
    } catch (error) { showToast("Lỗi khi cập nhật bài mẫu.", "error"); }
  };

  const handleSuggestIdeas = async () => {
    if (!prompt.trim()) return showToast("Vui lòng nhập đề bài trước khi tạo Mind Map.", "error");
    setShowIdeasModal(true);
    if (mindMapData) return;
    setIsGeneratingIdeas(true);
    const systemInstruction = `You are an expert IELTS tutor. Analyze this prompt: "${prompt}". Generate a mind map using the EGOSFI method (Economy, Government/Global, Opportunity/Outcome, Society/Safety, Family/Friends, Individual). Return strict JSON: { "centralIdea": "Core topic in Vietnamese (2-3 words)", "body1": { "title": "Main argument for Body 1 (Vietnamese)", "vocab": ["3-4 academic English phrases"], "ideas": [ { "category": "One of EGOSFI", "subCategory": "Specific aspect", "content": "The main point (Vietnamese)", "support": "Explanation/Example (Vietnamese)" } ] }, "body2": { "title": "...", "vocab": ["..."], "ideas": [ ... ] } }`;
    try {
      const result = await fetchWithRetry(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Generate EGOSFI mind map." }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      setMindMapData(parseGeminiResponse(result.candidates[0].content.parts[0].text));
    } catch (error) { showToast("Lỗi tạo sơ đồ tư duy.", "error"); setShowIdeasModal(false); } finally { setIsGeneratingIdeas(false); }
  };

  const handleExportBackup = () => {
    const backupData = { sampleEssays, vocabularies, evaluationsHistory, exportDate: new Date().toISOString() };
    try {
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.href = url;
      downloadAnchorNode.download = `ielts_coach_backup_${new Date().getTime()}.json`;
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      document.body.removeChild(downloadAnchorNode);
      URL.revokeObjectURL(url);
      showToast("Đã tải file sao lưu về máy!", "success");
    } catch (error) { showToast("Không thể tải file. Trình duyệt có thể đang chặn tải xuống.", "error"); }
  };

  const processImportBackup = async () => {
    if (!importDataString.trim()) return;
    setIsImporting(true);
    try {
      let data = JSON.parse(importDataString);
      if (typeof data === 'string') data = JSON.parse(data);
      if (!user || !db || !appId) throw new Error("Chưa kết nối CSDL");
      let importCount = 0;
      const importCol = async (items, colName) => {
        if (items && Array.isArray(items)) {
          for (const item of items) {
            const { id, ...itemData } = item;
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, colName), { ...itemData, importedAt: new Date().toISOString() });
            importCount++;
          }
        }
      };
      const samplesToImport = data.sampleEssays || data.sample_essays || data.samples || [];
      const vocabToImport = data.vocabularies || data.vocabulary || data.vocab || [];
      const evalsToImport = data.evaluationsHistory || data.evaluations || [];
      if (samplesToImport.length > 0) await importCol(samplesToImport, 'sample_essays');
      if (vocabToImport.length > 0) await importCol(vocabToImport, 'vocabulary');
      if (evalsToImport.length > 0) await importCol(evalsToImport, 'evaluations');
      if (importCount === 0) { showToast("File hợp lệ nhưng hệ thống không tìm thấy dữ liệu nào để khôi phục (0 dòng).", "info"); } else {
        showToast(`Phục hồi thành công! Đã nhập ${importCount} dòng dữ liệu.`, "success"); setShowImportModal(false); setImportDataString('');
      }
    } catch (error) { showToast("Lỗi: Dữ liệu JSON không hợp lệ. Vui lòng copy đúng nội dung file.", "error"); } finally { setIsImporting(false); }
  };

  const getEgosfiColor = (cat = '') => {
    const c = cat.toLowerCase();
    if (c.includes('economy')) return 'bg-amber-100 text-amber-700 border-amber-300';
    if (c.includes('gov') || c.includes('global')) return 'bg-rose-100 text-rose-700 border-rose-300';
    if (c.includes('opportunity') || c.includes('outcome')) return 'bg-purple-100 text-purple-700 border-purple-300';
    if (c.includes('society') || c.includes('safety')) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (c.includes('family') || c.includes('friend')) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (c.includes('individual')) return 'bg-indigo-100 text-indigo-700 border-indigo-300';
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const renderTopNav = () => (
    <div className="w-full bg-slate-900 text-slate-300 flex flex-wrap lg:flex-nowrap items-center justify-between px-4 py-2 shrink-0 shadow-md z-20 relative gap-2">
      <div className="flex items-center gap-3 shrink-0">
        <div className="bg-emerald-500 p-1.5 rounded-lg text-white"><PenTool size={18} /></div>
        <div className="flex flex-col">
          <h1 className="text-white font-bold text-base leading-tight">Max Academy</h1>
          <p className="text-[10px] text-emerald-400 font-medium leading-tight">Pro Edition</p>
        </div>
      </div>
      <nav className="w-full lg:w-auto flex-1 lg:px-6 mt-1 lg:mt-0 order-3 lg:order-2">
        <ul className="flex flex-wrap items-center justify-start lg:justify-center gap-1.5">
          {[{ id: 'practice', icon: <Edit3 size={16} />, label: 'Luyện viết' }, { id: 'samples', icon: <Library size={16} />, label: 'Kho Bài Mẫu' }, { id: 'vocab', icon: <Tags size={16} />, label: 'Kho Từ Vựng' }, { id: 'quiz', icon: <Gamepad2 size={16} />, label: 'Ôn Từ Vựng' }, { id: 'tracker', icon: <BarChart3 size={16} />, label: 'Thống Kê' }].map(tab => (
            <li key={tab.id}><button onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-700 hover:text-white'}`}>{tab.icon}<span className="font-medium whitespace-nowrap">{tab.label}</span></button></li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center shrink-0 order-2 lg:order-3 gap-2">
        <button onClick={() => setActiveTab('backup')} className={`bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-rose-500/30 ${activeTab === 'backup' ? 'ring-2 ring-white/50' : ''}`}><AlertTriangle size={16} /><span>BACKUP</span></button>
      </div>
    </div>
  );

  const renderPracticeTab = () => (
    <div className="flex flex-col h-full mx-auto p-2 lg:p-3 gap-2 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 shrink-0 flex items-center justify-between gap-3 z-10 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <select className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-medium w-[120px] sm:w-[150px] truncate" value={selectedTopic} onChange={(e) => {setSelectedTopic(e.target.value); setSelectedSubtopic('');}}>
            <option value="">-- Chủ đề --</option>
            {TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-xs font-medium w-[120px] sm:w-[160px] truncate" value={selectedSubtopic} onChange={(e) => setSelectedSubtopic(e.target.value)} disabled={!selectedTopic}>
            <option value="">-- Chủ đề phụ --</option>
            {selectedTopic && SUBTOPICS[selectedTopic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={handleGeneratePrompt} className="flex items-center justify-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-md font-bold text-xs transition-colors shrink-0 whitespace-nowrap shadow-sm">
            <RotateCcw size={12} /> <span className="hidden sm:inline">Tạo Đề</span>
          </button>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200 shrink-0 ml-auto">
          <button onClick={() => setIsGuidedMode(false)} className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all whitespace-nowrap ${!isGuidedMode ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
            <PenTool size={12}/> Thực chiến
          </button>
          <button onClick={() => setIsGuidedMode(true)} className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all whitespace-nowrap ${isGuidedMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <BookMarked size={12}/> Dẫn dắt
          </button>
        </div>
      </div>

      {isGuidedMode ? (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-indigo-200 flex flex-col overflow-hidden animate-fadeIn min-h-0">
           <div className="bg-indigo-50 border-b border-indigo-100 p-2 md:p-3 shrink-0 flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
             <div className="flex-1 w-full">
               <label className="block text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Đề bài đang học</label>
               <textarea className="w-full bg-transparent text-indigo-900 font-medium outline-none resize-y min-h-[24px] max-h-[60px] text-sm md:text-[15px] custom-scrollbar" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Nhập đề bài để bắt đầu..." />
             </div>
             {guidedStep > 0 && (
               <div className="flex items-center gap-1.5 shrink-0 bg-white px-3 py-1.5 rounded-full shadow-sm border border-indigo-100">
                 <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${guidedStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
                 <span className={`w-6 h-1 rounded-full ${guidedStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></span>
                 <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${guidedStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
               </div>
             )}
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 bg-slate-50 flex flex-col">
              {guidedStep === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto animate-fadeIn m-auto">
                    <BookMarked size={48} className="text-indigo-300 mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-3">Chế độ Học Dẫn dắt (Input & Output)</h2>
                    <p className="text-slate-600 text-[15px] mb-6 leading-relaxed">Thay vì ép bạn viết ngay, AI sẽ cung cấp cho bạn một bài đọc ngắn về chủ đề này để "nạp" từ vựng, sau đó giúp bạn dịch từng câu theo dàn ý chuẩn 40/60.</p>
                    <button onClick={handleStartGuidedMode} disabled={isGeneratingGuidedData || !prompt.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 px-6 py-2.5 rounded-xl text-[15px] font-bold transition-all shadow-md flex items-center gap-2">
                      {isGeneratingGuidedData ? <><Loader2 size={18} className="animate-spin"/> Đang soạn giáo trình...</> : <><Sparkles size={18}/> Bắt Đầu Học</>}
                    </button>
                 </div>
              )}

              {guidedStep === 1 && guidedData && (
                 <div className="w-full h-full flex flex-col lg:flex-row gap-3 md:gap-4 animate-fadeIn items-stretch min-h-0">
                    <div className="w-full lg:w-1/2 flex flex-col h-[40vh] lg:h-auto shrink-0 lg:shrink">
                      <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-0">
                        <h3 className="text-base md:text-lg font-bold text-indigo-800 mb-2 flex items-center gap-1.5"><BookOpen size={18}/> Bài Đọc Ngữ Cảnh</h3>
                        <div className="text-slate-800 leading-relaxed text-[15px] md:text-base bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-y-auto custom-scrollbar shadow-inner whitespace-pre-wrap font-serif flex-1">
                          {guidedData.readingPassage.split(/(\s+)/).map((segment, i) => {
                            if (!segment.trim()) return segment; 
                            const cleanSegment = segment.replace(/[.,!?;:()"]/g, '');
                            const isTarget = guidedData.highlightWords.some(hw => {
                               const targetWordPart = hw.split(' ')[0].toLowerCase();
                               return cleanSegment.toLowerCase() === targetWordPart && targetWordPart.length > 2; 
                            });
                            return isTarget 
                              ? <strong key={i} className="text-indigo-800 bg-indigo-100/80 px-1 py-0.5 rounded shadow-sm mx-[1px]">{segment}</strong> 
                              : segment;
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-1/2 flex flex-col h-auto lg:h-full shrink-0 lg:shrink">
                      <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-0">
                        <h3 className="text-base md:text-lg font-bold text-emerald-800 mb-1 flex items-center gap-1.5"><Brain size={18}/> Thử thách Đọc Hiểu & Từ Vựng</h3>
                        <p className="text-xs text-slate-500 mb-3 border-b border-slate-100 pb-2">Hoàn thành bài tập để mở khóa Luyện Viết.</p>
                        
                        <div className="overflow-y-auto custom-scrollbar pr-1 flex-1 space-y-4">
                          {guidedData.exercises.map((ex, exIndex) => (
                             <div key={exIndex} className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-[15px]">
                                  <span className="bg-amber-100 text-amber-700 w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-black shrink-0">B{exIndex + 1}</span> 
                                  {ex.instruction}
                                </h4>
                                <div className="space-y-4">
                                  {ex.items.map((item, itemIndex) => {
                                    const isChecked = Object.keys(guidedGameResults).length > 0;
                                    const isCorrect = guidedGameResults[exIndex]?.[itemIndex];
                                    return (
                                      <div key={itemIndex} className="flex flex-col gap-1.5">
                                        <label className="text-[14px] md:text-[15px] font-medium text-slate-700 leading-snug">
                                          <span className="font-bold mr-1">{itemIndex + 1}.</span> {item.question}
                                        </label>
                                        <div className="relative">
                                          {ex.type === 'true_false' ? (
                                            <div className="flex gap-2">
                                              {['True', 'False'].map(opt => (
                                                <label key={opt} className={`flex items-center gap-1.5 px-4 py-2 rounded-md border cursor-pointer transition-colors text-sm ${guidedGameAnswers[exIndex]?.[itemIndex] === opt ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'} ${isChecked && guidedGameAnswers[exIndex]?.[itemIndex] === opt ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700') : ''}`}>
                                                  <input type="radio" name={`ex_${exIndex}_item_${itemIndex}`} value={opt} checked={guidedGameAnswers[exIndex]?.[itemIndex] === opt} onChange={() => handleExerciseAnswerChange(exIndex, itemIndex, opt)} disabled={guidedGamePassed} className="hidden" />
                                                  {opt}
                                                </label>
                                              ))}
                                            </div>
                                          ) : (
                                            <input type="text" placeholder="Nhập từ..." value={guidedGameAnswers[exIndex]?.[itemIndex] || ''} onChange={(e) => handleExerciseAnswerChange(exIndex, itemIndex, e.target.value)} disabled={guidedGamePassed} className={`w-full px-3 py-2 rounded-md border outline-none focus:ring-1 text-[15px] transition-colors ${isChecked ? (isCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold' : 'bg-rose-50 border-rose-400 text-rose-800 font-bold') : 'bg-white border-slate-300 focus:ring-indigo-500'}`} />
                                          )}
                                          {isChecked && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                              {isCorrect ? <CheckCircle2 size={18} className="text-emerald-500"/> : <XCircle size={18} className="text-rose-500"/>}
                                            </div>
                                          )}
                                        </div>
                                        {isChecked && !isCorrect && (
                                          <div className="text-xs font-bold text-rose-600 mt-0.5 pl-1 animate-fadeIn">💡 Đáp án chuẩn: <span className="italic underline">{item.answer}</span></div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                             </div>
                          ))}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 shrink-0">
                          {guidedGameError && !guidedGamePassed && (
                            <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[13px] font-medium flex items-center gap-1.5 animate-fadeIn shadow-sm"><AlertCircle size={16} className="shrink-0" /> <span>{guidedGameError}</span></div>
                          )}

                          {!guidedGamePassed ? (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 md:gap-2">
                                <button onClick={() => setGuidedStep(0)} className="text-slate-500 hover:bg-slate-200 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[13px]">
                                  <ArrowLeft size={14}/> <span className="hidden sm:inline">Quay lại</span>
                                </button>
                                {Object.keys(guidedGameResults).length > 0 && (
                                  <button onClick={() => setGuidedStep(2)} className="text-slate-500 hover:bg-slate-200 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[13px]">
                                    Bỏ qua <ArrowRight size={14}/>
                                  </button>
                                )}
                              </div>
                              <button onClick={handleCheckGuidedGame} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md text-sm">Kiểm Tra</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                              <div className="flex items-center gap-2 md:gap-3">
                                 <button onClick={() => setGuidedStep(0)} className="text-slate-500 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[13px]">
                                   <ArrowLeft size={14}/> <span className="hidden sm:inline">Quay lại</span>
                                 </button>
                                 <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-sm"><CheckCircle2 size={18}/> Xuất sắc!</span>
                              </div>
                              <button onClick={() => setGuidedStep(2)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-md flex items-center gap-1.5 animate-pulse text-sm">Sang Bước 2 <ArrowRight size={16}/></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                 </div>
              )}

              {guidedStep === 2 && guidedData && (
                 <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn pb-6 w-full">
                    <div className="text-center mb-6">
                       <h3 className="text-xl font-bold text-indigo-800 mb-1">Bước 2: Lắp Ráp & Dịch Thuật</h3>
                       <p className="text-slate-600 text-[15px]">Hãy chọn 1 đoạn bạn muốn viết và dịch các gợi ý sang tiếng Anh.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {guidedData.outlines.map((outline, idx) => (
                        <div key={idx} onClick={() => setSelectedIdeaIndex(idx)} className={`cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 ${selectedIdeaIndex === idx ? 'bg-indigo-50 border-indigo-500 shadow-md transform scale-[1.02]' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                           <div className="flex justify-between items-start mb-3">
                             <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${idx === 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>Body {idx + 1} ({idx === 0 ? '40% - Counter' : '60% - Main'})</span>
                             {selectedIdeaIndex === idx && <CheckCircle2 className="text-indigo-600" size={20}/>}
                           </div>
                           <h4 className="font-bold text-slate-800 text-base mb-2 leading-snug">{outline.title}</h4>
                           <ul className="text-sm text-slate-600 space-y-1.5 pl-4 list-disc marker:text-slate-300">
                             {outline.sentences.map((s, i) => <li key={i} className="line-clamp-2">{s.vn}</li>)}
                           </ul>
                        </div>
                      ))}
                    </div>

                    {selectedIdeaIndex !== null && (
                      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 mt-6 animate-slideUp">
                         <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Dịch từng câu (Đoạn {selectedIdeaIndex + 1})</h3>
                         <div className="space-y-6">
                           {guidedData.outlines[selectedIdeaIndex].sentences.map((sentence, sIdx) => {
                             const tKey = `${selectedIdeaIndex}-${sIdx}`;
                             const tEval = translationEvals[tKey];
                             const isEvalLoading = isEvaluatingTranslation[tKey];
                             return (
                             <div key={sIdx} className="bg-slate-50 p-4 md:p-5 rounded-lg border border-slate-100 relative">
                                <div className="absolute -left-2 -top-2 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">{sIdx + 1}</div>
                                <p className="font-bold text-slate-800 mb-3 pl-2 text-[15px] md:text-base leading-relaxed">{sentence.vn}</p>
                                <div className="flex flex-wrap gap-2 mb-4 pl-2 items-center">
                                  <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border shadow-sm">Từ khóa:</span>
                                  {sentence.keywords.split(',').map((kw, i) => <span key={i} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{kw.trim()}</span>)}
                                </div>
                                <textarea className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 text-[15px] md:text-base outline-none focus:ring-1 focus:ring-indigo-500 resize-none shadow-inner" rows={2} placeholder="Dịch câu trên sang tiếng Anh..." value={translationAttempts[tKey] || ''} onChange={(e) => setTranslationAttempts(prev => ({...prev, [tKey]: e.target.value}))} />
                                <div className="flex justify-end mt-2">
                                   <button onClick={() => handleEvaluateTranslation(selectedIdeaIndex, sIdx)} disabled={isEvalLoading || !translationAttempts[tKey]} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 disabled:opacity-50 text-[13px] font-bold px-4 py-2 rounded-md flex items-center gap-1.5 transition-colors shadow-sm">
                                     {isEvalLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Kiểm tra
                                   </button>
                                </div>
                                {tEval && (
                                  <div className="mt-4 pt-4 border-t border-slate-200 animate-fadeIn space-y-3">
                                     <div className={`p-3 rounded-md border ${tEval.isGood ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                           {tEval.isGood ? <CheckCircle2 className="text-emerald-500" size={16}/> : <AlertCircle className="text-amber-500" size={16}/>}
                                           <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">Nhận xét</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed">{tEval.feedback}</p>
                                     </div>
                                     <div className="bg-white border border-slate-200 rounded-md p-3">
                                        <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider mb-1 block">Đáp án chuẩn (Tham khảo):</span>
                                        <p className="text-sm font-medium text-slate-800 leading-relaxed">{sentence.en}</p>
                                     </div>
                                     <div className="bg-white border border-slate-200 rounded-md p-3">
                                        <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider mb-1 block">Cách diễn đạt nâng cao (Band 7.5+):</span>
                                        <p className="text-sm font-medium text-slate-800 leading-relaxed">{tEval.paraphrase}</p>
                                     </div>
                                  </div>
                                )}
                             </div>
                           )})}
                         </div>
                      </div>
                    )}
                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200">
                       <button onClick={() => setGuidedStep(1)} className="text-slate-500 hover:bg-slate-200 font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                         <ArrowLeft size={16}/> Quay lại
                       </button>
                       <button onClick={jumpToProMode} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 text-sm">
                         <FastForward size={18}/> Vào Thực Chiến
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col md:flex-row gap-3 min-h-0 animate-fadeIn">
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-0">
            <div className="border-b border-slate-100 p-3 bg-slate-50 flex flex-col gap-2 shrink-0">
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0">Đề bài</label>
               <textarea ref={promptRef} className="w-full bg-transparent text-slate-800 font-medium outline-none resize-y min-h-[40px] max-h-[120px] custom-scrollbar overflow-y-auto leading-relaxed text-sm" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Nhập đề..." rows={2} />
               
               <div className="flex flex-wrap gap-1.5 mt-1">
                 {guidedData && (
                   <button onClick={() => { closeAllSidebars(); setShowGuidedRefSidebar(!showGuidedRefSidebar); }} className={`text-[11px] lg:text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${showGuidedRefSidebar ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-sm'}`}>
                     <BookMarked size={12} /> Tư Liệu Guided
                   </button>
                 )}
                 <button onClick={() => { closeAllSidebars(); handleSuggestPromptVocab(); }} className={`text-[11px] lg:text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${showVocabSidebar ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                   <Tags size={12} /> 10 Từ Ăn Điểm
                 </button>
                 <button onClick={() => { closeAllSidebars(); setShowStructureModal(true); }} className="text-[11px] lg:text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors bg-rose-100 text-rose-700 hover:bg-rose-200">
                   <Columns size={12} /> Cấu trúc 40/60
                 </button>
                 <button onClick={handleSuggestIdeas} className="text-[11px] lg:text-xs font-bold flex items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 px-2.5 py-1.5 rounded-md transition-colors">
                   <Lightbulb size={12} /> Mind Map Idea
                 </button>
                 <button onClick={() => { if(matchedSample){ closeAllSidebars(); setShowSampleSidebar(!showSampleSidebar); } else showToast("Không tìm thấy bài mẫu trong Kho!", "error"); }} className={`text-[11px] lg:text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${showSampleSidebar ? 'bg-slate-300 text-slate-800' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                   <BookOpen size={12} /> Xem Mẫu
                 </button>
               </div>
            </div>

            <div className="flex-1 p-3 lg:p-4 min-h-0 flex flex-col relative">
               <textarea 
                 ref={editorRef} spellCheck={false}
                 className="w-full h-full resize-none outline-none text-slate-700 leading-relaxed text-[15px] lg:text-base placeholder-slate-300 custom-scrollbar" 
                 placeholder="Viết bài của bạn tại đây... Thử bấm mở các công cụ hỗ trợ ở trên nếu bạn bí ý tưởng nhé!" 
                 value={essay} onChange={(e) => setEssay(e.target.value)}
               />
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                 <div className={`px-2.5 py-1 rounded-md text-xs font-medium border shadow-sm ${wordCount < 250 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'} shrink-0 flex items-center gap-1`}>
                   <span className="font-black text-sm">{wordCount}</span> <span className="hidden sm:inline">từ</span>
                 </div>
                 <div className="bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs font-bold font-mono tracking-wider ${timeRemaining < 300 ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>{formatTime(timeRemaining)}</span>
                    <div className="flex gap-0.5 border-l border-slate-100 pl-1.5">
                      <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-1 rounded text-slate-500 hover:bg-slate-100"><Play size={12}/></button>
                      <button onClick={() => {setIsTimerRunning(false); setTimeRemaining(40 * 60);}} className="p-1 rounded text-slate-500 hover:bg-slate-100"><RotateCcw size={12}/></button>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                 <button onClick={handleOpenParaphraseFromSelection} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-md font-bold text-xs shadow-sm whitespace-nowrap">
                   <Wrench size={12} className="text-amber-400" /> <span className="hidden sm:inline">Sửa Câu</span>
                 </button>
                 <button onClick={handleEvaluate} disabled={isEvaluating || !prompt || !essay.trim()} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-md font-bold shadow-sm text-xs whitespace-nowrap">
                   {isEvaluating ? <><Loader2 size={14} className="animate-spin" /> Chấm...</> : <><Brain size={14} /> Chấm điểm</>}
                 </button>
              </div>
            </div>
          </div>

          {showGuidedRefSidebar && guidedData && (
             <div className="w-full md:w-1/3 xl:w-[400px] shrink-0 bg-white rounded-xl shadow-sm border border-indigo-300 flex flex-col overflow-hidden animate-fadeIn">
                <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shrink-0">
                   <h3 className="font-bold flex items-center gap-2"><BookMarked size={18} /> Tư liệu Guided Mode</h3>
                   <button onClick={() => setShowGuidedRefSidebar(false)} className="text-indigo-200 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 space-y-6">
                   <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-indigo-800 mb-2 border-b pb-2">Đoạn văn ngữ cảnh</h4>
                      <p className="text-sm text-slate-700 leading-relaxed italic">{guidedData.readingPassage}</p>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-emerald-800 mb-2 border-b pb-2">Từ vựng mục tiêu</h4>
                      <div className="flex flex-wrap gap-2">
                        {guidedData.highlightWords?.map((w, i) => (
                           <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-sm font-bold shadow-sm">{w}</span>
                        ))}
                      </div>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-rose-800 mb-2 border-b pb-2">Gợi ý Dàn ý (Ideas)</h4>
                      {guidedData.outlines.map((o, i) => (
                         <div key={i} className="mb-3 last:mb-0">
                           <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded">Body {i+1}</span>
                           <p className="text-sm font-medium text-slate-800 mt-1">{o.title}</p>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {showVocabSidebar && (
            <div className="w-full md:w-1/3 xl:w-[320px] shrink-0 bg-white rounded-xl shadow-sm border border-emerald-200 flex flex-col overflow-hidden animate-fadeIn">
               <div className="bg-emerald-600 p-4 flex items-center justify-between text-white shrink-0">
                  <h3 className="font-bold flex items-center gap-2"><Tags size={18} /> 10 Từ Ăn Điểm</h3>
                  <button onClick={() => setShowVocabSidebar(false)} className="text-emerald-200 hover:text-white transition-transform hover:scale-110"><X size={20}/></button>
               </div>
               <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 space-y-3">
                 {isGeneratingPromptVocabs ? (
                   <div className="flex flex-col items-center justify-center h-full py-10 text-center px-4"><Loader2 className="animate-spin text-emerald-500 mb-4" size={32} /></div>
                 ) : (
                   suggestedPromptVocabs.map((v, i) => {
                     const isUsed = checkVocabUsage(v.phrase, essay);
                     return (
                       <div key={i} className={`p-3 rounded-xl border flex items-start gap-3 transition-all duration-500 ${isUsed ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-slate-200'}`}>
                         <div className="mt-0.5 shrink-0 transition-transform duration-500">
                           {isUsed ? <CheckCircle2 className="text-emerald-500 scale-110" size={18}/> : <Circle className="text-slate-300" size={18}/>}
                         </div>
                         <div className="flex-1">
                           <div className="flex items-center flex-wrap gap-1.5 mb-1">
                             <div className={`font-bold text-sm transition-colors duration-500 ${isUsed ? 'text-emerald-700' : 'text-slate-800'}`}>{v.phrase}</div>
                             <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${v.source === 'kho' ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>{v.source === 'kho' ? 'Từ cũ' : 'Từ mới'}</span>
                           </div>
                           <div className={`text-xs transition-colors duration-500 ${isUsed ? 'text-emerald-600' : 'text-slate-500'}`}>{v.meaning}</div>
                         </div>
                       </div>
                     );
                   })
                 )}
               </div>
            </div>
          )}

          {showSampleSidebar && (
            <div className="w-full md:w-1/2 xl:w-[500px] shrink-0 bg-white rounded-xl shadow-sm border border-indigo-200 flex flex-col overflow-hidden animate-fadeIn">
               <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shrink-0">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Library size={20} /> Bài Mẫu Tham Khảo</h3>
                  <button onClick={() => setShowSampleSidebar(false)} className="text-indigo-200 hover:text-white transition-transform hover:scale-110"><X size={24}/></button>
               </div>
               <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
                 {matchedSample && (
                   <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                     <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100 tracking-wide mb-4 inline-block">Band {matchedSample.bandScore}</span>
                     <p className="text-sm font-bold text-slate-800 mb-4 pb-4 border-b border-slate-100 leading-relaxed">{matchedSample.prompt || matchedSample.title}</p>
                     <p className="text-base text-slate-700 whitespace-pre-wrap leading-loose font-medium">{matchedSample.content}</p>
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER EVALUATION RESULT */}
      {evaluationResult && !isGuidedMode && (
         <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden animate-fadeIn shrink-0 mt-4 flex flex-col">
          <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
               <h2 className="text-2xl font-bold flex items-center gap-2"><Award size={28}/> Kết Quả Chấm Bài</h2>
               <p className="text-indigo-100 text-sm mt-1">Giáo viên AI đã chấm điểm và đưa ra thử thách sửa lỗi cho bạn.</p>
             </div>
             <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-sm text-center shrink-0">
                <div className="text-sm font-medium uppercase tracking-wider text-white/80">Overall Band</div>
                <div className="text-4xl font-extrabold">{evaluationResult.overallBand.toFixed(1)}</div>
             </div>
          </div>
          
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 md:px-8">
            <button onClick={() => setEvalTab('scores')} className={`py-4 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${evalTab === 'scores' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><BarChart3 size={18} /> Điểm & Nhận Xét</button>
            <button onClick={() => setEvalTab('corrections')} className={`py-4 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${evalTab === 'corrections' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><MessageSquareDiff size={18} /> Tự Sửa Lỗi (Active Learning)</button>
            <button onClick={() => setEvalTab('polished')} className={`py-4 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${evalTab === 'polished' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><FileText size={18} /> Bài Viết Hoàn Thiện</button>
          </div>

          {evalTab === 'scores' && (
            <div className="p-6 lg:p-8 animate-fadeIn bg-white overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 {[{ title: "Task Response", score: evaluationResult.trScore, fb: evaluationResult.trFeedback}, { title: "Coherence & Cohesion", score: evaluationResult.ccScore, fb: evaluationResult.ccFeedback}, { title: "Lexical Resource", score: evaluationResult.lrScore, fb: evaluationResult.lrFeedback}, { title: "Grammar Range & Accuracy", score: evaluationResult.graScore, fb: evaluationResult.graFeedback}].map((crit, idx) => (
                   <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-slate-800">{crit.title}</h3><span className="bg-white px-3 py-1 rounded-lg text-indigo-700 font-bold border border-indigo-100">{crit.score.toFixed(1)}</span></div>
                      <p className="text-sm text-slate-600 leading-relaxed">{crit.fb}</p>
                   </div>
                 ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm"><h3 className="text-emerald-800 font-bold text-lg mb-4 flex items-center gap-2"><CheckCircle size={20} /> Điểm mạnh của bài viết</h3><ul className="space-y-3">{evaluationResult.strengths?.map((str, idx) => (<li key={idx} className="text-emerald-700 text-sm flex items-start gap-2"><span className="mt-0.5 text-emerald-500 font-bold">•</span><span className="leading-relaxed">{str}</span></li>))}</ul></div>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm"><h3 className="text-rose-800 font-bold text-lg mb-4 flex items-center gap-2"><TrendingDown size={20} /> Điểm cần khắc phục</h3><ul className="space-y-3">{evaluationResult.weaknesses?.map((weak, idx) => (<li key={idx} className="text-rose-700 text-sm flex items-start gap-2"><span className="mt-0.5 text-rose-500 font-bold">•</span><span className="leading-relaxed">{weak}</span></li>))}</ul></div>
              </div>
            </div>
          )}

          {evalTab === 'corrections' && (
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6 animate-fadeIn bg-slate-100 h-[70vh] overflow-hidden">
               <div className="flex-[3] bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm overflow-y-auto custom-scrollbar flex flex-col relative"><div className="text-slate-700 leading-loose text-lg font-medium">{renderHighlightedEssay()}</div></div>
               <div className="flex-[2] overflow-y-auto custom-scrollbar px-2 pb-10 space-y-4">
                  {(!evaluationResult.detailedCorrections || evaluationResult.detailedCorrections.length === 0) ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-700 mt-10"><CheckCircle2 className="mx-auto mb-3" size={32} /><p className="font-bold">Tuyệt vời!</p><p className="text-sm mt-1">Giáo viên không tìm thấy lỗi ngữ pháp hay diễn đạt nghiêm trọng nào cần bôi đỏ.</p></div>
                  ) : (
                    evaluationResult.detailedCorrections.map((item, idx) => {
                      const attempt = correctionAttempts[idx] || { text: '', submitted: false };
                      const isCorrect = attempt.submitted && normalizeForCheck(attempt.text) === normalizeForCheck(item.corrected);
                      return (
                        <div key={idx} ref={el => commentRefs.current[idx] = el} onMouseEnter={() => handleCommentHover(idx)} onMouseLeave={() => handleCommentHover(null)} className={`p-5 rounded-2xl transition-all duration-300 shadow-sm relative overflow-hidden ${activeCommentIndex === idx ? 'bg-white border-2 border-indigo-400 shadow-md z-10' : 'bg-white border border-slate-200'}`}>
                           {activeCommentIndex === idx && <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-400"></div>}
                           <div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0">{idx + 1}</div><div><div className="font-bold text-sm text-slate-800">Thử thách sửa lỗi</div></div></div>
                           <div className="mb-4"><span className="text-[10px] font-black uppercase text-rose-500 tracking-wider mb-1 block">Câu gốc của bạn:</span><p className="text-sm text-slate-600 line-through decoration-rose-300 decoration-2 leading-relaxed bg-rose-50 p-2 rounded-lg border border-rose-100">{item.original}</p></div>
                           <div className="mb-4"><div className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mb-1"><Lightbulb size={12} /> Gợi ý của Giáo viên:</div><p className="text-sm text-slate-700 italic border-l-2 border-amber-300 pl-2 ml-1 leading-relaxed">{item.hint}</p></div>
                           {!attempt.submitted ? (
                             <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
                                <textarea className="w-full bg-slate-50 border border-indigo-200 rounded-xl p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none shadow-inner" rows={2} placeholder="Dựa vào gợi ý, bạn hãy thử tự viết lại cho đúng nhé..." value={attempt.text} onChange={(e) => setCorrectionAttempts(prev => ({...prev, [idx]: { ...prev[idx], text: e.target.value }}))} />
                                <div className="flex justify-end mt-2"><button onClick={() => handleSubmitCorrection(idx)} disabled={!attempt.text.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"><Send size={14} /> Kiểm tra</button></div>
                             </div>
                           ) : (
                             <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
                                <div className={`mb-4 p-3 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}><div className="flex justify-between items-start mb-1"><span className={`text-[10px] font-black uppercase tracking-wider ${isCorrect ? 'text-emerald-600' : 'text-amber-600'}`}>Câu bạn sửa:</span>{isCorrect ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-amber-500" />}</div><p className={`text-sm font-medium ${isCorrect ? 'text-emerald-800' : 'text-amber-800'}`}>{attempt.text}</p>{!isCorrect && <p className="text-xs text-amber-600 mt-1 italic">Khá khen cho nỗ lực của bạn! Dưới đây là cách diễn đạt tối ưu nhất:</p>}</div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-3"><span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider mb-1 block">Đáp án chuẩn (AI):</span><p className="text-sm font-bold text-emerald-800 leading-relaxed">{item.corrected}</p></div>
                                <div className="text-xs text-indigo-700 bg-indigo-50 p-3 rounded-lg font-medium leading-relaxed border border-indigo-100"><span className="font-bold text-indigo-800 block mb-0.5">Giải thích chi tiết:</span>{item.explanation}</div>
                             </div>
                           )}
                        </div>
                      );
                    })
                  )}
               </div>
            </div>
          )}

          {evalTab === 'polished' && (
            <div className="p-6 lg:p-8 animate-fadeIn bg-white overflow-y-auto max-h-[60vh] custom-scrollbar flex flex-col">
               <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                 <div><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Sparkles className="text-amber-500" size={20}/> Bài Viết Tham Khảo (Band 8.0+)</h3><p className="text-sm text-slate-500 mt-1">Bài viết đã được chia chuẩn 4 đoạn (Intro, 2 Body, Conclusion) với văn phong tự nhiên, mạch lạc.</p></div>
                 <button onClick={() => copyToClipboard(evaluationResult.polishedEssay)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors shrink-0"><Copy size={16}/> Copy Bài</button>
               </div>
               <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-10 shadow-inner text-slate-800 leading-loose text-base md:text-lg whitespace-pre-wrap font-serif">
                  {evaluationResult.polishedEssay}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTrackerTab = () => { 
    const recentEvals = [...evaluationsHistory].slice(0, 10);
    if (recentEvals.length === 0) return (<div className="flex flex-col h-full items-center justify-center p-8 animate-fadeIn text-center"><BarChart3 size={64} className="text-slate-300 mb-6" /><h2 className="text-2xl font-bold text-slate-800 mb-2">Chưa có dữ liệu thống kê</h2><p className="text-slate-500 max-w-md">Bạn cần hoàn thành ít nhất 1 bài viết và sử dụng tính năng "Đánh giá bài viết" để hệ thống theo dõi lỗ hổng của bạn.</p></div>);
    const avg = { TR: (recentEvals.reduce((s, e) => s + e.trScore, 0) / recentEvals.length).toFixed(1), CC: (recentEvals.reduce((s, e) => s + e.ccScore, 0) / recentEvals.length).toFixed(1), LR: (recentEvals.reduce((s, e) => s + e.lrScore, 0) / recentEvals.length).toFixed(1), GRA: (recentEvals.reduce((s, e) => s + e.graScore, 0) / recentEvals.length).toFixed(1) };
    let lowestCrit = 'TR', minScore = parseFloat(avg.TR);
    if (parseFloat(avg.CC) < minScore) { minScore = parseFloat(avg.CC); lowestCrit = 'CC'; }
    if (parseFloat(avg.LR) < minScore) { minScore = parseFloat(avg.LR); lowestCrit = 'LR'; }
    if (parseFloat(avg.GRA) < minScore) { minScore = parseFloat(avg.GRA); lowestCrit = 'GRA'; }
    const adviceMap = { 'TR': 'Bạn đang gặp khó khăn trong việc bám sát và phát triển ý tưởng. Lời khuyên: Hãy sử dụng nút Sơ Đồ Tư Duy (Mind Map 40/60) và bám chặt vào nhánh EGOSFI thay vì viết lan man.', 'CC': 'Các đoạn văn của bạn đang thiếu sự liên kết logic. Lời khuyên: Hãy sử dụng các từ nối hợp lý, phân bổ rõ ràng mỗi Body 2 ý tưởng theo đúng chuẩn EGOSFI mà không nhảy ý.', 'LR': 'Bạn đang bí từ vựng! Hãy tự tay chọn lọc và thêm các cụm từ "chất" vào Kho Từ Vựng Tinh Hoa. Sau đó qua tab "Ôn Từ Vựng" để luyện tập hàng ngày.', 'GRA': 'Ngữ pháp của bạn đang là lực cản lớn nhất. Lời khuyên: Hãy thử bôi đen các câu đơn giản trong bài, dùng nút "🪄 Sửa Câu Bôi Đen" để xem AI viết lại thành câu phức tạp/đảo ngữ như thế nào và bắt chước nhé.' };
    return (
      <div className="flex flex-col h-full max-w-5xl mx-auto p-6 lg:p-8 animate-fadeIn">
         <div className="mb-8"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Target className="text-rose-500"/> Thống Kê & Vá Lỗ Hổng</h2><p className="text-slate-500">Phân tích dựa trên {recentEvals.length} bài viết gần nhất của bạn.</p></div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-center shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div><div className="bg-rose-100 p-4 rounded-full shrink-0"><TrendingDown size={32} className="text-rose-600" /></div><div className="relative z-10 flex-1"><h3 className="text-xl font-black text-rose-800 uppercase tracking-wide mb-2 flex items-center gap-2">⚠️ CẢNH BÁO LỖ HỔNG: KỸ NĂNG {lowestCrit} (TRUNG BÌNH {minScore})</h3><p className="text-rose-700 font-medium leading-relaxed">{adviceMap[lowestCrit]}</p></div></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           {[{ name: 'Task Response', id: 'TR', score: avg.TR, color: 'text-indigo-600' }, { name: 'Coherence', id: 'CC', score: avg.CC, color: 'text-emerald-600' }, { name: 'Lexical', id: 'LR', score: avg.LR, color: 'text-amber-600' }, { name: 'Grammar', id: 'GRA', score: avg.GRA, color: 'text-blue-600' }].map(c => (
             <div key={c.id} className={`bg-white rounded-2xl p-5 shadow-sm border ${lowestCrit === c.id ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'} text-center`}><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{c.name}</p><div className={`text-4xl font-black ${c.id === lowestCrit ? 'text-rose-600' : c.color}`}>{c.score}</div></div>
           ))}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-slate-800">Lịch Sử Điểm Chi Tiết</h3></div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase border-b border-slate-100"><tr><th className="px-6 py-4">Ngày</th><th className="px-6 py-4">Đề bài (Tóm tắt)</th><th className="px-4 py-4 text-center">Words</th><th className="px-4 py-4 text-center">TR</th><th className="px-4 py-4 text-center">CC</th><th className="px-4 py-4 text-center">LR</th><th className="px-4 py-4 text-center">GRA</th><th className="px-6 py-4 text-right font-black text-slate-700">OVERALL</th></tr></thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                   {recentEvals.map((e, idx) => (
                     <tr key={idx} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 whitespace-nowrap">{new Date(e.createdAt).toLocaleDateString('vi-VN')}</td><td className="px-6 py-4 max-w-xs truncate" title={e.prompt}>{e.prompt || 'Không có đề'}</td><td className="px-4 py-4 text-center text-slate-400">{e.wordCount}</td><td className={`px-4 py-4 text-center ${lowestCrit === 'TR' ? 'text-rose-600 font-bold' : ''}`}>{e.trScore.toFixed(1)}</td><td className={`px-4 py-4 text-center ${lowestCrit === 'CC' ? 'text-rose-600 font-bold' : ''}`}>{e.ccScore.toFixed(1)}</td><td className={`px-4 py-4 text-center ${lowestCrit === 'LR' ? 'text-rose-600 font-bold' : ''}`}>{e.lrScore.toFixed(1)}</td><td className={`px-4 py-4 text-center ${lowestCrit === 'GRA' ? 'text-rose-600 font-bold' : ''}`}>{e.graScore.toFixed(1)}</td><td className="px-6 py-4 text-right"><span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-black">{e.overallBand.toFixed(1)}</span></td></tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    );
  };

  const renderVocabTab = () => { 
     let filteredVocabs = vocabularies;
     if (vocabFilterTopic) filteredVocabs = filteredVocabs.filter(v => v.topicId === vocabFilterTopic);
     if (vocabFilterSubtopic) filteredVocabs = filteredVocabs.filter(v => v.subtopicId === vocabFilterSubtopic);
     return (
       <div className="flex flex-col h-full max-w-5xl mx-auto p-6 lg:p-8 animate-fadeIn">
         <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
           <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Tags className="text-indigo-600"/> Kho Từ Vựng Tinh Hoa<span className="text-sm font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 mt-1">{filteredVocabs.length} cụm từ</span></h2>
             <p className="text-slate-500">Lưu trữ các từ vựng học thuật tự động quét từ Bài Mẫu hoặc thêm thủ công.</p>
           </div>
         </div>
         <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm justify-between items-center">
             <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                <div className="flex items-center gap-2 font-bold text-slate-500 hidden md:flex"><Filter size={18} /> Lọc:</div>
                <select className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm" value={vocabFilterTopic} onChange={(e) => {setVocabFilterTopic(e.target.value); setVocabFilterSubtopic('');}}>
                  <option value="">Tất cả Chủ đề</option>
                  {TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50 text-sm" value={vocabFilterSubtopic} onChange={(e) => setVocabFilterSubtopic(e.target.value)} disabled={!vocabFilterTopic}>
                  <option value="">Tất cả Chủ đề phụ</option>
                  {vocabFilterTopic && SUBTOPICS[vocabFilterTopic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                <button onClick={handleCleanVocabBaseForm} disabled={isCleaningVocab || vocabularies.length === 0} className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50" title="Dùng AI quét và chuyển đổi toàn bộ từ vựng hiện có về nguyên thể (base form)">
                   {isCleaningVocab ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}<span className="hidden sm:inline">{isCleaningVocab ? "Đang xử lý..." : "Chuẩn hóa từ gốc"}</span>
                </button>
                <button onClick={() => { setIsAutoVocab(true); setNewVocab({ topic: '', subtopic: '', phrase: '', translation: '', example1: '', example2: '' }); setShowVocabModal(true); }} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap shrink-0">
                   <Plus size={20} /> Thêm Từ Vựng
                </button>
             </div>
         </div>
         {filteredVocabs.length === 0 ? (
           <div className="flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center px-4"><Tags size={48} className="text-slate-300 mb-4" /><h3 className="text-lg font-bold text-slate-600 mb-2">Không tìm thấy từ vựng</h3><p className="text-slate-500 mb-4">Kho từ vựng của bạn đang trống ở bộ lọc này. Hãy thử chọn chủ đề khác hoặc nhấn thêm từ vựng mới!</p></div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {filteredVocabs.map((vocab) => (
               <div key={vocab.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow relative group">
                  <button onClick={() => triggerDelete('vocabulary', vocab.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                  <div className="mb-4 pr-6"><h3 className="text-xl font-bold text-indigo-700">{vocab.phrase}</h3><p className="text-slate-500 text-sm font-medium">{vocab.translation}</p></div>
                  <div className="space-y-3">
                     {vocab.examples?.map((ex, i) => (<div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm text-slate-700"><span className="font-bold text-emerald-600 mr-2">Ex {i+1}:</span> {ex}</div>))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                     <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded font-medium">{TOPICS.find(t => t.id === vocab.topicId)?.name || 'General'}</span>
                  </div>
               </div>
             ))}
           </div>
         )}
       </div>
     );
  };

  const renderQuizTab = () => {  
    return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6 lg:p-8 animate-fadeIn">
       <div className="mb-8"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Gamepad2 className="text-amber-500"/> Luyện Tập Điền Từ (Fill in the blank)</h2><p className="text-slate-500">Gõ từ vựng cần điền vào chỗ trống. Hệ thống sẽ tự động đối chiếu với Kho Từ Vựng của bạn.</p></div>
      {!quizQuestions.length ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto">
           <Wand2 size={48} className="text-amber-400 mx-auto mb-6" />
           <h3 className="text-xl font-bold text-slate-800 mb-4">Cấu hình Bài Tập</h3>
           <div className="space-y-4 mb-8 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Chọn Chủ đề ôn tập <span className="text-rose-500">*</span></label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500" value={quizTopic} onChange={(e) => {setQuizTopic(e.target.value); setQuizSubtopic('');}}>
                  <option value="">-- Bắt buộc chọn chủ đề --</option>
                  {TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Chủ đề phụ (Tùy chọn)</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50" value={quizSubtopic} onChange={(e) => setQuizSubtopic(e.target.value)} disabled={!quizTopic}>
                  <option value="">-- Tất cả --</option>
                  {quizTopic && SUBTOPICS[quizTopic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
           </div>
           <button onClick={handleGenerateQuiz} disabled={!quizTopic || isGeneratingQuiz} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 mx-auto">
            {isGeneratingQuiz ? <><Loader2 className="animate-spin" size={20}/> Đang soạn bài tập...</> : <><Play size={20} /> Tạo 10 Câu Điền Từ</>}
           </button>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn pb-20">
           <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 sticky top-0 z-10">
              <h3 className="font-bold text-slate-800">Bài Tập: {TOPICS.find(t=>t.id===quizTopic)?.name}</h3>
              <button onClick={() => setQuizQuestions([])} className="text-sm font-bold text-slate-500 hover:text-rose-500">Thoát</button>
           </div>
           {quizQuestions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                 <div className="flex gap-4 mb-4"><span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold shrink-0">{qIdx + 1}</span><p className="text-lg text-slate-800 font-medium leading-relaxed">{q.question}</p></div>
                 <div className="pl-12 space-y-3">
                    <input type="text" disabled={quizSubmitted} value={userAnswers[qIdx] || ''} onChange={(e) => setUserAnswers(prev => ({...prev, [qIdx]: e.target.value}))} placeholder="Nhập từ cần điền vào đây..." className={`w-full p-3 border rounded-xl outline-none transition-colors ${quizSubmitted ? (userAnswers[qIdx] || '').trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-rose-500 bg-rose-50 text-rose-700 font-bold' : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'}`} />
                    <div className="flex items-center gap-3 mt-2">
                       <button onClick={() => setShowHints(prev => ({...prev, [qIdx]: true}))} disabled={quizSubmitted || showHints[qIdx]} className="text-xs font-bold flex items-center gap-1 text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"><Lightbulb size={14} /> Xem gợi ý</button>
                       {showHints[qIdx] && <span className="text-sm text-slate-600 italic animate-fadeIn">{q.hint}</span>}
                    </div>
                    {quizSubmitted && (
                      <div className={`mt-4 p-4 rounded-xl border ${(userAnswers[qIdx] || '').trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                         {(userAnswers[qIdx] || '').trim().toLowerCase() !== q.correctAnswer.trim().toLowerCase() && (<div className="mb-2"><span className="font-bold text-rose-800 text-sm block mb-1">Đáp án đúng:</span><p className="text-rose-700 font-bold">{q.correctAnswer}</p></div>)}
                         <div><span className="font-bold text-slate-800 text-sm block mb-1">Giải thích:</span><p className="text-slate-700 text-sm leading-relaxed">{q.explanation}</p></div>
                      </div>
                    )}
                 </div>
              </div>
           ))}
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
              {quizSubmitted ? (
                <div><h3 className="text-2xl font-bold text-slate-800 mb-2">Điểm của bạn</h3><div className="text-5xl font-black text-amber-500 mb-4">{quizScore} / 10</div><button onClick={() => {setQuizQuestions([]); handleGenerateQuiz();}} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md">Làm bài mới</button></div>
              ) : (
                <button onClick={handleQuizSubmit} disabled={Object.values(userAnswers).filter(ans => ans.trim().length > 0).length === 0} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md text-lg">Nộp Bài Kiểm Tra</button>
              )}
           </div>
        </div>
      )}
    </div>
    );
  };

  const renderSamplesTab = () => { 
    let filteredSamples = sampleEssays;
    if (sampleSearchQuery.trim()) { const query = sampleSearchQuery.toLowerCase(); filteredSamples = filteredSamples.filter(s => (s.prompt && s.prompt.toLowerCase().includes(query)) || (s.title && s.title.toLowerCase().includes(query)) || (s.content && s.content.toLowerCase().includes(query))); }
    if (sampleFilterTopic) filteredSamples = filteredSamples.filter(s => s.topic === sampleFilterTopic);
    if (sampleFilterSubtopic) filteredSamples = filteredSamples.filter(s => s.subtopic === sampleFilterSubtopic);

    return (
      <div className="flex flex-col h-full max-w-5xl mx-auto p-6 lg:p-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Library className="text-emerald-600"/> Kho Bài Mẫu<span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 mt-1">{filteredSamples.length} bài viết</span></h2><p className="text-slate-500">Lưu trữ các bài mẫu chất lượng cao để tham khảo và học hỏi.</p></div>
        </div>
        <div className="flex flex-col gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 w-full items-center justify-between">
               <div className="relative w-full md:w-1/3">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input type="text" placeholder="Tìm kiếm đề bài hoặc nội dung..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm" value={sampleSearchQuery} onChange={(e) => setSampleSearchQuery(e.target.value)} />
                 {sampleSearchQuery && <button onClick={() => setSampleSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><X size={16} /></button>}
               </div>
               <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center flex-1 md:justify-end">
                 <div className="flex items-center gap-2 font-bold text-slate-500 hidden md:flex"><Filter size={18} /> Lọc:</div>
                 <select className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm" value={sampleFilterTopic} onChange={(e) => {setSampleFilterTopic(e.target.value); setSampleFilterSubtopic('');}}>
                   <option value="">Tất cả Chủ đề</option>{TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                 </select>
                 <select className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm disabled:opacity-50 text-sm" value={sampleFilterSubtopic} onChange={(e) => setSampleFilterSubtopic(e.target.value)} disabled={!sampleFilterTopic}>
                   <option value="">Tất cả Chủ đề phụ</option>{sampleFilterTopic && SUBTOPICS[sampleFilterTopic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
               </div>
               <button onClick={() => setShowSampleModal(true)} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0"><Plus size={20} /> Thêm Bài Mẫu</button>
            </div>
        </div>
        {filteredSamples.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center"><BookOpen size={48} className="text-slate-300 mb-4" /><h3 className="text-lg font-bold text-slate-600 mb-2">Không tìm thấy Bài Mẫu</h3><p className="text-slate-500 mb-6 max-w-md">Kho bài mẫu đang trống ở chủ đề bạn chọn. Hãy thêm bài viết mới để lưu trữ và tham khảo nhé.</p><button onClick={() => setShowSampleModal(true)} className="bg-emerald-100 text-emerald-800 px-6 py-2.5 rounded-xl font-bold transition-all">Thêm Ngay</button></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSamples.map((sample) => (
              <div key={sample.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="p-5 flex items-start justify-between cursor-pointer hover:bg-slate-50" onClick={() => setExpandedSampleId(expandedSampleId === sample.id ? null : sample.id)}>
                  <div className="flex-1 pr-4">
                     <div className="flex items-start gap-3 mb-2"><span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded text-xs font-bold border border-indigo-200 shrink-0 mt-0.5">Band {sample.bandScore}</span><h3 className="font-bold text-slate-800 text-base line-clamp-2 leading-snug">{sample.prompt || sample.title || 'Bài mẫu không có đề bài'}</h3></div>
                     <div className="flex gap-2"><span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{TOPICS.find(t => t.id === sample.topic)?.name || 'IELTS'}</span></div>
                  </div>
                  <div className="flex items-center gap-4 pl-4 border-l border-slate-100 mt-2">{expandedSampleId === sample.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}</div>
               </div>
               {expandedSampleId === sample.id && (
                 <div className="p-5 bg-slate-50 border-t border-slate-100 animate-fadeIn">
                    <div className="mb-4"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Đề bài</span><p className="text-slate-700 text-sm font-medium">{sample.prompt || sample.title}</p></div>
                    <div><span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Bài viết</span><p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{sample.content}</p></div>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end gap-2">
                       <button onClick={(e) => { e.stopPropagation(); setEditingSample(sample); }} className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors"><Edit3 size={16} /> Sửa</button>
                       <button onClick={(e) => { e.stopPropagation(); triggerDelete('sample_essays', sample.id); }} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors"><Trash2 size={16} /> Xóa</button>
                    </div>
                 </div>
               )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderBackupTab = () => { 
    return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6 lg:p-8 animate-fadeIn">
       <div className="mb-8"><h2 className="text-2xl font-bold text-slate-800">Sao Lưu & Phục Hồi Dữ Liệu</h2><p className="text-slate-500">Quản lý cục bộ toàn bộ Kho Bài Mẫu, Kho Từ Vựng và Lịch sử Thống kê (Điểm số).</p></div>
      <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-6 mb-8 flex gap-4 items-start shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div><ShieldAlert size={36} className="text-rose-500 shrink-0 mt-1" />
         <div className="relative z-10">
            <h3 className="text-xl font-black text-rose-800 uppercase tracking-wide mb-2">Cảnh báo quan trọng!</h3>
            <p className="text-rose-700 font-medium leading-relaxed">Do cơ chế bảo mật của môi trường giả lập, mỗi khi bạn <b>yêu cầu cập nhật hệ thống hoặc tải lại mã code mới</b>, ID phiên làm việc ẩn danh của bạn có thể sẽ thay đổi. Điều này làm cho bạn không thể thấy dữ liệu cũ của mình.<br/><br/>👉 Vì vậy, <b>LUÔN LUÔN BẤM "TẢI VỀ MÁY"</b> trước khi gửi tin nhắn yêu cầu AI chỉnh sửa phần mềm.</p>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center">
          <Download size={48} className="text-indigo-500 mb-4" /><h3 className="text-xl font-bold text-slate-800 mb-2">Xuất File Backup</h3><p className="text-slate-600 mb-6 text-sm">Tải về máy tính toàn bộ <b>{sampleEssays.length} Bài Mẫu</b>, <b>{vocabularies.length} Từ Vựng</b> và <b>{evaluationsHistory.length} Lịch sử Thống kê</b> dưới dạng 1 file JSON duy nhất.</p>
          <button onClick={handleExportBackup} disabled={sampleEssays.length === 0 && vocabularies.length === 0 && evaluationsHistory.length === 0} className="mt-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"><Save size={20} /> Tải Về Máy</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center">
          <Upload size={48} className="text-emerald-500 mb-4" /><h3 className="text-xl font-bold text-slate-800 mb-2">Phục Hồi Dữ Liệu</h3><p className="text-slate-600 mb-6 text-sm">Tải lên file JSON Backup bạn đã xuất trước đó để khôi phục toàn bộ bài mẫu, từ vựng và biểu đồ thống kê vào phiên làm việc hiện tại.</p>
          <button onClick={() => setShowImportModal(true)} className="mt-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"><RefreshCw size={20} /> Nhập Dữ Liệu</button>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden">
      {renderTopNav()}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {activeTab === 'practice' && renderPracticeTab()}
        {activeTab === 'samples' && renderSamplesTab()}
        {activeTab === 'vocab' && renderVocabTab()}
        {activeTab === 'quiz' && renderQuizTab()}
        {activeTab === 'tracker' && renderTrackerTab()}
        {activeTab === 'backup' && renderBackupTab()}

        {/* MODAL CẨM NANG CẤU TRÚC 40/60 */}
        {showStructureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white shrink-0">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-rose-600 flex items-center gap-2">
                    <Columns size={24} /> Cẩm Nang Cấu Trúc 40/60 Toàn Tập
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Hệ thống hóa toàn bộ Template và Ngôn ngữ ăn điểm cho Task 2</p>
                </div>
                <button onClick={() => setShowStructureModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative bg-slate-100/50">
                <div className="max-w-4xl mx-auto space-y-8">
                  
                  {/* --- PHẦN 1: TƯ DUY 40/60 --- */}
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-800 text-white p-3 flex items-center gap-2">
                      <Target size={18} className="text-amber-400"/> <h4 className="font-bold tracking-wide uppercase text-sm">1. Tư duy cốt lõi 40/60</h4>
                    </div>
                    <div className="p-5 text-sm text-slate-700 leading-relaxed">
                      <p className="mb-3 font-medium">Thay vì viết One-Sided (bảo vệ 1 hướng 100%), phương pháp 40/60 giúp bài viết khách quan và dễ triển khai ý tưởng hơn (mỗi đoạn Body chỉ cần viết về 1 phe).</p>
                      <ul className="space-y-3">
                        <li className="flex gap-3 items-start bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                          <span className="font-black text-rose-600 shrink-0 mt-0.5">Body 1 (40%):</span>
                          <span>Hạ view. Thừa nhận quan điểm đối lập / mặt yếu / mặt hại của vấn đề. <br/><i className="text-slate-500 text-xs">Mục đích: Chứng minh bạn có góc nhìn đa chiều.</i></span>
                        </li>
                        <li className="flex gap-3 items-start bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                          <span className="font-black text-emerald-600 shrink-0 mt-0.5">Body 2 (60%):</span>
                          <span>Nâng view. Đánh bật lại Body 1, khẳng định mạnh mẽ quan điểm bạn ủng hộ / mặt mạnh của vấn đề.</span>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* --- PHẦN 2: TEMPLATE CHUNG CHO TỪNG DẠNG BÀI --- */}
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-indigo-600 text-white p-3 flex items-center gap-2">
                      <ListChecks size={18} className="text-indigo-200"/> <h4 className="font-bold tracking-wide uppercase text-sm">2. Khung Sườn & Template Cho 6 Dạng Bài</h4>
                    </div>
                    
                    <div className="p-5 space-y-6">
                      
                      {/* Dạng 1: Opinion (To what extent agree/disagree) */}
                      <div className="border border-indigo-100 rounded-xl overflow-hidden">
                        <div className="bg-indigo-50 p-3 border-b border-indigo-100 font-bold text-indigo-800">1. Dạng Opinion (To what extent do you agree / disagree?)</div>
                        <div className="p-4 text-sm text-slate-700 space-y-3">
                          <div className="bg-slate-50 p-3 rounded border border-slate-200">
                            <span className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wider">Introduction</span>
                            <p><b>[Background]:</b> Opinions are divided on whether... / It is argued that...</p>
                            <p><b>[Thesis]:</b> Although this proposition could offer certain benefits, I believe its associated disadvantages are more significant. <i className="text-slate-500">(Disgree)</i></p>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1 bg-rose-50 p-3 rounded border border-rose-100"><span className="font-bold text-rose-700 block mb-1">Body 1 (40% - Hạ View)</span><p>Granted / Admittedly, there are valid reasons to believe that [Quan điểm bạn KHÔNG đồng ý] is beneficial.</p></div>
                            <div className="flex-1 bg-emerald-50 p-3 rounded border border-emerald-100"><span className="font-bold text-emerald-700 block mb-1">Body 2 (60% - Nâng View)</span><p>However / On the other hand, I firmly believe that [Quan điểm bạn ĐỒNG Ý] is a better approach.</p></div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded border border-slate-200">
                            <span className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wider">Conclusion</span>
                            <p>In conclusion, while I acknowledge that there are potential benefits to [View 1], they are far outweighed by its consequences. Based on the presented arguments, I completely disagree with the proposed idea.</p>
                          </div>
                        </div>
                      </div>

                      {/* Dạng 2: Advantages outweigh Disadvantages */}
                      <div className="border border-indigo-100 rounded-xl overflow-hidden">
                        <div className="bg-indigo-50 p-3 border-b border-indigo-100 font-bold text-indigo-800">2. Dạng Advantages outweigh Disadvantages (Hoặc Positive/Negative)</div>
                        <div className="p-4 text-sm text-slate-700 space-y-3">
                          <div className="bg-slate-50 p-3 rounded border border-slate-200">
                            <span className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wider">Introduction</span>
                            <p><b>[Background]:</b> It is increasingly common in some parts of the world to [paraphrase đề].</p>
                            <p><b>[Thesis]:</b> While this trend / practice may bring about certain disadvantages, I believe the associated advantages far outweigh them.</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1 bg-rose-50 p-3 rounded border border-rose-100"><span className="font-bold text-rose-700 block mb-1">Body 1 (40% - Disadvantages)</span><p>Admittedly, there may be some drawbacks when [Chủ đề].</p></div>
                            <div className="flex-1 bg-emerald-50 p-3 rounded border border-emerald-100"><span className="font-bold text-emerald-700 block mb-1">Body 2 (60% - Advantages)</span><p>However, despite these disadvantages, the long-term benefits of [Chủ đề] are more significant.</p></div>
                          </div>
                        </div>
                      </div>

                      {/* Dạng 3: Discuss both views */}
                      <div className="border border-indigo-100 rounded-xl overflow-hidden">
                        <div className="bg-indigo-50 p-3 border-b border-indigo-100 font-bold text-indigo-800">3. Dạng Discuss both views and give your opinion</div>
                        <div className="p-4 text-sm text-slate-700 space-y-3">
                          <div className="bg-slate-50 p-3 rounded border border-slate-200">
                            <span className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wider">Introduction</span>
                            <p><b>[Thesis]:</b> While there are valid arguments in favor of [View 1], I personally lean towards the belief that [View 2].</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1 bg-rose-50 p-3 rounded border border-rose-100"><span className="font-bold text-rose-700 block mb-1">Body 1 (View KHÔNG CHỌN)</span><p>On the one hand, many people argue that...</p></div>
                            <div className="flex-1 bg-emerald-50 p-3 rounded border border-emerald-100"><span className="font-bold text-emerald-700 block mb-1">Body 2 (View BẠN CHỌN)</span><p>On the other hand, I side with those who believe that...</p></div>
                          </div>
                        </div>
                      </div>

                      {/* Dạng 4: Partly Agree */}
                      <div className="border border-indigo-100 rounded-xl overflow-hidden">
                        <div className="bg-indigo-50 p-3 border-b border-indigo-100 font-bold text-indigo-800">4. Dạng Partly Agree (Đồng ý một phần / Tùy hoàn cảnh)</div>
                        <div className="p-4 text-sm text-slate-700 space-y-3">
                          <div className="bg-slate-50 p-3 rounded border border-slate-200">
                            <span className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wider">Introduction</span>
                            <p><b>[Thesis]:</b> I believe that this depends on [yếu tố phụ thuộc - VD: the financial background of a country].</p>
                          </div>
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 bg-rose-50 p-3 rounded border border-rose-100"><span className="font-bold text-rose-700 block mb-1">Body 1 (Đồng ý cho Nhóm A)</span><p>On the one hand, this policy should be implemented in [Developed countries] because...</p></div>
                            <div className="flex-1 bg-emerald-50 p-3 rounded border border-emerald-100"><span className="font-bold text-emerald-700 block mb-1">Body 2 (Không đồng ý cho Nhóm B)</span><p>On the other hand, [Developing nations] should not do the same due to...</p></div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded border border-slate-200">
                            <span className="font-bold text-slate-800 block mb-1 text-xs uppercase tracking-wider">Conclusion</span>
                            <p>In conclusion, there is no one-size-fits-all answer regarding [vấn đề]. While this should be the case in [Nhóm A], I believe [Nhóm B] should not do the same due to potential adverse outcomes.</p>
                          </div>
                        </div>
                      </div>

                      {/* Dạng 5: Is X the best way? */}
                      <div className="border border-indigo-100 rounded-xl overflow-hidden">
                        <div className="bg-indigo-50 p-3 border-b border-indigo-100 font-bold text-indigo-800">5. Dạng Is X the best way? (Có phải X là cách tốt nhất?)</div>
                        <div className="p-4 text-sm text-slate-700 space-y-3">
                          <div className="bg-slate-50 p-3 rounded border border-slate-200">
                            <p><b>[Chiến thuật]:</b> Bạn phải <b>Disagree</b>. Vì nếu đồng ý là "Best", bạn sẽ không còn ý tưởng để viết.</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1 bg-rose-50 p-3 rounded border border-rose-100"><span className="font-bold text-rose-700 block mb-1">Body 1 (Hạ View)</span><p>Thừa nhận cách X vẫn mang lại lợi ích nhất định. <br/>"Admittedly, [Cách X] is effective to a certain extent."</p></div>
                            <div className="flex-1 bg-emerald-50 p-3 rounded border border-emerald-100"><span className="font-bold text-emerald-700 block mb-1">Body 2 (Nâng View)</span><p>Đưa ra các cách KHÁC (Alternatives) hiệu quả bằng hoặc hơn X.<br/>"However, there are other equally effective methods to tackle this issue, such as..."</p></div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </section>

                  {/* --- PHẦN 3: BỘ PARAPHRASE THESIS --- */}
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="bg-fuchsia-600 text-white p-3 flex items-center gap-2">
                      <MessageSquareDiff size={18} className="text-fuchsia-200"/> <h4 className="font-bold tracking-wide uppercase text-sm">3. Bộ Paraphrase Thesis (Chốt Mở Bài) Linh Hoạt</h4>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-700">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <span className="font-bold text-emerald-700 flex items-center gap-2 mb-3">Hướng 1: Lợi lớn hơn Hại (Ủng hộ)</span>
                           <ul className="space-y-4">
                              <li className="flex gap-2 items-start"><span className="text-emerald-500 mt-0.5 font-bold">1.</span> <span>While this trend may <b>bring about certain disadvantages</b>, I believe the <b>associated advantages far outweigh them</b>.</span></li>
                              <li className="flex gap-2 items-start"><span className="text-emerald-500 mt-0.5 font-bold">2.</span> <span><b>Despite the potential negative consequences</b> of this practice, I would argue that it <b>yields far more positive outcomes</b>.</span></li>
                              <li className="flex gap-2 items-start"><span className="text-emerald-500 mt-0.5 font-bold">3.</span> <span>Although there are <b>valid concerns regarding</b> this issue, the long-term benefits it brings are <b>of greater significance</b>.</span></li>
                           </ul>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <span className="font-bold text-rose-700 flex items-center gap-2 mb-3">Hướng 2: Hại lớn hơn Lợi (Phản đối)</span>
                           <ul className="space-y-4">
                              <li className="flex gap-2 items-start"><span className="text-rose-500 mt-0.5 font-bold">1.</span> <span>Although this proposition could <b>offer certain benefits</b>, I believe its <b>associated disadvantages are more significant</b>.</span></li>
                              <li className="flex gap-2 items-start"><span className="text-rose-500 mt-0.5 font-bold">2.</span> <span><b>Despite the undeniable benefits</b> of this trend, the potential drawbacks it entails are <b>far more substantial</b>.</span></li>
                              <li className="flex gap-2 items-start"><span className="text-rose-500 mt-0.5 font-bold">3.</span> <span>Admittedly, this approach is <b>advantageous to a certain extent</b>; however, I would argue that the <b>negative implications are much greater</b>.</span></li>
                           </ul>
                        </div>
                    </div>
                  </section>

                  {/* --- PHẦN 4: PARAPHRASE TOPIC SENTENCE & TỪ NỐI CHUYỂN Ý --- */}
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="bg-amber-500 text-white p-3 flex items-center gap-2">
                      <Layers size={18} className="text-amber-100"/> <h4 className="font-bold tracking-wide uppercase text-sm">4. Bộ Paraphrase Topic Sentence & Từ Nối Chuyển Ý</h4>
                    </div>
                    <div className="p-5 space-y-5 text-sm text-slate-700">
                        
                        <div className="flex flex-col md:flex-row gap-5">
                            {/* Body 1 */}
                            <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                               <span className="font-bold text-rose-700 flex items-center gap-2 mb-3">Mở đoạn Body 1 (40% - Nhượng bộ)</span>
                               <ul className="space-y-3 font-medium">
                                  <li className="flex gap-2 items-start"><span className="text-rose-400 mt-0.5 font-bold">1.</span> <span><b>Admittedly, there is some validity to the argument that</b> [Quan điểm đối lập].</span></li>
                                  <li className="flex gap-2 items-start"><span className="text-rose-400 mt-0.5 font-bold">2.</span> <span><b>Granted,</b> [Chủ đề] <b>does yield certain</b> benefits / drawbacks.</span></li>
                                  <li className="flex gap-2 items-start"><span className="text-rose-400 mt-0.5 font-bold">3.</span> <span><b>On the one hand, it is understandable why some advocate / oppose</b> [Vấn đề].</span></li>
                                  <li className="flex gap-2 items-start"><span className="text-rose-400 mt-0.5 font-bold">4.</span> <span><b>It is undeniable that</b> [Chủ đề] <b>presents certain</b> challenges / advantages.</span></li>
                               </ul>
                            </div>
                            
                            {/* Body 2 */}
                            <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                               <span className="font-bold text-emerald-700 flex items-center gap-2 mb-3">Mở đoạn Body 2 (60% - Phản biện & Khẳng định)</span>
                               <ul className="space-y-3 font-medium">
                                  <li className="flex gap-2 items-start"><span className="text-emerald-500 mt-0.5 font-bold">1.</span> <span><b>However, I would argue that these</b> positive/negative aspects <b>are eclipsed by</b>...</span></li>
                                  <li className="flex gap-2 items-start"><span className="text-emerald-500 mt-0.5 font-bold">2.</span> <span><b>On the other hand, I firmly believe that the aforementioned</b> drawbacks <b>are of lesser significance compared to</b>...</span></li>
                                  <li className="flex gap-2 items-start"><span className="text-emerald-500 mt-0.5 font-bold">3.</span> <span><b>Despite the valid points raised above, the</b> advantages of [Chủ đề] <b>are far more substantial.</b></span></li>
                                  <li className="flex gap-2 items-start"><span className="text-emerald-500 mt-0.5 font-bold">4.</span> <span><b>That being said / Having said that, the long-term impacts of</b> [Chủ đề] <b>justify</b>...</span></li>
                               </ul>
                            </div>
                        </div>

                        {/* Nối ý Idea 1 -> Idea 2 */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <span className="font-bold text-indigo-700 flex items-center gap-2 mb-3">Từ nối thêm ý tưởng (Từ Idea 1 sang Idea 2 trong cùng đoạn)</span>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <ul className="space-y-2 font-medium">
                                 <li>• <b>Another significant factor to consider is</b> that...</li>
                                 <li>• <b>Beyond that,</b> S + V <i className="text-slate-400 text-xs">(Rất Tây, thay cho Furthermore)</i></li>
                              </ul>
                              <ul className="space-y-2 font-medium">
                                 <li>• <b>Equally important is the fact that</b> S + V</li>
                                 <li>• <b>Coupled with this is</b> the [Noun phrase]...</li>
                              </ul>
                           </div>
                        </div>

                    </div>
                  </section>

                  {/* --- PHẦN 5: NGÔN NGỮ PHÁT TRIỂN Ý (IDEA DEVELOPMENT) --- */}
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="bg-blue-600 text-white p-3 flex items-center gap-2">
                      <Languages size={18} className="text-blue-200"/> <h4 className="font-bold tracking-wide uppercase text-sm">5. "Vũ khí" Nối Ý & Phát Triển Ý (Idea Development)</h4>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-700">
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <span className="font-bold text-slate-800 flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Đưa ra Nguyên nhân (Reason)</span>
                           <ul className="space-y-2 font-mono text-[13px] text-indigo-700">
                              <li>• This is because + S + V</li>
                              <li>• This is due to the fact that + S + V</li>
                              <li>• The primary reason behind this is that...</li>
                           </ul>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <span className="font-bold text-slate-800 flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Đưa ra Hệ quả (Impact)</span>
                           <ul className="space-y-2 font-mono text-[13px] text-indigo-700">
                              <li>• Therefore / As a result / Consequently, S + V</li>
                              <li>• S + V, <span className="font-bold text-rose-600">which leads to / results in</span> + Noun</li>
                              <li>• S + V, <span className="font-bold text-rose-600">thus / thereby</span> + V-ing</li>
                              <li>• It makes it + [adj] + for sb to do sth</li>
                           </ul>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <span className="font-bold text-slate-800 flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Đưa ra Ví dụ (Example)</span>
                           <ul className="space-y-2 font-mono text-[13px] text-indigo-700">
                              <li>• For instance / For example, S + V</li>
                              <li>• <span className="font-bold text-amber-600">A case in point is that</span> + S + V</li>
                           </ul>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <span className="font-bold text-slate-800 flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Thay thế linh hoạt (This / Such)</span>
                           <ul className="space-y-2 font-mono text-[13px] text-indigo-700">
                              <li>• <span className="font-bold text-blue-600">This + Noun:</span> This practice / this trend / this proposition / this policy / this issue.</li>
                              <li>• <span className="font-bold text-blue-600">Such a + Noun:</span> Such a shift requires...</li>
                              <li>• <span className="font-bold text-blue-600">Doing so:</span> Doing so requires significant investment...</li>
                           </ul>
                        </div>

                    </div>
                  </section>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODALS (Paraphrase, Sample, Vocab, Import, Ideas...) */}
        {showParaphraseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Wrench className="text-indigo-600" size={20} /> Công Cụ Paraphrase (Elevator Tool)
                </h3>
                <button onClick={() => !isParaphrasing && setShowParaphraseModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50" disabled={isParaphrasing}><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative bg-slate-50">
                 <div className="mb-6"><label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Câu của bạn</label><textarea rows={3} className="w-full border border-indigo-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white font-medium text-slate-800 shadow-sm" value={paraphraseInput} onChange={(e) => setParaphraseInput(e.target.value)} disabled={isParaphrasing} /></div>
                 {isParaphrasing ? (
                   <div className="flex flex-col items-center justify-center py-10"><Loader2 className="animate-spin text-indigo-500 mb-4" size={48} /><h3 className="text-lg font-bold text-slate-700">AI đang phân tích và viết lại câu...</h3></div>
                 ) : paraphraseResult ? (
                   <div className="space-y-4 animate-fadeIn">
                      <div className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm relative group"><div className="absolute top-0 left-0 w-2 h-full bg-slate-400 rounded-l-xl"></div><div className="flex justify-between items-start mb-2 pl-2"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-black uppercase tracking-wider">Band 6.5+ | Tự nhiên & Rõ ràng</span><button onClick={() => copyToClipboard(paraphraseResult.band65.text)} className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 text-xs font-bold"><Copy size={14}/> Copy</button></div><p className="text-slate-800 font-medium pl-2 mb-3">{paraphraseResult.band65.text}</p><p className="text-sm text-slate-500 italic pl-2 border-l-2 border-slate-100 ml-1">{paraphraseResult.band65.reason}</p></div>
                      <div className="bg-white border-2 border-amber-200 rounded-xl p-5 shadow-sm relative group"><div className="absolute top-0 left-0 w-2 h-full bg-amber-400 rounded-l-xl"></div><div className="flex justify-between items-start mb-2 pl-2"><span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-black uppercase tracking-wider">Band 7.5+ | Học thuật & Nâng cao</span><button onClick={() => copyToClipboard(paraphraseResult.band75.text)} className="text-slate-400 hover:text-amber-600 flex items-center gap-1 text-xs font-bold"><Copy size={14}/> Copy</button></div><p className="text-slate-800 font-medium pl-2 mb-3">{paraphraseResult.band75.text}</p><p className="text-sm text-slate-500 italic pl-2 border-l-2 border-slate-100 ml-1">{paraphraseResult.band75.reason}</p></div>
                   </div>
                 ) : ( <div className="text-center text-slate-400 mt-10">Bấm "Phân Tích & Viết Lại" để xem 2 phiên bản thay thế cho câu của bạn.</div> )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0"><button onClick={handleParaphrase} disabled={isParaphrasing || !paraphraseInput.trim()} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md">{isParaphrasing ? <Loader2 className="animate-spin" size={18} /> : <Wrench size={18} />} Phân Tích & Viết Lại</button></div>
            </div>
          </div>
        )}

        {showSampleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BookOpen className="text-emerald-600" size={20} /> Thêm Bài Mẫu</h3><button onClick={() => !isSavingSample && setShowSampleModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50" disabled={isSavingSample}><X size={20} /></button></div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                 {isSavingSample && (<div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-b-2xl"><Loader2 className="animate-spin text-emerald-500 mb-4" size={48} /><h3 className="text-xl font-bold text-slate-800">Đang lưu bài mẫu...</h3></div>)}
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Chủ đề (Bắt buộc) <span className="text-rose-500">*</span></label><select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500" value={newSample.topic} onChange={(e) => setNewSample({...newSample, topic: e.target.value, subtopic: ''})}><option value="">-- Chọn chủ đề --</option>{TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Chủ đề phụ <span className="text-rose-500">*</span></label><select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 disabled:opacity-50" value={newSample.subtopic} onChange={(e) => setNewSample({...newSample, subtopic: e.target.value})} disabled={!newSample.topic}><option value="">-- Chọn chủ đề phụ --</option>{newSample.topic && SUBTOPICS[newSample.topic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Đề bài (Prompt) <span className="text-rose-500">*</span></label><textarea rows={2} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 resize-none" value={newSample.prompt} onChange={(e) => setNewSample({...newSample, prompt: e.target.value})}/>
                       {newSample.prompt.trim().length > 20 && (() => { const similar = sampleEssays.find(s => calculateSimilarity(newSample.prompt, s.prompt) > 70); if (similar) { return ( <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 items-start animate-fadeIn"><AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" /><div><p className="text-sm font-bold text-amber-800">Cảnh báo: Đề bài này có thể đã tồn tại!</p><p className="text-xs text-amber-700 mt-1 leading-relaxed">Phát hiện một đề bài giống đến trên 70% trong kho của bạn: <br/><span className="italic font-medium">"{similar.prompt}"</span></p></div></div> ); } return null; })()}
                    </div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Nội dung Bài Viết <span className="text-rose-500">*</span></label><textarea rows={8} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 resize-none" value={newSample.content} onChange={(e) => setNewSample({...newSample, content: e.target.value})}/></div>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0"><button onClick={() => setShowSampleModal(false)} disabled={isSavingSample} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Hủy</button><button onClick={handleSaveSample} disabled={isSavingSample} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md"><Save size={18} /> Lưu Bài Mẫu</button></div>
            </div>
          </div>
        )}

        {showVocabModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BookPlus className="text-indigo-600" size={20} /> {selectionPopup.text ? 'Lưu nhanh Từ Vựng' : 'Thêm Từ Vựng'}</h3>
                 <button onClick={() => !isGeneratingVocabDetails && setShowVocabModal(false)} disabled={isGeneratingVocabDetails} className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                 {isGeneratingVocabDetails && (
                   <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-b-2xl">
                     <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                     <h3 className="text-xl font-bold text-slate-800">AI đang xử lý...</h3>
                     <p className="text-slate-500 text-sm mt-2">Đang tìm nghĩa và 2 câu ví dụ siêu xịn cho từ này</p>
                   </div>
                 )}
                 <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-center gap-3 cursor-pointer" onClick={() => setIsAutoVocab(!isAutoVocab)}>
                       <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${isAutoVocab ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isAutoVocab ? 'translate-x-4' : 'translate-x-0'}`}></div>
                       </div>
                       <div className="flex-1">
                          <span className="font-bold text-indigo-900 text-sm block">✨ AI Tự động dịch & tạo ví dụ</span>
                          <span className="text-xs text-indigo-700">Tắt đi nếu bạn muốn tự nhập tay toàn bộ</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Chủ đề <span className="text-rose-500">*</span></label><select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500" value={newVocab.topic} onChange={(e) => setNewVocab({...newVocab, topic: e.target.value, subtopic: ''})}><option value="">-- Chọn chủ đề --</option>{TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Chủ đề phụ</label><select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 disabled:opacity-50" value={newVocab.subtopic} onChange={(e) => setNewVocab({...newVocab, subtopic: e.target.value})} disabled={!newVocab.topic}><option value="">-- Chọn chủ đề phụ --</option>{newVocab.topic && SUBTOPICS[newVocab.topic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Cụm từ / Từ vựng <span className="text-rose-500">*</span></label>
                       <input type="text" placeholder="VD: make a concerted effort to" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 font-bold text-indigo-800 bg-indigo-50/30" value={newVocab.phrase} onChange={(e) => setNewVocab({...newVocab, phrase: e.target.value})}/>
                    </div>

                    {!isAutoVocab ? (
                      <div className="space-y-4 animate-fadeIn pt-2 border-t border-slate-100">
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Nghĩa Tiếng Việt <span className="text-rose-500">*</span></label><input type="text" placeholder="VD: nỗ lực phối hợp/chủ động để..." className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1" value={newVocab.translation} onChange={(e) => setNewVocab({...newVocab, translation: e.target.value})}/></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Câu ví dụ 1 (Tùy chọn)</label><input type="text" placeholder="Ví dụ về cách dùng cụm từ này..." className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1" value={newVocab.example1} onChange={(e) => setNewVocab({...newVocab, example1: e.target.value})}/></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Câu ví dụ 2 (Tùy chọn)</label><input type="text" placeholder="Ví dụ khác về cách dùng cụm từ này..." className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1" value={newVocab.example2} onChange={(e) => setNewVocab({...newVocab, example2: e.target.value})}/></div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center animate-fadeIn mt-2">
                         <Sparkles className="mx-auto text-indigo-400 mb-2" size={24} />
                         <p className="text-sm font-medium text-slate-600">Bạn chỉ cần chọn chủ đề.<br/>AI sẽ tự điền nghĩa Tiếng Việt và sinh 2 câu ví dụ Band 8.0 cho bạn sau khi bấm Lưu.</p>
                      </div>
                    )}
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                 <button onClick={() => setShowVocabModal(false)} disabled={isGeneratingVocabDetails} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50">Hủy</button>
                 <button onClick={handleSaveCustomVocab} disabled={isGeneratingVocabDetails} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md disabled:opacity-50">
                    {isAutoVocab ? <><Wand2 size={18} /> Lưu & Nhờ AI Sinh Nghĩa</> : <><Save size={18} /> Lưu Từ Vựng</>}
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* --- GLOBAL FLOATING BUTTON FOR TEXT SELECTION --- */}
        {selectionPopup.show && (
          <div id="quick-save-vocab-btn" className="fixed z-50 animate-slideUp pointer-events-auto" style={{ left: `${Math.max(20, Math.min(window.innerWidth - 180, selectionPopup.x - 80))}px`, top: `${Math.max(20, selectionPopup.y)}px` }}>
            <button onMouseDown={(e) => e.preventDefault()} onClick={handleOpenQuickSaveVocab} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl flex items-center gap-2 font-bold text-sm transition-transform hover:scale-105 border border-slate-700">
              <Highlighter size={16} className="text-amber-400" /><span>Lưu Từ Này</span>
            </button>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-r border-b border-slate-700"></div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Upload className="text-emerald-600" size={20} /> Phục Hồi Dữ Liệu</h3><button onClick={() => !isImporting && setShowImportModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" disabled={isImporting}><X size={20} /></button></div>
              <div className="p-6"><p className="text-sm text-slate-600 mb-4">Mở file JSON bạn đã tải xuống bằng Notepad (hoặc TextEdit), copy toàn bộ nội dung và dán vào ô bên dưới:</p><textarea value={importDataString} onChange={(e) => setImportDataString(e.target.value)} placeholder="Dán nội dung file JSON vào đây..." disabled={isImporting} className="w-full h-[45vh] p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-700 outline-none resize-none shadow-inner focus:ring-2 focus:ring-emerald-500 custom-scrollbar disabled:opacity-50" /></div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3"><button onClick={() => setShowImportModal(false)} disabled={isImporting} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50">Hủy</button><button onClick={processImportBackup} disabled={isImporting || !importDataString.trim()} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md">{isImporting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />} {isImporting ? "Đang khôi phục..." : "Khôi Phục Lên Hệ Thống"}</button></div>
            </div>
          </div>
        )}

        {editingSample && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Edit3 className="text-indigo-600" size={20} /> Chỉnh Sửa Bài Mẫu</h3><button onClick={() => setEditingSample(null)} className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><X size={20} /></button></div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Chủ đề (Bắt buộc) <span className="text-rose-500">*</span></label><select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500" value={editingSample.topic} onChange={(e) => setEditingSample({...editingSample, topic: e.target.value, subtopic: ''})}><option value="">-- Chọn chủ đề --</option>{TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Chủ đề phụ</label><select className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 disabled:opacity-50" value={editingSample.subtopic} onChange={(e) => setEditingSample({...editingSample, subtopic: e.target.value})} disabled={!editingSample.topic}><option value="">-- Chọn chủ đề phụ --</option>{editingSample.topic && SUBTOPICS[editingSample.topic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    </div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Đề bài (Prompt) <span className="text-rose-500">*</span></label><textarea rows={2} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 resize-none" value={editingSample.prompt || ''} onChange={(e) => setEditingSample({...editingSample, prompt: e.target.value})}/></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Nội dung Bài Viết <span className="text-rose-500">*</span></label><textarea rows={8} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 resize-none" value={editingSample.content || ''} onChange={(e) => setEditingSample({...editingSample, content: e.target.value})}/></div>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0"><button onClick={() => setEditingSample(null)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Hủy</button><button onClick={handleUpdateSample} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md"><Save size={18} /> Lưu Thay Đổi</button></div>
            </div>
          </div>
        )}

        {showIdeasModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-[90vw] md:max-w-6xl overflow-hidden animate-slideUp flex flex-col max-h-[95vh] md:max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Lightbulb className="text-amber-500" size={20} /> Sơ đồ tư duy EGOSFI</h3><button onClick={() => setShowIdeasModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"><X size={20} /></button></div>
              <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 relative">
                 {isGeneratingIdeas ? (
                   <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 py-20"><Loader2 className="animate-spin text-amber-500" size={48} /><p className="font-bold text-lg text-slate-600">AI đang quét và phân tích EGOSFI...</p></div>
                 ) : mindMapData ? (
                   <div className="relative w-full max-w-5xl mx-auto">
                     <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 hidden lg:block z-0 rounded-full"></div>
                     <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6 lg:gap-8 relative z-10">
                        <div className="flex-1 bg-white border-2 border-rose-200 rounded-2xl p-5 shadow-lg relative overflow-hidden transform transition-transform hover:-translate-y-1">
                           <div className="absolute top-0 left-0 w-2 h-full bg-rose-400"></div><h4 className="text-lg font-black text-rose-700 mb-6 flex items-center gap-2"><Layers size={20}/> {mindMapData.body2?.title || 'Body 2'}</h4>
                           <div className="space-y-6">
                             <div>
                               <span className="text-xs font-black uppercase text-rose-500 mb-3 block tracking-wider bg-rose-50 inline-block px-2 py-1 rounded">💡 Ý Tưởng (Ideas)</span>
                               <ul className="space-y-4 text-sm font-medium text-slate-700">
                                 {mindMapData.body2?.ideas?.map((ideaObj, i) => (
                                   <li key={i} className="flex flex-col gap-1.5 items-start">
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border tracking-wider shadow-sm flex items-center gap-1 ${getEgosfiColor(ideaObj.category)}`}>{ideaObj.category} {ideaObj.subCategory && <span className="opacity-75">| {ideaObj.subCategory}</span>}</span>
                                      <div className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 w-full overflow-hidden shadow-sm hover:shadow transition-shadow"><div className="px-3 py-2 border-b border-slate-100 bg-white font-bold text-slate-800 leading-snug">👉 {ideaObj.content}</div>{ideaObj.support && (<div className="px-3 py-2.5 text-xs text-slate-600 bg-emerald-50/30 flex items-start gap-2"><span className="font-bold text-emerald-500 mt-0.5 shrink-0">↳</span> <span className="leading-relaxed"><span className="font-bold text-slate-500">Phát triển:</span> {ideaObj.support}</span></div>)}</div>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                             <div className="pt-4 border-t border-rose-100"><span className="text-xs font-black uppercase text-rose-500 mb-3 block tracking-wider bg-rose-50 inline-block px-2 py-1 rounded">📝 Từ Vựng (Lexical)</span><div className="flex flex-wrap gap-2">{mindMapData.body2?.vocab?.map((v, i) => <span key={i} className="bg-white text-rose-700 border border-rose-300 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">{v}</span>)}</div></div>
                           </div>
                        </div>
                        <div className="w-full lg:w-56 shrink-0 flex items-center justify-center my-2 lg:my-0"><div className="bg-gradient-to-br from-amber-100 to-orange-100 border-4 border-amber-300 rounded-3xl p-6 text-center shadow-xl w-full relative transform hover:scale-105 transition-transform"><Brain className="mx-auto text-amber-600 mb-3" size={40} /><h3 className="font-black text-amber-900 text-lg leading-snug">{mindMapData.centralIdea || 'Tâm Sơ Đồ'}</h3></div></div>
                        <div className="flex-1 bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-lg relative overflow-hidden transform transition-transform hover:-translate-y-1">
                           <div className="absolute top-0 right-0 w-2 h-full bg-emerald-400"></div><h4 className="text-lg font-black text-emerald-700 mb-6 flex items-center justify-end gap-2 text-right"><Layers size={20}/> {mindMapData.body1?.title || 'Body 1'}</h4>
                           <div className="space-y-6">
                             <div className="text-right">
                               <span className="text-xs font-black uppercase text-emerald-500 mb-3 block tracking-wider bg-emerald-50 inline-block px-2 py-1 rounded ml-auto">💡 Ý Tưởng (Ideas)</span>
                               <ul className="space-y-4 text-sm font-medium text-slate-700 flex flex-col items-end text-right">
                                 {mindMapData.body1?.ideas?.map((ideaObj, i) => (
                                   <li key={i} className="flex flex-col gap-1.5 items-end w-full">
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border tracking-wider shadow-sm flex items-center gap-1 ${getEgosfiColor(ideaObj.category)}`}>{ideaObj.category} {ideaObj.subCategory && <span className="opacity-75">| {ideaObj.subCategory}</span>}</span>
                                      <div className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 w-full overflow-hidden shadow-sm hover:shadow transition-shadow" dir="rtl"><div className="px-3 py-2 border-b border-slate-100 bg-white font-bold text-slate-800 leading-snug">👉 {ideaObj.content}</div>{ideaObj.support && (<div className="px-3 py-2.5 text-xs text-slate-600 bg-emerald-50/30 flex items-start gap-2 text-right"><span className="font-bold text-emerald-500 mt-0.5 shrink-0">↲</span> <span className="leading-relaxed"><span className="font-bold text-slate-500">Phát triển:</span> {ideaObj.support}</span></div>)}</div>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                             <div className="pt-4 border-t border-emerald-100 text-right"><span className="text-xs font-black uppercase text-emerald-500 mb-3 block tracking-wider bg-emerald-50 inline-block px-2 py-1 rounded ml-auto">📝 Từ Vựng (Lexical)</span><div className="flex flex-wrap gap-2 justify-end">{mindMapData.body1?.vocab?.map((v, i) => <span key={i} className="bg-white text-emerald-700 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">{v}</span>)}</div></div>
                           </div>
                        </div>
                     </div>
                   </div>
                 ) : ( <p className="text-center text-slate-500 mt-10">Lỗi hiển thị dữ liệu...</p> )}
              </div>
              <div className="p-4 border-t border-slate-200 bg-white flex justify-end shrink-0"><button onClick={() => setShowIdeasModal(false)} className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shadow-lg">Đóng Sơ Đồ</button></div>
            </div>
          </div>
        )}

        {/* --- UI NOTIFICATIONS & CONFIRMS --- */}
        {toast.visible && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-slideUp px-6 py-3.5 rounded-2xl shadow-xl font-bold flex items-center gap-3 text-white max-w-md w-max ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-indigo-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={20}/> : toast.type === 'error' ? <AlertCircle size={20}/> : <Sparkles size={20}/>}
            <span className="text-sm">{toast.message}</span>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp">
               <div className="p-8 text-center">
                 <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                   <Trash2 size={32} />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 mb-2">Xác nhận xóa?</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">Dữ liệu này sẽ bị xóa vĩnh viễn và không thể khôi phục lại.</p>
               </div>
               <div className="flex border-t border-slate-100 bg-slate-50">
                 <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-200 transition-colors">Hủy Bỏ</button>
                 <button onClick={confirmDeleteAction} className="flex-1 py-4 bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors">Xóa Ngay</button>
               </div>
            </div>
          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
}