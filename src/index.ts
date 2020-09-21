import WebSocket from 'ws';
import {v4 as uuidv4} from 'uuid';

const wss = new WebSocket.Server({
    port: 8080
});

let connections = {};
let lobbies: any[] = [];
const LOBBY_LIMIT = 5;

wss.on('connection', function connect(ws) {
    const connection_id = uuidv4();

    ws.on('message', function incoming(json) {
        const message = JSON.parse(json as string);
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
                    connect_to_lobby(connection_id, message.username, new_lobby)
                    add_to_lobbies(new_lobby);
                    joined_lobby_id = new_lobby.id;
                } else {
                    const random_index = getRandomInt(0, available_lobbies.length);
                    const existing_lobby = available_lobbies[random_index];
                    connect_to_lobby(connection_id, message.username, existing_lobby);
                    joined_lobby_id = existing_lobby.id;
                }

                ws.send(JSON.stringify({
                    type: "LOBBY_JOINED",
                    lobby_id: joined_lobby_id
                }));

                send_message_to_lobby(joined_lobby_id, `${message.username} has joined the lobby.`, "", "SYSTEM");

                break;
            case "SEND_LOBBY_CHAT":
                const sender = get_lobby_username(message.lobby_id, connection_id);
                send_message_to_lobby(message.lobby_id, message.message, sender, connection_id)
                break;
        }
    });

    ws.on('close', function close() {
        disconnect_from_current_lobby(connection_id);
        remove_connection(connection_id);
    });

    ws.send(JSON.stringify({
        type: "CONNECTED",
        connection_id: connection_id
    }));


    connections[connection_id] = ws;
});

function disconnect_from_current_lobby(connection_id) {
    const player = connections[connection_id];
    if(!player || !player.in_lobby) return;


    const lobby_id = player.connected_lobby_id;
    const lobby_index = lobbies.findIndex((lobby) => lobby.id === lobby_id);
    if(lobby_index < 0) return;

    const temp = lobbies[lobby_index].players.find((player) => player.connection_id === connection_id);
    const left_username = temp.username;
    lobbies[lobby_index].disconnected_players.push(temp);
    lobbies[lobby_index].players = lobbies[lobby_index].players.filter((player) => player.connection_id !== connection_id);
    player.in_lobby = false;
    player.connected_lobby_id = "";
    send_message_to_lobby(lobby_id, `${left_username} has left the lobby.`, "", "SYSTEM");
}

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
    return (total_players_in_lobby(lobby) === LOBBY_LIMIT);
}


function create_new_lobby() {
    return {
        id: uuidv4(),
        players: [],
        disconnected_players: []
    }
}

function total_players_in_lobby(lobby) {
    if(!lobby) return 0;

    return lobby.players.length + lobby.disconnected_players.length;
}

function connect_to_lobby(connection_id, username, lobby) {
    const connection_exists = connections.hasOwnProperty(connection_id);
    if (!connection_exists) { return false; }

    if (is_a_full(lobby)) { return false; }

    connections[connection_id].in_lobby = true;
    connections[connection_id].connected_lobby_id = lobby.id;
    lobby.players.push({ connection_id: connection_id, username: username });
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
function send_message_to_lobby(lobby_id, message, sender, sender_id) {
    const lobby = lobbies.find((lobby) => lobby.id === lobby_id);
    if(!lobby || !lobby.players || lobby.players.length ===0) return;

    for (let player of lobby.players) {
        const connection_id = player.connection_id;
        connections[connection_id].send(JSON.stringify({
            type: "RECEIVE_LOBBY_CHAT",
            sender: sender,
            sender_id: sender_id,
            message: message
        }))
    }
}

function get_lobby_username(lobby_id, connection_id) {
    const lobby = lobbies.find((lobby) => lobby.id === lobby_id);
    if(!lobby || !lobby.players || lobby.players.length === 0) { return; }

    const player = lobby.players.find((player) => player.connection_id === connection_id);
    return player.username;
}