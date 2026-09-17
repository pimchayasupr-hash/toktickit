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
  createdAt: string;
  updatedAt: string;
  category: Category;
  relatedSystem: RelatedSystem;
  requester: Requester;
  owner?: User | null;
  attachments?: Attachment[];
  publicComments?: PublicComment[];
  internalNotes?: InternalNote[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
