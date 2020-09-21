import { Server } from './models/Server';

class App {
    static server: Server;
    public static run() {
        this.server = new Server();
        this.server.start();
    }
}

App.run();