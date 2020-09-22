import { Server } from './models/Server';
require('dotenv').config();

class App {
    static server: Server;
    public static run() {
        this.server = new Server();
        this.server.start();
    }
}

App.run();