export interface GroupMember {
  userId: string;
  displayName: string;
  role: 'Owner' | 'Member';
  joinedAtUtc: string;
}
