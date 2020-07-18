import EventDispatcher from "../src";

(async () => {
    const myDispatcher = await EventDispatcher('amqp://localhost');

    myDispatcher.register('hello', (user: string) =>  { return `Hello ${user}` });
    await myDispatcher.listen();

    const result = await myDispatcher.emit('hello', 'John');
    console.log(result);
})();