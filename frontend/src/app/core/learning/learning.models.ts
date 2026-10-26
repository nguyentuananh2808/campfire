export interface LearningCourse {
  id: string;
  slug: string;
  name: string;
  description: string;
  hskLevel: number;
  contentVersion: string;
}
export interface LearningActivity {
  id: string;
  type: string;
  title: string;
  orderIndex: number;
  required: boolean;
  completed: boolean;
  contentJson: string;
}
export interface LearningDaySummary {
  id: string;
  dayNumber: number;
  title: string;
  titleChinese: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  status: 'Locked' | 'Available' | 'InProgress' | 'Completed';
  progressPercent: number;
}
export interface LearningUnit {
  id: string;
  title: string;
  orderIndex: number;
  days: LearningDaySummary[];
}
export interface LearningPath {
  course: LearningCourse;
  totalXp: number;
  units: LearningUnit[];
}
export interface LearningDayDetail {
  course: LearningCourse;
  day: LearningDaySummary;
  activities: LearningActivity[];
}
export interface LearningToday {
  course: LearningCourse;
  totalXp: number;
  currentDay: LearningDayDetail;
}
export interface LearningCompletion {
  day: LearningDayDetail;
  totalXp: number;
  xpAwarded: number;
  dayCompleted: boolean;
}
export interface ExerciseResult {
  score: number;
  correct: number;
  total: number;
  completion: LearningCompletion;
}
export interface MindMapNode {
  id: string;
  chinese: string;
  pinyin: string;
  meaningVi: string;
  hskLevel: number;
  exampleChinese: string;
  examplePinyin: string;
  exampleTranslationVi: string;
  relationType: string;
  masteryScore: number;
}
export interface VocabularyMindMap {
  root: MindMapNode;
  children: MindMapNode[];
  source: string;
  aiExpansionAvailable: boolean;
}
export interface LearningCapabilities {
  textToSpeech: boolean;
  pronunciationAssessment: boolean;
  conversationAi: boolean;
  vocabularyAi: boolean;
  message: string;
}
export interface VocabularyItem {
  chinese: string;
  pinyin: string;
  meaningVi: string;
  exampleChinese?: string;
  examplePinyin?: string;
  translationVi?: string;
}
export interface SentenceItem {
  chinese: string;
  pinyin: string;
  translationVi: string;
}
export interface ExerciseQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
}
export interface ActivityContent {
  items?: Array<VocabularyItem | SentenceItem>;
  name?: string;
  explanationVi?: string;
  examples?: string[];
  questions?: ExerciseQuestion[];
}
