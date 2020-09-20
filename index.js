const WebSocket = require('ws');
const {
    v4: uuidv4
} = require('uuid');


const wss = new WebSocket.Server({
    port: 8080
});

let connections = {};
let lobbies = [];
const LOBBY_LIMIT = 5;

wss.on('connection', function connect(ws) {
    const connection_id = uuidv4();

    ws.on('message', function incoming(json) {
        const message = JSON.parse(json);
        if (!message || !message.type) {
            return;
        }

        switch (message.type) {
            case "JOIN_RANDOM_LOBBY":
                let joined_lobby_id;

                const available_lobbies = get_available_lobbies();

                const there_are_no_available_lobbies = !available_lobbies || available_lobbies.length === 0;

                if (there_are_no_available_lobbies) {
                    const new_lobby = create_new_lobby();
                    connect_to_lobby(connection_id, new_lobby)
                    add_to_lobbies(new_lobby);
                    joined_lobby_id = new_lobby.id;
                } else {
                    const random_index = getRandomInt(0, available_lobbies.length);
                    const existing_lobby = available_lobbies[random_index];
                    connect_to_lobby(connection_id, existing_lobby);
                    joined_lobby_id = existing_lobby.id;
                }

                ws.send(JSON.stringify({
                    type: "LOBBY_JOINED",
                    lobby_id: joined_lobby_id
                }));

                break;
        }
    });

    ws.on('close', function close() {
        remove_connection(connection_id);
    });

    ws.send(JSON.stringify({
        type: "CONNECTED",
        connection_id: connection_id
    }));


    connections[connection_id] = ws;
});

function remove_connection(connection_id) {
    delete connections[connection_id];
}

function get_available_lobbies() {
    if (!lobbies || lobbies.length === 0) {
        return [];
    }

    const available_lobbies = lobbies.filter((lobby) => !is_a_full(lobby));
    return available_lobbies;
}

function is_a_full(lobby) {
    return (lobby.players && lobby.players.length === LOBBY_LIMIT);
}


function create_new_lobby() {
    return {
        id: uuidv4(),
        players: []
    }
}

function connect_to_lobby(connection_id, lobby) {
    const connection_exists = connections.hasOwnProperty(connection_id);
    if (!connection_exists) {
        return false;
    }

    if (is_a_full(lobby)) {
        return false;
    }

    connections[connection_id].in_lobby = true;
    connections[connection_id].connected_lobby_id = lobby.id;
    lobby.players.push(connection_id);
}

function add_to_lobbies(lobby) {
    if (!lobbies) {
        lobbies = [];
    }

    lobbies.push(lobby);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}