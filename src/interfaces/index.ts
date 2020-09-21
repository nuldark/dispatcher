export interface IRequest 
{
    event: string,
    args?: any[]
}

export interface IResponse
{
    queue: string,
    content: Buffer,
    options: {
        correlationId: string,
        replyTo: string
    }  
}