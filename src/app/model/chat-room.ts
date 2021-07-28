import { BdpElementMessage } from "./element-message";

export interface ChatRoom {
  type: 'project' | 'package' | 'user';
  triggerScrollToBottom: boolean;
  isAtBottom: boolean;
  isLoading: boolean;
  messages: Array<Partial<BdpElementMessage>>;
  pageIndex: number;
  totalPage: number;
  totalCount: number;
  unread: number;
}