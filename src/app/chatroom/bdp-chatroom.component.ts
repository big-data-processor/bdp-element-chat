import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { BdpElementMessage } from '../model/element-message';
import { AccountModel } from '../model/mongo.models';

@Component({
  selector: 'bdp-chatroom',
  templateUrl: 'bdp-chatroom.component.html',
  styleUrls: ['bdp-chatroom.component.css']
})

export class BdpChatroomComponent implements OnInit, AfterViewInit {
  @Input() roomId: string | undefined;
  @Input() roomType: 'project' | 'package' | 'user' = 'project';
  @Input() messages: Array<{id: string, content: any, owner?: AccountModel | string}> = [];
  @ViewChild('messageBoxes') messageBoxes: ElementRef | undefined;
  constructor() { }

  ngOnInit() { }
  ngAfterViewInit() {
    if (this.messageBoxes) {
      this.messageBoxes.nativeElement.scrollTop = this.messageBoxes.nativeElement.scrollHeight;
    }
  }
}