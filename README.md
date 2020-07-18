# Event Dispatcher
A simple EventDispatcher which implements RPC pattern over RabbitMQ. Allows to register subscribers and dispatch events across the microservices.
   
## Usage
    import EventDispatcher from 'event-dispatcher';

    (async () => {
        const myDispatcher = await EventDispatcher('amqp://localhost');

        myDispatcher.register('hello', (user: string) =>  { return `Hello ${user}` });
        await myDispatcher.listen();

        const result = await myDispatcher.emit('hello', 'John');
        console.log(result);
    })();
    
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
