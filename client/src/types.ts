export type Role = 'REQUESTER' | 'STAFF' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Requester {
  id: number;
  name: string;
  email: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface Attachment {
  id: number;
  ticketId: number;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  sizeBytes: number;
  isRemoved: boolean;
  removedAt?: string | null;
  removalReason?: string | null;
  createdAt: string;
}

export interface PublicComment {
  id: number;
  ticketId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: Role;
  };
}

export interface InternalNote {
  id: number;
  ticketId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: Role;
  };
}

export type ActionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ActionTaken {
  id: number;
  ticketId: number;
  actionDateTime: string;
  description: string;
  result?: string | null;
  status: ActionStatus;
  assigneeId?: number | null;
  assignee?: {
    id: number;
    name: string;
    email: string;
  } | null;
  performedById: number;
  performedBy: {
    id: number;
    name: string;
    email: string;
  };
  followUpRequired: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  version: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketStatusHistory {
  id: number;
  ticketId: number;
  fromStatus: string;
  toStatus: string;
  changedById: number;
  changedBy: {
    id: number;
    name: string;
    role: Role;
  };
  changedAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  clientSubmissionId?: string | null;
  requesterId: number;
  ownerId?: number | null;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  itPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
  currentStatus: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
  relatedSystem: RelatedSystem;
  requester: Requester;
  owner?: User | null;
  attachments?: Attachment[];
  publicComments?: PublicComment[];
  internalNotes?: InternalNote[];
  actionsTaken?: ActionTaken[];
  statusHistory?: TicketStatusHistory[];
  actionsCount?: number;
  hasActionWithResult?: boolean;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

