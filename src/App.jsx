import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Edit3, CheckCircle, Loader2, Sparkles, AlertTriangle, Play, Pause, RotateCcw,
  Brain, PenTool, Layers, ArrowRight, ArrowLeft, Wand2, Download, Upload, Plus, Trash2, X, Save, Award, Clock, Settings, RefreshCw,
  ListChecks, Library, ChevronDown, ChevronUp, Tags, Gamepad2, CheckCircle2, XCircle, ShieldAlert, Columns, Lightbulb,
  PanelRightOpen, PanelRightClose, BarChart3, Wrench, Copy, TrendingDown, Target, Filter, Circle, Search, AlertCircle,
  FileText, MessageSquareDiff, MessageSquare, Send, BookMarked, Languages, FastForward, Highlighter, BookPlus, LogOut, Key, Zap
} from 'lucide-react';

// ==========================================
// 🔴 CÔNG TẮC BẬT/TẮT CHẾ ĐỘ PREVIEW (Chỉnh false khi up lên Vercel)
// ==========================================
const IS_PREVIEW_MODE = false; 

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
let app, auth, db, appId;
if (!IS_PREVIEW_MODE) {
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
}

// --- TOPICS VÀ SUBTOPICS ---
const TOPICS = [
  { id: 'general', name: 'General (Đa chủ đề)' },
  { id: 'education', name: 'Education (Giáo dục)' },
  { id: 'environment', name: 'Environment (Môi trường)' },
  { id: 'technology', name: 'Technology (Công nghệ)' },
  { id: 'health', name: 'Health (Y tế & Sức khỏe)' },
  { id: 'society', name: 'Society (Xã hội)' },
  { id: 'work', name: 'Work (Công việc & Kinh tế)' },
  { id: 'crime', name: 'Crime (Tội phạm & Luật pháp)' },
  { id: 'media', name: 'Media & Advertising (Truyền thông & Quảng cáo)' },
  { id: 'lifestyle', name: 'Lifestyle (Lối sống & Đời sống cá nhân)' }
];

const SUBTOPICS = {
  education: [
    { id: 'edu_purpose', name: 'Mục đích giáo dục & Hướng nghiệp' },
    { id: 'edu_method', name: 'Môi trường & Phương pháp học' },
    { id: 'edu_curriculum', name: 'Chương trình học & Đánh giá' },
    { id: 'edu_behavior', name: 'Hành vi & Kỷ luật' },
    { id: 'edu_policy', name: 'Chính sách trường học & Tài chính' }
  ],
  environment: [
    { id: 'env_climate', name: 'Biến đổi khí hậu, Năng lượng & Tài nguyên' },
    { id: 'env_pollution', name: 'Ô nhiễm & Xử lý rác thải' },
    { id: 'env_animal', name: 'Bảo tồn động vật & Sinh thái' },
    { id: 'env_responsibility', name: 'Trách nhiệm: Cá nhân, Chính phủ & Toàn cầu' }
  ],
  technology: [
    { id: 'tech_comm', name: 'Giao tiếp & Mạng xã hội' },
    { id: 'tech_ai', name: 'Trí tuệ nhân tạo & Tự động hóa' },
    { id: 'tech_space', name: 'Khám phá vũ trụ' },
    { id: 'tech_lifestyle', name: 'Tác động đời sống & Thói quen' },
    { id: 'tech_education', name: 'Công nghệ với Trẻ em & Trí não' }
  ],
  health: [
    { id: 'health_diet_fitness', name: 'Dinh dưỡng, Thể chất & Lối sống' },
    { id: 'health_care_system', name: 'Hệ thống y tế & Phúc lợi xã hội' },
    { id: 'health_mental_child', name: 'Sức khỏe tinh thần & Phát triển của trẻ' },
    { id: 'health_ethics_substances', name: 'Y đức, Nghiên cứu & Chất gây nghiện' }
  ],
  society: [
    { id: 'soc_culture', name: 'Văn hóa, Truyền thống, Du lịch & Toàn cầu hóa' },
    { id: 'soc_age', name: 'Dân số & Khoảng cách thế hệ' },
    { id: 'soc_urban', name: 'Đô thị hóa, Kiến trúc & Không gian công cộng' },
    { id: 'soc_equality', name: 'Phúc lợi xã hội, Đói nghèo & Xung đột' },
    { id: 'soc_traffic', name: 'Giao thông, Hạ tầng & An toàn đường bộ' },
    { id: 'soc_government', name: 'Chính phủ, Ngân sách & Trách nhiệm công dân' }
  ],
  work: [
    { id: 'work_career_choice', name: 'Lựa chọn nghề nghiệp & Phát triển kỹ năng' },
    { id: 'work_environment', name: 'Môi trường làm việc, Tuyển dụng & Phúc lợi' },
    { id: 'work_balance', name: 'Cân bằng cuộc sống & Mối quan hệ công sở' },
    { id: 'work_future_issues', name: 'Thị trường lao động, Thất nghiệp & Bình đẳng' }
  ],
  crime: [
    { id: 'crime_law_justice', name: 'Hệ thống tư pháp & Quyền công dân' },
    { id: 'crime_punishment', name: 'Hình phạt, Nhà tù & Tái hòa nhập cộng đồng' },
    { id: 'crime_juvenile', name: 'Tội phạm vị thành niên & Trách nhiệm gia đình' },
    { id: 'crime_prevention', name: 'Phòng chống tội phạm, Cảnh sát & An ninh' }
  ],
  media: [
    { id: 'media_news_influence', name: 'Nội dung tin tức & Quyền lực truyền thông' },
    { id: 'media_formats', name: 'Các loại hình truyền thông' },
    { id: 'media_ads_impact', name: 'Tác động của Quảng cáo & Nhu cầu tiêu dùng' },
    { id: 'media_ads_regulation', name: 'Quản lý quảng cáo & Đại sứ thương hiệu' },
    { id: 'media_arts', name: 'Nghệ thuật, Âm nhạc & Bảo tàng' }
  ],
  lifestyle: [
    { id: 'life_family_rel', name: 'Gia đình, Nuôi dạy con & Các thế hệ' },
    { id: 'life_finance_shopping', name: 'Tài chính cá nhân & Chủ nghĩa tiêu dùng' },
    { id: 'life_health_recreation', name: 'Thói quen sức khỏe & Giải trí' },
    { id: 'life_personal_values', name: 'Giá trị sống, Tính cách & Lựa chọn cá nhân' },
    { id: 'life_modern_issues', name: 'Không gian sống & Các vấn đề lối sống hiện đại' }
  ]
};

const SAMPLE_PROMPTS = {
  edu_purpose: "Some people believe that the main aim of university education is to help graduates find better jobs, while others think that university education has much wider benefits for individuals and society. Discuss both views and give your opinion.",
  env_climate: "Global warming is one of the most serious issues that the world is facing today. What are the causes of global warming and what measures can governments and individuals take to tackle the issue?",
  tech_ai: "Some people believe that artificial intelligence will eventually replace human workers in most industries. To what extent do you agree or disagree?",
  health_diet_fitness: "In some countries, the average weight of people is increasing and their levels of health and fitness are decreasing. What do you think are the causes of these problems and what measures could be taken to solve them?",
  work_career_choice: "When choosing a job, the salary is the most important consideration. To what extent do you agree or disagree?",
  soc_culture: "The increase in international travel and business has led to a situation where people are adopting a single global culture. Do you think the advantages of this outweigh the disadvantages?",
  life_health_recreation: "Stress: What are the factors that cause stress and how to cope with stress?",
  media_news_influence: "The news media have become too much influence in people's lives today and this is a negative development. To what extent do you agree or disagree?"
};

// --- GEMINI API HELPERS ---
const MODEL_NAME = "gemini-2.5-flash"; 

