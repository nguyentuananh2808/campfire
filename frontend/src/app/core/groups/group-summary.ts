export interface GroupSummary {
  id: string;
  name: string;
  role: 'Owner' | 'Member';
  memberCount: number;
  version: string;
}
