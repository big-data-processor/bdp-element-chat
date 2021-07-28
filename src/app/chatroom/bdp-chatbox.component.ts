import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BdpElementMessage } from '../model/element-message';
// import * as InlineEditor from '@ckeditor/ckeditor5-build-inline';
// import  * as InlineEditor from '@ckeditor/ckeditor5-build-classic';
import * as BdpEditor from '../ckeditor-build-bdp/ckeditor';
import { AccountModel, PackageModel, ProjectModel } from '../model/mongo.models';
@Component({
  selector: 'bdp-chatbox',
  templateUrl: 'bdp-chatbox.component.html'
})

export class BdpChatboxComponent implements OnInit {
  @Input() messageObj: Partial<BdpElementMessage> | undefined;
  @Input() userModelMap: Map<string, AccountModel> | undefined;
  @Input() roomModel: ProjectModel | PackageModel | AccountModel | undefined;
  @Input() currentUser: AccountModel | undefined;
  @Output() onUpdateMsg = new EventEmitter<{msgId: string, content: string}>();
  @Output() onRemoveMsg = new EventEmitter<{msgId: string}>();
  Editor = BdpEditor;
  mode: 'view' | 'edit' = 'view';
  originalContent: string = '';
  isDeleting: boolean = false;
  constructor() { }

  ngOnInit() { }
  getUserRole(message: Partial<BdpElementMessage>): string {
    if (!this.roomModel) { return 'unknown'; }
    const userId = message?.owner?.id || message.owner;
    if ((this.roomModel as ProjectModel | PackageModel).owner?.id === userId) { return 'owner'; }
    const roles: Array<'managers' | 'runners' | 'viewers'> = ['managers', 'runners', 'viewers'];
    for (let i = 0; i < 3; i ++) {
      const theRole = roles[i];
      const members = (this.roomModel as ProjectModel | PackageModel)[theRole];
      for (let j = 0; j < members.length; j ++) {
        const eachMember = members[j];
        if (eachMember.id === userId) { return theRole ; }
      }
    }
    return 'unknown';
  }
  toggleEditor() {
    if (!this.messageObj) { return; }
    if (this.mode === 'view') {
      this.originalContent = this.messageObj.content;
      this.mode = 'edit';
      return;
    }
    this.mode ='view';
    this.messageObj.content = this.originalContent;
  }
  updateMessage() {
    if (!this.messageObj || !this.messageObj.id) { return; }
    this.mode = 'view';
    if (this.messageObj.content === '') { return; }
    this.onUpdateMsg.emit({msgId: this.messageObj.id, content: this.messageObj.content});
  }
  removeMessage() {
    if (!this.messageObj || !this.messageObj.id) { return; }
    if (this.mode === 'edit') {
      this.mode = 'view';
    }
    this.isDeleting = true;
    this.onRemoveMsg.emit({msgId: this.messageObj.id})
  }
}