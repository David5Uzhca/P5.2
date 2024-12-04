import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';
import CryptoJS from 'crypto-js';
import { RouterOutlet } from '@angular/router';
import { ChatComponent } from './app/chat/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, ChatComponent],
})
export class AppComponent implements OnInit {
  messages: { user: string; text: string }[] = [];
  message = '';
  username = '';
  joined = false;
  private socket: any;

  private secretKey = '88204997345479b1c3479f6b2efcfbfa5ebd2996198f19a20769399cdd4783c5';

  ngOnInit() {
    this.socket = io('http://localhost:3000');

    this.socket.on('message', (data: any) => {
      const bytes = CryptoJS.AES.decrypt(data.text, this.secretKey);
      const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);

      this.messages.push({
        user: data.user,
        text: decryptedMessage
      });
    });
  }

  joinChat() {
    if (this.username.trim()) {
      this.joined = true;
      this.socket.emit('joined', this.username);
    }
  }

  sendMessage() {
    if (this.message.trim()) {
      const encryptedMessage = CryptoJS.AES.encrypt(this.message, this.secretKey).toString();

      this.socket.emit('message', {
        user: this.username,
        text: encryptedMessage
      });

      this.message = '';
    }
  }
}
