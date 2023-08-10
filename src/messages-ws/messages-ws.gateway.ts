import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Socket, Server } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() wss: Server;

    constructor(
        private readonly messagesWsService: MessagesWsService
    ) { }

    handleConnection(client: Socket) {
        this.messagesWsService.registerClient(client);
        this.wss.emit('clients-updated', this.messagesWsService.getConnectdClients());
    }

    handleDisconnect(client: Socket) {
        this.messagesWsService.removeClient(client.id);
        this.wss.emit('clients-updated', this.messagesWsService.getConnectdClients());
    }

    @SubscribeMessage('message-from-client')
    onMessageClient(client: Socket, payload: NewMessageDto) {

        //! emite unicamente al cliente.
        // client.emit('message-from-server', {
        //     fullName: 'Soy Yo xd',
        //     message: payload.message || 'no-message'
        // });

        //! emitir a todos MENOS al cliente inicial
        // client.broadcast.emit('message-from-server', {
        //     fullName: 'Soy Yo xd',
        //     message: payload.message || 'no-message'
        // });

        //! todos los clientes reciben la info
        this.wss.emit('message-from-server', {
            fullName: client.id,
            message: payload.message || 'no-message'
        });
    }

}
