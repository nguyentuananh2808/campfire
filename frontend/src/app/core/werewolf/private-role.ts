export interface PrivateRole {
  id: 'Villager' | 'Werewolf' | 'Seer' | 'Guard' | 'Witch';
  name: string;
  faction: 'Village' | 'Werewolves';
  icon: string;
  description: string;
  ability: string;
  winCondition: string;
  hasHealPotion: boolean;
  hasPoisonPotion: boolean;
  werewolfTeammateIds: string[];
  investigationResult: string | null;
}
