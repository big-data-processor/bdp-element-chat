import { Component, Input, OnChanges, ViewChild, ElementRef, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { BdpElementMessage } from '../model/element-message';
import { AccountModel, PackageModel, ProjectModel } from '../model/mongo.models';
import * as BdpEditor from '../ckeditor-build-bdp/ckeditor';
import { ChatRoom } from '../model/chat-room';
// import * as InlineEditor from '@ckeditor/ckeditor5-build-inline';

// import * as InlineEditor from '@ckeditor/ckeditor5-build-classic';

@Component({
  selector: 'bdp-chatroom',
  templateUrl: 'bdp-chatroom.component.html',
  animations: [
    trigger('chatBox', [
      state('show', style({transform: 'translateX(0)', opacity: 1})),
      transition('void => *', [
        style({transform: 'translateX(-100%)', opacity: 0}),
        animate(300, style({transform: 'translateX(0)', opacity: 1}))
      ]),
      transition('* => void', [
        animate(300, style({transform: 'translateX(100%)', opacity: 0}))
      ])
  ])]
})

export class BdpChatroomComponent implements OnChanges {
  @Input() roomId: string = '';
  @Input() roomModel: ProjectModel | PackageModel | AccountModel | undefined;
  @Input() chatroom: ChatRoom = {type: 'project', isLoading: true, messages: [], pageIndex: 0, totalPage: 0, totalCount: 0, triggerScrollToBottom: false, isAtBottom: false, unread: 0};
  @Input() currentUser: AccountModel | undefined;
  @Input() userModelMap: Map<string, AccountModel> | undefined;
  @Input() scrollToBottomFlag: boolean = false;
  @Input() panelState: string = 'open';
  @Output() onSendMessage = new EventEmitter<{roomId: string; content: string }>();
  @Output() onMessageUpdate = new EventEmitter<{roomId: string, msgId: string, content: string}>();
  @Output() onMessageRemove = new EventEmitter<{roomId: string, msgId: string}>();
  @Output() onRequestMoreMessage = new EventEmitter<{roomId: string}>();
  @Output() onScrollToBottom = new EventEmitter<boolean>();
  @ViewChild('messageBoxes') messageBoxContainer: ElementRef | undefined;
  Editor = BdpEditor;
  editorConfig: any = {toolbar: ['heading', '|', 'bold', 'code', 'codeBlock']};
  inputText: string = '';
  scrollTimer: any;
  deletingMsgIds = new Set<string>();
  constructor() { }
  ngOnChanges(changes: SimpleChanges) {
    for (const prop in changes) {
      if (prop === 'scrollToBottomFlag') {
        if (changes[prop].currentValue){
          this.requestScrollToBottom();
          setTimeout(() => this.scrollToBottomFlag = false, 100);
        }
      } else if (prop === 'messages') {
      } else if (prop === 'isLoading') {
        if (!changes[prop].currentValue) {
          this.requestScrollToBottom();
        }
      }
    }
  }
  trackByMsgIds(index: number, item: Partial<BdpElementMessage>) { return item.id; }
  sendMessage() {
    this.onSendMessage.emit({roomId: this.roomId, content: this.inputText});
    this.inputText = '';
  }
  updateMessage(ev: {msgId: string, content: string}) {
    if (ev.content != undefined && ev.content !== '') {
      this.onMessageUpdate.emit({roomId: this.roomId, msgId: ev.msgId, content: ev.content});
    }
  }
  removeMessage(ev: {msgId: string}) {
    if (ev.msgId) {
      this.deletingMsgIds.add(ev.msgId);
      this.onMessageRemove.emit({roomId: this.roomId, msgId: ev.msgId});
    }
  }
  requestScrollToBottom() {
    setTimeout(() => {
      if (!this.messageBoxContainer) { return; }
      const element =  this.messageBoxContainer.nativeElement;
      element.scrollTop = element.scrollHeight - element.clientHeight;
    }, 50);
  }
  onScroll() {
    if (this.scrollTimer) { clearTimeout(this.scrollTimer); }
    this.scrollTimer = setTimeout(() => {
      if (!this.messageBoxContainer) { return; }
      const element =  this.messageBoxContainer.nativeElement;
      const isAtBottom = Math.abs(Math.ceil(element.scrollHeight - element.scrollTop) - element.clientHeight) < 10;
      if (isAtBottom) { this.chatroom.unread = 0; }
      this.onScrollToBottom.emit(isAtBottom);
    }, 100);
  }
  triggerScrollToBottom() {
    if (!this.messageBoxContainer) { return; }
    const element =  this.messageBoxContainer.nativeElement;
    element.scrollTop = element.scrollHeight - element.clientHeight;
    this.onScrollToBottom.emit(true);
  }
  loadMoreMessages() {
    if (this.chatroom.pageIndex > 0) {
      this.onRequestMoreMessage.emit({roomId: this.roomId});
    }
  }
}