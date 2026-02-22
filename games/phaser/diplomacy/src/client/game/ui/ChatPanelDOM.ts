import type { Country } from '../../../shared/types/game';
import { ALL_COUNTRIES, COUNTRY_NAMES } from '../../../shared/types/game';

export interface ChatMessage {
  from: string;
  country: string;
  text: string;
  timestamp: number;
  channel?: string;
}

type ChatChannel = 'global' | Country;

function channelKey(a: Country, b: Country): string {
  return [a, b].sort().join(':');
}

class ChatPanelImpl {
  private container: HTMLElement | null = null;
  private messagesEl: HTMLElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private onSend: ((text: string, channel?: string) => void) | null = null;
  private collapsed = true;
  private toggleBtn: HTMLElement | null = null;
  private badgeEl: HTMLElement | null = null;
  private tabsEl: HTMLElement | null = null;

  private activeChannel: ChatChannel = 'global';
  private myCountry: Country | null = null;
  private messagesByChannel: Map<string, ChatMessage[]> = new Map();
  private unreadByChannel: Map<string, number> = new Map();
  private globalBadge = 0;

  init(onSend: (text: string, channel?: string) => void, myCountry?: Country) {
    this.onSend = onSend;
    this.myCountry = myCountry ?? null;
    if (this.container) return;

    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'chat-toggle';
    this.toggleBtn.textContent = 'Chat';
    this.toggleBtn.onclick = () => this.toggle();

    this.badgeEl = document.createElement('span');
    this.badgeEl.className = 'chat-badge';
    this.badgeEl.style.display = 'none';
    this.toggleBtn.appendChild(this.badgeEl);

    this.container = document.createElement('div');
    this.container.id = 'chat-panel';
    this.container.style.display = 'none';

    this.tabsEl = document.createElement('div');
    this.tabsEl.className = 'chat-tabs';
    this.buildTabs();

    this.messagesEl = document.createElement('div');
    this.messagesEl.className = 'chat-messages';

    const inputRow = document.createElement('div');
    inputRow.className = 'chat-input-row';

    this.inputEl = document.createElement('input');
    this.inputEl.className = 'chat-input';
    this.inputEl.placeholder = 'Type a message...';
    this.inputEl.maxLength = 200;
    this.inputEl.onkeydown = (e) => {
      if (e.key === 'Enter' && this.inputEl!.value.trim()) {
        this.sendMessage();
      }
    };

    const sendBtn = document.createElement('button');
    sendBtn.className = 'chat-send-btn';
    sendBtn.textContent = '→';
    sendBtn.onclick = () => {
      if (this.inputEl!.value.trim()) this.sendMessage();
    };

    inputRow.appendChild(this.inputEl);
    inputRow.appendChild(sendBtn);
    this.container.appendChild(this.tabsEl);
    this.container.appendChild(this.messagesEl);
    this.container.appendChild(inputRow);

    const app = document.getElementById('app') ?? document.body;
    app.appendChild(this.toggleBtn);
    app.appendChild(this.container);
  }

  private sendMessage() {
    if (!this.inputEl || !this.onSend) return;
    const text = this.inputEl.value.trim();
    if (!text) return;

    let serverChannel: string | undefined;
    if (this.activeChannel !== 'global' && this.myCountry) {
      serverChannel = channelKey(this.myCountry, this.activeChannel as Country);
    }
    this.onSend(text, serverChannel);
    this.inputEl.value = '';
  }

  private buildTabs() {
    if (!this.tabsEl) return;
    this.tabsEl.innerHTML = '';

    const globalTab = document.createElement('button');
    globalTab.className = `chat-tab${this.activeChannel === 'global' ? ' active' : ''}`;
    globalTab.textContent = 'All';
    const gUnread = this.unreadByChannel.get('global') ?? 0;
    if (gUnread > 0 && this.activeChannel !== 'global') {
      const badge = document.createElement('span');
      badge.className = 'chat-tab-badge';
      badge.textContent = String(gUnread);
      globalTab.appendChild(badge);
    }
    globalTab.onclick = () => this.switchChannel('global');
    this.tabsEl.appendChild(globalTab);

    if (this.myCountry) {
      for (const c of ALL_COUNTRIES) {
        if (c === this.myCountry) continue;
        const tab = document.createElement('button');
        const isActive = this.activeChannel === c;
        tab.className = `chat-tab${isActive ? ' active' : ''}`;
        tab.textContent = c.slice(0, 3);
        tab.title = COUNTRY_NAMES[c];
        const chKey = channelKey(this.myCountry, c);
        const unread = this.unreadByChannel.get(chKey) ?? 0;
        if (unread > 0 && !isActive) {
          const badge = document.createElement('span');
          badge.className = 'chat-tab-badge';
          badge.textContent = String(unread);
          tab.appendChild(badge);
        }
        tab.onclick = () => this.switchChannel(c);
        this.tabsEl.appendChild(tab);
      }
    }
  }

