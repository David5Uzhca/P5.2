const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const http = require('http');
const CryptoJS = require('crypto-js');
const amqp = require('amqplib/callback_api');

const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"]
};

app.use(cors(corsOptions));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const secretKey = '88204997345479b1c3479f6b2efcfbfa5ebd2996198f19a20769399cdd4783c5';

const RABBITMQ_URL = 'amqp://localhost';
const EXCHANGE_NAME = 'chat';

let messages = [];

amqp.connect(RABBITMQ_URL, (err, connection) => {
  if (err) {
    console.error('Error al conectar con RabbitMQ:', err.message);
    process.exit(1);
  }

  connection.createChannel((err, channel) => {
    if (err) {
      console.error('Error al crear el canal de RabbitMQ:', err.message);
      process.exit(1);
    }

    channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: false });

    io.on('connection', (socket) => {
      console.log('Usuario conectado:', socket.id);

      socket.emit('previous-messages', messages);

      channel.assertQueue('', { exclusive: true }, (err, q) => {
        if (err) {
          console.error('Error al crear la cola:', err.message);
          return;
        }

        console.log(`Esperando mensajes en la cola ${q.queue}`);
        channel.bindQueue(q.queue, EXCHANGE_NAME, '');

        channel.consume(q.queue, (message) => {
          if (message) {
            const receivedMessage = JSON.parse(message.content.toString());
            console.log('Mensaje recibido desde RabbitMQ:', receivedMessage);

            io.emit('message', receivedMessage);

            if (!messages.some(m => m.text === receivedMessage.text && m.user === receivedMessage.user)) {
              messages.push(receivedMessage);
            }
          }
        });
      });

      socket.on('join', (username) => {
        console.log(`${username} se unió al chat`);
        const joinMessage = { user: 'Sistema', text: `${username} se unió al chat` };

        channel.publish(EXCHANGE_NAME, '', Buffer.from(JSON.stringify(joinMessage)));

        if (!messages.some(m => m.text === joinMessage.text)) {
          messages.push(joinMessage);
        }
      });

      socket.on('message', (data) => {
        try {
          const bytes = CryptoJS.AES.decrypt(data.text, secretKey);
          const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);

          if (!decryptedMessage) throw new Error('Error de desencriptación');

          console.log(`${data.user} envió: ${decryptedMessage}`);

          const message = { user: data.user, text: decryptedMessage };

          channel.publish(EXCHANGE_NAME, '', Buffer.from(JSON.stringify(message)));

          if (!messages.some(m => m.text === message.text && m.user === message.user)) {
            messages.push(message);
          }

          socket.emit('message', message);

        } catch (error) {
          console.error('Error procesando mensaje:', error.message);
        }
      });

      socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
      });
    });
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Servidor corriendo en http://0.0.0.0:3000');
});