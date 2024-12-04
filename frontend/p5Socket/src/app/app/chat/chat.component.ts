import { Component, OnInit } from '@angular/core';
import { SocketService } from '../socket.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ChatComponent implements OnInit {
  username: string = '';
  message: string = '';
  messages: { user: string; text: string }[] = [];
  joined: boolean = false;

  private secretKey = '88204997345479b1c3479f6b2efcfbfa5ebd2996198f19a20769399cdd4783c5';

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    this.socketService.getPreviousMessages((previousMessages) => {
      this.messages = previousMessages || [];
    });
  
    this.socketService.onUserJoined((msg) => {
      this.messages.push({ user: 'Sistema', text: msg });
    });
  
    this.socketService.onReceiveMessage((msg) => {
      if (!this.messages.some(m => m.text === msg.text && m.user === msg.user)) {
        this.messages.push(msg);
      }
    });
  }

  joinChat() {
    if (this.username.trim()) {
      this.socketService.joinChat(this.username);
      this.joined = true;
    }
  }

  sendMessage() {
    if (this.message.trim()) {
      const encryptedMessage = CryptoJS.AES.encrypt(this.message, this.secretKey).toString();
      const msg = { user: this.username, text: encryptedMessage };

      if (!this.messages.some(m => m.text === this.message && m.user === this.username)) {
        this.socketService.sendMessage(msg);
        this.messages.push({ user: this.username, text: this.message });
      }

      this.message = '';
    }
  }
}
