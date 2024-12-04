import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket = io('http://192.168.172.103:3000'); // IP DEL LOCAL

  constructor() {
    this.socket.on('connect', () => {
      console.log('Conectado al servidor');
    });
    this.socket.on('connect_error', (err) => {
      console.error('Error de conexión:', err);
    });
  }

  joinChat(username: string) {
    this.socket.emit('join', username);
  }

  sendMessage(message: { user: string; text: string }) {
    this.socket.emit('message', message);
  }

  onUserJoined(callback: (msg: string) => void) {
    this.socket.on('user-joined', callback);
  }

  onReceiveMessage(callback: (msg: { user: string; text: string }) => void) {
    this.socket.on('message', callback);
  }

  getPreviousMessages(callback: (messages: { user: string; text: string }[]) => void) {
    this.socket.on('previous-messages', callback);
  }
}