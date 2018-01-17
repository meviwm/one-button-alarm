export class ChatMessage {
    messageId: string;
    userImAccount: string;
    userName: string;
    userAvatar: string;
    toUserImAccount: string;
    time: number | string;
    message: string;
    status: string;
    type: number | string;
    src: string;
}

export class UserInfo {
    imAccount: string;
    name?: string;
    avatar?: string;
}
