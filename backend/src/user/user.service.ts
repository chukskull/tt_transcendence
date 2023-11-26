import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { Conversation, Chat } from '../conversations/conversation.entity';
import { NotFoundException } from '@nestjs/common';
import { NotifGateway } from 'src/notifications.gateway';
import { Channel } from '../channel/channel.entity';
import { ChannelService } from '../channel/channel.service';
import { ConversationService } from 'src/conversations/conversation.service';
import { Achievement } from 'src/achievement/achievement.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly notifGateway: NotifGateway,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,

    private channelService: ChannelService,
    private readonly conversationService: ConversationService,
  ) {}

  async createNewUser(intraLogin: string, avatarUrl: string, email: string) {
    let alreadyExists;
    try {
      if (!intraLogin) {
        alreadyExists = await this.userRepository.findOne({
          where: {
            intraLogin: intraLogin,
          },
        });
      } else {
        alreadyExists = await this.userRepository.findOne({
          where: {
            email: email,
          },
        });
      }
    } catch (e) {
      console.log(e);
    }
    if (alreadyExists) {
      return null;
    }
    const user = this.userRepository.create({ intraLogin, avatarUrl, email });
    user.nickName = '';
    user.firstName = '';
    user.lastName = '';
    user.twoFactorAuthEnabled = false;
    user.twoFactorSecret = '';
    user.friends = [];
    user.blockedUsers = [];
    user.matchHistory = [];
    user.nickName = intraLogin;
    user.firstTimeLogiIn = true;
    user.conversations = [];

    // check if the global channel exists
    const savedUser = await this.userRepository.save(user);
    let globalChannel;
    globalChannel = await this.channelRepository.findOne({
      where: {
        name: 'Welcome/Global channel',
      },
    });
    if (!globalChannel) {
      globalChannel = await this.channelService.createChannel(
        {
          name: 'Welcome/Global channel',
          is_private: false,
          password: '',
        },
        savedUser.id,
      );
      console.log('global channel created', globalChannel);
    } else {
      this.channelService.joinChannel(globalChannel.id, '', savedUser.id);
    }

    this.channelRepository.save(globalChannel);
    return this.userRepository.save(savedUser);
  }
  async validate42Callback(code: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: {
        intraLogin: code,
      },
    });
    if (!user) {
      return null;
    }
    return user;
  }

  async all(): Promise<User[]> {
    return this.userRepository.find();
  }

  async userProfile(id: string | number): Promise<User> {
    const user =
      typeof id === 'string'
        ? await this.userRepository.findOne({
            where: { nickName: id },
            relations: [
              'matchHistory',
              'channels',
              'conversations',
              'friends',
              'matchHistory.winner',
              'matchHistory.player1',
              'matchHistory.player2',
              'achievements',
            ],
          })
        : await this.userRepository.findOne({
            where: { id },
            relations: [
              'matchHistory',
              'channels',
              'conversations',
              'friends',
              'matchHistory.winner',
              'matchHistory.player1',
              'matchHistory.player2',
              'achievements',
            ],
          });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async findOne(email: string): Promise<User> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async fillData(data: any, id: number): Promise<any> {
    const { nickName, firstName, lastName } = data;
    const nickNameEx = await this.userRepository.findOne({
      where: { nickName },
    });
    if (nickNameEx) return { message: 'NickName already exists' };
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (user.firstName.length > 2) return { message: 'data already filled' };
    const useeer = this.userRepository.update(id, {
      nickName,
      firstName,
      lastName,
    });

    console.log('this is user ', useeer);
    return useeer;
  }

  async getFriends(userId: number): Promise<User> {
    const client = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['friends', 'blockedUsers', 'pendingFriendRequests'],
    });
    if (!client) {
      return null;
    }
    return client;
  }
  async getChatWithFriend(clientID: number, friendId: number): Promise<any> {
    const client = await this.userRepository.findOne({
      where: { id: clientID },
      relations: [
        'conversations',
        'conversations.chats',
        'conversations.members',
        'conversations.chats.sender',
      ],
    });
    if (!client) {
      return null;
    }
    const conversation = client.conversations.find(
      (conv) =>
        conv.is_group === false &&
        conv.members.find((member) => member.id == friendId),
    );

    if (!conversation) {
      return null;
    }
    return conversation;
  }

  async updateUserInfo(data): Promise<any> {
    const { nickName, profilePicture, twoFa, id } = data;

    const alreadyExists = await this.userRepository.findOne({
      where: { id },
    });
    if (alreadyExists) {
      await this.userRepository.update(id, {
        nickName,
        avatarUrl: profilePicture,
        twoFactorAuthEnabled: twoFa,
      });
    }
    return this.userRepository.update(id, data);
  }

  async setStatus(clientID: number, status: string): Promise<any> {
    return this.userRepository.update(clientID, { status: status });
  }

  async setStatusByNick(nickName: string, status: string): Promise<any> {
    return this.userRepository.update(nickName, { status: status });
  }

  async getLeaderboard(): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    queryBuilder.orderBy('user.experience', 'DESC');
    return queryBuilder.getMany();
  }

  async sendFriendRequest(myID: number, friendID: number): Promise<any> {
    if (myID === friendID) {
      return { message: 'Cannot send friend request to yourself' };
    }
    const client = await this.userRepository.findOne({
      where: { id: myID },
      relations: ['friends', 'blockedUsers', 'pendingFriendRequests'],
    });

    const friend = await this.userRepository.findOne({
      where: { id: friendID },
      relations: ['friends', 'blockedUsers', 'pendingFriendRequests'],
    });

    if (!client || !friend) {
      throw new NotFoundException('User not found.');
    }

    if (this.isAlreadyFriend(client, friend)) {
      return { message: 'User already in friends' };
    }

    if (this.isBlocked(client, friend)) {
      return { message: 'User is blocked' };
    }

    if (this.isAlreadyPending(client, friend)) {
      return { message: 'User already in pending' };
    }

    // Update pendingFriendRequests without saving immediately
    friend.pendingFriendRequests.push(client);
    client.pendingFriendRequests.push(friend);

    // Save the changes asynchronously
    await this.saveFriendRequests([client, friend]);

    await this.notifGateway.newFriendRequest(client, friendID);

    return { message: 'Friend request sent' };
  }

  // New asynchronous method to save changes
  private async saveFriendRequests(users: User[]): Promise<void> {
    for (const user of users) {
      await this.userRepository.save(user);
    }
  }

  async handleFriendRequest(
    friendID: number,
    action: number,
    handlerId: number,
  ): Promise<any> {
    const client = await this.userRepository.findOne({
      where: { id: handlerId },
      relations: ['friends', 'blockedUsers', 'pendingFriendRequests'],
    });

    const friend = await this.userRepository.findOne({
      where: { id: friendID },
      relations: ['friends', 'blockedUsers', 'pendingFriendRequests'],
    });

    if (!client || !friend) {
      throw new NotFoundException('User not found.');
    }
    const pending = this.findPendingRequest(client, friendID);
    if (!pending) {
      return { message: 'User is not in pending' };
    }
    if (this.isAlreadyFriend(client, friend)) {
      return { message: 'User already in friends' };
    }

    if (this.isBlocked(client, friend)) {
      return { message: 'User is blocked' };
    }

    if (action === 1) {
      //accept
      client.pendingFriendRequests = client.pendingFriendRequests.filter(
        (pending) => pending.id !== friendID,
      );
      friend.pendingFriendRequests = friend.pendingFriendRequests.filter(
        (pending) => pending.id !== handlerId,
      );

      const conversation = this.findConversation(client, friendID);

      if (conversation) {
        client.friends.push(friend);
        friend.friends.push(client);
      } else {
        const newconv = await this.conversationService.createConversation(
          client.id,
          friendID,
        );
        client.friends.push(friend);
        friend.friends.push(client);
        client.conversations.push(newconv);
        friend.conversations.push(newconv);
      }
    } else {
      //decline 0
      client.pendingFriendRequests = client.pendingFriendRequests.filter(
        (pending) => pending.id !== friendID,
      );
      friend.pendingFriendRequests = friend.pendingFriendRequests.filter(
        (pending) => pending.id !== handlerId,
      );
    }

    await this.userRepository.save(client);
    await this.userRepository.save(friend);
    return { message: 'Friend request accepted' };
  }

  async removeFriend(clientID: number, friendID: number): Promise<any> {
    const client = await this.userRepository.findOne({
      where: { id: clientID },
      relations: ['friends'],
    });

    const friend = await this.userRepository.findOne({
      where: { id: friendID },
      relations: ['friends'],
    });

    if (!client || !friend) {
      throw new NotFoundException('User not found.');
    }

    client.friends = client.friends.filter((f) => f.id !== friendID);
    friend.friends = friend.friends.filter((f) => f.id !== clientID);

    await this.userRepository.save(client);
    await this.userRepository.save(friend);
    return { message: 'Friend removed' };
  }

  private isAlreadyFriend(client: User, friend: User): boolean {
    return client.friends.some((f) => f.id === friend.id);
  }

  private isBlocked(client: User, friend: User): boolean {
    return client.blockedUsers.some((b) => b.id === friend.id);
  }

  private isAlreadyPending(client: User, friend: User): boolean {
    return friend.pendingFriendRequests.some((p) => p.id === client.id);
  }

  private findPendingRequest(client: User, friendID: number): User | undefined {
    return client.pendingFriendRequests.find((p) => p.id === friendID);
  }

  private findConversation(
    client: User,
    friendID: number,
  ): Conversation | undefined {
    return client.conversations.find(
      (conv) =>
        conv.is_group === false &&
        conv.members.find((member) => member.id === friendID),
    );
  }

  async handleBlock(blockedID: number, handlerId: number, action: number) {
    const { client, blocked } = await this.getClientAndBlockedUser(blockedID);

    // 1 block 0 unblock
    if (action === 1) {
      const alreadyBlocked = this.isAlreadyBlocked(client, blocked);
      if (alreadyBlocked) {
        return { message: 'User already blocked' };
      }

      const friend = this.findFriend(client, blockedID);
      if (friend) {
        client.friends = client.friends.filter((user) => user.id !== blockedID);
      }

      client.blockedUsers.push(blocked);
      return this.userRepository.save(client);
    } else if (action === 0) {
      const alreadyBlocked = this.isAlreadyBlocked(client, blocked);
      if (!alreadyBlocked) {
        return { message: 'User not blocked' };
      }

      client.blockedUsers = client.blockedUsers.filter(
        (user) => user.id !== blockedID,
      );
      return this.userRepository.save(client);
    }
  }
  async getMyChannels(clientID: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: clientID },
      relations: [
        'channels',
        'channels.members',
        'channels.owner',
        'channels.Moderators',
        'channels.BannedUsers',
        'channels.MutedUsers',
        'channels.conversation',
      ],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const channels = user.channels.map((channel) => {
      channel.password = '';
      return channel;
    });
    return channels;
  }

  private async getClientAndBlockedUser(
    blockedID: number,
    clientID?: number,
  ): Promise<{ client: User; blocked: User }> {
    const [client, blocked] = await Promise.all([
      this.userRepository.findOne({
        where: { id: clientID || 1 },
        relations: ['friends', 'blockedUsers'],
      }),
      this.userRepository.findOne({ where: { id: blockedID } }),
    ]);

    if (!client || !blocked) {
      throw new NotFoundException('User not found.');
    }

    return { client, blocked };
  }

  async enableTwoFactor(clientID: number): Promise<any> {
    const client = await this.userRepository.findOne({
      where: { id: clientID },
    });
    if (!client) {
      throw new NotFoundException('User not found.');
    }

    client.twoFactorAuthEnabled = true;
    return this.userRepository.save(client);
  }

  async disableTwoFactor(clientID: number): Promise<any> {
    const client = await this.userRepository.findOne({
      where: { id: clientID },
    });
    if (!client) {
      throw new NotFoundException('User not found.');
    }

    client.twoFactorAuthEnabled = false;
    return this.userRepository.save(client);
  }

  async saveTwoFactorSecret(secret: string, clientID: number): Promise<any> {
    const client = await this.userRepository.findOne({
      where: { id: clientID },
    });
    if (!client) {
      throw new NotFoundException('User not found.');
    }

    client.twoFactorSecret = secret;
    return this.userRepository.save(client);
  }

  private isAlreadyBlocked(client: User, blocked: User): boolean {
    return client.blockedUsers.some((user) => user.id === blocked.id);
  }

  private findFriend(client: User, friendID: number): User | undefined {
    return client.friends.find((user) => user.id === friendID);
  }

  async setOnline(clientID: number): Promise<any> {
    return this.userRepository.update(clientID, { status: 'online' });
  }

  async setOffline(clientID: number): Promise<any> {
    return this.userRepository.update(clientID, { status: 'offline' });
  }

  async updateLevel(xp: number, clientID: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: clientID },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const level = Math.floor(xp / (1098 + user.level * 100));
    user.level = level;
    return this.userRepository.save(user);
  }
}
