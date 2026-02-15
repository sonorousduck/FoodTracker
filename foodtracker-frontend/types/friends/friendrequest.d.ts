import { FriendProfile } from './friendprofile';

export interface FriendRequest {
  id: number;
  requester: FriendProfile;
  createdAt: Date;
}
