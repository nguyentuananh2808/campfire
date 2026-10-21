import { ChatDeliveryState } from './chat-delivery-state';
import { ChatMessage } from './chat-message';
export interface ChatViewMessage extends ChatMessage {
  deliveryState: ChatDeliveryState;
}
