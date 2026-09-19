export interface Level {
  code: string;
  name: string;
  index: number;
  min: number;
  nextCode: string | null;
  nextName: string | null;
  nextMin: number | null;
  remaining: number;
  progress: number;
}

export interface LevelDef { code: string; name: string; min: number }

export interface BoardRow {
  id: string;
  employeeId: string;
  name: string;
  teamId: string;
  teamName: string;
  avatarUrl: string;
  points: number;
  transactions: number;
  level: Level;
  rank: number;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  logoUrl: string;
  totalPoints: number;
  memberCount: number;
  averagePoints: number;
  rank: number;
  topMembers: BoardRow[];
  members?: BoardRow[];
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  defaultPoints: number;
  icon: string;
  type: 'BONUS' | 'PENALTY';
}

export interface Transaction {
  id: string;
  participantId: string;
  employeeId: string;
  participantName: string;
  teamId: string;
  teamName: string;
  type: string;
  category: string;
  points: number;
  reason: string;
  adminId: string;
  createdAt: string;
  reversed: boolean;
  reversedAt: string;
  reversedBy: string;
  metadata: string;
}

export interface Settings {
  conferenceName: string;
  conferenceYear: string;
  companyName: string;
  currentDay: number;
  isScoringOpen: boolean;
  butterflyOpen: boolean;
  leaderboardRefreshSeconds: number;
  maxTop10: number;
  levels: LevelDef[];
}

export interface Stats {
  participants: number;
  totalPoints: number;
  transactions: number;
  reversedTransactions: number;
  activeTeams: number;
  topParticipant: BoardRow | null;
  topTeam: Team | null;
  lastTransactionAt: string | null;
}

export interface Badge { id: string; icon: string; name: string; earned: boolean }

export interface Story {
  steps: { at: string; points: number; total: number; category: string }[];
  biggest: { points: number; category: string; at: string } | null;
  topCategory: string | null;
  summary: string;
}

export interface ParticipantView {
  participant: {
    id: string;
    employeeId: string;
    name: string;
    teamId: string;
    teamName: string;
    avatarUrl: string;
    points: number;
    rank: number;
    level: Level;
    transactionCount: number;
    totalParticipants: number;
  };
  recent: Transaction[];
  story: Story;
  badges: Badge[];
}

export interface AdminParticipant {
  id: string;
  employeeId: string;
  name: string;
  displayName: string;
  teamId: string;
  teamName: string;
  phone: string;
  email: string;
  pin: string;
  status: string;
  avatarUrl: string;
  points: number;
  rank: number | null;
  level: Level;
}

export interface ButterflyMoment {
  id: string;
  employeeId: string;
  name?: string;
  answer: string;
  createdAt: string;
  visibility: 'private' | 'public';
}

export interface Session {
  token: string;
  role: 'participant' | 'admin';
  name: string;
  employeeId?: string;
  adminId?: string;
}

export interface AddTransactionResult {
  transaction: Transaction;
  participant: BoardRow | null;
  levelUp: Level | null;
  enteredTop10: number | null;
}
