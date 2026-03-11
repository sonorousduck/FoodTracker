import { FriendProfile } from './friendprofile';

export interface SentFriendRequest {
  id: number;
  addressee: FriendProfile;
  createdAt: Date;
}
