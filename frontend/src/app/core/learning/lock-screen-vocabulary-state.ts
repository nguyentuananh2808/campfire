import { VocabularyItem } from './learning.models';

export interface LockScreenVocabularyState {
  words: VocabularyItem[];
  nextIndex: number;
}
