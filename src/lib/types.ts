export type Status =
  | 'draft'
  | 'submitted'
  | 'verifying'
  | 'verified'
  | 'scoring'
  | 'scored'
  | 'approved'
  | 'disbursing'
  | 'disbursed'
  | 'follow_up'
  | 'closed'
  | 'rejected';

export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export type Category = 'zakat' | 'sedekah' | 'wakaf' | 'infak' | 'bantuan_kerajaan';

export interface NoteType {
  type: 'note' | 'call' | 'visit' | 'assessment';
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface CaseNote {
  id: string;
  type: NoteType['type'];
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Disbursement {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  recipientBank?: string;
  recipientAcc?: string;
  scheduledDate?: string;
}

export interface CaseData {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  applicantName: string;
  applicantIC: string;
  applicantPhone: string;
  applicantAddress: string;
  programmeId: string | null;
  memberId: string | null;
  amountRequested: number | null;
  notes: CaseNote[];
  createdAt: string;
  updatedAt: string;
  disbursements: Disbursement[];
  statusHistory: { status: Status; date: string }[];
}

export interface Member {
  id: string;
  name: string;
  ic: string;
  phone: string;
  address: string;
  monthlyIncome: number | null;
  householdSize: number | null;
  householdMembers: Array<{
    relation: string;
    age: number;
    isStudent?: boolean;
    income?: number;
  }> | null;
  status: 'active' | 'inactive';
  eKYCVerification?: {
    riskLevel: 'low' | 'medium' | 'high';
    verifiedAt: string;
  };
}

export interface Programme {
  id: string;
  name: string;
  category: string; // e.g., 'financial_assistance', 'education', 'community', 'health'
  description?: string;
}