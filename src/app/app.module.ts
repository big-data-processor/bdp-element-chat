import { Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {createCustomElement} from '@angular/elements';
import { AppComponent } from './app.component';
import { BdpChatroomComponent } from './chatroom/bdp-chatroom.component';
import { BdpChatboxComponent } from './chatroom/bdp-chatbox.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
@NgModule({
    declarations: [AppComponent, BdpChatroomComponent, BdpChatboxComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        CKEditorModule
    ],
    // bootstrap: [AppComponent],
    providers: []
})
export class AppModule {
  constructor(private injector : Injector){}
  ngDoBootstrap() {
    const el = createCustomElement(AppComponent, {injector : this.injector});
    if (!customElements.get('bdp-element-chat')) {
      customElements.define('bdp-element-chat', el);
    }
  }
}
