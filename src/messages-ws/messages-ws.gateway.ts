import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { MessagesWsService } from './messages-ws.service';
import { Socket, Server } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() wss: Server;

    constructor(
        private readonly messagesWsService: MessagesWsService,
        private readonly jwtService: JwtService,
    ) { }

    async handleConnection(client: Socket) {
        const token = client.handshake.headers.authentication as string;
        let payload: JwtPayload;

        try {
            payload = this.jwtService.verify(token);
            await this.messagesWsService.registerClient(client, payload.id);
            
        } catch (error) {
            client.disconnect();
            return;
        }

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
            fullName: this.messagesWsService.getUserFullName(client.id),
            message: payload.message || 'no-message'
        });
    }

}
