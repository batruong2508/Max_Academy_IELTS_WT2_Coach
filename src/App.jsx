import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Edit3, CheckCircle, Loader2, Sparkles, AlertTriangle, Play, Pause, RotateCcw,
  Brain, PenTool, Layers, ArrowRight, ArrowLeft, Wand2, Download, Upload, Plus, Trash2, X, Save, Award, Clock, Settings, RefreshCw,
  ListChecks, Library, ChevronDown, ChevronUp, Tags, Gamepad2, CheckCircle2, XCircle, ShieldAlert, Columns, Lightbulb,
  PanelRightOpen, PanelRightClose, BarChart3, Wrench, Copy, TrendingDown, Target, Filter, Circle, Search, AlertCircle,
  FileText, MessageSquareDiff, MessageSquare, Send, BookMarked, Languages, FastForward, Highlighter, BookPlus, LogOut, Key
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION (MÁY CHỦ CỦA BẠN) ---
let app, auth, db, appId;
try {
  const firebaseConfig = {
    apiKey: "AIzaSyB-jyWPSmuq2Y76Luk78nax87Jq2X-iTKc",
    authDomain: "max-academy-a6b50.firebaseapp.com",
    projectId: "max-academy-a6b50",
    storageBucket: "max-academy-a6b50.firebasestorage.app",
    messagingSenderId: "648894411192",
    appId: "1:648894411192:web:4e01eae686379de7b5df4d"
  };
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = 'max-academy-pro-prod'; 
} catch (e) {
  console.error("Firebase init error:", e);
}

const TOPICS = [
  { id: 'general', name: 'General (Đa chủ đề)' },
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
    { id: 'env_prob', name: 'Vấn đề môi trường' },
    { id: 'env_sol', name: 'Giải pháp bảo vệ' },
    { id: 'env_animal', name: 'Bảo vệ động vật' }
  ],
  technology: [
    { id: 'tech_impact', name: 'Tác động đời sống' },
    { id: 'tech_ai', name: 'AI & Tự động hóa' },
    { id: 'tech_comm', name: 'Giao tiếp trực tuyến' }
  ],
  society: [
    { id: 'soc_culture', name: 'Văn hóa & Toàn cầu hóa' },
    { id: 'soc_generation', name: 'Khoảng cách thế hệ' },
    { id: 'soc_housing', name: 'Nhà ở & Đô thị hóa' }
  ],
  health: [
    { id: 'health_diet', name: 'Chế độ ăn uống' },
    { id: 'health_gov', name: 'Trách nhiệm chính phủ' },
    { id: 'health_stress', name: 'Sức khỏe tinh thần' }
  ],
  work: [
    { id: 'work_balance', name: 'Cân bằng cuộc sống' },
    { id: 'work_remote', name: 'Làm việc từ xa' },
    { id: 'work_satisfaction', name: 'Sự hài lòng & Lương' }
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

// --- GEMINI API HELPERS (DÙNG API KEY CỦA HỌC VIÊN) ---
// DANH SÁCH "CHỐNG ĐẠN": Thử từ bản mới nhất xuống các bản định danh cứng ổn định
const AI_MODELS = [
  "gemini-2.5-flash",      // Ưu tiên bản mới nhất nếu cổng đang mở
  "gemini-1.5-flash",      // Bản ổn định chung
  "gemini-1.5-flash-001",  // Bản định danh cứng (không bao giờ bị lỗi 404)
  "gemini-1.5-pro",
  "gemini-pro"
]; 

async function fetchWithRetry(options, retries = 2) {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error("MISSING_API_KEY");
  
  const delays = [1000, 2000];
  let lastError = null;
  
  for (let model of AI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          if (response.status === 400 || response.status === 403) throw new Error("INVALID_API_KEY");
          if (response.status === 429) throw new Error("QUOTA_EXCEEDED");
          if (response.status === 404) {
             lastError = new Error("MODEL_NOT_FOUND");
             break; // Bỏ qua model này, thử model tiếp theo trong danh sách
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        if (error.message === "INVALID_API_KEY" || error.message === "MISSING_API_KEY" || error.message === "QUOTA_EXCEEDED") throw error;
        lastError = error;
        if (error.message === "MODEL_NOT_FOUND") break; // Chuyển model ngay lập tức
        if (i === retries - 1) break; 
        await new Promise(res => setTimeout(res, delays[i]));
      }
    }
  }
  throw lastError || new Error("ALL_MODELS_FAILED");
}

const parseGeminiResponse = (text) => {
  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(cleaned); } catch (e) {
    let tempCleaned = cleaned;
    while (tempCleaned.length > Math.max(0, cleaned.length - 20)) {
      tempCleaned = tempCleaned.slice(0, -1).trim();
      try { return JSON.parse(tempCleaned); } catch (err) {}
    }
    try {
      let noNewlines = cleaned.replace(/[\n\r\t]+/g, ' ');
      return JSON.parse(noNewlines);
    } catch (err) {
      let tempNoNewlines = noNewlines;
      while (tempNoNewlines.length > Math.max(0, noNewlines.length - 20)) {
        tempNoNewlines = tempNoNewlines.slice(0, -1).trim();
        try { return JSON.parse(tempNoNewlines); } catch (innerErr) {}
      }
    }
    throw e;
  }
};

const getFullSentenceDetails = (fullText, errorText, correctedText) => {
  if (!fullText || !errorText) return { before: '', error: errorText, after: '' };
  const index = fullText.indexOf(errorText);
  if (index === -1) return { before: '', error: errorText, after: '' };
  let start = index;
  while (start > 0 && !/[.!?\n]/.test(fullText[start - 1])) start--;
  let end = index + errorText.length;
  while (end < fullText.length && !/[.!?\n]/.test(fullText[end])) end++;
  if (end < fullText.length && /[.!?]/.test(fullText[end])) end++;
  const fullOriginal = fullText.substring(start, end).trim();
  const relativeIndex = fullOriginal.indexOf(errorText);
  return { 
    before: fullOriginal.substring(0, relativeIndex), 
    error: errorText, 
    after: fullOriginal.substring(relativeIndex + errorText.length), 
    corrected: correctedText 
  };
};

