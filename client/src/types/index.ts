// Types for BVM Campus Management platform

export type UserRole = 'super_admin' | 'org_admin' | 'club_admin' | 'organizer' | 'student';

export type EventCategory = 'hackathon' | 'workshop' | 'seminar' | 'tech_talk' | 'cultural' | 'competition' | 'fest' | 'other';

export type EventStatus = 'draft' | 'pending_approval' | 'published' | 'ongoing' | 'completed' | 'cancelled';

export type RegistrationStatus = 'registered' | 'waitlisted' | 'cancelled';

export type CheckInMethod = 'qr_scan' | 'ticket_scan' | 'manual';

export type ResourceType = 'report' | 'slides' | 'drive' | 'recording' | 'github' | 'other';

export type DataHosting = 'bvm_cloud' | 'self_hosted' | 'college_server';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  clubIds: string[];
  profilePhoto?: string;
  rollNumber?: string;
  year?: number;
  phone?: string;
  interests: string[];
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  website?: string;
  description: string;
  admins: string[];
  isVerified: boolean;
  dataHosting?: DataHosting;
  customAnnouncement?: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  logo?: string;
  admins: string[];
  members: string[];
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  clubId: string;
  organizationId: string;
  organizerId: string;
  eventType: 'main_event' | 'sub_event';
  parentEventId?: string;
  startTime: string;
  endTime: string;
  location: string;
  category: EventCategory;
  capacity: number;
  registrationDeadline: string;
  status: EventStatus;
  gallery: string[];
  resources: Resource[];
  qrCode?: string;
  coOrganizers: string[];
  registeredCount: number;
  attendedCount: number;
  coverImage?: string;
  teamSize?: number; // for hackathons / team events
  allowExternalParticipants?: boolean;
  createdAt: string;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  status: RegistrationStatus;
  ticketQR: string;
  participantName: string;
  rollNumber?: string;
  year?: number;
  phone?: string;
  teamName?: string;
  registeredAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  eventId: string;
  checkInTime: string;
  checkInMethod: CheckInMethod;
  markedBy?: string;
}

export interface Resource {
  id: string;
  eventId: string;
  type: ResourceType;
  title: string;
  link: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  message: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  eventId: string;
  message: string;
  postedBy: string;
  postedByName: string;
  createdAt: string;
}

export interface OrgOnboardRequest {
  id: string;
  collegeName: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  website?: string;
  studentCount?: number;
  dataHosting: DataHosting;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface ClubRequest {
  id: string;
  clubName: string;
  description: string;
  organizationId: string;
  requestedBy: string;       // userId of requester
  requestedByName: string;
  requestedByEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}
