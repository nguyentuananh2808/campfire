import { ChatInboxItem } from '../../core/chat/chat-inbox-item';
import { GroupSummary } from '../../core/groups/group-summary';

export interface ChatGroupConversation {
  group: GroupSummary;
  inbox: ChatInboxItem;
}
