export interface RequestPayload {
    event: string,
    args?: any[]
};

export interface RequestMessage {
    queue: string,
    content: Buffer,
    options: {
        correlationId: string,
        replyTo: string
    }
}