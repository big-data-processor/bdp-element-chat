import { Component, ElementRef, EventEmitter, OnInit, Input, Output, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BdpElementMessage } from './model/element-message';
import {ProjectModel, PackageModel, AccountModel} from './model/mongo.models';
import * as moment from 'moment';
import Moment = moment.Moment;
import { ChatRoom } from './model/chat-room';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnChanges, OnDestroy {
  @Input('elementId') elementId: string | undefined;
  @Output('onload') onload = new EventEmitter<ElementRef>();
  @Output('notify') notify = new EventEmitter<string>();
  api: any;
  chatRooms: {[key: string]: ChatRoom} = {};
  chatRoomIds: string[] = [];
  roomModelMap = new Map<string, ProjectModel | PackageModel | AccountModel>();
  userModelMap = new Map<string, AccountModel>();
  currentUser: AccountModel | undefined;
  pageSize: number = 10;
  notifyMsg$ = new BehaviorSubject<string>('');
  panelState: string = 'menu';
  private sub = new Subscription();
  constructor(private el: ElementRef) {}
  ngOnInit() {
    this.el.nativeElement.bdpInitialize = (inputApi: any) => this.initialize(inputApi).catch(console.log);
    this.el.nativeElement.bdpNotifyChanges = (changes: {type: string, target: string, data: any}) => this.handleChanges(changes).catch(console.log);
    this.el.nativeElement.bdpIncomingMessage = (msgObj: {type: string, message: BdpElementMessage}) => this.incomingMessageHandler(msgObj).catch(console.log);
    this.sub.add(this.notifyMsg$.subscribe((str: string) => this.notify.emit(str)));
    // making a global 
    // this.chatRooms['test-id'] = {type: 'project', isLoading: true, messages: [{
    //   id: 'msg-id-1', content: 'XDXD', owner: {name: 'A user', id: 'user-id-1', auths: {bdp: 9}}, createdAt: moment(new Date()), updatedAt: moment(new Date())
    // }], pageIndex: 0, totalPage: 10, totalCount: 300};
    // this.chatRoomIds = ['test-id'];
  }
  ngOnChanges(changes: SimpleChanges) {
    for (const prop in changes) {
      if (prop === 'elementId') {
        if (changes[prop].isFirstChange()) {
          this.onload.emit(this.el.nativeElement);
        }
      }
    }
  }
  async initialize(inputApi: any) {
    this.api = inputApi;
    if (!this.api) { return console.log('failed to get api functions'); }
    this.panelState = this.api.getRightSideBarStatus();
    this.currentUser = await this.api.getCurrentUserInfo();
    const currentProject = await this.api.getCurrentProjectInfo();
    const currentPackage = await this.api.getCurrentPackageInfo();
    this.notifyMsg$.next(' ');
    setTimeout(() => {
      if (currentProject) {
        this.roomModelMap.set(currentProject.id, currentProject);
        this.setRoomMembers(currentProject);
        this.enterChatroom('project', currentProject.id);
      }
      if (currentPackage) {
        this.roomModelMap.set(currentPackage.id, currentPackage);
        this.setRoomMembers(currentPackage);
        this.enterChatroom('package', currentPackage.id);  
      }
      this.enterChatroom('user', 'global');
    }, 10);
  }

  setRoomMembers(roomModel: ProjectModel | PackageModel) {
    const owner = roomModel.owner;
    const managers = roomModel.managers;
    const runners = roomModel.runners;
    const viewers = roomModel.viewers;
    if (owner && owner.id) {
      this.userModelMap.set(owner.id, owner);
    }
    [managers, runners, viewers].forEach(group => group.forEach(u => u && u.id ? this.userModelMap.set(u.id, u) : ''));
  }

  async handleChanges(changes: {type: string, target: string, data: any}) {
    if (changes.type !== 'switch') { return; }
    switch (changes.target) {
      case 'Project':
        if (changes.data && changes.data.id) {
          this.roomModelMap.set(changes.data.id, changes.data);
          this.setRoomMembers(changes.data);
          this.enterChatroom('project', changes.data.id);
        }
        break;
      case 'Package':
        if (changes.data && changes.data.id) {
          this.roomModelMap.set(changes.data.id, changes.data);
          this.setRoomMembers(changes.data);
          this.enterChatroom('package', changes.data.id);
        }
        break;
      case 'ui':
        if (changes.data.rightSideBarStatus && this.panelState !== changes.data.rightSideBarStatus) {
          this.panelState = changes.data.rightSideBarStatus;
        }
        break;
    }
  }
  async incomingMessageHandler(msgObj: {type: string, message: BdpElementMessage}) {
    const theMessage = msgObj.message;
    let roomId = theMessage.project || theMessage.package || theMessage.user?.id || 'global';
    if (roomId === this.currentUser?.id && theMessage.owner?.id) { roomId = theMessage.owner.id; }
    switch (msgObj.type) {
      case 'insert':
        if (!this.chatRooms[roomId] && !theMessage.user?.id) {
          return;
        } else if (!this.chatRooms[roomId] && theMessage.owner) {
          this.userModelMap.set(theMessage.owner.id, theMessage.owner);
          this.enterChatroom('user', theMessage.owner.id);
          return;
        }
        if (theMessage.owner && theMessage.owner.id) {
          this.userModelMap.set(theMessage.owner?.id, theMessage.owner);
        }
        this._appendChatMessage(roomId, {
          id: theMessage.id,
          content: theMessage.content.toString(),
          owner: theMessage.owner as AccountModel | undefined,
          createdAt: moment(new Date(theMessage.createdAt as unknown as string)),
          updatedAt: moment(new Date(theMessage.updatedAt as unknown as string))
        });
        setTimeout(() => this.notifyUnreadNumber());
        break;
      case 'remove':
        if (!this.chatRooms[roomId]) { return; }
        this._removeChatMessage(roomId, theMessage.id);
        break;
      case 'update':
        if (!this.chatRooms[roomId]) { return; }
        theMessage.createdAt = moment(new Date(theMessage.createdAt as unknown as string));
        theMessage.updatedAt = moment(new Date(theMessage.updatedAt as unknown as string));
        this._updateChatMessage(roomId, theMessage);
        break;
    }
  }
  notifyUnreadNumber(): number {
    let unreadNumber = 0;
    for (let i = 0; i < this.chatRoomIds.length; i ++) {
      unreadNumber += this.chatRooms[this.chatRoomIds[i]].unread;
    }
    if (unreadNumber <= 0) {
      this.notifyMsg$.next('');
    } else if (unreadNumber > 99) {
      this.notifyMsg$.next('99+');
    } else {
      this.notifyMsg$.next(unreadNumber.toString());
    }
    return unreadNumber;
  }
  enterChatroom(roomType: 'project' | 'package' | 'user', roomId: string) {
    if (!this.api || !this.elementId) { return; }
    if (this.chatRooms[roomId]) { return; }
    const correspondingIds = {
      project: roomType === 'project' ? roomId : undefined,
      package: roomType === 'package' ? roomId : undefined
    };
    if (roomType === 'project' || roomType === 'package') {
      this.getInitialMessages(roomId, roomType, 'list', correspondingIds);
    } else if (roomType === 'user' && roomId === 'global') {
      this.getInitialMessages(roomId, roomType, 'query', {project: {$exists: false}, package: {$exists: false}, user: {$exists: false}});
    } else if (roomType === 'user') {
      if (!this.currentUser || !this.currentUser.id) { return; }
      if (this.userModelMap.has(roomId)) {
        const theUserModel = this.userModelMap.get(roomId);
        if (theUserModel) {
          this.roomModelMap.set(roomId, theUserModel);
          this.getInitialMessages(roomId, roomType, 'query',
            {project: {$exists: false}, package: {$exists: false}, $or: [{user: roomId, owner: this.currentUser.id}, {user: this.currentUser.id, owner: roomId}]});
        }
      }
    }
  }
  onEnterChatroom(ev: {roomId: string, roomType: string}) {
    this.enterChatroom(ev.roomType as 'project' | 'package' | 'user', ev.roomId);
  }
  _appendChatMessage(roomId: string, message: Partial<BdpElementMessage>) {
    if (!this.chatRooms[roomId]) { return; }
    const msgs = this.chatRooms[roomId].messages;
    msgs.push(message);
    this.chatRooms[roomId].unread ++;
    if (this.chatRooms[roomId].isAtBottom) {
      setTimeout(() => {
        this.chatRooms[roomId].triggerScrollToBottom = true;
        setTimeout(() => this.chatRooms[roomId].triggerScrollToBottom = false, 10);
      }, 100);
    }
  }
  _updateChatMessage(roomId: string, message: Partial<BdpElementMessage>) {
    if (!this.chatRooms[roomId]) { return; }
    const msgs = this.chatRooms[roomId].messages;
    for (let i = 0; i < msgs.length; i ++) {
      if (msgs[i].id === message.id) {
        msgs[i] = message;
        break;
      }
    }
  }
  _removeChatMessage(roomId: string, messageId: string) {
    if (!this.chatRooms[roomId]) { return; }
    const msgs = this.chatRooms[roomId].messages;
    for (let i = 0; i < msgs.length; i ++) {
      if (msgs[i].id === messageId) {
        msgs.splice(i, 1);
        break;
      }
    }
  }
  createMessage(roomId: string, content: string) {
    if (!this.api || !this.api.createElementMessage) { return; }
    if (!this.chatRooms[roomId]) { return; }
    if (content === '') { return; }
    const roomType = this.chatRooms[roomId].type;
    if (roomType === 'project' || roomType === 'package') {
      const correspondingIds = {
        project: roomType === 'project' ? roomId : undefined,
        package: roomType === 'package' ? roomId : undefined
      };
      this.api.createElementMessage(this.elementId, content, correspondingIds, [roomType]).catch(console.log);
    } else if (roomType === 'user' && roomId === 'global') {
      this.api.createElementMessage(this.elementId, content, {}, ['user']).catch(console.log);
    } else if (roomType === 'user') {
      this.api.createElementMessage(this.elementId, content, {user: roomId}, ['user']).catch(console.log);
    }
    
  }
  editMessage(ev: {roomId: string, msgId: string, content: string}) {
    if (!this.api || !this.api.updateElementMessage) { return; }
    if (!this.chatRooms[ev.roomId]) { return; }
    if (ev.content === '') { return; }
    const roomType = this.chatRooms[ev.roomId].type;
    this.api.updateElementMessage(this.elementId, ev.msgId, ev.content, undefined, [roomType]).catch(console.log);
  }
  removeMessage(ev: {roomId: string, msgId: string}) {
    if (!this.api || !this.api.removeElementMessage) { return; }
    if (!this.chatRooms[ev.roomId]) { return; }
    const roomType = this.chatRooms[ev.roomId].type;
    this.api.removeElementMessage(this.elementId, ev.msgId, [roomType]).catch(console.log);
  }
  sortRoomFunc(a: string, b: string) {
    return this.chatRoomIds.indexOf(b) - this.chatRoomIds.indexOf(a);
  }
  sendMessage(ev: {roomId: string, content: string }) {
    this.createMessage(ev.roomId, ev.content);
  }
  setScrollAtBottom(ev: any, roomId: string) {
    if (!this.chatRooms[roomId]) { return; }
    this.chatRooms[roomId].isAtBottom = ev;
    this.notifyUnreadNumber();
  }
  focusChatRoom(roomId: string) {
    if (!this.chatRooms[roomId]) { return; }
    this.chatRooms[roomId].unread = 0;
    this.notifyUnreadNumber();
  }
  trackByRoomIds(index: number, item: string) {
    return item;
  }
  getInitialMessages(roomId: string, roomType: 'project' | 'package' | 'user', listOrQuery: 'list' | 'query', queryObject: any) {
    this.chatRooms[roomId] = {type: roomType, isLoading: true, messages: [], pageIndex: 0, totalPage: 0, totalCount: 0, triggerScrollToBottom: false, isAtBottom: false, unread: 0};
    if (roomId !== 'global') { this.chatRoomIds.unshift(roomId); }
    const theApiName = listOrQuery === 'list' ? 'listElementMessages' : 'queryElementMessages';
    if (typeof this.api[theApiName] !== 'function') { return; }
    this.api[theApiName](this.elementId, queryObject, this.pageSize, -1, 'created-asc').then((lists: {
      records: BdpElementMessage[],
      totalPage: number,
      pageIndex: number,
      totalCount: number,
      pageSize:number
    }) => {
      lists.records.forEach((elemMessage: BdpElementMessage) => {
        if (typeof elemMessage.owner === 'string') {
          const ownerId = elemMessage.owner;
          elemMessage.owner = {id: ownerId, name: `(unknown user id: ${ownerId}`, auths: {}};
          this.userModelMap.set(ownerId, elemMessage.owner);
        } else if (!elemMessage.owner) {
          elemMessage.owner = {id: 'undefined', name: `(unknown user)`, auths: {}};
        }
        this.userModelMap.set(elemMessage.owner.id, elemMessage.owner);
      });
      this.chatRooms[roomId] = {
        type: roomType,
        isLoading: false,
        triggerScrollToBottom: true,
        isAtBottom: true,
        messages: lists.records.map(msg => ({id: msg.id, content: msg.content.toString(), owner: msg.owner as AccountModel | undefined, createdAt: moment(new Date(msg.createdAt as unknown as string)), updatedAt: moment(new Date(msg.updatedAt as unknown as string))})),
        pageIndex: lists.pageIndex,
        totalPage: lists.totalPage,
        totalCount: lists.totalCount,
        unread: 0,
      };
      this.notifyMsg$.next('');
      setTimeout(() => {
        this.chatRooms[roomId].triggerScrollToBottom = false;
        if (this.chatRooms[roomId].pageIndex > 0 && this.chatRooms[roomId].messages.length < 5) {
          this.loadMoreMessages({roomId: roomId});
        }
      }, 100);
    });
  }

  loadMoreMessages(ev: {roomId: string}) {
    const roomId = ev.roomId;
    if (!this.api || !this.api.listElementMessages) { return; }
    if (!this.chatRooms[roomId]) { return; }
    if (this.chatRooms[roomId].pageIndex <= 0) { return; }
    const roomType = this.chatRooms[roomId].type;
    //  TODO: START HERE!!!
    this.chatRooms[roomId].isLoading = true;
    const nextIndex = this.chatRooms[roomId].pageIndex - 1;
    let queryObject, apiFunction;
    if (roomType === 'package' || roomType === 'project') {
      queryObject = {project: roomType === 'project' ? roomId : undefined, package: roomType === 'package' ? roomId : undefined};
      apiFunction = 'listElementMessages';
    } else if (roomType === 'user' && roomId === 'global') {
      queryObject = {project: {$exists: false}, package: {$exists: false}, user: {$exists: false}};
      apiFunction = 'queryElementMessages';
    } else if (roomType === 'user') {
      if (!this.currentUser || !this.currentUser.id) { return; }
      queryObject = {project: {$exists: false}, package: {$exists: false}, $or: [{user: roomId, owner: this.currentUser.id}, {user: this.currentUser.id, owner: roomId}]};
      apiFunction = 'queryElementMessages';
    } else {
      return;
    }
    this.api[apiFunction](this.elementId, queryObject, this.pageSize, nextIndex, 'created-asc').then((lists: {
      records: BdpElementMessage[],
      totalPage: number,
      pageIndex: number,
      totalCount: number,
      pageSize:number
    }) => {
      lists.records.forEach((elemMessage: BdpElementMessage) => {
        if (typeof elemMessage.owner === 'string') {
          const ownerId = elemMessage.owner;
          elemMessage.owner = {id: ownerId, name: `(unknown user id: ${ownerId}`, auths: {}};
          this.userModelMap.set(ownerId, elemMessage.owner);
        } else if (!elemMessage.owner) {
          elemMessage.owner = {id: 'undefined', name: `(unknown user)`, auths: {}};
        }
        this.userModelMap.set(elemMessage.owner.id, elemMessage.owner);
      });
      const prependingMessages = lists.records.map(msg => ({
        id: msg.id,
        content: msg.content.toString(),
        owner: msg.owner as AccountModel | undefined,
        createdAt: moment(new Date(msg.createdAt as unknown as string)),
        updatedAt: moment(new Date(msg.updatedAt as unknown as string))}));
      const roomMessages = this.chatRooms[roomId].messages;
      for (let i = prependingMessages.length - 1; i >= 0; i --) {
        roomMessages.unshift(prependingMessages[i]);
      }
      this.chatRooms[roomId].pageIndex = lists.pageIndex;
      setTimeout(() => this.chatRooms[roomId].isLoading = false, 500);
    });
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
