import * as amqp from 'amqplib'

export default class AmqpWrapper {
    private readonly url: string

    constructor (url: string) {
        this.url = url
    }

    async connect (): Promise<amqp.Connection> {
        return amqp.connect(this.url)
    }
}