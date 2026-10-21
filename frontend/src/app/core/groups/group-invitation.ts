export interface GroupInvitation {
  id: string;
  createdAtUtc: string;
  expiresAtUtc: string;
  revokedAtUtc: string | null;
}
