# Dispatcher
A package for creating communication between microservices based on RabbitMQ.

## Usage
    (async () => {
        const rpc = await require('./src')('amqp://localhost')

        rpc.register('hello', user => `Hello ${user}`);
        rpc.start();

        rpc.call('hello', 'john).then(response => {
            console.log(response);
        });
    })().catch(e => console.log(e))

## Api reference
    async emit(event: string, ...args: any[]) => Promise<any>
Emit new event.

    register (event: string, callback: (...args: any[]) => any) => void
Register new event callback

    async listen() => Promise<void>
Start listen for new requests. Use this after register events.

## Versioning
We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/FFx0q/event-dispatcher/tags). 

## Authors
* **Dominik Szamburski** - *Initial work* - [FFx0q](https://github.com/FFx0q)

See also the list of [contributors](https://github.com/FFx0q/event-dispatcher/contributors) who participated in this project.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