  private switchChannel(channel: ChatChannel) {
    this.activeChannel = channel;
    const chKey = this.resolveChannelKey(channel);
    this.unreadByChannel.set(chKey, 0);
    this.buildTabs();
    this.renderMessages();
    this.updateGlobalBadge();
    this.inputEl?.focus();
  }

  private resolveChannelKey(channel: ChatChannel): string {
    if (channel === 'global') return 'global';
    if (this.myCountry) return channelKey(this.myCountry, channel as Country);
    return 'global';
  }

  private renderMessages() {
    if (!this.messagesEl) return;
    const chKey = this.resolveChannelKey(this.activeChannel);
    const msgs = this.messagesByChannel.get(chKey) ?? [];
    this.messagesEl.innerHTML = '';

    if (msgs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'chat-empty';
      empty.textContent = this.activeChannel === 'global' ? 'No messages yet' : `No messages with ${COUNTRY_NAMES[this.activeChannel as Country] ?? this.activeChannel}`;
      this.messagesEl.appendChild(empty);
      return;
    }

    for (const msg of msgs) {
      this.messagesEl.appendChild(this.createMsgRow(msg));
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private createMsgRow(msg: ChatMessage): HTMLElement {
    const row = document.createElement('div');
    row.className = 'chat-msg';
    row.innerHTML =
      `<span class="chat-msg-author" style="color: var(--chat-${msg.country.toLowerCase()}, #aaa)">${escapeHtml(msg.from)}</span>` +
      `<span class="chat-msg-text">${escapeHtml(msg.text)}</span>`;
    return row;
  }

  private toggle() {
    this.collapsed = !this.collapsed;
    if (this.container) {
      this.container.style.display = this.collapsed ? 'none' : 'flex';
    }
    if (!this.collapsed) {
      const chKey = this.resolveChannelKey(this.activeChannel);
      this.unreadByChannel.set(chKey, 0);
      this.buildTabs();
      this.updateGlobalBadge();
      this.renderMessages();
      this.inputEl?.focus();
    }
  }

  private updateGlobalBadge() {
    let total = 0;
    for (const [, count] of this.unreadByChannel) total += count;
    this.globalBadge = total;
    if (!this.badgeEl) return;
    if (total > 0) {
      this.badgeEl.textContent = String(total);
      this.badgeEl.style.display = 'inline-block';
    } else {
      this.badgeEl.style.display = 'none';
    }
  }

  setMessages(messages: ChatMessage[]) {
    this.messagesByChannel.clear();
    for (const msg of messages) {
      const ch = msg.channel ?? 'global';
      const arr = this.messagesByChannel.get(ch) ?? [];
      arr.push(msg);
      this.messagesByChannel.set(ch, arr);
    }
    this.renderMessages();
  }

  addMessage(msg: ChatMessage) {
    const ch = msg.channel ?? 'global';
    const arr = this.messagesByChannel.get(ch) ?? [];
    arr.push(msg);
    this.messagesByChannel.set(ch, arr);

    const activeKey = this.resolveChannelKey(this.activeChannel);
    const isActiveChannel = ch === activeKey;

    if (isActiveChannel && !this.collapsed) {
      if (this.messagesEl) {
        this.messagesEl.appendChild(this.createMsgRow(msg));
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
      }
    } else {
      const prev = this.unreadByChannel.get(ch) ?? 0;
      this.unreadByChannel.set(ch, prev + 1);
      this.buildTabs();
      this.updateGlobalBadge();
    }
  }

  destroy() {
    this.container?.remove();
    this.toggleBtn?.remove();
    this.container = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.toggleBtn = null;
    this.badgeEl = null;
    this.tabsEl = null;
    this.messagesByChannel.clear();
    this.unreadByChannel.clear();
    this.activeChannel = 'global';
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const ChatPanelDOM = new ChatPanelImpl();
