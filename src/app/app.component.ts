import { Component, ElementRef, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BdpElementMessage } from './model/element-message';
import {ProjectModel, PackageModel, AccountModel} from './model/mongo.models';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @Input('elementId') elementId: string = '';
  @Output('onload') onload = new EventEmitter<ElementRef>();
  api: any;
  chatRooms: {[key: string]: {type: 'project' | 'package' | 'user', isLoading: boolean, messages: Array<{id: string, content: any, owner?: AccountModel | string}>, pageIndex: number, totalPage: number, totalCount: number}} = {};
  chatRoomIds: string[] = [];
  currentProject: ProjectModel | undefined;
  currentPackage: PackageModel | undefined;
  currentUser: AccountModel | undefined;
  pageSize: number = 30;
  constructor(private el: ElementRef) {}
  ngOnInit() {
    this.el.nativeElement.bdpInitialize = (inputApi: any) => this.initialize(inputApi).catch(console.log);
    this.el.nativeElement.bdpNotifyChanges = (changes: {type: string, target: string, data: any}) => this.handleChanges(changes).catch(console.log);
    this.el.nativeElement.bdpIncomingMessage = (msgObj: {type: string, message: BdpElementMessage}) => this.incomingMessageHandler(msgObj).catch(console.log);
    this.onload.emit(this.el.nativeElement);

    this.chatRooms['test-id'] = {type: 'project', isLoading: true, messages: [], pageIndex: 0, totalPage: 10, totalCount: 300};
    this.chatRoomIds = ['test-id'];
  }
  async initialize(inputApi: any) {
    this.api = inputApi;
    if (!this.api) { return console.log('failed to get api functions'); }

    this.currentUser = await this.api.getCurrentUserInfo();
    this.currentProject = await this.api.getCurrentProjectInfo();
    this.currentPackage = await this.api.getCurrentPackageInfo();
    
    // console.log(this.currentUser, this.currentProject, this.currentPackage);
    
  }
  
  async handleChanges(changes: {type: string, target: string, data: any}) {
    if (changes.type !== 'switch') { return; }
    switch (changes.target) {
      case 'Project':
        if (changes.data && changes.data.id) { this.enterChatroom('project', changes.data.id); }
        break;
      case 'Package':
        if (changes.data && changes.data.id) { this.enterChatroom('package', changes.data.id); }
        break;
    }
  }
  async incomingMessageHandler(msgObj: {type: string, message: BdpElementMessage}) {
    switch (msgObj.type) {
      case 'insert':

        break;
    }
  }

  enterChatroom(roomType: 'project' | 'package' | 'user', roomId: string) {
    /** 1. check if chatroom is joined.
     *  2. join the new room.
     *  Note that if roomType === 'user', use queryElementMessages which allows customized message queries instead of the listElementMessages
     */
    if (!this.api || !this.elementId) { return; }
    if (!this.chatRooms[roomId]) {
      const correspondingIds = {
        project: roomType === 'project' ? roomId : undefined,
        package: roomType === 'package' ? roomId : undefined
      };
      this.chatRooms[roomId] = {type: roomType, isLoading: true, messages: [], pageIndex: 0, totalPage: 0, totalCount: 0};
      this.chatRoomIds.push(roomId);
      this.api.listElementMessages(this.elementId, correspondingIds, this.pageSize, 0, 'created-desc').then((lists: {
        records: BdpElementMessage[],
        totalPage: number,
        pageIndex: number,
        totalCount: number,
        pageSize:number
      }) => {
        console.log(lists);
        this.chatRooms[roomId] = {type: roomType, isLoading: true, messages: lists.records.map(msg => ({id: msg.id, content: msg.content, owner: msg.owner as AccountModel | string | undefined})), pageIndex: lists.pageIndex, totalPage: lists.totalPage, totalCount: lists.totalCount};
      });
    }
  }
  appendChatMessage(roomId: string, message: BdpElementMessage) {

  }
  createMesage(roomId: string, content: string) {
    if (!this.chatRooms[roomId]) { return; }
    const roomType = this.chatRooms[roomId].type;
    const correspondingIds = {
      project: roomType === 'project' ? roomId : undefined,
      package: roomType === 'package' ? roomId : undefined
    };
    this.api.createElementMessage(this.elementId, correspondingIds, {message: content}, roomType);
  }
  sortRoomFunc(a: string, b: string) {
    return this.chatRoomIds.indexOf(b) - this.chatRoomIds.indexOf(a);
  }
}
