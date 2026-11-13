import { VocabularyGameWord } from '../../../core/learning/learning.models';

export interface FallingVocabulary {
  instanceId: number;
  word: VocabularyGameWord;
  top: number;
  left: number;
}