export default function App() {
  // --- AUTH & PERMISSION STATES ---
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(null); 
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('practice'); 
  
  // Practice States
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [prompt, setPrompt] = useState('');
  const [essay, setEssay] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [writingTarget, setWritingTarget] = useState('full');
  
  // Sidebars & Modals
  const [selectedSample, setSelectedSample] = useState(null); 
  const [selectedVocab, setSelectedVocab] = useState(null);
  const [showVocabSidebar, setShowVocabSidebar] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showParaphraseModal, setShowParaphraseModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showVocabModal, setShowVocabModal] = useState(false);

  // Guided Reading-to-Writing States
  const [showGuidedModal, setShowGuidedModal] = useState(false);
  const [guidedStep, setGuidedStep] = useState('reading'); 
  const [guidedArticle, setGuidedArticle] = useState(null);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [guidedExercise, setGuidedExercise] = useState(null);
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
  const [guidedAnswers, setGuidedAnswers] = useState({});

  // Evaluation & Data
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [sampleEssays, setSampleEssays] = useState([]);
  const [vocabularies, setVocabularies] = useState([]);
  const [evaluationsHistory, setEvaluationsHistory] = useState([]);
  
  const [mindMapData, setMindMapData] = useState(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [suggestedPromptVocabs, setSuggestedPromptVocabs] = useState([]);
  const [isGeneratingPromptVocabs, setIsGeneratingPromptVocabs] = useState(false);
  
  const [timeRemaining, setTimeRemaining] = useState(40 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [activeCommentIndex, setActiveCommentIndex] = useState(null);
  const [correctionAttempts, setCorrectionAttempts] = useState({});
  const commentRefs = useRef({});

  const [evalWidth, setEvalWidth] = useState(420);
  const isDraggingRef = useRef(false);

  const [paraphraseInput, setParaphraseInput] = useState('');
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [paraphraseResult, setParaphraseResult] = useState(null);
  const [selectionPopup, setSelectionPopup] = useState({ show: false, text: '', x: 0, y: 0 });
  const [newVocab, setNewVocab] = useState({ topic: '', subtopic: '', phrase: '', basePhrase: '', translation: '', example1: '', example2: '' });
  const [vocabStep, setVocabStep] = useState('init'); 

  const [filterSampleTopic, setFilterSampleTopic] = useState('');
  const [filterSampleSubtopic, setFilterSampleSubtopic] = useState('');
  const [filterVocabTopic, setFilterVocabTopic] = useState('');
  const [filterVocabSubtopic, setFilterVocabSubtopic] = useState('');
  const [filterQuizTopic, setFilterQuizTopic] = useState('');
  const [filterQuizSubtopic, setFilterQuizSubtopic] = useState('');

  const [quizStep, setQuizStep] = useState('setup'); 
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [wordBank, setWordBank] = useState([]);
  const [revealedHints, setRevealedHints] = useState({});

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importDataString, setImportDataString] = useState('');
  const [newSample, setNewSample] = useState({ topic: '', subtopic: '', prompt: '', content: '' });
  const [isRestoring, setIsRestoring] = useState(false);

  const editorRef = useRef(null);
  const promptRef = useRef(null);
  const timerRef = useRef(null);

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), duration);
  };

  const closeAllSidebars = () => {
    setSelectedSample(null);
    setSelectedVocab(null);
    setShowVocabSidebar(false);
  };

  // --- LOGIN & WHITELIST CHECK ---
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const q = query(collection(db, 'allowed_users'), where("email", "==", currentUser.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty && querySnapshot.docs[0].data().status === true) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error("Whitelist check error:", error);
          setIsAuthorized(false); 
        }
      } else {
        setIsAuthorized(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- CHECK API KEY ---
  useEffect(() => {
    if (isAuthorized === true) {
      const key = localStorage.getItem('gemini_api_key');
      if (!key) setShowApiKeyModal(true);
    }
  }, [isAuthorized]);

  // --- FETCH USER DATA ---
  useEffect(() => {
    if (!user || isAuthorized !== true || !db || !appId) return;
    const samplesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sample_essays');
    const unsubscribeSamples = onSnapshot(samplesRef, (snapshot) => {
      setSampleEssays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const vocabRef = collection(db, 'artifacts', appId, 'users', user.uid, 'vocabulary');
    const unsubscribeVocab = onSnapshot(vocabRef, (snapshot) => {
      setVocabularies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const evalsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'evaluations');
    const unsubscribeEvals = onSnapshot(evalsRef, (snapshot) => {
      setEvaluationsHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubscribeSamples(); unsubscribeVocab(); unsubscribeEvals(); };
  }, [user, isAuthorized]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (e) { showToast("Đăng nhập thất bại. Hãy thử lại.", "error"); } 
    finally { setIsLoggingIn(false); }
  };

  const handleLogout = async () => { await signOut(auth); };

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem('gemini_api_key', tempApiKey.trim());
      setShowApiKeyModal(false);
      showToast("Đã lưu API Key thành công!", "success");
    } else {
      showToast("Vui lòng nhập API Key", "error");
    }
  };

  // Cập nhật hàm xử lý lỗi
  const handleApiError = (error) => {
    if (error.message === "INVALID_API_KEY" || error.message === "MISSING_API_KEY") {
      setShowApiKeyModal(true);
      showToast("API Key không hợp lệ hoặc chưa được cung cấp!", "error", 5000);
    } else if (error.message === "QUOTA_EXCEEDED") {
      showToast("⚠️ API đang bị giới hạn số lần gọi (Lỗi 429). Hãy đợi 1 phút rồi thử lại nhé!", "error", 7000);
    } else if (error.message === "MODEL_NOT_FOUND" || error.message === "ALL_MODELS_FAILED") {
      showToast("⚠️ Lỗi 404: API Key của bạn không hỗ trợ các phiên bản AI này. Vui lòng tạo 1 API Key mới từ aistudio.google.com.", "error", 8000);
    } else {
      showToast(error.message || "Lỗi kết nối AI. Vui lòng thử lại sau.", "error");
    }
  };

  // --- UI EFFECTS ---
  useEffect(() => { setWordCount(essay.trim().split(/\s+/).filter(word => word.length > 0).length); }, [essay]);
  useEffect(() => { if (promptRef.current) { promptRef.current.style.height = 'auto'; promptRef.current.style.height = `${promptRef.current.scrollHeight}px`; } }, [prompt]);
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) timerRef.current = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
    else if (timeRemaining === 0) { setIsTimerRunning(false); clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, timeRemaining]);
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const newWidth = document.body.clientWidth - e.clientX;
      if (newWidth >= 320 && newWidth <= 800) setEvalWidth(newWidth);
    };
    const handleMouseUp = () => { if (isDraggingRef.current) { isDraggingRef.current = false; document.body.style.cursor = 'default'; } };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, []);

  const startDrag = (e) => { isDraggingRef.current = true; document.body.style.cursor = 'col-resize'; };

  useEffect(() => {
    const handleMouseUp = (e) => {
      if (e.target.closest('#selection-popup') || e.target.closest('.locate-btn') || showApiKeyModal) return;
      setTimeout(() => {
        let text = '';
        if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
          const start = document.activeElement.selectionStart;
          const end = document.activeElement.selectionEnd;
          if (start !== undefined && end !== undefined && start !== end) text = document.activeElement.value.substring(start, end).trim();
        } else text = window.getSelection().toString().trim();

        if (text && text.length > 0 && text.length < 100 && text.split(' ').length <= 15) {
          setSelectionPopup({ show: true, text: text, x: e.clientX, y: e.clientY - 60 });
        } else setSelectionPopup(prev => ({ ...prev, show: false }));
      }, 50);
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [showApiKeyModal]);

  // --- ACTIONS WITH ERROR HANDLING ---
  const handleOpenReviewVocab = () => {
    setNewVocab({ topic: selectedTopic || '', subtopic: selectedSubtopic || '', phrase: selectionPopup.text, basePhrase: '', translation: '', example1: '', example2: '' });
    setVocabStep('init'); setShowVocabModal(true); setSelectionPopup({ show: false, text: '', x: 0, y: 0 });
    window.getSelection().removeAllRanges();
  };

  const handleAnalyzeVocab = async () => {
    if (!newVocab.topic) return showToast("Vui lòng chọn Chủ đề để AI hiểu ngữ cảnh!", "error");
    if (!newVocab.phrase.trim()) return showToast("Vui lòng nhập từ vựng cần phân tích!", "error");
    setVocabStep('analyzing');
    const topicName = TOPICS.find(t => t.id === newVocab.topic)?.name || '';
    const systemInstruction = `Analyze the phrase: "${newVocab.phrase}" in the context of the IELTS topic "${topicName}". 
    CRITICAL INSTRUCTION: 1. Extract BASE FORM. 2. Provide 2 VERY SHORT examples (Band 7.5+, Max 15 words). 3. Wrap target vocab in <b> tags.
    Return strictly JSON: {"basePhrase": "...", "translation": "...", "example1": "...", "example2": "..."}`;
    
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Analyze vocab." }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      const aiData = parseGeminiResponse(result.candidates[0].content.parts[0].text);
      setNewVocab(prev => ({ ...prev, basePhrase: aiData.basePhrase || prev.phrase, translation: aiData.translation || '', example1: aiData.example1 || '', example2: aiData.example2 || '' }));
      setVocabStep('reviewed');
    } catch (error) { handleApiError(error); setVocabStep('init'); }
  };

  const handleConfirmSaveVocab = async () => {
    const targetPhrase = newVocab.basePhrase || newVocab.phrase;
    if (!targetPhrase) return showToast("Vui lòng nhập từ vựng!", "error");
    const isDuplicate = vocabularies.some(v => (v.phrase || '').toLowerCase().trim() === targetPhrase.toLowerCase().trim() && v.id !== newVocab.id);
    if (isDuplicate) return showToast(`Từ vựng đã tồn tại!`, "error");

    try {
      if (newVocab.id) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'vocabulary', newVocab.id), { topicId: newVocab.topic || '', subtopicId: newVocab.subtopic || '', phrase: targetPhrase, translation: newVocab.translation || '', examples: [newVocab.example1 || '', newVocab.example2 || ''] });
        showToast("Đã cập nhật từ vựng!", "success");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'vocabulary'), { topicId: newVocab.topic || '', subtopicId: newVocab.subtopic || '', phrase: targetPhrase, translation: newVocab.translation || '', examples: [newVocab.example1 || '', newVocab.example2 || ''], createdAt: new Date().toISOString() });
        showToast("Đã lưu từ vựng vào kho!", "success");
      }
      setShowVocabModal(false);
    } catch (error) { showToast("Lỗi lưu trữ: " + error.message, "error"); }
  };

  const handleOpenParaphraseFromSelection = () => {
    setParaphraseInput(selectionPopup.text); setParaphraseResult(null); setShowParaphraseModal(true);
    setSelectionPopup({ ...selectionPopup, show: false }); window.getSelection().removeAllRanges();
  };

  const handleParaphraseFromFooter = () => {
    if (!editorRef.current) return;
    const selectedText = essay.substring(editorRef.current.selectionStart, editorRef.current.selectionEnd);
    if (!selectedText || selectedText.trim().length < 5) return showToast("Vui lòng bôi đen một câu trong bài viết.", "error");
    setParaphraseInput(selectedText.trim()); setParaphraseResult(null); setShowParaphraseModal(true);
  };

  const handleGeneratePrompt = () => {
    const randomPrompt = sampleEssays.length > 0 ? sampleEssays[Math.floor(Math.random() * sampleEssays.length)].prompt : (selectedSubtopic && SAMPLE_PROMPTS[selectedSubtopic] ? SAMPLE_PROMPTS[selectedSubtopic] : "Some people think that technology is driving people apart, while others believe it is bringing people closer together. Discuss both views and give your opinion.");
    setPrompt(randomPrompt); setEssay(''); setTimeRemaining(40 * 60); setIsTimerRunning(false); setEvaluationResult(null); closeAllSidebars();
  };

  const handleSuggestIdeas = async () => {
    if (!prompt.trim()) return showToast("Vui lòng nhập đề bài trước.", "error");
    setShowIdeasModal(true); if (mindMapData) return; setIsGeneratingIdeas(true);
    const systemInstruction = `You are an IELTS Writing Task 2 expert. Generate an EGOSFI mind map for this prompt: "${prompt}".
    Structure ideas into View 40 (opposing) and View 60 (supporting). Use E, G, O, S, F, I categories.
    Return strictly JSON: { "centralIdea": "...", "view40": {"title": "...", "ideas": [{"letter": "S", "category": "...", "keyword": "...", "explanation": "..."}]}, "view60": {...} }`;
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Generate EGOSFI mind map." }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      setMindMapData(parseGeminiResponse(result.candidates[0].content.parts[0].text));
    } catch (error) { handleApiError(error); setShowIdeasModal(false); } finally { setIsGeneratingIdeas(false); }
  };

  const handleViewSampleFromPractice = () => {
    if (!prompt.trim()) return showToast("Vui lòng nhập đề bài trước.", "error");
    const matchedSample = sampleEssays.find(s => s.prompt.toLowerCase().trim() === prompt.toLowerCase().trim());
    if (matchedSample) { closeAllSidebars(); setSelectedSample(matchedSample); } 
    else showToast("Chưa có bài mẫu cho đề bài này trong Kho.", "info");
  };

  const handleSuggestPromptVocab = async () => { 
    if (!prompt.trim()) return showToast("Vui lòng nhập đề bài trước.", "error");
    closeAllSidebars(); setShowVocabSidebar(true); if (suggestedPromptVocabs.length > 0) return; setIsGeneratingPromptVocabs(true);
    const systemInstruction = `Suggest exactly 10 academic phrases for this prompt: "${prompt}". Return JSON array of objects with {phrase, meaning, source}.`;
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Suggest vocabulary." }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      setSuggestedPromptVocabs(parseGeminiResponse(result.candidates[0].content.parts[0].text));
    } catch (error) { handleApiError(error); setShowVocabSidebar(false); } finally { setIsGeneratingPromptVocabs(false); }
  };

  const handleStartGuidedWriting = async () => {
    if (!prompt.trim()) return showToast("Vui lòng nhập đề bài trước!", "error");
    setShowGuidedModal(true); setGuidedStep('reading'); setGuidedArticle(null); setGuidedExercise(null); setGuidedAnswers({}); setIsGeneratingArticle(true);
    const matchedSamples = sampleEssays.filter(s => s.prompt.toLowerCase().trim() === prompt.toLowerCase().trim()).slice(0, 3);
    const sampleText = matchedSamples.length > 0 ? matchedSamples.map((s, i) => `Sample ${i+1}:\n${s.content}`).join('\n\n') : "No specific samples available.";
    const systemInstruction = `Prompt: "${prompt}". Samples: ${sampleText}. 
    TASK: Write a 500-600 word objective, engaging popular science/news article. Use Band 8.0+ collocations naturally. 
    Highlight exactly 10 high-value collocations using strictly HTML <b> tags. 
    Return strictly JSON: {"title": "...", "content": "...", "collocations": [{"phrase": "...", "meaning": "..."}]}`;
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Generate Guided Article" }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      setGuidedArticle(parseGeminiResponse(result.candidates[0].content.parts[0].text));
    } catch (error) { handleApiError(error); setShowGuidedModal(false); } finally { setIsGeneratingArticle(false); }
  };

  const handleGenerateGuidedExercise = async () => {
    setGuidedStep('exercise'); setIsGeneratingExercise(true); setGuidedAnswers({}); 
    const systemInstruction = `Based on this article: "${guidedArticle.title}". Content: "${guidedArticle.content}". 
    Create a "Summary Completion" exercise. 1 short paragraph (80-100 words), 5 missing phrases ("___") strictly from bolded collocations. Provide 4 distractors.
    Return strictly JSON: {"summaryText": "...", "wordBank": ["...", "..."], "blanks": [{"id": 0, "answer": "...", "hint": "..."}]}`;
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Generate Summary Completion" }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      setGuidedExercise(parseGeminiResponse(result.candidates[0].content.parts[0].text));
    } catch (error) { handleApiError(error); setGuidedStep('reading'); } finally { setIsGeneratingExercise(false); }
  };

  const handleParaphrase = async () => { 
    if (!paraphraseInput.trim()) return;
    setIsParaphrasing(true); setParaphraseResult(null);
    const systemPrompt = `Paraphrase the following sentence in 2 styles: Band 6.5 and Band 7.5+. Input: "${paraphraseInput}". Return JSON: { "band65": "...", "band75": "..." }.`;
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }], generationConfig: { responseMimeType: "application/json" } })
      });
      setParaphraseResult(parseGeminiResponse(result.candidates[0].content.parts[0].text));
    } catch (error) { handleApiError(error); } finally { setIsParaphrasing(false); }
  };

  const handleEvaluate = async () => {
    if (wordCount < 30) return showToast("Vui lòng viết ít nhất 30 từ để AI có thể đánh giá.", "error");
    setIsEvaluating(true); setIsTimerRunning(false); setActiveCommentIndex(null); setCorrectionAttempts({});
    let targetInstruction = writingTarget === 'full' ? `Grade the FULL ESSAY.` : writingTarget === 'intro_conc' ? `The student is ONLY writing the INTRODUCTION and CONCLUSION. Evaluate based on Paraphrasing and Thesis.` : `The student is ONLY writing BODY PARAGRAPH(S). Evaluate based on flow, coherence and topic sentences.`;
    const systemInstruction = `You are an IELTS Writing Task 2 examiner. ${targetInstruction} 
    Provide 4 criteria scores, specific comments, and detailedCorrections: [{original, corrected, explanation}].
    Return strictly JSON: { "overallBand": 6.5, "trScore": 6.0, "trComment": "...", "ccScore": 7.0, "ccComment": "...", "lrScore": 6.0, "lrComment": "...", "graScore": 6.0, "graComment": "...", "detailedCorrections": [...], "polishedEssay": "Band 8.0 polished version of what student wrote." }`;
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Prompt: ${prompt}\nStudent Text (${writingTarget}): ${essay}` }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      const evaluation = parseGeminiResponse(result.candidates[0].content.parts[0].text);
      setEvaluationResult(evaluation);
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'evaluations'), { prompt, wordCount, target: writingTarget, overallBand: evaluation.overallBand, createdAt: new Date().toISOString() });
    } catch (error) { handleApiError(error); } finally { setIsEvaluating(false); }
  };

  const handleCheckCorrection = async (idx) => {
    const attempt = correctionAttempts[idx]?.text;
    if (!attempt || !attempt.trim()) return showToast("Vui lòng viết lại câu trước khi check.", "error");
    const correctionData = evaluationResult.detailedCorrections[idx];
    setCorrectionAttempts(prev => ({ ...prev, [idx]: { ...prev[idx], isSubmitting: true } }));
    const systemPrompt = `Evaluate if the student successfully fixed this error: "${correctionData.original}". Student's rewrite: "${attempt}". Return strictly JSON: { "isCorrect": true/false, "feedback": "Brief feedback max 15 words" }.`;
    try {
        const result = await fetchWithRetry({
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Check my rewrite." }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } })
        });
        const aiReview = parseGeminiResponse(result.candidates[0].content.parts[0].text);
        setCorrectionAttempts(prev => ({ ...prev, [idx]: { ...prev[idx], isSubmitting: false, reviewed: true, isCorrect: aiReview.isCorrect, feedback: aiReview.feedback } }));
    } catch (e) { handleApiError(e); setCorrectionAttempts(prev => ({ ...prev, [idx]: { ...prev[idx], isSubmitting: false } })); }
  };

  const handleStartQuiz = async () => {
    const filteredVocabs = vocabularies.filter(v => (filterQuizTopic ? v.topicId === filterQuizTopic : true) && (filterQuizSubtopic ? v.subtopicId === filterQuizSubtopic : true));
    if (filteredVocabs.length < 1) return showToast("Không có từ vựng nào. Hãy thêm từ mới nhé!", "error");
    setIsGeneratingQuiz(true); setQuizAnswers({}); setQuizResults(null); setRevealedHints({});
    const selectedVocabs = [...filteredVocabs].sort(() => 0.5 - Math.random()).slice(0, 10).map(v => v.basePhrase || v.phrase);
    const systemInstruction = `Create a fill-in-the-blank exercise for exactly these words: [${selectedVocabs.join(', ')}]. 
    Return strictly JSON: { "questions": [ { "question": "Sentence with ___", "answer": "exact word", "hint": "Smart hint" } ] }.`;
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Generate Quiz" }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      const aiData = parseGeminiResponse(result.candidates[0].content.parts[0].text);
      setQuizData(aiData.questions || []); setWordBank((aiData.questions || []).map(q => q.answer).sort(() => 0.5 - Math.random())); setQuizStep('playing');
    } catch (error) { handleApiError(error); } finally { setIsGeneratingQuiz(false); }
  };

  // --- STANDARD HELPERS ---
  const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  const handleLocateError = (originalText) => {
    if (!editorRef.current) return;
    const index = essay.indexOf(originalText);
    if (index !== -1) { editorRef.current.focus(); editorRef.current.setSelectionRange(index, index + originalText.length); editorRef.current.scrollTop = Math.max(0, (essay.substring(0, index).split('\n').length - 3) * 24); } 
    else showToast("Không tìm thấy câu này trong bài viết.", "info");
  };
  const triggerDelete = (col, id) => setDeleteConfirm({ col, id });
  const confirmDeleteAction = async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, deleteConfirm.col, deleteConfirm.id)); setDeleteConfirm(null); };
  const handleCheckQuiz = () => {
    let results = {};
    quizData.forEach((q, index) => { results[index] = (quizAnswers[index] || '').toLowerCase().trim().replace(/[.,!?]/g, '') === q.answer.toLowerCase().trim().replace(/[.,!?]/g, ''); });
    setQuizResults(results);
  };
  const renderHighlightedExample = (text) => {
    if (!text) return null;
    return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').split(/(<b>.*?<\/b>)/gi).map((part, i) => (part.toLowerCase().startsWith('<b>') && part.toLowerCase().endsWith('</b>')) ? <mark key={i} className="bg-emerald-200/70 text-emerald-900 px-1 py-0.5 mx-0.5 rounded-sm font-bold shadow-sm">{part.slice(3, -4)}</mark> : part);
  };
  const handleExportBackup = () => {
    const backupData = { sampleEssays, vocabularies, evaluationsHistory, exportDate: new Date().toISOString() };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" })); a.download = `ielts_coach_backup_${new Date().getTime()}.json`; a.click(); showToast('Đã tải file thành công', 'success');
  };
  const handleSaveSample = async () => {
    if (!newSample.prompt || !newSample.prompt.trim()) return showToast("Vui lòng nhập đề bài!", "error");
    if (sampleEssays.some(s => (s.prompt || '').toLowerCase().trim() === newSample.prompt.toLowerCase().trim() && s.id !== newSample.id)) return showToast("Đề bài này đã tồn tại!", "error");
    try {
      const safeData = { topic: newSample.topic || '', subtopic: newSample.subtopic || '', prompt: newSample.prompt || '', content: newSample.content || '' };
      if (newSample.id) { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sample_essays', newSample.id), safeData); showToast("Đã cập nhật!", "success"); } 
      else { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sample_essays'), { ...safeData, createdAt: new Date().toISOString() }); showToast("Đã thêm!", "success"); }
      setShowSampleModal(false); setNewSample({ topic: '', subtopic: '', prompt: '', content: '' });
    } catch (error) { showToast("Lỗi: " + error.message, "error"); }
  };
  const processImportBackup = async () => {
    if (!importDataString.trim()) return showToast("Vui lòng nhập JSON.", "error");
    setIsRestoring(true);
    try {
      const data = JSON.parse(importDataString);
      for (const s of data.sampleEssays || []) { const { id, ...r } = s; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sample_essays'), r); }
      for (const v of data.vocabularies || []) { const { id, ...r } = v; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'vocabulary'), r); }
      for (const e of data.evaluationsHistory || []) { const { id, ...r } = e; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'evaluations'), r); }
      setShowImportModal(false); setImportDataString(''); showToast(`Đã khôi phục thành công!`, 'success');
    } catch (e) { showToast("Dữ liệu JSON không hợp lệ.", "error"); } finally { setIsRestoring(false); }
  };

  // --- RENDER CONDITIONALS ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
         <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-md w-full text-center border animate-slideUp">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-inner"><PenTool size={40}/></div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">Max Academy Pro</h1>
            <p className="text-sm font-medium text-slate-500 mb-10 leading-relaxed">Hệ thống luyện thi IELTS Writing độc quyền tích hợp AI thông minh.</p>
            <button onClick={handleLogin} disabled={isLoggingIn} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-base py-4 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3">
               {isLoggingIn ? <Loader2 className="animate-spin" size={20}/> : <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-5 h-5 bg-white p-0.5 rounded-full" />}
               {isLoggingIn ? 'Đang kết nối...' : 'Đăng nhập bằng Google'}
            </button>
            <p className="text-[10px] text-slate-400 mt-6">*Chỉ các tài khoản học viên nội bộ mới được cấp quyền truy cập.</p>
         </div>
      </div>
    );
  }

  if (isAuthorized === null) {
    return <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-emerald-600 mb-4" size={40}/><p className="font-bold text-slate-500">Đang kiểm tra quyền truy cập...</p></div>;
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
         <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-md w-full text-center border animate-slideUp">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-inner"><ShieldAlert size={40}/></div>
            <h1 className="text-2xl font-black text-slate-800 mb-3">Truy cập bị từ chối</h1>
            <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
              Email <strong className="text-rose-600">{user.email}</strong> của bạn chưa được cấp quyền sử dụng hệ thống này. Vui lòng liên hệ với Admin để kích hoạt tài khoản.
            </p>
            <button onClick={handleLogout} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm py-4 rounded-2xl transition-all">Đăng xuất & Thử tài khoản khác</button>
         </div>
      </div>
    );
  }

  // --- RENDER APP COMPONENTS ---
  const renderTopNav = () => (
    <div className="w-full bg-slate-900 text-slate-300 flex flex-wrap lg:flex-nowrap items-center justify-between px-4 py-2 shrink-0 shadow-md z-20 relative gap-3">
      <div className="flex items-center gap-3 shrink-0">
        <div className="bg-emerald-500 p-1.5 rounded-lg text-white"><PenTool size={18} /></div>
        <div className="flex flex-col">
          <h1 className="text-white font-bold text-base leading-tight">Max Academy</h1>
          <p className="text-[10px] text-emerald-400 font-medium leading-tight">Pro Edition</p>
        </div>
      </div>
      
      <nav className="flex overflow-x-auto gap-1 bg-slate-800 p-1 rounded-xl w-full lg:w-auto order-last lg:order-none [&::-webkit-scrollbar]:hidden">
        {[
          { id: 'practice', icon: <Edit3 size={16} />, label: 'Luyện viết' },
          { id: 'samples', icon: <Library size={16} />, label: 'Kho bài mẫu' },
          { id: 'vocab', icon: <Tags size={16} />, label: 'Kho từ vựng' },
          { id: 'quiz', icon: <Gamepad2 size={16} />, label: 'Ôn từ vựng' },
          { id: 'tracker', icon: <BarChart3 size={16} />, label: 'Thống kê' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'hover:text-white'}`}>
            {tab.icon} <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        <div className="bg-slate-800 px-3 py-1.5 rounded-lg flex flex-col hidden sm:flex">
           <span className="text-[9px] text-slate-400 uppercase font-black">Học viên</span>
           <span className="text-xs text-white font-medium truncate max-w-[120px]">{user.email}</span>
        </div>
        <button onClick={() => setShowApiKeyModal(true)} className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors" title="Đổi API Key"><Key size={14} /></button>
        <button onClick={() => setActiveTab('backup')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors" title="Backup & Restore"><AlertTriangle size={14} /></button>
        <button onClick={handleLogout} className="bg-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors" title="Đăng xuất"><LogOut size={14} /></button>
      </div>
    </div>
  );

  const renderPracticeTab = () => {
    const getPlaceholderText = () => {
        if (writingTarget === 'intro_conc') return "Viết phần Mở bài và Kết bài của bạn tại đây... Bôi đen cụm từ bất kỳ để lưu vào Kho Từ Vựng Nhanh nhé.";
        if (writingTarget === 'body') return "Viết phần Thân bài (Body) của bạn tại đây... Bôi đen cụm từ bất kỳ để lưu vào Kho Từ Vựng Nhanh nhé.";
        return "Viết trọn vẹn bài essay của bạn tại đây... Bôi đen cụm từ bất kỳ để lưu vào Kho Từ Vựng Nhanh nhé.";
    };

    return (
    <div className="flex-1 flex p-2 lg:p-3 gap-3 min-h-0">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-0">
        
        <div className="border-b border-slate-100 p-2 lg:p-3 bg-slate-50 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-1.5 shrink-0">
              <select className="bg-white border border-slate-200 rounded-md px-2 py-1 outline-none text-xs w-[120px]" value={selectedTopic} onChange={(e) => {setSelectedTopic(e.target.value); setSelectedSubtopic('');}}>
                <option value="">Chủ đề</option> {TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select className="bg-white border border-slate-200 rounded-md px-2 py-1 outline-none text-xs w-[120px]" value={selectedSubtopic} onChange={(e) => setSelectedSubtopic(e.target.value)} disabled={!selectedTopic || selectedTopic === 'general'}>
                <option value="">Chủ đề phụ</option> {selectedTopic && SUBTOPICS[selectedTopic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={handleGeneratePrompt} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1"><RotateCcw size={12} /> Tạo Đề</button>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
               <span className="text-[10px] font-bold text-slate-500 uppercase hidden md:inline">Mục tiêu:</span>
               <select className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-md px-2 py-1 outline-none text-xs cursor-pointer hover:bg-indigo-100 transition-colors" value={writingTarget} onChange={(e) => setWritingTarget(e.target.value)}>
                  <option value="full">📝 Viết Cả bài (Full)</option>
                  <option value="intro_conc">🎯 Mở bài & Kết bài</option>
                  <option value="body">🧩 Chỉ viết Thân bài</option>
               </select>
            </div>
          </div>

          <textarea ref={promptRef} className="w-full bg-transparent text-slate-800 font-bold outline-none resize-y min-h-[40px] max-h-[120px] custom-scrollbar text-sm mt-2" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Nhập đề bài..." rows={2} />
          
          <div className="flex flex-wrap gap-1.5">
            <button onClick={handleStartGuidedWriting} className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"><BookOpen size={12} /> Hướng dẫn viết</button>
            <button onClick={() => { closeAllSidebars(); handleSuggestPromptVocab(); }} className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700"><Tags size={12} /> 10 Từ Ăn Điểm</button>
            <button onClick={() => { closeAllSidebars(); setShowStructureModal(true); }} className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-rose-100 text-rose-700"><Columns size={12} /> Cấu trúc 40/60</button>
            <button onClick={handleSuggestIdeas} className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-700"><Lightbulb size={12} /> Mind Map Idea</button>
            <button onClick={handleViewSampleFromPractice} className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700"><BookPlus size={12} /> Bài mẫu</button>
          </div>
        </div>

        <div className="flex-1 p-3 relative flex flex-col">
          <textarea ref={editorRef} className="w-full h-full resize-none outline-none text-slate-700 leading-relaxed text-[15px] lg:text-base placeholder-slate-400 custom-scrollbar" placeholder={getPlaceholderText()} value={essay} onChange={(e) => setEssay(e.target.value)} spellCheck={false} />
        </div>
        <div className="border-t border-slate-200 bg-slate-50 p-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
             <div className="px-2 py-1 rounded bg-white border text-xs font-bold">{wordCount} từ</div>
             <div className="bg-white px-2 py-1 rounded border flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
                {formatTime(timeRemaining)}
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-0.5 hover:text-emerald-600 transition-colors">{isTimerRunning ? <Pause size={12}/> : <Play size={12}/>}</button>
                <button onClick={() => { setIsTimerRunning(false); setTimeRemaining(40 * 60); }} className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors" title="Reset thời gian"><RotateCcw size={12}/></button>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={handleParaphraseFromFooter} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md font-bold text-xs">Sửa Câu</button>
             <button onClick={handleEvaluate} disabled={isEvaluating || !essay.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md font-bold text-xs flex items-center gap-1">
                {isEvaluating ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />} Chấm điểm
             </button>
          </div>
        </div>
      </div>

      {evaluationResult && (
        <div 
           className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-slideUp z-10 shrink-0 relative"
           style={{ width: `${evalWidth}px` }}
        >
           <div 
             className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/50 bg-transparent z-20 transition-colors flex items-center justify-center group"
             onMouseDown={startDrag}
           >
              <div className="w-1 h-8 bg-slate-300 rounded-full group-hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
           </div>

           <div className="bg-emerald-600 p-4 pl-6 text-white text-center flex items-center justify-between shrink-0">
              <div className="text-left"><span className="text-[10px] font-bold uppercase block opacity-80">Overall Band</span><span className="text-3xl font-black">{evaluationResult.overallBand}</span></div>
              <button onClick={() => setEvaluationResult(null)} className="p-1 hover:bg-emerald-700 rounded"><X size={20}/></button>
           </div>
           <div className="grid grid-cols-4 gap-px bg-slate-100 border-b">
              {[ { k: 'TR', v: evaluationResult.trScore }, { k: 'CC', v: evaluationResult.ccScore }, { k: 'LR', v: evaluationResult.lrScore }, { k: 'GRA', v: evaluationResult.graScore } ].map(s => (
                <div key={s.k} className="bg-white p-2 text-center"><div className="text-[10px] font-bold text-slate-400">{s.k}</div><div className="text-lg font-black text-slate-800">{s.v}</div></div>
              ))}
           </div>
           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
              
              <div>
                 <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5 text-sm"><ListChecks className="text-blue-500" size={16}/> Đánh giá theo tiêu chí</h4>
                 <div className="space-y-2.5">
                    {[
                      { id: 'Task Response', score: evaluationResult.trScore, comment: evaluationResult.trComment },
                      { id: 'Coherence & Cohesion', score: evaluationResult.ccScore, comment: evaluationResult.ccComment },
                      { id: 'Lexical Resource', score: evaluationResult.lrScore, comment: evaluationResult.lrComment },
                      { id: 'Grammatical Range & Accuracy', score: evaluationResult.graScore, comment: evaluationResult.graComment }
                    ].map(crit => (
                       <div key={crit.id} className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                          <div className="font-bold text-blue-800 text-[11px] mb-1.5 flex justify-between items-center">
                            <span className="uppercase tracking-wider">{crit.id}</span>
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-black">{crit.score}</span>
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed font-medium">{crit.comment}</p>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="pt-2 border-t">
                 <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5 text-sm"><Highlighter className="text-rose-500" size={16}/> Sửa lỗi chi tiết</h4>
                 <div className="space-y-4">
                    {evaluationResult.detailedCorrections.map((c, i) => {
                       const attemptState = correctionAttempts[i] || {};
                       const showAnswer = attemptState.showAnswer || attemptState.reviewed;
                       const sentenceDetails = getFullSentenceDetails(essay, c.original, c.corrected);
                       
                       return (
                         <div key={i} ref={(el) => (commentRefs.current[i] = el)} className={`p-4 rounded-xl border transition-all ${activeCommentIndex === i ? 'bg-indigo-50 border-indigo-300 shadow-md' : 'bg-slate-50 border-slate-100'}`} onMouseEnter={() => setActiveCommentIndex(i)} onMouseLeave={() => setActiveCommentIndex(null)}>
                            <div className="flex justify-between items-center mb-3">
                               <span className="text-[11px] font-black uppercase text-rose-600 tracking-wider flex items-center gap-1.5 bg-rose-100 px-2 py-1 rounded-md"><XCircle size={14}/> Lỗi cần sửa</span>
                               <button 
                                 onClick={() => handleLocateError(c.original)} 
                                 className="locate-btn shrink-0 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold shadow-sm" 
                                 title="Định vị câu này trong bài viết bên trái"
                               >
                                 <Target size={14}/> Tìm trong bài
                               </button>
                            </div>

                            <div className="bg-white border border-rose-200 p-3.5 rounded-xl mb-3 text-[13px] text-slate-700 leading-relaxed shadow-sm">
                               {sentenceDetails.before}
                               <span className="bg-rose-100 text-rose-700 font-bold px-1.5 mx-0.5 rounded border border-rose-200">{c.original}</span>
                               {sentenceDetails.after}
                            </div>

                            <div className="flex items-start gap-2.5 mb-4 bg-amber-50 border border-amber-100 p-3.5 rounded-xl shadow-sm">
                               <span className="shrink-0 mt-0.5 bg-amber-100 p-1 rounded-full"><Lightbulb size={14} className="text-amber-600"/></span>
                               <p className="text-slate-700 text-xs leading-relaxed"><strong>Giải thích:</strong> {c.explanation}</p>
                            </div>
                            
                            {!showAnswer ? (
                               <div className="flex flex-col gap-3 animate-fadeIn mt-2">
                                  <span className="text-[11px] font-bold text-slate-500">✍️ Hãy thử viết lại câu trên cho đúng:</span>
                                  <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all custom-scrollbar resize-none" rows={2} placeholder="Viết lại toàn bộ câu..." value={attemptState.text || ''} onChange={(e) => setCorrectionAttempts(prev => ({...prev, [i]: { ...prev[i], text: e.target.value }}))} disabled={attemptState.isSubmitting} />
                                  <div className="flex justify-between items-center mt-1">
                                    <button onClick={() => setCorrectionAttempts(prev => ({...prev, [i]: { ...prev[i], showAnswer: true }}))} className="text-[11px] text-slate-400 hover:text-slate-600 font-bold underline transition-colors">Bỏ qua & Xem đáp án</button>
                                    <button onClick={() => handleCheckCorrection(i)} disabled={attemptState.isSubmitting || !attemptState.text?.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-md transition-all">
                                      {attemptState.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Kiểm tra
                                    </button>
                                  </div>
                               </div>
                            ) : (
                               <div className="mt-4 space-y-3 animate-fadeIn">
                                  {attemptState.reviewed && (
                                     <div className={`p-3.5 rounded-xl text-xs font-medium border shadow-sm ${attemptState.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                        <span className="font-black text-sm flex items-center gap-1.5 mb-1.5">
                                           {attemptState.isCorrect ? <CheckCircle2 size={16} className="text-emerald-600"/> : <XCircle size={16} className="text-rose-600"/>}
                                           {attemptState.isCorrect ? "Tuyệt vời! Câu của bạn đã chính xác." : "Chưa chính xác lắm!"}
                                        </span>
                                        <span className="leading-relaxed block">{attemptState.feedback}</span>
                                     </div>
                                  )}
                                  
                                  <div className="pt-4 border-t border-slate-200">
                                     <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle2 size={14}/> Câu mẫu chuẩn (Band 8.0)</span>
                                     <div className="bg-white border border-emerald-200 p-3.5 rounded-xl text-[13px] text-slate-700 leading-relaxed shadow-sm">
                                        {sentenceDetails.before}
                                        <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 mx-0.5 rounded border border-emerald-200">{c.corrected}</span>
                                        {sentenceDetails.after}
                                     </div>
                                  </div>
                               </div>
                            )}
                         </div>
                       );
                    })}
                 </div>
              </div>
              
              <div className="pt-5 border-t">
                 <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5 text-sm md:text-base"><Award className="text-amber-500" size={18}/> Tham khảo (Band 8.0)</h4>
                 <div className="p-4 md:p-5 bg-amber-50/80 rounded-2xl text-sm md:text-base leading-loose text-amber-900 font-serif border border-amber-200/60 shadow-inner">
                    {evaluationResult.polishedEssay.split(/\n+/).filter(p => p.trim()).map((paragraph, idx) => (
                       <p key={idx} className="mb-4 last:mb-0 text-justify">{paragraph}</p>
                    ))}
                 </div>
              </div>
              
           </div>
        </div>
      )}
    </div>
  )};

  const renderSamplesTab = () => {
    const filteredSamples = sampleEssays.filter(s => {
      const matchTopic = filterSampleTopic ? s.topic === filterSampleTopic : true;
      const matchSubtopic = filterSampleSubtopic ? s.subtopic === filterSampleSubtopic : true;
      return matchTopic && matchSubtopic;
    });
    
    return (
    <div className="max-w-5xl mx-auto p-8 animate-fadeIn h-full flex flex-col w-full">
       <div className="flex justify-between items-center mb-8 shrink-0">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Library className="text-emerald-600"/> Kho Bài Mẫu</h2>
          <div className="flex items-center gap-3">
             <select className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500" value={filterSampleTopic} onChange={(e) => {setFilterSampleTopic(e.target.value); setFilterSampleSubtopic('');}}>
                <option value="">Lọc theo Chủ đề</option>
                {TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
             <select className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500" value={filterSampleSubtopic} onChange={(e) => setFilterSampleSubtopic(e.target.value)} disabled={!filterSampleTopic || filterSampleTopic === 'general'}>
                <option value="">Lọc Chủ đề phụ</option>
                {filterSampleTopic && SUBTOPICS[filterSampleTopic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
             <button onClick={() => { setNewSample({ topic: '', subtopic: '', prompt: '', content: '' }); setShowSampleModal(true); }} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-emerald-600/20"><Plus size={18}/> Thêm bài mẫu</button>
          </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar flex-1 pb-10 content-start">
          {filteredSamples.length === 0 ? <div className="col-span-full py-20 text-center text-slate-300 font-bold border-2 border-dashed rounded-3xl">Chưa có bài mẫu nào trong chủ đề này.</div> :
          filteredSamples.map(s => (
            <div key={s.id} onClick={() => setSelectedSample(s)} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors relative group h-fit">
               <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setNewSample({ id: s.id, topic: s.topic || '', subtopic: s.subtopic || '', prompt: s.prompt, content: s.content }); setShowSampleModal(true); }} className="text-slate-300 hover:text-blue-500 p-1"><Edit3 size={18}/></button>
                  <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); triggerDelete('sample_essays', s.id); }} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 size={18}/></button>
               </div>
               <div className="flex gap-2 mb-4">
                  {s.topic && <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg inline-block">{TOPICS.find(t => t.id === s.topic)?.name || s.topic}</span>}
                  {s.subtopic && <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-3 py-1 rounded-lg inline-block border">{SUBTOPICS[s.topic]?.find(st => st.id === s.subtopic)?.name || s.subtopic}</span>}
               </div>
               <h4 className="font-black text-slate-800 mb-3 text-sm leading-tight">{s.prompt}</h4>
               <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">{s.content}</p>
            </div>
          ))}
       </div>
    </div>
  )};

  const renderVocabTab = () => {
    const filteredVocabs = vocabularies.filter(v => {
      const matchTopic = filterVocabTopic ? v.topicId === filterVocabTopic : true;
      const matchSubtopic = filterVocabSubtopic ? v.subtopicId === filterVocabSubtopic : true;
      return matchTopic && matchSubtopic;
    });
    
    return (
    <div className="max-w-5xl mx-auto p-8 animate-fadeIn h-full flex flex-col w-full">
       <div className="flex justify-between items-center mb-8 shrink-0">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Tags className="text-indigo-600"/> Kho Từ Vựng</h2>
          <div className="flex items-center gap-3">
             <select className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500" value={filterVocabTopic} onChange={(e) => {setFilterVocabTopic(e.target.value); setFilterVocabSubtopic('');}}>
                <option value="">Lọc theo Chủ đề</option>
                {TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
             <select className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500" value={filterVocabSubtopic} onChange={(e) => setFilterVocabSubtopic(e.target.value)} disabled={!filterVocabTopic || filterVocabTopic === 'general'}>
                <option value="">Lọc Chủ đề phụ</option>
                {filterVocabTopic && SUBTOPICS[filterVocabTopic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
             <button onClick={() => { setNewVocab({ topic: '', subtopic: '', phrase: '', basePhrase: '', translation: '', example1: '', example2: '' }); setVocabStep('init'); setShowVocabModal(true); }} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-indigo-600/20"><Plus size={18}/> Thêm từ mới</button>
          </div>
       </div>
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar flex-1 pb-10 content-start">
          {filteredVocabs.length === 0 ? <div className="col-span-full py-20 text-center text-slate-300 font-bold border-2 border-dashed rounded-3xl">Chưa có từ vựng nào trong chủ đề này.</div> :
          filteredVocabs.map(v => (
            <div key={v.id} onClick={() => setSelectedVocab(v)} className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 relative group hover:border-indigo-300 transition-colors flex flex-col cursor-pointer text-left h-fit">
               <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setNewVocab({ id: v.id, topic: v.topicId || '', subtopic: v.subtopicId || '', phrase: v.phrase, basePhrase: v.phrase, translation: v.translation, example1: v.examples?.[0] || '', example2: v.examples?.[1] || '' }); setVocabStep('reviewed'); setShowVocabModal(true); }} className="text-slate-300 hover:text-indigo-500 p-1 bg-white/80 rounded" title="Sửa từ vựng này"><Edit3 size={16}/></button>
                  <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); triggerDelete('vocabulary', v.id); }} className="text-slate-300 hover:text-rose-500 p-1 bg-white/80 rounded"><Trash2 size={16}/></button>
               </div>
               <div className="flex flex-wrap gap-1.5 mb-2">
                 {v.topicId && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{TOPICS.find(t => t.id === v.topicId)?.name?.split(' ')[0] || ''}</span>}
               </div>
               <h3 className="text-base md:text-lg font-black text-indigo-800 mb-1 pr-4 leading-tight break-words">{v.phrase}</h3>
               <p className="text-xs text-slate-500 font-bold mb-3 break-words">{v.translation}</p>
               
               {v.examples?.[0] && (
                 <div className="mt-1 pt-3 border-t border-slate-100">
                     <div className="text-[11px] leading-relaxed text-slate-700 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-50/80">
                       {renderHighlightedExample(v.examples[0])}
                     </div>
                 </div>
               )}
            </div>
          ))}
       </div>
    </div>
  )};

  const renderQuizTab = () => (
    <div className="max-w-5xl mx-auto p-4 md:p-6 flex flex-col h-full animate-fadeIn w-full min-h-0">
      {quizStep === 'setup' ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center bg-white rounded-3xl border shadow-sm p-10 max-w-2xl mx-auto w-full my-auto">
           <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-inner"><Gamepad2 size={40} /></div>
           <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-3">Ôn Tập Từ Vựng</h2>
           <p className="text-sm text-slate-500 mb-8">AI sẽ bốc ngẫu nhiên tối đa 10 từ vựng trong kho và tạo bài tập điền từ vào chỗ trống để giúp bạn kiểm tra trí nhớ.</p>
           
           <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full">
              <select className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500" value={filterQuizTopic} onChange={(e) => {setFilterQuizTopic(e.target.value); setFilterQuizSubtopic('');}}>
                 <option value="">Tất cả Chủ đề (Random)</option>
                 {TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500" value={filterQuizSubtopic} onChange={(e) => setFilterQuizSubtopic(e.target.value)} disabled={!filterQuizTopic || filterQuizTopic === 'general'}>
                 <option value="">Tất cả Chủ đề phụ</option>
                 {filterQuizTopic && SUBTOPICS[filterQuizTopic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
           </div>

           <button onClick={handleStartQuiz} disabled={isGeneratingQuiz} className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3.5 rounded-xl font-black shadow-lg shadow-amber-500/20 text-base transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait w-full justify-center">
             {isGeneratingQuiz ? <Loader2 className="animate-spin" size={20}/> : <Play size={20}/>}
             {isGeneratingQuiz ? 'AI đang tạo đề bài...' : 'Bắt đầu ngay'}
           </button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 mx-auto w-full min-h-0 bg-white rounded-2xl md:rounded-3xl border shadow-sm overflow-hidden">
           <div className="bg-slate-50 border-b border-slate-200 p-4 md:p-5 shrink-0 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                 <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><Gamepad2 className="text-amber-500"/> Fill in the Blanks</h2>
                 <button onClick={() => setQuizStep('setup')} className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-slate-100 flex items-center gap-1"><X size={14}/> Thoát</button>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                 <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1 bg-amber-100 px-2 py-1 rounded"><Layers size={12}/> Word Bank:</span>
                 {wordBank.map((w, i) => (
                     <span key={i} className="bg-white px-2.5 py-1 rounded-md shadow-sm font-bold text-indigo-700 border border-indigo-100 text-xs">{w}</span>
                 ))}
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4 bg-slate-50/50">
              {quizData.map((q, i) => (
                <div key={i} className={`p-4 rounded-xl border transition-colors ${quizResults ? (quizResults[i] ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-white border-slate-200 hover:border-amber-200 shadow-sm'}`}>
                   <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">{i+1}</span>
                      <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-2">
                          {q.question.split('___').map((part, pIdx, arr) => (
                             <React.Fragment key={pIdx}>
                                {part}
                                {pIdx < arr.length - 1 && (
                                  <input 
                                    type="text" 
                                    disabled={quizResults !== null}
                                    className={`inline-block w-28 md:w-32 px-1.5 py-0.5 mx-1 border-b-2 border-slate-300 bg-amber-50/50 outline-none text-center font-black text-indigo-700 focus:border-amber-500 focus:bg-amber-100/50 transition-colors ${quizResults && !quizResults[i] ? 'text-rose-600 border-rose-300' : ''}`}
                                    value={quizAnswers[i] || ''} 
                                    onChange={(e) => setQuizAnswers(prev => ({...prev, [i]: e.target.value}))}
                                  />
                                )}
                             </React.Fragment>
                          ))}
                          </p>
                          
                          <div className="mt-2 min-h-[24px]">
                             {!revealedHints[i] ? (
                                <button onClick={() => setRevealedHints(prev => ({...prev, [i]: true}))} className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 hover:bg-amber-100 flex items-center gap-1 transition-colors">
                                   <Lightbulb size={12}/> Xem gợi ý
                                </button>
                             ) : (
                                <p className="text-[10px] md:text-xs text-slate-500 italic flex items-center gap-1.5 animate-fadeIn">
                                   <Lightbulb size={12} className="text-amber-500"/> Gợi ý: {q.hint || q.translation}
                                </p>
                             )}
                          </div>
                          
                          {quizResults && (
                             <div className="mt-2">
                                {quizResults[i] ? (
                                  <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold"><CheckCircle2 size={12}/> Chính xác!</div>
                                ) : (
                                  <div className="flex items-center gap-1 text-rose-600 text-[10px] font-bold"><XCircle size={12}/> Sai. Đáp án: <span className="underline">{q.answer}</span></div>
                                )}
                             </div>
                          )}
                      </div>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="p-4 border-t border-slate-200 bg-white flex justify-end shrink-0">
              {!quizResults ? (
                 <button onClick={handleCheckQuiz} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-amber-500/20 text-sm transition-colors w-full sm:w-auto">Kiểm tra đáp án</button>
              ) : (
                 <button onClick={handleStartQuiz} disabled={isGeneratingQuiz} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-indigo-600/20 text-sm transition-colors w-full sm:w-auto flex justify-center items-center gap-2">
                   {isGeneratingQuiz ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                   Chơi ván khác
                 </button>
              )}
           </div>
        </div>
      )}
    </div>
  );

  const renderTrackerTab = () => {
    // Tính toán số liệu thống kê động
    const totalEssays = evaluationsHistory.length;
    let avgTR = 0, avgCC = 0, avgLR = 0, avgGRA = 0, highestBand = 0;

    if (totalEssays > 0) {
      // Lọc các bài có đầy đủ 4 tiêu chí
      const validEvals = evaluationsHistory.filter(e => e.trScore && e.ccScore && e.lrScore && e.graScore);
      if (validEvals.length > 0) {
         avgTR = (validEvals.reduce((sum, e) => sum + Number(e.trScore), 0) / validEvals.length).toFixed(1);
         avgCC = (validEvals.reduce((sum, e) => sum + Number(e.ccScore), 0) / validEvals.length).toFixed(1);
         avgLR = (validEvals.reduce((sum, e) => sum + Number(e.lrScore), 0) / validEvals.length).toFixed(1);
         avgGRA = (validEvals.reduce((sum, e) => sum + Number(e.graScore), 0) / validEvals.length).toFixed(1);
      }
      highestBand = Math.max(...evaluationsHistory.map(e => Number(e.overallBand) || 0)).toFixed(1);
    } else {
      avgTR = avgCC = avgLR = avgGRA = "0.0";
      highestBand = "0.0";
    }

    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fadeIn h-full flex flex-col w-full">
         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 shrink-0 gap-4">
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="text-rose-600"/> Thống Kê Điểm Số</h2>
           <div className="bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl font-medium text-sm border border-indigo-100 flex flex-wrap gap-4 shadow-sm">
              <span>Tổng bài viết: <span className="font-black text-indigo-900">{totalEssays}</span></span>
              <span>Band cao nhất: <span className="font-black text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded">{highestBand}</span></span>
           </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 shrink-0">
            {[ { k: 'Task Response', v: avgTR, color: 'text-blue-600' },
               { k: 'Cohesion', v: avgCC, color: 'text-amber-600' },
               { k: 'Vocabulary', v: avgLR, color: 'text-emerald-600' },
               { k: 'Grammar', v: avgGRA, color: 'text-rose-600' } ].map((s, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden group hover:border-indigo-300 transition-colors">
                 <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-indigo-400 transition-colors"></div>
                 <p className="text-[10px] md:text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest truncate">{s.k}</p>
                 <div className={`text-3xl md:text-4xl font-black ${s.v > 0 ? s.color : 'text-slate-300'}`}>{s.v > 0 ? s.v : '-'}</div>
              </div>
            ))}
         </div>

         <div className="bg-white rounded-3xl border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-sm">
            <div className="p-5 border-b bg-slate-50 shrink-0 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">Lịch sử Luyện viết</h3>
               <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-1 border rounded-lg">Mới nhất xếp trước</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
               {evaluationsHistory.length === 0 ? <div className="text-center py-20 text-slate-400 font-bold border-2 border-dashed rounded-2xl">Bạn chưa có bài viết nào được chấm điểm.</div> : 
                 [...evaluationsHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((ev, i) => (
                   <div key={ev.id || i} className="mb-4 p-4 md:p-5 bg-white rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all gap-4 group">
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-2">
                           <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                             {new Date(ev.createdAt).toLocaleDateString('vi-VN')} {new Date(ev.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                           </span>
                           <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                             <FileText size={10}/> {ev.wordCount} từ
                           </span>
                         </div>
                         <h4 className="text-sm font-bold text-slate-700 group-hover:text-indigo-800 transition-colors line-clamp-2 md:line-clamp-1 leading-relaxed pr-4">{ev.prompt}</h4>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                         <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 flex justify-between gap-3 w-[60px]">TR <span className="text-slate-800">{ev.trScore || '-'}</span></span>
                            <span className="text-[10px] font-bold text-slate-500 flex justify-between gap-3 w-[60px]">CC <span className="text-slate-800">{ev.ccScore || '-'}</span></span>
                            <span className="text-[10px] font-bold text-slate-500 flex justify-between gap-3 w-[60px]">LR <span className="text-slate-800">{ev.lrScore || '-'}</span></span>
                            <span className="text-[10px] font-bold text-slate-500 flex justify-between gap-3 w-[60px]">GRA <span className="text-slate-800">{ev.graScore || '-'}</span></span>
                         </div>
                         <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl flex flex-col items-center justify-center border border-emerald-200 min-w-[70px] shadow-sm">
                            <span className="text-[9px] font-black uppercase tracking-widest mb-0.5 opacity-80">Band</span>
                            <span className="font-black text-xl leading-none">{ev.overallBand}</span>
                         </div>
                      </div>
                   </div>
                 ))
               }
            </div>
         </div>
      </div>
    );
  };

  const renderBackupTab = () => (
    <div className="max-w-4xl mx-auto p-8 h-full flex items-center justify-center animate-fadeIn w-full">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <div className="bg-white p-10 rounded-[40px] border shadow-sm text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6"><Download size={40}/></div>
             <h3 className="text-xl font-black text-slate-800 mb-2">Xuất file Backup</h3>
             <p className="text-sm text-slate-400 mb-8">Lưu toàn bộ bài mẫu và từ vựng của bạn vào một file JSON duy nhất để lưu trữ.</p>
             <button onClick={handleExportBackup} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">Tải về máy</button>
          </div>
          <div className="bg-white p-10 rounded-[40px] border shadow-sm text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6"><Upload size={40}/></div>
             <h3 className="text-xl font-black text-slate-800 mb-2">Phục hồi dữ liệu</h3>
             <p className="text-sm text-slate-400 mb-8">Tải lên file backup đã có để khôi phục lại kho dữ liệu cá nhân của bạn.</p>
             <button onClick={() => setShowImportModal(true)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-colors">Nhập dữ liệu</button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden">
      {isAuthorized === true && renderTopNav()}
      
      <main className="flex-1 overflow-hidden relative flex">
        {activeTab === 'practice' && renderPracticeTab()}
        {activeTab === 'samples' && renderSamplesTab()}
        {activeTab === 'vocab' && renderVocabTab()}
        {activeTab === 'quiz' && renderQuizTab()}
        {activeTab === 'tracker' && renderTrackerTab()}
        {activeTab === 'backup' && renderBackupTab()}

        {showVocabSidebar && activeTab === 'practice' && (
          <div className="w-[350px] bg-white border-l border-slate-200 shadow-2xl absolute right-0 top-0 h-full flex flex-col z-20 animate-fadeIn">
            <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-indigo-700 flex items-center gap-2"><Tags size={16}/> Từ Vựng Nổi Bật</h3>
              <button onClick={() => setShowVocabSidebar(false)} className="p-1 text-slate-400 hover:text-rose-500"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
               {isGeneratingPromptVocabs && <div className="text-center py-4 text-xs font-bold text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" size={20}/> Đang trích xuất từ vựng...</div>}
               {suggestedPromptVocabs.map((v, i) => (
                 <div key={i} className="p-3 bg-white border rounded-lg shadow-sm">
                    <div className="text-sm font-bold text-indigo-700">{v.phrase}</div>
                    <div className="text-xs text-slate-500 mt-1">{v.meaning}</div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </main>

      {/* --- CÁC POPUP & MODALS --- */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[32px] w-[95%] max-w-md animate-slideUp overflow-hidden shadow-2xl">
             <div className="p-6 border-b bg-slate-50 text-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner"><Key size={32}/></div>
                <h3 className="font-black text-slate-800 text-xl">Cấu hình AI (API Key)</h3>
                <p className="text-xs text-slate-500 mt-2">Hệ thống sử dụng Gemini AI. Vui lòng dán mã API Key của bạn để sử dụng toàn bộ tính năng.</p>
             </div>
             <div className="p-6 space-y-6">
                <div>
                   <label className="text-xs font-black uppercase text-slate-500 mb-2 block ml-1">Gemini API Key của bạn:</label>
                   <input type="password" value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} className="w-full p-4 border-2 rounded-2xl text-sm font-mono bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-colors" placeholder="AIzaSyB..." />
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                   <p className="text-xs text-amber-800 font-medium leading-relaxed">
                     🔑 Chưa có Key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-black text-indigo-600 hover:underline">Nhấn vào đây</a> để lấy API Key miễn phí từ Google (Chỉ mất 1 phút).
                   </p>
                </div>
                <button onClick={handleSaveApiKey} disabled={!tempApiKey.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all">
                  Lưu & Bắt đầu sử dụng
                </button>
             </div>
          </div>
        </div>
      )}

      {selectionPopup.show && (
        <div id="selection-popup" className="fixed z-[150] bg-slate-900 text-white rounded-lg shadow-xl flex items-center gap-1 p-1 transform -translate-x-1/2 animate-fadeIn" style={{ top: selectionPopup.y, left: selectionPopup.x }}>
          {activeTab === 'practice' && (
            <>
              <button onMouseDown={(e) => { e.preventDefault(); handleOpenParaphraseFromSelection(); }} className="px-3 py-1.5 hover:bg-slate-700 rounded-md text-xs font-bold flex items-center gap-1.5"><Wand2 size={12} /> Sửa câu</button>
              <div className="w-px h-4 bg-slate-700"></div>
            </>
          )}
          <button onMouseDown={(e) => { e.preventDefault(); handleOpenReviewVocab(); }} className="px-3 py-1.5 hover:bg-slate-700 rounded-md text-xs font-bold flex items-center gap-1.5 text-emerald-400"><BookMarked size={12} /> Lưu kho</button>
        </div>
      )}

      {selectedSample && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-[95%] max-w-4xl max-h-[90vh] flex flex-col animate-slideUp overflow-hidden">
             <div className="p-4 md:p-5 border-b flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-blue-700 text-sm md:text-base flex items-center gap-2"><Library size={18}/> Bài Mẫu Tham Khảo (Band 8.0)</h3>
                <div className="flex items-center gap-1">
                   <button onClick={() => { setNewSample({ id: selectedSample.id, topic: selectedSample.topic || '', subtopic: selectedSample.subtopic || '', prompt: selectedSample.prompt, content: selectedSample.content }); setSelectedSample(null); setShowSampleModal(true); }} className="hover:bg-slate-200 p-2 rounded-xl text-slate-500 transition-colors" title="Sửa bài mẫu này"><Edit3 size={20}/></button>
                   <button onClick={() => setSelectedSample(null)} className="hover:bg-slate-200 p-2 rounded-xl text-slate-500 transition-colors"><X size={20}/></button>
                </div>
             </div>
             <div className="p-6 md:p-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                <div className="flex gap-2 mb-4">
                  {selectedSample.topic && <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg inline-block">{TOPICS.find(t => t.id === selectedSample.topic)?.name || selectedSample.topic}</span>}
                  {selectedSample.subtopic && <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-3 py-1 rounded-lg inline-block border">{SUBTOPICS[selectedSample.topic]?.find(st => st.id === selectedSample.subtopic)?.name || selectedSample.subtopic}</span>}
                </div>
                <p className="text-xl md:text-2xl font-black text-slate-800 mb-8 leading-relaxed border-l-4 border-blue-500 pl-4">{selectedSample.prompt}</p>
                
                <div className="p-6 md:p-10 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm hover:border-blue-300 transition-colors">
                   {selectedSample.content.split('\n\n').map((paragraph, index) => (
                     <p key={index} className="text-[17px] md:text-lg text-slate-800 leading-relaxed font-serif mb-4 last:mb-0 text-justify">
                        {paragraph}
                     </p>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {showStructureModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-[95%] max-w-4xl max-h-[90vh] flex flex-col animate-slideUp overflow-hidden">
            <div className="p-4 md:p-5 border-b flex justify-between items-center bg-slate-50 shrink-0">
               <h3 className="font-bold text-rose-600 text-sm md:text-base flex items-center gap-2"><Columns size={20}/> Cẩm nang 40/60 & Template Viết Bài</h3>
               <button onClick={() => setShowStructureModal(false)} className="hover:bg-slate-200 p-2 rounded-xl text-slate-500 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-4 md:p-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar space-y-6 md:space-y-8 text-sm text-slate-700 leading-relaxed">
               
               <div className="bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-black text-slate-800 mb-2 md:mb-3 text-sm md:text-base flex items-center gap-2"><span className="w-5 h-5 md:w-6 md:h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] md:text-xs">1</span> Mở bài (Introduction)</h4>
                  <p className="mb-3 text-xs md:text-sm"><strong>Công thức:</strong> Hook (Dẫn dắt) + Paraphrase Topic + Thesis Statement (Trả lời trực tiếp câu hỏi).</p>
                  <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border-l-4 border-l-indigo-500 text-indigo-800 font-medium shadow-sm text-xs md:text-sm">It is often argued that [Paraphrase Topic]. While there are valid arguments in favor of [Side A / 40%], I firmly believe that [Side B / 60%] is far more significant.</div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 <div className="bg-rose-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-rose-100 rounded-bl-full -mr-6 -mt-6 md:-mr-8 md:-mt-8"></div>
                    <h4 className="font-black text-rose-700 mb-2 md:mb-3 text-sm md:text-base flex items-center gap-2"><span className="w-5 h-5 md:w-6 md:h-6 bg-rose-200 rounded-full flex items-center justify-center text-[10px] md:text-xs text-rose-800">2</span> Body 1 (40%) - Nhượng bộ</h4>
                    <p className="mb-3 md:mb-4 text-rose-900/80 text-xs md:text-sm">Dành cho quan điểm đối lập hoặc khía cạnh bạn cho là yếu hơn. Thể hiện tư duy phản biện đa chiều.</p>
                    <div className="space-y-2 md:space-y-3">
                       <p className="text-[9px] md:text-[10px] font-black uppercase text-rose-500 tracking-widest bg-white inline-block px-2 py-1 rounded">Cấu trúc đoạn:</p>
                       <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-[11px] md:text-xs font-bold text-rose-800">
                         <li>Topic Sentence (Giới thiệu lợi ích của quan điểm đối lập).</li>
                         <li>Idea 1 + Explanation + Example.</li>
                         <li>Idea 2 + Explanation (Ngắn gọn).</li>
                       </ul>
                    </div>
                 </div>
                 
                 <div className="bg-emerald-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-emerald-100 rounded-bl-full -mr-6 -mt-6 md:-mr-8 md:-mt-8"></div>
                    <h4 className="font-black text-emerald-700 mb-2 md:mb-3 text-sm md:text-base flex items-center gap-2"><span className="w-5 h-5 md:w-6 md:h-6 bg-emerald-200 rounded-full flex items-center justify-center text-[10px] md:text-xs text-emerald-800">3</span> Body 2 (60%) - Khẳng định</h4>
                    <p className="mb-3 md:mb-4 text-emerald-900/80 text-xs md:text-sm">Dành cho quan điểm chính bạn ủng hộ. Phân tích sâu hơn, đưa ra luận điểm mạnh mẽ và mang tính quyết định.</p>
                    <div className="space-y-2 md:space-y-3">
                       <p className="text-[9px] md:text-[10px] font-black uppercase text-emerald-500 tracking-widest bg-white inline-block px-2 py-1 rounded">Cấu trúc đoạn:</p>
                       <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-[11px] md:text-xs font-bold text-emerald-800">
                         <li>Topic Sentence (Lật lại vấn đề + Khẳng định quan điểm của mình).</li>
                         <li>Idea 1 + Deep Explanation + Specific Example.</li>
                         <li>Idea 2 + Deep Explanation.</li>
                       </ul>
                    </div>
                 </div>
               </div>

               <div className="bg-amber-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-amber-200 shadow-sm">
                  <h4 className="font-black text-amber-700 mb-4 md:mb-5 text-sm md:text-base flex items-center gap-2"><span className="w-5 h-5 md:w-6 md:h-6 bg-amber-200 rounded-full flex items-center justify-center text-[10px] md:text-xs text-amber-800">4</span> Bộ Paraphrase Topic Sentence & Từ Nối Chuyển Ý</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
                    <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                       <p className="text-[9px] md:text-[10px] font-black uppercase text-rose-500 mb-2 md:mb-3 tracking-widest bg-rose-50 inline-block px-2 py-1 rounded">Mở đoạn Body 1 (Nhượng bộ)</p>
                       <ul className="list-disc pl-4 space-y-2 md:space-y-3 text-[11px] md:text-xs font-medium text-slate-700">
                         <li><span className="font-black text-amber-600 text-xs md:text-sm">Admittedly,</span> there are valid reasons why some people advocate [Quan điểm đối lập]...</li>
                         <li><span className="font-black text-amber-600 text-xs md:text-sm">Granted,</span> it is understandable that...</li>
                         <li><span className="font-black text-amber-600 text-xs md:text-sm">It is undeniable that</span> [Mặt lợi của Body 1] offers certain benefits...</li>
                       </ul>
                    </div>
                    
                    <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                       <p className="text-[9px] md:text-[10px] font-black uppercase text-emerald-500 mb-2 md:mb-3 tracking-widest bg-emerald-50 inline-block px-2 py-1 rounded">Mở đoạn Body 2 (Phản biện)</p>
                       <ul className="list-disc pl-4 space-y-2 md:space-y-3 text-[11px] md:text-xs font-medium text-slate-700">
                         <li>However, the aforementioned advantages <span className="font-black text-amber-600 text-xs md:text-sm">are eclipsed by</span> the drawbacks of... (bị lu mờ bởi)</li>
                         <li><span className="font-black text-amber-600 text-xs md:text-sm">That being said,</span> I am convinced that... (Mặc dù vậy)</li>
                         <li>Nevertheless, these factors <span className="font-black text-amber-600 text-xs md:text-sm">are of lesser significance</span> when we consider...</li>
                       </ul>
                    </div>
                  </div>

                  <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-amber-100 shadow-sm">
                     <p className="text-[11px] md:text-xs font-black uppercase text-amber-600 mb-1">Nối từ Idea 1 sang Idea 2 mượt mà (Transitions)</p>
                     <p className="text-[10px] md:text-[11px] mb-3 md:mb-4 text-slate-500 italic">Thay vì dùng "Secondly" hay "In addition", hãy thử dùng:</p>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                       <div className="bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-100"><span className="font-black text-amber-600 block mb-0.5 md:mb-1 text-xs md:text-sm">Beyond that,</span> <span className="text-[9px] md:text-[10px] text-slate-500 block">(Bên cạnh đó, ...)</span></div>
                       <div className="bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-100"><span className="font-black text-amber-600 block mb-0.5 md:mb-1 text-xs md:text-sm">Coupled with this is</span> <span className="text-[9px] md:text-[10px] text-slate-500 block">(Đi đôi với điều này là...)</span></div>
                       <div className="bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-100"><span className="font-black text-amber-600 block mb-0.5 md:mb-1 text-xs md:text-sm">A further compelling argument is</span> <span className="text-[9px] md:text-[10px] text-slate-500 block">(Một lập luận thuyết phục khác là...)</span></div>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-black text-slate-800 mb-2 md:mb-3 text-sm md:text-base flex items-center gap-2"><span className="w-5 h-5 md:w-6 md:h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] md:text-xs">5</span> Kết bài (Conclusion)</h4>
                  <p className="mb-2 md:mb-3 text-xs md:text-sm"><strong>Công thức:</strong> Tóm tắt lại cả 2 mặt của vấn đề + Khẳng định lại Thesis Statement (1-2 câu).</p>
                  <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border-l-4 border-l-emerald-500 text-emerald-800 font-medium shadow-sm text-xs md:text-sm">In conclusion, while [Side A/40%] has some merits, I am of the opinion that [Side B/60%] is far more crucial due to [Reason 1] and [Reason 2].</div>
               </div>
               
            </div>
          </div>
        </div>
      )}

      {showIdeasModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-50 rounded-3xl shadow-2xl w-[95%] max-w-6xl max-h-[90vh] flex flex-col animate-slideUp overflow-hidden">
             <div className="p-4 md:p-5 border-b flex justify-between items-center bg-white shrink-0">
                <h3 className="font-black text-amber-600 text-base md:text-lg flex items-center gap-2"><Lightbulb size={22}/> Sơ đồ EGOSFI (40/60)</h3>
                <button onClick={() => setShowIdeasModal(false)} className="hover:bg-slate-100 p-2 rounded-xl text-slate-500 transition-colors"><X size={20}/></button>
             </div>
             
             <div className="p-4 md:p-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar relative">
                {isGeneratingIdeas ? (
                  <div className="flex flex-col items-center justify-center py-20 h-full">
                     <Loader2 className="animate-spin mb-4 text-amber-500" size={48}/>
                     <p className="font-black text-slate-700 text-lg">AI đang phân tích EGOSFI...</p>
                     <p className="text-sm text-slate-500 mt-2">Trích xuất từ khóa gợi ý siêu tốc</p>
                  </div>
                ) : 
                mindMapData && mindMapData.view40 && mindMapData.view60 ? (
                  <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-4 relative w-full pt-4 pb-6">
                     
                     {/* Cột Trái: VIEW 40 (Nhượng bộ) */}
                     <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-white border-l-4 border-rose-500 py-3 px-4 rounded-xl shadow-sm text-center">
                           <p className="text-[10px] uppercase font-black tracking-widest text-rose-400 mb-1">VIEW 40 (Nhượng bộ)</p>
                           <h4 className="font-bold text-rose-700 text-sm">{mindMapData.view40.title}</h4>
                        </div>
                        <div className="space-y-4 lg:pr-6 relative">
                           {/* Đường line mờ kết nối ở desktop */}
                           <div className="hidden lg:block absolute right-0 top-1/2 w-6 border-b-2 border-dashed border-rose-200"></div>
                           
                           {mindMapData.view40.ideas.map((id, i) => (
                              <div key={i} className="bg-white border-l-2 border-l-rose-400 p-4 rounded-xl shadow-sm relative ml-4 lg:ml-0 hover:shadow-md transition-shadow">
                                 <span className="absolute -left-4 -top-3 w-8 h-8 bg-rose-500 text-white font-black rounded-full flex items-center justify-center text-xs shadow-sm border-2 border-white">{id.letter}</span>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1 block pl-3">{id.category}</span>
                                 <p className="font-bold text-slate-800 text-sm pl-3 leading-snug">{id.keyword || id.content}</p>
                                 {(id.explanation || (id.content && !id.keyword)) && (
                                   <p className="text-[13px] text-slate-500 pl-3 mt-2 flex items-start gap-1.5 leading-relaxed">
                                      <span className="text-rose-300 font-black shrink-0 mt-0.5">↳</span> 
                                      {id.explanation || id.content}
                                   </p>
                                 )}
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Cột Giữa: Central Node */}
                     <div className="hidden lg:flex flex-col items-center justify-center w-52 shrink-0 relative z-10">
                        <div className="bg-indigo-50 text-indigo-900 p-5 rounded-3xl shadow-lg border-4 border-white text-center w-full z-10 relative">
                           <Brain size={28} className="mx-auto mb-2 text-indigo-500"/>
                           <p className="text-[10px] uppercase text-indigo-400 font-black mb-1.5 tracking-widest">Core Topic</p>
                           <h4 className="font-black text-sm md:text-base leading-snug">{mindMapData.centralIdea || 'Vấn đề nghị luận'}</h4>
                        </div>
                     </div>

                     {/* Cột Phải: VIEW 60 (Lập luận chính) */}
                     <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-white border-r-4 border-emerald-500 py-3 px-4 rounded-xl shadow-sm text-center">
                           <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400 mb-1">VIEW 60 (Lập luận chính)</p>
                           <h4 className="font-bold text-emerald-700 text-sm">{mindMapData.view60.title}</h4>
                        </div>
                        <div className="space-y-4 lg:pl-6 relative">
                           {/* Đường line mờ kết nối ở desktop */}
                           <div className="hidden lg:block absolute left-0 top-1/2 w-6 border-b-2 border-dashed border-emerald-200"></div>

                           {mindMapData.view60.ideas.map((id, i) => (
                              <div key={i} className="bg-white border-r-2 border-r-emerald-400 p-4 rounded-xl shadow-sm relative mr-4 lg:mr-0 lg:text-right hover:shadow-md transition-shadow">
                                 <span className="absolute -right-4 lg:-right-4 -top-3 w-8 h-8 bg-emerald-500 text-white font-black rounded-full flex items-center justify-center text-xs shadow-sm border-2 border-white">{id.letter}</span>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1 block pr-3">{id.category}</span>
                                 <p className="font-bold text-slate-800 text-sm pr-3 leading-snug">{id.keyword || id.content}</p>
                                 {(id.explanation || (id.content && !id.keyword)) && (
                                   <p className="text-[13px] text-slate-500 pr-3 mt-2 flex lg:justify-end items-start gap-1.5 leading-relaxed">
                                      <span className="lg:hidden text-emerald-300 font-black shrink-0 mt-0.5">↳</span> 
                                      <span className="lg:text-right">{id.explanation || id.content}</span>
                                      <span className="hidden lg:inline text-emerald-300 font-black shrink-0 mt-0.5">↲</span> 
                                   </p>
                                 )}
                              </div>
                           ))}
                        </div>
                     </div>

                  </div>
                ) : null}
             </div>
          </div>
        </div>
      )}

      {showParaphraseModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white rounded-3xl w-[95%] max-w-xl animate-slideUp overflow-hidden">
              <div className="p-5 border-b font-bold text-sm flex justify-between items-center bg-slate-50">Sửa Câu (Paraphrase) <button onClick={() => setShowParaphraseModal(false)} className="hover:bg-slate-200 p-2 rounded-xl text-slate-500"><X size={20}/></button></div>
              <div className="p-8 space-y-6">
                 <textarea className="w-full p-4 border rounded-2xl text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} value={paraphraseInput} onChange={(e) => setParaphraseInput(e.target.value)} placeholder="Nhập câu cần sửa..."/>
                 {isParaphrasing ? <div className="text-center text-sm py-4 text-indigo-600 font-bold"><Loader2 className="animate-spin inline mr-2"/> Đang phân tích và nâng cấp câu...</div> : 
                  paraphraseResult ? (
                    <div className="space-y-4">
                       <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl"><span className="text-[10px] font-black text-indigo-600 block mb-2 px-2 py-1 bg-white inline-block rounded-md">BAND 6.5</span><p className="text-sm font-medium text-indigo-900">{paraphraseResult.band65}</p></div>
                       <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl"><span className="text-[10px] font-black text-emerald-600 block mb-2 px-2 py-1 bg-white inline-block rounded-md">BAND 7.5+</span><p className="text-sm font-medium text-emerald-900">{paraphraseResult.band75}</p></div>
                    </div>
                  ) : null}
              </div>
              <div className="p-6 bg-slate-50 flex justify-end"><button onClick={handleParaphrase} disabled={isParaphrasing || !paraphraseInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg">Sửa câu này</button></div>
           </div>
        </div>
      )}

      {showVocabModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white rounded-3xl w-[95%] max-w-lg animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b font-bold text-sm text-center bg-slate-50 flex justify-between items-center shrink-0">
                 <span>{newVocab.id ? 'Sửa Từ Vựng' : (vocabStep === 'reviewed' ? 'Review & Lưu Từ Vựng' : 'Phân loại Từ Vựng')}</span>
                 <button onClick={() => setShowVocabModal(false)} className="hover:bg-slate-200 p-1.5 rounded-xl text-slate-500 transition-colors"><X size={18}/></button>
              </div>
              
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                 {vocabStep === 'init' && (
                   <>
                     <input className="w-full bg-indigo-50 text-indigo-800 p-3 rounded-xl text-center font-black text-lg border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập từ vựng tiếng Anh..." value={newVocab.phrase} onChange={(e) => setNewVocab({...newVocab, phrase: e.target.value})} />
                     <p className="text-xs text-slate-500 text-center mb-2 mt-2 font-medium italic">Vui lòng chọn chủ đề để AI tạo câu mẫu sát ngữ cảnh nhất.</p>
                    <div className="flex flex-col gap-3">
                      <select className="w-full p-3.5 border-2 rounded-xl text-sm font-bold bg-white focus:border-indigo-500 outline-none text-slate-700" value={newVocab.topic} onChange={(e) => setNewVocab({...newVocab, topic: e.target.value, subtopic: ''})}>
                         <option value="">-- Chọn Chủ đề chính --</option>
                         {TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <select className="w-full p-3.5 border-2 rounded-xl text-sm font-bold bg-white focus:border-indigo-500 outline-none text-slate-700" value={newVocab.subtopic} onChange={(e) => setNewVocab({...newVocab, subtopic: e.target.value})} disabled={!newVocab.topic || newVocab.topic === 'general'}>
                         <option value="">-- Chọn Chủ đề phụ --</option>
                         {newVocab.topic && SUBTOPICS[newVocab.topic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {vocabStep === 'analyzing' && (
                   <div className="py-12 flex flex-col items-center justify-center text-indigo-600">
                      <Loader2 className="animate-spin mb-4" size={40}/>
                      <p className="font-bold text-sm">AI đang trích xuất cụm từ và tạo câu mẫu...</p>
                   </div>
                )}

                {vocabStep === 'reviewed' && (
                  <div className="space-y-4">
                     <div className="flex gap-3 mb-2">
                        <select className="w-1/2 p-3 border-2 rounded-xl text-sm font-bold bg-white focus:border-emerald-500 outline-none text-slate-700" value={newVocab.topic} onChange={(e) => setNewVocab({...newVocab, topic: e.target.value, subtopic: ''})}>
                           <option value="">-- Chọn Chủ đề --</option>
                           {TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <select className="w-1/2 p-3 border-2 rounded-xl text-sm font-bold bg-white focus:border-emerald-500 outline-none text-slate-700" value={newVocab.subtopic} onChange={(e) => setNewVocab({...newVocab, subtopic: e.target.value})} disabled={!newVocab.topic || newVocab.topic === 'general'}>
                           <option value="">-- Chủ đề phụ --</option>
                           {newVocab.topic && SUBTOPICS[newVocab.topic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>
                     <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block ml-1">Từ nguyên thể (Base Form)</label>
                       <input className="w-full p-3.5 border-2 rounded-xl text-sm font-black bg-white focus:border-emerald-500 outline-none text-indigo-900" value={newVocab.basePhrase} onChange={(e) => setNewVocab({...newVocab, basePhrase: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block ml-1">Nghĩa tiếng Việt</label>
                       <input className="w-full p-3.5 border-2 rounded-xl text-sm font-bold bg-white focus:border-emerald-500 outline-none" value={newVocab.translation} onChange={(e) => setNewVocab({...newVocab, translation: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block ml-1 flex items-center justify-between">
                         <span className="flex items-center gap-1"><BookOpen size={12}/> Câu mẫu 1 (IELTS Band 7.5+)</span>
                         <span className="text-[9px] text-indigo-400 lowercase normal-case italic">*Giữ nguyên thẻ {'<b>'} để highlight</span>
                       </label>
                       <textarea className="w-full p-3.5 border-2 rounded-xl text-xs font-medium bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none leading-relaxed" rows={3} value={newVocab.example1} onChange={(e) => setNewVocab({...newVocab, example1: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block ml-1 flex items-center gap-1"><BookOpen size={12}/> Câu mẫu 2 (IELTS Band 7.5+)</label>
                       <textarea className="w-full p-3.5 border-2 rounded-xl text-xs font-medium bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none leading-relaxed" rows={3} value={newVocab.example2} onChange={(e) => setNewVocab({...newVocab, example2: e.target.value})} />
                     </div>
                  </div>
                )}
             </div>
             
             <div className="p-5 bg-slate-50 flex justify-end gap-3 border-t shrink-0">
                {vocabStep === 'init' && (
                  <button onClick={handleAnalyzeVocab} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 w-full justify-center shadow-lg transition-colors"><Sparkles size={18}/> Phân tích & Lấy câu mẫu</button>
                )}
                {vocabStep === 'reviewed' && (
                  <>
                    {!newVocab.id && <button onClick={() => setVocabStep('init')} className="px-5 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors">Quay lại</button>}
                    <button onClick={handleConfirmSaveVocab} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg transition-colors"><Save size={18}/> {newVocab.id ? 'Cập nhật' : 'Lưu chính thức'}</button>
                  </>
                )}
             </div>
          </div>
        </div>
      )}

      {showSampleModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[32px] w-[95%] max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b font-black text-slate-800">{newSample.id ? 'Sửa bài mẫu' : 'Thêm bài mẫu mới'}</div>
            <div className="p-8 space-y-4 overflow-y-auto custom-scrollbar">
               <textarea className="w-full p-4 border rounded-2xl text-sm font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500" rows={3} placeholder="Đề bài..." value={newSample.prompt} onChange={(e) => setNewSample({...newSample, prompt: e.target.value})} />
               <textarea className="w-full p-4 border rounded-2xl text-sm font-medium bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500" rows={8} placeholder="Nội dung bài viết..." value={newSample.content} onChange={(e) => setNewSample({...newSample, content: e.target.value})} />
               <div className="flex gap-4">
                  <select className="w-1/2 p-4 border rounded-2xl text-sm font-bold bg-slate-50" value={newSample.topic} onChange={(e) => setNewSample({...newSample, topic: e.target.value, subtopic: ''})}>
                     <option value="">Chọn chủ đề</option>{TOPICS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select className="w-1/2 p-4 border rounded-2xl text-sm font-bold bg-slate-50" value={newSample.subtopic} onChange={(e) => setNewSample({...newSample, subtopic: e.target.value})} disabled={!newSample.topic || newSample.topic === 'general'}>
                     <option value="">Chủ đề phụ</option>
                     {newSample.topic && SUBTOPICS[newSample.topic]?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3">
               <button onClick={() => setShowSampleModal(false)} className="px-6 py-2 font-bold text-slate-400">Hủy</button>
               <button onClick={handleSaveSample} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">{newSample.id ? 'Cập nhật' : 'Lưu bài mẫu'}</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[32px] shadow-2xl w-[95%] max-w-xl animate-slideUp overflow-hidden">
             <div className="p-6 border-b font-black text-slate-800 flex justify-between items-center bg-slate-50">Phục hồi dữ liệu <button onClick={() => setShowImportModal(false)} disabled={isRestoring} className="hover:bg-slate-200 p-2 rounded-xl text-slate-500 disabled:opacity-50"><X size={20}/></button></div>
             <div className="p-8"><textarea value={importDataString} onChange={(e) => setImportDataString(e.target.value)} disabled={isRestoring} className="w-full h-48 p-4 border rounded-2xl font-mono text-[10px] bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Mở file .json đã tải về bằng Notepad, copy toàn bộ nội dung và dán vào đây..." /></div>
             <div className="p-6 bg-slate-50 flex justify-end gap-3">
               <button onClick={() => setShowImportModal(false)} disabled={isRestoring} className="px-6 py-3 font-bold text-slate-400 disabled:opacity-50">Hủy</button>
               <button onClick={processImportBackup} disabled={isRestoring || !importDataString.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg flex items-center gap-2 disabled:opacity-75 disabled:cursor-wait">
                 {isRestoring && <Loader2 className="animate-spin" size={18} />}
                 {isRestoring ? 'Đang khôi phục...' : 'Bắt đầu Khôi phục'}
               </button>
             </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-[95%] text-center shadow-2xl animate-slideUp">
             <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash2 size={40}/></div>
             <h3 className="text-2xl font-black text-slate-800 mb-3">Xác nhận xóa?</h3>
             <p className="text-sm text-slate-400 mb-8">Dữ liệu sau khi xóa sẽ không thể khôi phục lại.</p>
             <div className="flex gap-4"><button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 font-black text-slate-400">Hủy</button><button onClick={confirmDeleteAction} className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-600/20">Xóa vĩnh viễn</button></div>
          </div>
        </div>
      )}

      {toast.visible && (
        <div className="fixed top-6 inset-x-0 z-[200] flex justify-center pointer-events-none">
          <div className="px-8 py-3.5 rounded-2xl shadow-2xl bg-slate-800 text-white font-black text-sm animate-slideUp border border-slate-700 flex items-center gap-3 pointer-events-auto">
            <Sparkles className="text-emerald-400" size={18}/> {toast.message}
          </div>
        </div>
      )}

    </div>
  );
}