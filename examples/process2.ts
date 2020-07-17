import * as EventDispatcher from "../src";

(async () => {
    const myDispatcher = await EventDispatcher.connect('amqp://localhost');

    myDispatcher.emit('user.get', 'macotsu').then(r => console.log(r));
})()