async function fetchWithRetry(options, retries = 2) {
  if (IS_PREVIEW_MODE) {
      return new Promise(resolve => setTimeout(() => {
          resolve({ 
            candidates: [{ 
                content: { 
                    parts: [{ 
                        text: JSON.stringify({ 
                            message: "Đây là dữ liệu ảo vì đang ở chế độ Preview Mode.",
                            overallBand: 7.5, trScore: 7.0, ccScore: 8.0, lrScore: 7.0, graScore: 7.5,
                            trComment: "Khá tốt.", ccComment: "Mượt mà.", lrComment: "Từ vựng ổn.", graComment: "Ngữ pháp tốt.",
                            detailedCorrections: [], polishedEssay: "Mock polished essay.",
                            centralIdea: "Mock Central Idea", view40: { title: "View 40", ideas: [{letter: 'E', category: 'Economic', keyword: 'Money'}] }, view60: { title: "View 60", ideas: [{letter: 'S', category: 'Social', keyword: 'People'}] },
                            steps: [
                                { id: "intro", title: "1. Mở bài", instruction: "Viết mở bài", structures: [{name: "Cách 1", hint: "Hint 1"}], requiredVocab: [{phrase: "environmental impact", meaning: "tác động môi trường"}] },
                                { id: "body1", title: "2. Thân bài 1", instruction: "Viết body 1", structures: [{name: "Cách 1", hint: "Hint 1"}], requiredVocab: [{phrase: "detrimental effect", meaning: "ảnh hưởng xấu"}] },
                                { id: "body2", title: "3. Thân bài 2", instruction: "Viết body 2", structures: [{name: "Cách 1", hint: "Hint 1"}], requiredVocab: [] },
                                { id: "conclusion", title: "4. Kết bài", instruction: "Viết kết bài", structures: [{name: "Cách 1", hint: "Hint 1"}], requiredVocab: [] }
                            ],
                            options: [{ phrase: "environmental protection", band: "7.0" }, { phrase: "safeguarding the environment", band: "8.0" }]
                        }) 
                    }] 
                } 
            }] 
          });
      }, 800)); 
  }

  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error("MISSING_API_KEY");
  
  const delays = [2000, 4000];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey.trim()}`;
  
  for (let i = 0; i <= retries; i++) {
    let timeoutId;
    try {
      const controller = new AbortController();
      // Timeout 25 giây để tránh treo UI
      timeoutId = setTimeout(() => controller.abort(), 25000); 
      
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 400 || response.status === 403) throw new Error("INVALID_API_KEY");
        if (response.status === 429) throw new Error("QUOTA_EXCEEDED");
        if (response.status === 404) throw new Error("MODEL_NOT_FOUND");
        if (response.status === 500 || response.status === 503) throw new Error("SERVER_BUSY");
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
         if (i === retries) throw new Error("TIMEOUT");
      } else if (error.message === "INVALID_API_KEY" || 
          error.message === "MISSING_API_KEY" || 
          error.message === "QUOTA_EXCEEDED" || 
          error.message === "MODEL_NOT_FOUND") {
        throw error;
      } else {
         if (i === retries) throw error; 
      }
      await new Promise(res => setTimeout(res, delays[i] || 2000));
    }
  }
}

// Hàm trích xuất JSON mới cực kỳ mạnh mẽ, chống lỗi rác văn bản từ AI
const parseGeminiResponse = (text) => {
  try {
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    
    let start = -1;
    let end = -1;
    
    // Ưu tiên object {...} hoặc array [...]
    if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
       start = firstBrace; end = lastBrace;
    } else if (firstBracket !== -1 && lastBracket !== -1) {
       start = firstBracket; end = lastBracket;
    }

    if (start !== -1 && end !== -1) {
       cleaned = cleaned.substring(start, end + 1);
    }
    
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("JSON_PARSE_FAILED");
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

const checkVocabUsed = (text, phrase) => {
    if (!text || !phrase) return false;
    const normalize = (str) => str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim();
    const textWords = normalize(text).split(/\s+/);
    const phraseWords = normalize(phrase).split(/\s+/);
    
    return phraseWords.every(pw => {
        if(pw.length <= 3) return textWords.includes(pw);
        let stem = pw;
        if (pw.endsWith('ing')) stem = pw.slice(0, -3);
        else if (pw.endsWith('ed')) stem = pw.slice(0, -2);
        else if (pw.endsWith('es')) stem = pw.slice(0, -2);
        else if (pw.endsWith('s')) stem = pw.slice(0, -1);
        else stem = pw.substring(0, pw.length - 1);
        return textWords.some(tw => tw.includes(stem));
    });
};

export default function App() {
  // --- AUTH STATES ---
  const [user, setUser] = useState(IS_PREVIEW_MODE ? { email: 'tester@preview.com', uid: 'mock-user-123' } : null);
  const [isAuthorized, setIsAuthorized] = useState(IS_PREVIEW_MODE ? true : null); 
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(!IS_PREVIEW_MODE);

  // Lắng nghe trạng thái đăng nhập
  useEffect(() => {
    if (!IS_PREVIEW_MODE && auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthChecking(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const [userStats, setUserStats] = useState(IS_PREVIEW_MODE ? { currentStreak: 4, longestStreak: 12, lastWriteDate: new Date(Date.now() - 86400000).toLocaleDateString('en-CA') } : { currentStreak: 0, longestStreak: 0, lastWriteDate: null });

  const [activeTab, setActiveTab] = useState('practice'); 
  
  // Practice States
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [prompt, setPrompt] = useState('');
  const [essay, setEssay] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [writingTarget, setWritingTarget] = useState('full');
  
  const [apiTimestamps, setApiTimestamps] = useState([]);
  
  const [copilotUses, setCopilotUses] = useState(3);
  const [copilotCooldown, setCopilotCooldown] = useState(0);
  const [showCopilotMenu, setShowCopilotMenu] = useState(false);
  const [copilotOptions, setCopilotOptions] = useState([]);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotWordInfo, setCopilotWordInfo] = useState({ word: '', index: -1, length: 0 });

  const [selectedSample, setSelectedSample] = useState(null); 
  const [selectedVocab, setSelectedVocab] = useState(null);
  const [showVocabSidebar, setShowVocabSidebar] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showParaphraseModal, setShowParaphraseModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [showGuidedModal, setShowGuidedModal] = useState(false); 

  const [guidedPlan, setGuidedPlan] = useState(null);
  const [guidedStepIndex, setGuidedStepIndex] = useState(0);
  const [guidedDrafts, setGuidedDrafts] = useState({ intro: '', body1: '', body2: '', conclusion: '' });
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [isGuidedDraft, setIsGuidedDraft] = useState(false); 

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  
  const [sampleEssays, setSampleEssays] = useState(IS_PREVIEW_MODE ? [
    { id: 's1', topic: 'society', subtopic: 'soc_traffic', prompt: 'Some people think that governments should invest mainly in making public transportation faster while other think there are more important priorities. Discuss both views and give your own opinion.', content: 'While some people believe that the most important factor in public transport is speed, others extol areas such as cost and the environment...' },
    { id: 's2', topic: 'crime', subtopic: 'crime_law_justice', prompt: 'In some countries, some criminal trials in law courts are shown on television so that the general public can watch. Do the advantages outweigh the disadvantages?', content: 'It is true that people, in some countries, can watch some criminal trials live on TV...' }
  ] : []);
  const [vocabularies, setVocabularies] = useState(IS_PREVIEW_MODE ? [
    { id: 'v1', topicId: 'society', subtopicId: 'soc_traffic', phrase: 'traffic congestion', translation: 'tắc nghẽn giao thông', examples: ['Heavy **traffic congestion** is a major problem in modern cities.', 'The new policy aims to reduce **traffic congestion** during rush hours.'] }
  ] : []);
  const [evaluationsHistory, setEvaluationsHistory] = useState(IS_PREVIEW_MODE ? [
    { id: 'ev1', prompt: 'Sample prompt 1', wordCount: 250, target: 'full', overallBand: 6.5, trScore: 6.0, ccScore: 6.0, lrScore: 7.0, graScore: 7.0, createdAt: new Date().toISOString() }
  ] : []);
  
  useEffect(() => {
    if (IS_PREVIEW_MODE || !user || !db) return;
    
    const unsubSamples = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'sample_essays'), (snapshot) => {
      setSampleEssays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const unsubVocab = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'vocabulary'), (snapshot) => {
      setVocabularies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubEvals = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'evaluations'), (snapshot) => {
      setEvaluationsHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStats = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'user_info', 'stats'), (docSnap) => {
      if (docSnap.exists()) setUserStats(docSnap.data());
    });

    return () => {
      unsubSamples();
      unsubVocab();
      unsubEvals();
      unsubStats();
    };
  }, [user]);

  const [mindMapData, setMindMapData] = useState(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [suggestedPromptVocabs, setSuggestedPromptVocabs] = useState([]);
  const [isGeneratingPromptVocabs, setIsGeneratingPromptVocabs] = useState(false);
  
  const [timeRemaining, setTimeRemaining] = useState(40 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [activeCommentIndex, setActiveCommentIndex] = useState(null);
  const [correctionAttempts, setCorrectionAttempts] = useState({});
  const [isBatchChecking, setIsBatchChecking] = useState(false); 
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
  const copilotCooldownRef = useRef(0);

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), duration);
  };

  const closeAllSidebars = () => {
    setSelectedSample(null);
    setSelectedVocab(null);
    setShowVocabSidebar(false);
  };

  const getRelevantSamples = (maxCount) => {
    let relevantSamples = sampleEssays.filter(s => s.prompt.toLowerCase().trim() === prompt.toLowerCase().trim());
    if (relevantSamples.length < maxCount && selectedSubtopic) {
        const subtopicSamples = sampleEssays.filter(s => s.subtopic === selectedSubtopic && !relevantSamples.find(r => r.id === s.id));
        relevantSamples = [...relevantSamples, ...subtopicSamples];
    }
    if (relevantSamples.length < maxCount && selectedTopic) {
        const topicSamples = sampleEssays.filter(s => s.topic === selectedTopic && !relevantSamples.find(r => r.id === s.id));
        relevantSamples = [...relevantSamples, ...topicSamples];
    }
    return relevantSamples.slice(0, maxCount);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setApiTimestamps(prev => prev.filter(t => now - t < 60000)); 
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkAndRecordApiCall = () => {
    if (IS_PREVIEW_MODE) return true; 
    
    if (apiTimestamps.length >= 15) {
      showToast("⚡ Năng lượng AI đã cạn. Hệ thống đang tự hồi phục, vui lòng đợi vài giây!", "error", 5000);
      return false; 
    }
    
    if (apiTimestamps.length === 13) { 
      showToast("⚠️ Chú ý: Năng lượng AI sắp cạn (14/15). Hãy tạm dừng vài giây để hệ thống phục hồi nhé!", "error", 6000);
    }

    setApiTimestamps(prev => [...prev, Date.now()]);
    return true; 
  };

  useEffect(() => {
    if (copilotCooldown > 0) {
       copilotCooldownRef.current = copilotCooldown;
       const timer = setTimeout(() => setCopilotCooldown(c => c - 1), 1000);
       return () => clearTimeout(timer);
    } else {
       copilotCooldownRef.current = 0;
    }
  }, [copilotCooldown]);

  const handleLogin = async () => {
    if (IS_PREVIEW_MODE) return showToast("Chức năng Login bị tắt trong bản Preview.", "info");
    
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (e) { showToast("Đăng nhập thất bại. Hãy thử lại.", "error"); } 
    finally { setIsLoggingIn(false); }
  };

  const handleLogout = async () => { 
    if (IS_PREVIEW_MODE) {
        setUser(null);
        setIsAuthorized(null);
    } else {
        await signOut(auth); 
    }
  };

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem('gemini_api_key', tempApiKey.trim());
      setShowApiKeyModal(false);
      showToast("Đã lưu API Key thành công!", "success");
    } else {
      showToast("Vui lòng nhập API Key", "error");
    }
  };

  const handleApiError = (error) => {
    if (error.message === "INVALID_API_KEY" || error.message === "MISSING_API_KEY") {
      setShowApiKeyModal(true);
      showToast("API Key không hợp lệ! Nếu copy, hãy chú ý tránh dư dấu cách.", "error", 6000);
    } else if (error.message === "TIMEOUT") {
      showToast("⏳ Mạng chậm hoặc AI phản hồi quá lâu. Vui lòng thử lại!", "error", 5000);
    } else if (error.message === "JSON_PARSE_FAILED") {
      showToast("⚠️ AI trả về dữ liệu không đúng định dạng. Vui lòng bấm thử lại!", "error", 5000);
    } else if (error.message === "QUOTA_EXCEEDED") {
      showToast("⚠️ Thao tác quá nhanh (Lỗi 429). Hãy đợi khoảng 1 phút để AI hồi sức nhé!", "error", 6000);
    } else if (error.message === "SERVER_BUSY") {
      showToast("⏳ Máy chủ Google đang bị nghẽn tải. Vui lòng bấm thử lại sau vài giây.", "error", 6000);
    } else if (error.message === "MODEL_NOT_FOUND") {
      showToast("⚠️ Lỗi 404: Khóa API của bạn không được cấp quyền cho Mô hình này. Vui lòng tạo Key mới.", "error", 8000);
    } else {
      showToast("Lỗi kết nối AI: " + error.message, "error");
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Tab') && !showCopilotMenu) {
      if (!editorRef.current) return;
      const cursorPosition = editorRef.current.selectionEnd;
      const textBeforeCursor = essay.substring(0, cursorPosition);
      
      const match = textBeforeCursor.match(/(?:^|\s)@([^@]+)@$/);
      
      if (match) {
         e.preventDefault(); 
         const vietnameseWord = match[1].trim(); 
         const wordStartIndex = cursorPosition - match[0].length + (match[0].startsWith(' ') ? 1 : 0);
         
         if (copilotUses <= 0) {
             return showToast("Bạn đã hết quyền trợ giúp từ vựng cho bài này. Hãy cố gắng vận dụng vốn từ của bản thân!", "error", 5000);
         }
         if (copilotCooldownRef.current > 0) {
             return showToast(`⏳ Tính năng đang hồi chiêu. Vui lòng đợi ${copilotCooldownRef.current}s nữa.`, "info");
         }

         triggerCopilot(vietnameseWord, wordStartIndex, match[0].trim().length);
      }
    }
  };

  const triggerCopilot = async (vietnameseWord, startIndex, lengthToReplace) => {
    if (!checkAndRecordApiCall()) return; 

    setIsCopilotLoading(true);
    setCopilotWordInfo({ word: vietnameseWord, index: startIndex, length: lengthToReplace });
    
    const contextStart = Math.max(0, startIndex - 150);
    const context = essay.substring(contextStart, startIndex);

    const systemPrompt = `You are an IELTS Task 2 Vocabulary Copilot. 
    The student is writing: "...${context}[${vietnameseWord}]...".
    Translate the Vietnamese concept "[${vietnameseWord}]" into EXACTLY 3 English academic collocations/phrases that fit the context perfectly.
    Return strictly JSON: { "options": [ {"phrase": "...", "band": "7.0"}, {"phrase": "...", "band": "8.0"}, {"phrase": "...", "band": "8.5+"} ] }`;

    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Suggest words." }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      const data = parseGeminiResponse(result.candidates[0].content.parts[0].text);
      setCopilotOptions(data.options || []);
      setShowCopilotMenu(true);
      setCopilotUses(prev => prev - 1); 
      setCopilotCooldown(10); 
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const applyCopilotOption = (phrase) => {
    const before = essay.substring(0, copilotWordInfo.index);
    const after = essay.substring(copilotWordInfo.index + copilotWordInfo.length);
    const newText = before + phrase + after;
    setEssay(newText);
    setShowCopilotMenu(false);
    
    setTimeout(() => {
       if (editorRef.current) {
          editorRef.current.focus();
          const newPosition = copilotWordInfo.index + phrase.length;
          editorRef.current.setSelectionRange(newPosition, newPosition);
       }
    }, 50);
  };

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
      if (e.target.closest('#selection-popup') || e.target.closest('.locate-btn') || showApiKeyModal || showCopilotMenu) return;
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
  }, [showApiKeyModal, showCopilotMenu]);

  const handleOpenReviewVocab = () => {
    setNewVocab({ topic: selectedTopic || '', subtopic: selectedSubtopic || '', phrase: selectionPopup.text, basePhrase: '', translation: '', example1: '', example2: '' });
    setVocabStep('init'); setShowVocabModal(true); setSelectionPopup({ show: false, text: '', x: 0, y: 0 });
    window.getSelection().removeAllRanges();
  };

  const handleAnalyzeVocab = async () => {
    if (!newVocab.topic) return showToast("Vui lòng chọn Chủ đề để AI hiểu ngữ cảnh!", "error");
    if (!newVocab.phrase.trim()) return showToast("Vui lòng nhập từ vựng cần phân tích!", "error");
    if (!checkAndRecordApiCall()) return;

    setVocabStep('analyzing');
    const topicName = TOPICS.find(t => t.id === newVocab.topic)?.name || '';
    const subtopicName = newVocab.subtopic ? (SUBTOPICS[newVocab.topic]?.find(s => s.id === newVocab.subtopic)?.name || '') : '';
    const contextTopic = subtopicName ? `${topicName} (specifically ${subtopicName})` : topicName;
    
    const systemInstruction = `Analyze the phrase: "${newVocab.phrase}" in the context of the IELTS topic "${contextTopic}". 
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
    if (!user && !IS_PREVIEW_MODE) return showToast("Bạn cần đăng nhập để lưu từ vựng!", "error");
    
    try {
      if (newVocab.id) {
          if (IS_PREVIEW_MODE) {
              setVocabularies(prev => prev.map(v => v.id === newVocab.id ? { ...v, topicId: newVocab.topic || '', subtopicId: newVocab.subtopic || '', phrase: targetPhrase, translation: newVocab.translation || '', examples: [newVocab.example1 || '', newVocab.example2 || ''] } : v));
              showToast("Đã cập nhật từ vựng (MOCK)!", "success");
          } else {
              await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'vocabulary', newVocab.id), { topicId: newVocab.topic || '', subtopicId: newVocab.subtopic || '', phrase: targetPhrase, translation: newVocab.translation || '', examples: [newVocab.example1 || '', newVocab.example2 || ''] });
              showToast("Đã cập nhật từ vựng!", "success");
          }
      } else {
          if (IS_PREVIEW_MODE) {
              setVocabularies(prev => [{ id: Date.now().toString(), topicId: newVocab.topic || '', subtopicId: newVocab.subtopic || '', phrase: targetPhrase, translation: newVocab.translation || '', examples: [newVocab.example1 || '', newVocab.example2 || ''], createdAt: new Date().toISOString() }, ...prev]);
              showToast("Đã lưu từ vựng vào kho (MOCK)!", "success");
          } else {
              await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'vocabulary'), { topicId: newVocab.topic || '', subtopicId: newVocab.subtopic || '', phrase: targetPhrase, translation: newVocab.translation || '', examples: [newVocab.example1 || '', newVocab.example2 || ''], createdAt: new Date().toISOString() });
              showToast("Đã lưu từ vựng vào kho!", "success");
          }
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
    setCopilotUses(3); setIsGuidedDraft(false); 
  };

  const handleSuggestIdeas = async () => {
    if (!prompt.trim()) return showToast("Vui lòng nhập đề bài trước.", "error");
    setShowIdeasModal(true); if (mindMapData) return; 
    if (!checkAndRecordApiCall()) { setShowIdeasModal(false); return; } 
    
    setIsGeneratingIdeas(true);

    const relevantSamples = getRelevantSamples(3);
    let referenceContext = "";
    if (relevantSamples.length > 0) {
        referenceContext = `\n\nREFERENCE ESSAYS TO BASE IDEAS ON:\n${relevantSamples.map((s, i) => `Essay ${i+1}:\n${s.content}`).join('\n\n')}\n\nCRITICAL INSTRUCTION: Analyze the Reference Essays provided above. Extract the core arguments and ideas from them to build this EGOSFI mind map. Do not invent completely new ideas if the reference essays already cover the topic well.`;
    }

    const systemInstruction = `You are an IELTS Writing Task 2 expert. Generate an EGOSFI mind map for this prompt: "${prompt}".
    Structure ideas into View 40 (opposing) and View 60 (supporting). Use E, G, O, S, F, I categories.${referenceContext}
    Return strictly JSON: { "centralIdea": "...", "view40": {"title": "...", "ideas": [{"letter": "S", "category": "...", "keyword": "...", "explanation": "..."}]}, "view60": {...} }`;
    
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Generate EGOSFI mind map." }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      setMindMapData(parseGeminiResponse(result.candidates[0].content.parts[0].text));
    } catch (error) { handleApiError(error); setShowIdeasModal(false); } finally { setIsGeneratingIdeas(false); }
  };

  const handleSuggestPromptVocab = async () => { 
    if (!prompt.trim()) return showToast("Vui lòng nhập đề bài trước.", "error");
    closeAllSidebars(); setShowVocabSidebar(true); if (suggestedPromptVocabs.length > 0) return; 
    if (!checkAndRecordApiCall()) { setShowVocabSidebar(false); return; } 
    
    setIsGeneratingPromptVocabs(true);

    const relevantSamples = getRelevantSamples(5);
    let referenceContext = "";
    if (relevantSamples.length > 0) {
        referenceContext = `\n\nREFERENCE ESSAYS TO EXTRACT VOCABULARY FROM:\n${relevantSamples.map((s, i) => `Essay ${i+1}:\n${s.content}`).join('\n\n')}\n\nCRITICAL INSTRUCTION: You MUST extract the vocabulary phrases directly from the text of the Reference Essays provided above. Do not invent new phrases if there are good ones in the text.`;
    }

    const systemInstruction = `Suggest exactly 10 academic phrases (Band 7.5+) for this prompt: "${prompt}".${referenceContext}
    Return strictly JSON array of objects with {phrase, meaning, source}.`;
    
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Suggest vocabulary." }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      
      const responseData = parseGeminiResponse(result.candidates[0].content.parts[0].text);
      let parsedArray = [];
      if (Array.isArray(responseData)) {
          parsedArray = responseData;
      } else if (responseData && typeof responseData === 'object') {
          const arr = Object.values(responseData).find(v => Array.isArray(v));
          if (arr) parsedArray = arr;
      }
      setSuggestedPromptVocabs(parsedArray);
      
    } catch (error) { handleApiError(error); setShowVocabSidebar(false); } finally { setIsGeneratingPromptVocabs(false); }
  };

  const handleStartGuidedWriting = async () => {
    if (!prompt.trim()) return showToast("Vui lòng nhập đề bài trước!", "error");
    setShowGuidedModal(true); 
    if (!checkAndRecordApiCall()) { setShowGuidedModal(false); return; } 

    setIsGeneratingGuide(true);
    setGuidedPlan(null); setGuidedDrafts({ intro: '', body1: '', body2: '', conclusion: '' }); setGuidedStepIndex(0);

    const relevantSamples = getRelevantSamples(3);
    let referenceContext = "";
    if (relevantSamples.length > 0) {
        referenceContext = `\n\nREFERENCE ESSAYS TO EXTRACT VOCABULARY AND IDEAS FROM:\n${relevantSamples.map((s, i) => `Essay ${i+1}:\n${s.content}`).join('\n\n')}\n\nCRITICAL INSTRUCTION: You MUST base the suggested structures and extract the "requiredVocab" collocations directly from the Reference Essays provided above. Help the student replicate the flow and wording of these 9.0 essays.`;
    }

    const systemInstruction = `You are an expert IELTS Writing Tutor. The student needs to write an essay for this prompt: "${prompt}".${referenceContext}
    Create a 4-step Guided Writing Plan. For Intro, Body 1 and Body 2, provide EXACTLY 3 natural, precise, and context-appropriate collocations (Band 7.5+) extracted from references that the student should try to use.
    
    CRITICAL RULES:
    1. DO NOT use obscure "big words". Prioritize natural phrasing.
    2. Provide 2 DIFFERENT grammatical structures for each step.
    
    Return STRICTLY JSON matching this structure:
    {
      "steps": [
        {
          "id": "intro", "title": "1. Mở bài", 
          "instruction": "Paraphrase đề bài và đưa ra Thesis Statement.", 
          "structures": [{"name": "Cấu trúc 1", "hint": "Gợi ý..."}, {"name": "Cấu trúc 2", "hint": "Gợi ý..."}],
          "requiredVocab": [{"phrase": "collocation 1", "meaning": "nghĩa"}, {"phrase": "collocation 2", "meaning": "nghĩa"}, {"phrase": "collocation 3", "meaning": "nghĩa"}]
        },
        {
          "id": "body1", "title": "2. Thân bài 1", 
          "instruction": "Viết đoạn Body 1. Hãy cố gắng áp dụng các cụm từ đắt giá dưới đây.", 
          "structures": [{"name": "Cấu trúc 1", "hint": "..."}, {"name": "Cấu trúc 2", "hint": "..."}],
          "requiredVocab": [{"phrase": "...", "meaning": "..."}, {"phrase": "...", "meaning": "..."}, {"phrase": "...", "meaning": "..."}]
        },
        {
          "id": "body2", "title": "3. Thân bài 2", 
          "instruction": "Viết đoạn Body 2. Hãy cố gắng áp dụng các cụm từ đắt giá dưới đây.", 
          "structures": [{"name": "Cấu trúc 1", "hint": "..."}, {"name": "Cấu trúc 2", "hint": "..."}],
          "requiredVocab": [{"phrase": "...", "meaning": "..."}, {"phrase": "...", "meaning": "..."}, {"phrase": "...", "meaning": "..."}]
        },
        {
          "id": "conclusion", "title": "4. Kết bài", 
          "instruction": "Tóm tắt và khẳng định lại quan điểm.", 
          "structures": [{"name": "Cấu trúc 1", "hint": "..."}, {"name": "Cấu trúc 2", "hint": "..."}],
          "requiredVocab": []
        }
      ]
    }`;

    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Generate Guided Writing Plan" }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      setGuidedPlan(parseGeminiResponse(result.candidates[0].content.parts[0].text));
    } catch (error) { 
        handleApiError(error); 
        setShowGuidedModal(false); 
    } finally { 
        setIsGeneratingGuide(false); 
    }
  };

  const handleParaphrase = async () => { 
    if (!paraphraseInput.trim()) return;
    if (!checkAndRecordApiCall()) return; 
    
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
    const minWords = writingTarget === 'full' ? 150 : 50;
    if (wordCount < 30) return showToast("Vui lòng viết ít nhất 30 từ để AI có thể đánh giá.", "error");
    
    const meetsStreakReq = wordCount >= minWords;
    if (!meetsStreakReq) {
       showToast(`Bài viết của bạn chưa đủ độ dài (${minWords} từ) để được cộng chuỗi Streak. AI vẫn sẽ chấm điểm nhé!`, "info", 6000);
    }

    if (!checkAndRecordApiCall()) return;

    setIsEvaluating(true); setIsTimerRunning(false); setActiveCommentIndex(null); setCorrectionAttempts({});
    setCopilotUses(3); 
    
    let targetInstruction = writingTarget === 'full' ? `Grade the FULL ESSAY.` : writingTarget === 'intro_conc' ? `The student is ONLY writing the INTRODUCTION and CONCLUSION. Evaluate based on Paraphrasing and Thesis.` : `The student is ONLY writing BODY PARAGRAPH(S). Evaluate based on flow, coherence and topic sentences.`;
    
    // RAG Logic: Lấy tối đa 5 bài mẫu
    const relevantSamples = getRelevantSamples(5);
    let referenceContext = "";
    if (relevantSamples.length > 0) {
        referenceContext = `\n\nREFERENCE ESSAYS (BAND 9.0 STANDARD):\n${relevantSamples.map((s, i) => `Essay ${i+1}:\n${s.content}`).join('\n\n')}\n\nCRITICAL SEPARATION RULE FOR TASK RESPONSE (TR):
        The reference essays are provided ONLY to calibrate your standard for Vocabulary (LR), Grammar (GRA), and Cohesion (CC). 
        DO NOT force the student to use the same ideas or opinions as the reference essays. Evaluate the student's Task Response based solely on how logically they develop THEIR OWN ideas, even if they completely contradict the reference essays.
        For CC and LR, DO NOT penalize natural phrasing or implicit cohesion if it matches the high-level style of the reference essays.`;
    }

    let systemInstruction = `You are a strict and expert IELTS Writing Task 2 examiner. 
    1. SCORING CRITERIA: Grade the essay based STRICTLY on the official IELTS Writing Task 2 Band Descriptors (Public Version).
    2. SCORING RULE: Calculate the average of the 4 criteria. Round down to the nearest 0.5. ${referenceContext}
    3. TARGET: ${targetInstruction} Provide specific comments and detailedCorrections: [{original, corrected, explanation}].
    4. Return strictly JSON: { "overallBand": 6.5, "trScore": 6.0, "trComment": "...", "ccScore": 7.0, "ccComment": "...", "lrScore": 6.0, "lrComment": "...", "graScore": 6.0, "graComment": "...", "detailedCorrections": [...], "polishedEssay": "Band 8.0 polished version of what student wrote." }`;
    
    try {
      const result = await fetchWithRetry({
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Prompt: ${prompt}\nStudent Text (${writingTarget}): ${essay}` }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } })
      });
      const evaluation = parseGeminiResponse(result.candidates[0].content.parts[0].text);
      setEvaluationResult(evaluation);
      
      if (!IS_PREVIEW_MODE && user) {
         await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'evaluations'), { prompt, wordCount, target: writingTarget, overallBand: evaluation.overallBand, trScore: evaluation.trScore, ccScore: evaluation.ccScore, lrScore: evaluation.lrScore, graScore: evaluation.graScore, createdAt: new Date().toISOString() });
      } else if (IS_PREVIEW_MODE) {
         setEvaluationsHistory(prev => [{ id: Date.now().toString(), prompt, wordCount, target: writingTarget, overallBand: evaluation.overallBand, trScore: evaluation.trScore, ccScore: evaluation.ccScore, lrScore: evaluation.lrScore, graScore: evaluation.graScore, createdAt: new Date().toISOString() }, ...prev]);
      }

      if (meetsStreakReq) {
         const today = new Date().toLocaleDateString('en-CA'); 
         const yesterdayDate = new Date();
         yesterdayDate.setDate(yesterdayDate.getDate() - 1);
         const yesterday = yesterdayDate.toLocaleDateString('en-CA');

         let newStreak = userStats.currentStreak || 0;
         if (userStats.lastWriteDate !== today) {
            if (userStats.lastWriteDate === yesterday) {
               newStreak += 1;
            } else {
               newStreak = 1;
            }
         }
         
         const newLongest = Math.max(userStats.longestStreak || 0, newStreak);
         const newStats = { currentStreak: newStreak, longestStreak: newLongest, lastWriteDate: today };

         if (!IS_PREVIEW_MODE && user) {
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'user_info', 'stats'), newStats);
         } else {
            setUserStats(newStats);
         }

         if (userStats.lastWriteDate !== today) {
            showToast(`🔥 Tuyệt vời! Bạn đã hoàn thành bài tập. Streak: ${newStreak} ngày liên tiếp!`, "success", 5000);
         }
      }

    } catch (error) { handleApiError(error); } finally { setIsEvaluating(false); }
  };

  const handleBatchCheckCorrections = async () => {
    const pendingChecks = Object.entries(correctionAttempts)
      .filter(([idx, attempt]) => attempt.text && attempt.text.trim() && !attempt.reviewed)
      .map(([idx, attempt]) => ({
          idx: idx,
          originalError: evaluationResult.detailedCorrections[idx].original,
          studentRewrite: attempt.text.trim()
      }));

    if (pendingChecks.length === 0) {
       return showToast("Vui lòng viết lại ít nhất 1 câu lỗi trước khi kiểm tra.", "info");
    }

    if (!checkAndRecordApiCall()) return;

    setIsBatchChecking(true);
    
    const batchPayload = pendingChecks.map(p => ({
        id: p.idx,
        error: p.originalError,
        rewrite: p.studentRewrite
    }));

    const systemPrompt = `You are an IELTS teacher. Evaluate a batch of student's rewritten sentences.
    Input format: an array of objects {id, error, rewrite}.
    For each rewrite, check if it successfully fixes the original error in grammatical/lexical context.
    Return strictly JSON: { "results": [ { "id": "...", "isCorrect": true/false, "feedback": "Brief feedback max 15 words" } ] }`;

    try {
        const result = await fetchWithRetry({
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: JSON.stringify(batchPayload) }] }], 
                systemInstruction: { parts: [{ text: systemPrompt }] }, 
                generationConfig: { responseMimeType: "application/json" } 
            })
        });
        
        const aiReview = parseGeminiResponse(result.candidates[0].content.parts[0].text);
        
        setCorrectionAttempts(prev => {
            const newState = { ...prev };
            aiReview.results.forEach(res => {
                if (newState[res.id]) {
                    newState[res.id] = {
                        ...newState[res.id],
                        reviewed: true,
                        isCorrect: res.isCorrect,
                        feedback: res.feedback,
                        showAnswer: true
                    };
                }
            });
            return newState;
        });

        showToast(`Tuyệt vời! Đã chấm xong ${aiReview.results.length} câu ⚡`, "success", 5000);

    } catch (e) { 
        handleApiError(e); 
    } finally { 
        setIsBatchChecking(false); 
    }
  };

  const handleStartQuiz = async () => {
    const filteredVocabs = vocabularies.filter(v => (filterQuizTopic ? v.topicId === filterQuizTopic : true) && (filterQuizSubtopic ? v.subtopicId === filterQuizSubtopic : true));
    if (filteredVocabs.length < 1) return showToast("Không có từ vựng nào. Hãy thêm từ mới nhé!", "error");
    if (!checkAndRecordApiCall()) return; 

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

  const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  const handleLocateError = (originalText) => {
    if (!editorRef.current) return;
    const index = essay.indexOf(originalText);
    if (index !== -1) { editorRef.current.focus(); editorRef.current.setSelectionRange(index, index + originalText.length); editorRef.current.scrollTop = Math.max(0, (essay.substring(0, index).split('\n').length - 3) * 24); } 
    else showToast("Không tìm thấy câu này trong bài viết.", "info");
  };
  const triggerDelete = (col, id) => setDeleteConfirm({ col, id });
  const confirmDeleteAction = async () => { 
      if (IS_PREVIEW_MODE) {
          if (deleteConfirm.col === 'vocabulary') setVocabularies(prev => prev.filter(v => v.id !== deleteConfirm.id));
          if (deleteConfirm.col === 'sample_essays') setSampleEssays(prev => prev.filter(s => s.id !== deleteConfirm.id));
      } else if (user) {
          await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, deleteConfirm.col, deleteConfirm.id)); 
      }
      setDeleteConfirm(null); 
  };
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
      if (newSample.id) { 
          if (IS_PREVIEW_MODE) {
              setSampleEssays(prev => prev.map(s => s.id === newSample.id ? { ...s, ...safeData } : s));
              showToast("Đã cập nhật (MOCK)!", "success"); 
          } else if (user) {
              await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sample_essays', newSample.id), safeData); 
              showToast("Đã cập nhật!", "success"); 
          }
      } else { 
          if (IS_PREVIEW_MODE) {
              setSampleEssays(prev => [{ id: Date.now().toString(), ...safeData, createdAt: new Date().toISOString() }, ...prev]);
              showToast("Đã thêm (MOCK)!", "success"); 
          } else if (user) {
              await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sample_essays'), { ...safeData, createdAt: new Date().toISOString() }); 
              showToast("Đã thêm!", "success");
          }
      }
      setShowSampleModal(false); setNewSample({ topic: '', subtopic: '', prompt: '', content: '' });
    } catch (error) { showToast("Lỗi: " + error.message, "error"); }
  };
  const processImportBackup = async () => {
    if (!importDataString.trim()) return showToast("Vui lòng nhập JSON.", "error");
    if (!user && !IS_PREVIEW_MODE) return showToast("Vui lòng đăng nhập để khôi phục dữ liệu.", "error");
    
    setIsRestoring(true);
    try {
      const data = JSON.parse(importDataString);
      if (IS_PREVIEW_MODE) {
          if (data.sampleEssays) setSampleEssays(prev => [...data.sampleEssays, ...prev]);
          if (data.vocabularies) setVocabularies(prev => [...data.vocabularies, ...prev]);
          showToast(`Đã khôi phục thành công (MOCK)!`, 'success');
      } else {
          for (const s of data.sampleEssays || []) { const { id, ...r } = s; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sample_essays'), r); }
          for (const v of data.vocabularies || []) { const { id, ...r } = v; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'vocabulary'), r); }
          for (const e of data.evaluationsHistory || []) { const { id, ...r } = e; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'evaluations'), r); }
          showToast(`Đã khôi phục thành công!`, 'success');
      }
      setShowImportModal(false); setImportDataString(''); 
    } catch (e) { showToast("Dữ liệu JSON không hợp lệ.", "error"); } finally { setIsRestoring(false); }
  };

  const renderTopNav = () => (
    <div className="w-full bg-slate-900 text-slate-300 flex flex-wrap lg:flex-nowrap items-center justify-between px-4 py-2 shrink-0 shadow-md z-20 relative gap-3">
      <div className="flex items-center gap-3 shrink-0">
        <div className="bg-emerald-500 p-1.5 rounded-lg text-white"><PenTool size={18} /></div>
        <div className="flex flex-col">
          <h1 className="text-white font-bold text-base leading-tight flex items-center gap-2">
            Max Academy 
            {IS_PREVIEW_MODE && <span className="bg-rose-500 text-[9px] px-1.5 py-0.5 rounded shadow-sm">PREVIEW MODE</span>}
          </h1>
          <p className="text-[10px] text-emerald-400 font-medium leading-tight">Crafted by Nguyễn Mai Bá Trường</p>
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
        <div className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-black text-sm border border-orange-200 shadow-sm cursor-help" title={`Kỷ lục dài nhất: ${userStats.longestStreak || 0} ngày`}>
           🔥 {userStats.currentStreak || 0}
        </div>

        <div className="bg-slate-800 px-3 py-1.5 rounded-lg flex flex-col hidden sm:flex">
           <span className="text-[9px] text-slate-400 uppercase font-black">Học viên</span>
           <span className="text-xs text-white font-medium truncate max-w-[120px]">
             {user ? (user.email || 'User') : 'Khách'}
           </span>
        </div>
        
        {!user && !IS_PREVIEW_MODE ? (
           <button onClick={handleLogin} disabled={isLoggingIn} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors">
              {isLoggingIn ? <Loader2 size={14} className="animate-spin" /> : "Đăng nhập"}
           </button>
        ) : (
           <>
             <button onClick={() => setShowApiKeyModal(true)} className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors" title="Đổi API Key"><Key size={14} /></button>
             <button onClick={() => setActiveTab('backup')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors" title="Backup & Restore"><AlertTriangle size={14} /></button>
             <button onClick={handleLogout} className="bg-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors" title="Đăng xuất"><LogOut size={14} /></button>
           </>
        )}
      </div>
    </div>
  );

  const renderPracticeTab = () => {
    const getPlaceholderText = () => {
        const hint = "\n\n💡 MẸO: Gõ @từ tiếng việt@ và bấm Dấu cách để AI gợi ý từ vựng cao cấp! (Ví dụ: @bảo vệ môi trường@)";
        if (writingTarget === 'intro_conc') return "Viết phần Mở bài và Kết bài của bạn tại đây..." + hint;
        if (writingTarget === 'body') return "Viết phần Thân bài (Body) của bạn tại đây..." + hint;
        return "Viết trọn vẹn bài essay của bạn tại đây..." + hint;
    };

    const pendingCount = Object.values(correctionAttempts).filter(a => a.text && a.text.trim() && !a.reviewed).length;

    return (
    <div className="flex-1 flex p-2 lg:p-3 gap-3 min-h-0 relative">
      
      <div className="flex-1 flex flex-col min-w-0 gap-3 relative">
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm shrink-0">
          <span className="text-lg">🔥</span> 
          {userStats.currentStreak > 0 
              ? `Tuyệt vời! Bạn đang giữ chuỗi ${userStats.currentStreak} ngày. Hãy hoàn thành 1 bài hôm nay để duy trì phong độ nhé!`
              : `Bắt đầu chuỗi ngày luyện viết của bạn ngay hôm nay!`}
          {(userStats.longestStreak > 0 && userStats.longestStreak > (userStats.currentStreak || 0)) && (
              <span className="text-orange-600 ml-auto hidden md:inline text-xs bg-orange-100 px-2 py-1 rounded-md">Kỷ lục cá nhân: {userStats.longestStreak} ngày</span>
          )}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-0 relative">
          
          <div className="border-b border-slate-100 p-2 lg:p-3 bg-slate-50 flex flex-col gap-2 shrink-0 rounded-t-xl">
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
              <button onClick={handleStartGuidedWriting} disabled={isGeneratingGuide} className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors disabled:opacity-50">
                {isGeneratingGuide ? <Loader2 size={12} className="animate-spin"/> : <BookOpen size={12} />} Hướng dẫn viết
              </button>
              <button onClick={() => { closeAllSidebars(); handleSuggestPromptVocab(); }} disabled={isGeneratingPromptVocabs} className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 disabled:opacity-50">
                {isGeneratingPromptVocabs ? <Loader2 size={12} className="animate-spin"/> : <Tags size={12} />} 10 Từ Ăn Điểm
              </button>
              <button onClick={() => { closeAllSidebars(); setShowStructureModal(true); }} className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-rose-100 text-rose-700"><Columns size={12} /> Cấu trúc 40/60</button>
              <button onClick={handleSuggestIdeas} disabled={isGeneratingIdeas} className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-700 disabled:opacity-50">
                {isGeneratingIdeas ? <Loader2 size={12} className="animate-spin"/> : <Lightbulb size={12} />} Mind Map Idea
              </button>
              <button onClick={() => {
                if (!prompt.trim()) return showToast("Vui lòng nhập đề bài trước.", "error");
                const matchedSample = sampleEssays.find(s => s.prompt.toLowerCase().trim() === prompt.toLowerCase().trim());
                if (matchedSample) { closeAllSidebars(); setSelectedSample(matchedSample); } 
                else showToast("Chưa có bài mẫu cho đề bài này trong Kho.", "info");
              }} className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700"><BookPlus size={12} /> Bài mẫu</button>
            </div>
          </div>

          <div className="flex-1 p-3 relative flex flex-col relative">
            <textarea 
              ref={editorRef} 
              className="w-full h-full resize-none outline-none text-slate-700 leading-relaxed text-[15px] lg:text-base placeholder-slate-400 custom-scrollbar relative z-0" 
              placeholder={getPlaceholderText()} 
              value={essay} 
              onChange={(e) => {
                setEssay(e.target.value);
                if (e.target.value.trim() === '') { setCopilotUses(3); setIsGuidedDraft(false); } 
              }} 
              onKeyDown={handleKeyDown}
              spellCheck={false} 
            />
            
            {(isCopilotLoading || showCopilotMenu) && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center animate-fadeIn rounded-b-xl">
                <div className="bg-white p-5 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm">
                    {isCopilotLoading ? (
                      <div className="text-center py-4 flex flex-col items-center justify-center text-indigo-600">
                          <Loader2 className="animate-spin mb-3" size={32}/>
                          <p className="font-bold text-sm">AI đang tìm cụm từ cho: <span className="text-rose-500">"{copilotWordInfo.word}"</span></p>
                          <p className="text-xs text-slate-400 mt-2">Dựa trên ngữ cảnh bài viết của bạn...</p>
                      </div>
                    ) : (
                      <div className="animate-slideUp">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-black text-slate-700 text-sm flex items-center gap-1.5"><Sparkles size={16} className="text-amber-500"/> Chọn từ thay thế:</h4>
                            <button onClick={() => setShowCopilotMenu(false)} className="text-slate-400 hover:text-rose-500 p-1 bg-slate-100 rounded-md"><X size={14}/></button>
                          </div>
                          <div className="space-y-2">
                            {copilotOptions.map((opt, i) => (
                                <button key={i} onClick={() => applyCopilotOption(opt.phrase)} className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex justify-between items-center group">
                                  <span className="font-bold text-indigo-900 group-hover:text-indigo-700">{opt.phrase}</span>
                                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">Band {opt.band}</span>
                                </button>
                            ))}
                          </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-slate-200 bg-slate-50 p-2.5 flex flex-wrap items-center justify-between shrink-0 gap-2 rounded-b-xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-2 py-1 rounded bg-white border flex items-center gap-1.5 text-xs font-bold text-slate-700" title="Giới hạn 15 lệnh/phút của Google">
                  <Zap size={14} className={apiTimestamps.length >= 12 ? "text-rose-500" : "text-amber-500"} />
                  {15 - apiTimestamps.length}/15
              </div>
              <div className="px-2 py-1 rounded bg-white border text-xs font-bold">{wordCount} từ</div>
              <div className="bg-white px-2 py-1 rounded border flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
                  {formatTime(timeRemaining)}
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-0.5 hover:text-emerald-600 transition-colors">{isTimerRunning ? <Pause size={12}/> : <Play size={12}/>}</button>
                  <button onClick={() => { setIsTimerRunning(false); setTimeRemaining(40 * 60); }} className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors" title="Reset thời gian"><RotateCcw size={12}/></button>
              </div>
              <div className="px-2 py-1 rounded bg-indigo-50 border border-indigo-100 flex items-center gap-1 text-xs font-bold text-indigo-700">
                  🪄 Gợi ý từ (@...@): {copilotUses}/3
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={handleParaphraseFromFooter} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5">
                <Sparkles size={12}/> ✨ Nâng cấp câu
              </button>
              <button onClick={handleEvaluate} disabled={isEvaluating || !essay.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md font-bold text-xs flex items-center gap-1">
                  {isEvaluating ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />} Chấm điểm
              </button>
            </div>
          </div>
        </div>
      </div>

      {evaluationResult && (
        <div 
           className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-slideRight z-10 shrink-0 relative"
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
                    {evaluationResult.detailedCorrections?.map((c, i) => {
                       const attemptState = correctionAttempts[i] || {};
                       const showAnswer = attemptState.showAnswer || attemptState.reviewed;
                       const sentenceDetails = getFullSentenceDetails(essay, c.original, c.corrected);
                        
                       return (
                         <div key={i} ref={(el) => (commentRefs.current[i] = el)} className={`p-4 rounded-xl border transition-all ${activeCommentIndex === i ? 'bg-indigo-50/50 border-indigo-300 shadow-md' : 'bg-slate-50 border-slate-100'}`} onMouseEnter={() => setActiveCommentIndex(i)} onMouseLeave={() => setActiveCommentIndex(null)}>
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
                               <div className="flex flex-col gap-2 animate-fadeIn mt-2">
                                  <span className="text-[11px] font-bold text-slate-500">✍️ Hãy thử viết lại câu trên cho đúng:</span>
                                  <textarea 
                                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all custom-scrollbar resize-none" 
                                      rows={2} 
                                      placeholder="Viết lại toàn bộ câu..." 
                                      value={attemptState.text || ''} 
                                      onChange={(e) => setCorrectionAttempts(prev => ({...prev, [i]: { ...prev[i], text: e.target.value }}))} 
                                      disabled={isBatchChecking} 
                                  />
                                  <div className="flex justify-end mt-1">
                                    <button onClick={() => setCorrectionAttempts(prev => ({...prev, [i]: { ...prev[i], showAnswer: true }}))} className="text-[11px] text-slate-400 hover:text-slate-600 font-bold underline transition-colors">Bỏ qua & Xem đáp án chuẩn</button>
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
                                     <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle2 size={14}/> ✅ Câu sửa hoàn thiện</span>
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

                    <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t p-4 rounded-xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)] mt-6">
                        <button 
                            onClick={handleBatchCheckCorrections} 
                            disabled={isBatchChecking || pendingCount === 0} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                            {isBatchChecking ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} 
                            {isBatchChecking ? 'Đang chấm điểm các câu...' : `Kiểm tra tất cả ${pendingCount} câu`}
                        </button>
                    </div>

                 </div>
              </div>
              
              <div className="pt-5 border-t">
                 <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5 text-sm md:text-base"><Award className="text-amber-500" size={18}/> Tham khảo (Band 8.0)</h4>
                 <div className="p-4 md:p-5 bg-amber-50/80 rounded-2xl text-sm md:text-base leading-loose text-amber-900 font-serif border border-amber-200/60 shadow-inner">
                    {evaluationResult.polishedEssay?.split(/\n+/).filter(p => p.trim()).map((paragraph, idx) => (
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
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
             <Library className="text-emerald-600"/> Kho Bài Mẫu
             <span className="ml-2 text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl shadow-sm border border-emerald-200">{filteredSamples.length} bài</span>
          </h2>
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
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
             <Tags className="text-indigo-600"/> Kho Từ Vựng
             <span className="ml-2 text-sm font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-xl shadow-sm border border-indigo-200">{filteredVocabs.length} từ</span>
          </h2>
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
        
       <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-1 pb-10 content-start pr-2">
          {filteredVocabs.length === 0 ? <div className="py-20 text-center text-slate-300 font-bold border-2 border-dashed rounded-3xl">Chưa có từ vựng nào trong chủ đề này.</div> :
          filteredVocabs.map(v => (
            <div key={v.id} onClick={() => setSelectedVocab(v)} className="bg-white p-5 md:p-6 rounded-[24px] shadow-sm border border-slate-200 relative group hover:border-indigo-300 transition-all flex flex-col md:flex-row gap-5 md:gap-8 cursor-pointer text-left shrink-0">
               <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setNewVocab({ id: v.id, topic: v.topicId || '', subtopic: v.subtopicId || '', phrase: v.phrase, basePhrase: v.phrase, translation: v.translation, example1: v.examples?.[0] || '', example2: v.examples?.[1] || '' }); setVocabStep('reviewed'); setShowVocabModal(true); }} className="text-slate-400 hover:text-indigo-600 p-2 bg-slate-100 hover:bg-indigo-50 rounded-xl transition-colors" title="Sửa từ vựng này"><Edit3 size={16}/></button>
                  <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); triggerDelete('vocabulary', v.id); }} className="text-slate-400 hover:text-rose-600 p-2 bg-slate-100 hover:bg-rose-50 rounded-xl transition-colors" title="Xóa từ vựng"><Trash2 size={16}/></button>
               </div>
                
               <div className="w-full md:w-[35%] flex flex-col justify-center">
                   <div className="flex flex-wrap gap-2 mb-3 pr-20 md:pr-0">
                     {v.topicId === 'general' ? (
                        <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-200 flex items-center gap-1.5 shadow-sm"><Layers size={12}/> Đa chủ đề</span>
                     ) : v.topicId ? (
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-wider border border-indigo-100 flex items-center gap-1.5 shadow-sm"><Layers size={12}/> {TOPICS.find(t => t.id === v.topicId)?.name?.split(' ')[0] || v.topicId}</span>
                     ) : null}
                     {v.subtopicId && (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg uppercase tracking-wider border border-emerald-100 shadow-sm">{SUBTOPICS[v.topicId]?.find(st => st.id === v.subtopicId)?.name || v.subtopicId}</span>
                     )}
                   </div>
                   <h3 className="text-xl md:text-[22px] font-black text-indigo-900 mb-2 leading-tight break-words">{v.phrase}</h3>
                   <p className="text-sm font-bold text-slate-500 break-words">{v.translation}</p>
               </div>
                
               <div className="w-full md:w-[65%] flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-8 space-y-3">
                   {v.examples?.[0] ? (
                       <div className="text-[14px] md:text-[15px] leading-relaxed text-slate-700 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/80 shadow-sm font-serif text-justify">
                           {renderHighlightedExample(v.examples[0])}
                       </div>
                   ) : (
                       <span className="text-sm text-slate-300 italic">Chưa có câu mẫu 1...</span>
                   )}
                   {v.examples?.[1] && (
                       <div className="text-[14px] md:text-[15px] leading-relaxed text-slate-700 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/60 shadow-sm font-serif text-justify mt-1">
                           {renderHighlightedExample(v.examples[1])}
                       </div>
                   )}
               </div>
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
    const totalEssays = evaluationsHistory.length;
    let avgTR = 0, avgCC = 0, avgLR = 0, avgGRA = 0, highestBand = 0;

    if (totalEssays > 0) {
      const validEvals = evaluationsHistory.filter(e => e.trScore && e.ccScore && e.lrScore && e.graScore);
      if (validEvals.length > 0) {
         avgTR = (validEvals.reduce((sum, e) => sum + Number(e.trScore), 0) / validEvals.length).toFixed(1);
         avgCC = (validEvals.reduce((sum, e) => sum + Number(e.ccScore), 0) / validEvals.length).toFixed(1);
         avgLR = (validEvals.reduce((sum, e) => sum + Number(e.lrScore), 0) / validEvals.length).toFixed(1);
         avgGRA = (validEvals.reduce((sum, e) => sum + Number(e.graScore), 0) / validEvals.length).toFixed(1);
      }
      highestBand = Math.max(...evaluationsHistory.map(e => Number(e.overallBand) || 0)).toFixed(1);
    }

    const radarData = [
      { name: 'TR', score: parseFloat(avgTR) || 0 },
      { name: 'CC', score: parseFloat(avgCC) || 0 },
      { name: 'LR', score: parseFloat(avgLR) || 0 },
      { name: 'GRA', score: parseFloat(avgGRA) || 0 },
    ];

    const getPoint = (score, index) => {
       const r = (score / 9) * 40;
       const angle = (index * 90 - 90) * (Math.PI / 180);
       return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
    };

    const polygonPoints = radarData.map((d, i) => getPoint(d.score, i)).join(' ');

    const minScore = Math.min(...radarData.map(d => d.score));
    const maxScore = Math.max(...radarData.map(d => d.score));
    const weakest = radarData.find(d => d.score === minScore)?.name || 'TR';
    const strongest = radarData.find(d => d.score === maxScore)?.name || 'TR';

    const adviceMap = {
       'TR': { title: 'Task Response', text: 'Bạn đang gặp khó khăn trong việc bám sát đề và phát triển ý. Lời khuyên: Hãy sử dụng tính năng Mindmap EGOSFI trước khi viết để lập dàn ý mạch lạc hơn.' },
       'CC': { title: 'Coherence & Cohesion', text: 'Các câu/đoạn văn của bạn chưa liên kết chặt chẽ. Lời khuyên: Hãy vào Cẩm nang 40/60, ôn lại mục [Từ nối chuyển ý] để luồng văn mượt mà hơn.' },
       'LR': { title: 'Lexical Resource', text: 'Vốn từ vựng của bạn còn hạn chế hoặc lặp từ nhiều. Lời khuyên: Chăm chỉ dùng "Gợi ý từ (@...@)" và thường xuyên chơi Quiz Ôn tập từ vựng nhé!' },
       'GRA': { title: 'Grammatical Range', text: 'Độ chính xác ngữ pháp và cấu trúc câu phức chưa cao. Lời khuyên: Hãy bôi đen các câu đơn giản và dùng tính năng [✨ Nâng cấp câu] để học cách viết Band 7.5+.' }
    };

    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fadeIn h-full flex flex-col w-full overflow-y-auto custom-scrollbar">
         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 shrink-0 gap-4">
           <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="text-indigo-600"/> Thống Kê & Phân Tích</h2>
           <div className="bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl font-medium text-sm border border-indigo-100 flex flex-wrap gap-4 shadow-sm">
              <span>Tổng bài viết: <span className="font-black text-indigo-900">{totalEssays}</span></span>
              <span>Band cao nhất: <span className="font-black text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded">{highestBand > 0 ? highestBand : '-'}</span></span>
           </div>
         </div>

         {totalEssays > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 shrink-0">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400"></div>
                 <h3 className="font-black text-slate-800 mb-6 w-full flex items-center gap-2"><Target size={18} className="text-rose-500"/> Biểu đồ Năng lực (Spider Web)</h3>
                 
                 <div className="relative w-48 h-48 sm:w-56 sm:h-56 mb-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                       {[3, 5, 7, 9].map(score => (
                         <polygon key={score} points={[0,1,2,3].map(i => getPoint(score, i)).join(' ')} fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="1,1" />
                       ))}
                       <line x1="50" y1="10" x2="50" y2="90" stroke="#cbd5e1" strokeWidth="0.5" />
                       <line x1="10" y1="50" x2="90" y2="50" stroke="#cbd5e1" strokeWidth="0.5" />
                        
                       <polygon points={polygonPoints} fill="rgba(99, 102, 241, 0.2)" stroke="#4f46e5" strokeWidth="1.5" className="transition-all duration-700 ease-in-out" />
                        
                       {radarData.map((d, i) => {
                          const [x, y] = getPoint(d.score, i).split(',');
                          return <circle key={i} cx={x} cy={y} r="2" fill="#4f46e5" className="animate-pulse" />;
                       })}
                    </svg>
                    
                    <div className="absolute top-0 inset-x-0 flex justify-center -mt-2"><span className="text-[10px] font-black text-blue-600 bg-white px-1 shadow-sm rounded">TR ({avgTR})</span></div>
                    <div className="absolute right-0 inset-y-0 flex items-center -mr-6"><span className="text-[10px] font-black text-amber-600 bg-white px-1 shadow-sm rounded">CC ({avgCC})</span></div>
                    <div className="absolute bottom-0 inset-x-0 flex justify-center -mb-2"><span className="text-[10px] font-black text-emerald-600 bg-white px-1 shadow-sm rounded">LR ({avgLR})</span></div>
                    <div className="absolute left-0 inset-y-0 flex items-center -ml-6"><span className="text-[10px] font-black text-rose-600 bg-white px-1 shadow-sm rounded">GRA ({avgGRA})</span></div>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
                 <h3 className="font-black text-slate-800 mb-6 w-full flex items-center gap-2"><Sparkles size={18} className="text-amber-500"/> Chẩn đoán & Lời khuyên</h3>
                 
                 <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                       <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-black">↑</div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Tiêu chí mạnh nhất</p>
                          <p className="text-sm font-bold text-slate-800"><span className="text-emerald-600">{adviceMap[strongest].title}</span> (Band {maxScore})</p>
                       </div>
                    </div>
                    
                    <div className="flex items-start gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                       <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-black">↓</div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Kẻ ngáng đường (Yếu nhất)</p>
                          <p className="text-sm font-bold text-slate-800"><span className="text-rose-600">{adviceMap[weakest].title}</span> (Band {minScore})</p>
                       </div>
                    </div>

                    <div className="mt-2 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl relative shadow-inner">
                       <Brain size={24} className="text-indigo-200 absolute right-4 top-4 opacity-50"/>
                       <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mb-1.5 flex items-center gap-1"><Sparkles size={12}/> Lời khuyên từ AI Coach:</p>
                       <p className="text-sm text-indigo-900 font-medium leading-relaxed">{adviceMap[weakest].text}</p>
                    </div>
                 </div>
              </div>
           </div>
         ) : (
           <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center mb-8">
              <BarChart3 size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold">Chưa có đủ dữ liệu để phân tích. Hãy hoàn thành bài viết đầu tiên nhé!</p>
           </div>
         )}

         <div className="bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden shadow-sm shrink-0">
            <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><ListChecks size={18} className="text-slate-400"/> Lịch sử Luyện viết</h3>
               <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-1 border rounded-lg shadow-sm">Mới nhất xếp trước</span>
            </div>
            <div className="p-4 md:p-6 custom-scrollbar max-h-[500px] overflow-y-auto bg-slate-50/30">
               {evaluationsHistory.length === 0 ? <div className="text-center py-10 text-slate-400 font-bold border-2 border-dashed rounded-2xl">Chưa có bài viết nào được lưu.</div> : 
                 [...evaluationsHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((ev, i) => (
                   <div key={ev.id || i} className="mb-4 p-4 md:p-5 bg-white rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all gap-4 group">
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

  if (isAuthChecking) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
        <p className="text-slate-500 font-bold animate-pulse">Đang kết nối hệ thống...</p>
      </div>
    );
  }

  if (!user && !IS_PREVIEW_MODE) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 px-4">
        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl max-w-md w-full text-center flex flex-col items-center animate-slideUp">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <Brain size={40}/>
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-3">Max Academy Pro</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">Nền tảng luyện viết IELTS Task 2 cá nhân hóa tích hợp AI và RAG.</p>
          
          <button 
            onClick={handleLogin} 
            disabled={isLoggingIn}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? <Loader2 size={24} className="animate-spin" /> : "Đăng nhập bằng Google"}
          </button>
          <p className="text-[10px] text-slate-400 mt-6 uppercase font-bold tracking-widest flex items-center justify-center gap-1.5"><ShieldAlert size={12}/> Dữ liệu lưu trữ riêng tư</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden">
      {renderTopNav()}
      
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
               {(Array.isArray(suggestedPromptVocabs) ? suggestedPromptVocabs : []).map((v, i) => (
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
              <button onMouseDown={(e) => { e.preventDefault(); handleOpenParaphraseFromSelection(); }} className="px-3 py-1.5 hover:bg-slate-700 rounded-md text-xs font-bold flex items-center gap-1.5"><Wand2 size={12} /> ✨ Nâng cấp câu</button>
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
                  <h4 className="font-black text-slate-800 mb-2 md:mb-3 text-sm md:text-base flex items-center gap-2">
                      <span className="w-5 h-5 md:w-6 md:h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] md:text-xs">1</span> Mở bài (Introduction)
                  </h4>
                  <p className="mb-4 text-xs md:text-sm text-slate-700"><strong>Công thức (2 câu):</strong> Background Sentence (Paraphrase đề bài) + Thesis Statement (Trả lời trực tiếp câu hỏi).</p>
                  
                  <div className="space-y-3">
                      <p className="text-[11px] md:text-xs font-black uppercase text-indigo-600 mb-1">Mẫu Thesis cho 4 dạng bài phổ biến:</p>
                      
                      <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border-l-4 border-l-indigo-500 shadow-sm hover:border-indigo-400 transition-colors">
                          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Dạng 1: Discuss both views & give opinion</p>
                          <p className="text-indigo-900 font-medium text-xs md:text-sm">People have different views about [Topic]. While there are valid arguments in favor of [Side A / 40%], I firmly believe that [Side B / 60%] is much more significant.</p>
                      </div>

                      <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border-l-4 border-l-emerald-500 shadow-sm hover:border-emerald-400 transition-colors">
                          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Dạng 2: To what extent do you agree or disagree?</p>
                          <p className="text-emerald-900 font-medium text-xs md:text-sm">It is often argued that [Topic]. I completely agree/disagree with this perspective because [Reason 1] and [Reason 2].</p>
                      </div>

                      <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border-l-4 border-l-rose-500 shadow-sm hover:border-rose-400 transition-colors">
                          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Dạng 3: Causes & Solutions / Problems & Solutions</p>
                          <p className="text-rose-900 font-medium text-xs md:text-sm">These days, [Topic] has become a matter of common concern. This problem is primarily caused by [Cause 1], and some viable solutions can be adopted to alleviate it.</p>
                      </div>
                      
                      <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border-l-4 border-l-amber-500 shadow-sm hover:border-amber-400 transition-colors">
                          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Dạng 4: Do the advantages outweigh the disadvantages?</p>
                          <p className="text-amber-900 font-medium text-xs md:text-sm">It is true that [Topic] has become increasingly common. While this trend brings some drawbacks, I believe its benefits are far more significant.</p>
                      </div>
                  </div>
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
                         <li><span className="font-black text-amber-600 text-xs md:text-sm">Despite the arguments above,</span> I believe that... (Bất chấp những lập luận trên...)</li>
                         <li><span className="font-black text-amber-600 text-xs md:text-sm">However, I would argue that</span> the benefits of [Side B] are much more significant. (Tuy nhiên, tôi cho rằng...)</li>
                         <li><span className="font-black text-amber-600 text-xs md:text-sm">On the other hand,</span> the drawbacks of [Side A] cannot be overlooked. (Mặt khác, điểm yếu của... không thể bỏ qua)</li>
                       </ul>
                    </div>
                  </div>

                  <div className="bg-white p-4 md:p-5 rounded-lg md:rounded-xl border border-amber-100 shadow-sm">
                     <p className="text-[11px] md:text-xs font-black uppercase text-amber-600 mb-1">Nối từ Idea 1 sang Idea 2 mượt mà (Transitions)</p>
                     <p className="text-[10px] md:text-[11px] mb-3 md:mb-4 text-slate-500 italic">Thay vì dùng "Secondly" hay "In addition", hãy thử dùng:</p>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                       <div className="bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-100"><span className="font-black text-amber-600 block mb-0.5 md:mb-1 text-xs md:text-sm">Another important factor is</span> <span className="text-[9px] md:text-[10px] text-slate-500 block">(Một yếu tố quan trọng khác là...)</span></div>
                       <div className="bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-100"><span className="font-black text-amber-600 block mb-0.5 md:mb-1 text-xs md:text-sm">Adding to this point,</span> <span className="text-[9px] md:text-[10px] text-slate-500 block">(Thêm vào ý này,...)</span></div>
                       <div className="bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-100"><span className="font-black text-amber-600 block mb-0.5 md:mb-1 text-xs md:text-sm">An equally important reason is</span> <span className="text-[9px] md:text-[10px] text-slate-500 block">(Một lý do quan trọng không kém là...)</span></div>
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
                      
                     <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-white border-l-4 border-rose-500 py-3 px-4 rounded-xl shadow-sm text-center">
                           <p className="text-[10px] uppercase font-black tracking-widest text-rose-400 mb-1">VIEW 40 (Nhượng bộ)</p>
                           <h4 className="font-bold text-rose-700 text-sm">{mindMapData.view40.title}</h4>
                        </div>
                        <div className="space-y-4 lg:pr-6 relative">
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

                     <div className="hidden lg:flex flex-col items-center justify-center w-52 shrink-0 relative z-10">
                        <div className="bg-indigo-50 text-indigo-900 p-5 rounded-3xl shadow-lg border-4 border-white text-center w-full z-10 relative">
                           <Brain size={28} className="mx-auto mb-2 text-indigo-500"/>
                           <p className="text-[10px] uppercase text-indigo-400 font-black mb-1.5 tracking-widest">Core Topic</p>
                           <h4 className="font-black text-sm md:text-base leading-snug">{mindMapData.centralIdea || 'Vấn đề nghị luận'}</h4>
                        </div>
                     </div>

                     <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-white border-r-4 border-emerald-500 py-3 px-4 rounded-xl shadow-sm text-center">
                           <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400 mb-1">VIEW 60 (Lập luận chính)</p>
                           <h4 className="font-bold text-emerald-700 text-sm">{mindMapData.view60.title}</h4>
                        </div>
                        <div className="space-y-4 lg:pl-6 relative">
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

      {showGuidedModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-50 rounded-3xl shadow-2xl w-[95%] max-w-5xl max-h-[90vh] flex flex-col animate-slideUp overflow-hidden">
             <div className="p-4 md:p-5 border-b flex justify-between items-center bg-white shrink-0">
                <h3 className="font-black text-indigo-600 text-base md:text-lg flex items-center gap-2"><Wand2 size={22}/> Guided Writing Wizard (Step-by-step)</h3>
                <button onClick={() => setShowGuidedModal(false)} className="hover:bg-slate-100 p-2 rounded-xl text-slate-500 transition-colors"><X size={20}/></button>
             </div>

             <div className="p-4 md:p-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar relative">
                {isGeneratingGuide ? (
                   <div className="flex flex-col items-center justify-center py-20 h-full">
                     <Loader2 className="animate-spin mb-4 text-indigo-500" size={48}/>
                     <p className="font-black text-slate-700 text-lg">AI đang phân tích đề bài...</p>
                     <p className="text-sm text-slate-500 mt-2">Đang xây dựng chiến thuật và trích xuất từ vựng Band 8.0+</p>
                   </div>
                ) : guidedPlan && guidedPlan.steps ? (
                   <div className="max-w-4xl mx-auto flex flex-col h-full">
                       
                      <div className="flex items-center justify-between mb-8 relative">
                         <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2"></div>
                         {guidedPlan.steps.map((step, idx) => (
                            <div key={idx} className={`flex flex-col items-center gap-2 bg-slate-50 px-2 cursor-pointer transition-colors`} onClick={() => setGuidedStepIndex(idx)}>
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-4 transition-colors ${idx === guidedStepIndex ? 'bg-indigo-600 text-white border-indigo-200 shadow-md transform scale-110' : idx < guidedStepIndex ? 'bg-emerald-500 text-white border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                  {idx < guidedStepIndex ? <CheckCircle2 size={16}/> : idx + 1}
                               </div>
                               <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${idx === guidedStepIndex ? 'text-indigo-600' : 'text-slate-400'}`}>{step.id}</span>
                            </div>
                         ))}
                      </div>

                      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                         <div className="p-5 md:p-6 border-b border-slate-100 bg-indigo-50/30">
                            <h4 className="text-lg md:text-xl font-black text-slate-800 mb-2">{guidedPlan.steps[guidedStepIndex].title}</h4>
                            <p className="text-slate-600 text-sm">{guidedPlan.steps[guidedStepIndex].instruction}</p>
                             
                            <div className="mt-4 p-4 md:p-5 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col gap-3 shadow-inner">
                               <div className="flex items-center gap-2 mb-1">
                                 <Lightbulb size={20} className="text-amber-500 shrink-0"/>
                                 <span className="text-[11px] font-black uppercase text-amber-700 tracking-widest">💡 Chọn 1 trong các Cấu trúc sau để dịch:</span>
                               </div>
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                 {guidedPlan.steps[guidedStepIndex].structures?.map((str, idx) => (
                                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-sm hover:border-amber-400 transition-colors">
                                       <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block mb-2 border border-indigo-100">{str.name}</span>
                                       <p className="text-amber-900 font-medium text-sm leading-relaxed">{str.hint}</p>
                                    </div>
                                 ))}
                                 {guidedPlan.steps[guidedStepIndex].vietnameseHint && !guidedPlan.steps[guidedStepIndex].structures && (
                                    <div className="bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-sm col-span-full">
                                       <p className="text-amber-900 font-medium text-sm leading-relaxed">{guidedPlan.steps[guidedStepIndex].vietnameseHint}</p>
                                    </div>
                                 )}
                               </div>
                            </div>
                         </div>

                         <div className="p-5 md:p-6 flex-1 flex flex-col gap-4 bg-slate-50/50">
                            {guidedPlan.steps[guidedStepIndex].requiredVocab?.length > 0 && (
                               <div className="mb-2">
                                  <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest block mb-2">🎯 Hãy thử sức dùng các cụm từ đắt giá này:</span>
                                  <div className="flex flex-wrap gap-2">
                                     {guidedPlan.steps[guidedStepIndex].requiredVocab.map((v, i) => {
                                        const currentText = guidedDrafts[guidedPlan.steps[guidedStepIndex].id] || '';
                                        const isUsed = checkVocabUsed(currentText, v.phrase);
                                        return (
                                           <div key={i} className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm transition-all duration-300 ${isUsed ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                              {isUsed ? <CheckCircle size={14} className="text-emerald-600"/> : <Circle size={14} className="text-slate-300"/>}
                                              <span className="font-bold">{v.phrase}</span>
                                              <span className="text-xs opacity-70">({v.meaning})</span>
                                           </div>
                                        )
                                     })}
                                  </div>
                               </div>
                            )}

                            <textarea 
                               className="w-full flex-1 min-h-[150px] p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-slate-700 leading-relaxed resize-none shadow-inner"
                               placeholder="Gõ đoạn văn tiếng Anh của bạn vào đây..."
                               value={guidedDrafts[guidedPlan.steps[guidedStepIndex].id]}
                               onChange={(e) => setGuidedDrafts({...guidedDrafts, [guidedPlan.steps[guidedStepIndex].id]: e.target.value})}
                               spellCheck={false}
                            />
                         </div>

                         <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                            <button 
                               onClick={() => setGuidedStepIndex(Math.max(0, guidedStepIndex - 1))} 
                               disabled={guidedStepIndex === 0}
                               className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30 flex items-center gap-2"
                            >
                               <ArrowLeft size={16}/> Quay lại
                            </button>
                             
                            {guidedStepIndex < guidedPlan.steps.length - 1 ? (
                               <button 
                                  onClick={() => setGuidedStepIndex(guidedStepIndex + 1)} 
                                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                               >
                                  Tiếp tục <ArrowRight size={16}/>
                               </button>
                            ) : (
                               <button 
                                  onClick={() => {
                                     const fullEssay = [guidedDrafts.intro, guidedDrafts.body1, guidedDrafts.body2, guidedDrafts.conclusion]
                                                       .filter(text => text.trim().length > 0)
                                                       .join('\n\n');
                                     setEssay(fullEssay);
                                     setWritingTarget('full');
                                     setShowGuidedModal(false);
                                     setIsGuidedDraft(true);
                                     showToast("Đã ghép bài thành công! Giờ bạn có thể chỉnh sửa thêm hoặc chấm điểm ngay.", "success", 5000);
                                  }} 
                                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                               >
                                  <CheckCircle2 size={18}/> Hoàn thành & Dán vào bài
                               </button>
                            )}
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
              <div className="p-5 border-b font-bold text-sm flex justify-between items-center bg-slate-50">✨ Nâng cấp câu (Paraphrase) <button onClick={() => setShowParaphraseModal(false)} className="hover:bg-slate-200 p-2 rounded-xl text-slate-500"><X size={20}/></button></div>
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
              <div className="p-6 bg-slate-50 flex justify-end"><button onClick={handleParaphrase} disabled={isParaphrasing || !paraphraseInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"><Sparkles size={16}/> Nâng cấp câu này</button></div>
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
                         <option value="">-- Chủ đề phụ (Tùy chọn) --</option>
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
                           <option value="">-- Chủ đề phụ (Tùy chọn) --</option>
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
          <div className={`px-8 py-3.5 rounded-2xl shadow-2xl ${toast.type === 'error' ? 'bg-rose-600 text-white border-rose-700' : 'bg-slate-800 text-white border-slate-700'} font-black text-sm animate-slideUp border flex items-center gap-3 pointer-events-auto`}>
            {toast.type === 'error' ? <AlertTriangle className="text-white" size={18}/> : <Sparkles className="text-emerald-400" size={18}/>} 
            {toast.message}
          </div>
        </div>
      )}

    </div>
  );
}