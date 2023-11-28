// app/channel/channel.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './channel.entity';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { Conversation } from '../conversations/conversation.entity';
import { ConversationService } from '../conversations/conversation.service';
import { ConversationModule } from 'src/conversations/conversation.module';
import { User } from '../user/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { FortyTwoStrategy } from 'src/auth/auth.strategy';
import { UserService } from 'src/user/user.service';
import { NotifGateway } from '../notifications.gateway';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    ConversationModule,
    TypeOrmModule.forFeature([Channel, Conversation, User]),
  ],
  controllers: [ChannelController],
  providers: [
    ChannelService,
    ConversationService,
    AuthService,
    FortyTwoStrategy,
    UserService,
    NotifGateway,
    JwtService,
  ],
  exports: [ChannelService],
})
export class ChannelModule {}
