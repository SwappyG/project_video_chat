import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'

const PORT = process.env.MY_OWN_VOICE_PORT || 5000;

class VideoServer {
	constructor() {
		this.participants = []
		this.lobbies = []

		this.app = express();
		this.app.use(cors());
		this.server = http.createServer(this.app)

		this.app.get('/', (req, res) => {
			res.send('Running');
		});

		// TODO (swapnil) - figure out how cross-origin stuff works so this can actually be 
		// hosted on the internet
		this.io = new Server(
			this.server, 
			{
				cors: {
					origin: "*",
					methods: [ "GET", "POST" ]
				}
			}
		)

		// Set up all our callbacks and hooks for every client that connects to the server
		this.io.on("connection", (socket) => {
			console.log(`New participant: ${socket.id}`)
			this.participants.push({
				'socket': socket,
				'socket_id': socket.id,
				'username': null,
				'lobby': null
			})
		
			// Let the client know theyve connected, and provide some information about the current
			// state of the server
			socket.emit("connection_confirmation", {
				'socket_id': socket.id,
				'lobbies': this._get_detailed_lobbies()
			})
		
			// Attach the rest of the callbacks for each supported event

			socket.on("disconnect", () => this._on_disconnect(socket))
		
			socket.on("set_username", ({ username }) => { this._on_set_username(socket, username) })
		
			socket.on("get_lobbies", () => { this._on_get_lobbies(socket) })
		
			socket.on("join_lobby", ({ lobby_name }) => { this._on_join_lobby(socket, lobby_name) })
		
			socket.on("create_lobby", ({ lobby_name }) => { this._on_create_lobby(socket, lobby_name) })
		
			socket.on("leave_lobby", () => { this._on_leave_lobby(socket) })
		
			socket.on("relay_signal", ({ socket_id, signal }) => { this._on_relay_signal(socket, socket_id, signal) })
		
			// For debugging, print the current connected clients. To be removed
			console.log(this.participants.map(pp => { return { ...pp, socket: undefined } }))
		})
	}

	start = () => {
		this.server.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
	}

	/* Allows the client to change their user name */
	_on_set_username = (socket, username) => {
		let index = participants.findIndex(p => p.socket_id === socket.id)
		if (index === -1) {
			return
		}
		participants[index].username = username

		send_response(socket, 'set_username', true, `username updated to ${username}`)
		
		notify_lobby_of_participant(index, 'participant_info', {
			'username_update': {
				'socket_id': participants[index].socket_id,
				'username': username,
			}
		}, true)
	}

	_on_disconnect = (socket) => {
		// TODO (swapnil) - what does broadcast mean
		console.log(`${socket.id} just disconnected`)
		socket.broadcast.emit("disconnected")
		const index = this.participants.findIndex(pp => pp.socket_id === socket.id)
		if (index === -1) {
			return
		}

		const lobby_name = this.participants[index].lobby
		const socket_id = this.participants[index].socket_id
		this._notify_lobby(lobby_name, 'lobby_update', {
			'disconnect': {
				'socket_id': socket_id,
			}
		})	

		this.participants = this.participants.filter((pp) => pp.socket_id !== socket.id)
	}

	_on_get_lobbies = (socket) => {
		send_response(socket, 'get_lobbies', true, this._get_detailed_lobbies())
	}

	_on_join_lobby = (socket, lobby_name) => {
		const lobby = this.lobbies.find(ll => ll === lobby_name)
		if (!lobby) {
			this._send_response(socket, 'join_lobby', false, `lobby [${lobby_name}] does not exist`)
			return
		}

		let index = this.participants.findIndex(p => p.socket_id === socket.id)
		if (index === -1) {
			return
		}
		this.participants[index].lobby = lobby_name
		
		this._notify_lobby_of_participant(index, 'lobby_update', {
			'participant_join': {
				...this.participants[index], 
				socket: undefined, // we don't wanna send socket information directly to clients
			},
		}, true)

		this._send_response(socket, 'join_lobby', true, `joined lobby ${lobby_name}`, {
			'lobby_name': lobby_name,
			'participants': this.participants.filter(pp => pp.lobby === lobby_name).map(pp => {
				return {
					...pp, 
					socket: undefined, // we don't wanna send socket information directly to clients
				}
			})
		})
	}

	_on_create_lobby = (socket, lobby_name) => {
		console.log('create_lobby called')
		if (!lobby_name || lobby_name === "") {
			this._send_response(socket, 'create_lobby', false, `Invalid lobby name`)
			return
		} 
		const lobby = this.lobbies.find(ll => ll === lobby_name)
		if (lobby) {
			this._send_response(socket, 'create_lobby', false, `lobby [${lobby_name}] already exists. Join instead`)
			return
		}

		this.lobbies.push(lobby_name)
		
		this._send_response(socket, 'create_lobby', true, `created lobby ${lobby_name}`)
		
		const detailed_lobbies = this._get_detailed_lobbies()
		this.participants.forEach(pp => {
			pp.socket.emit('server_update', {
				'lobbies': detailed_lobbies
			})
		})
	}

	_on_leave_lobby = (socket) => {
		let index = this.participants.findIndex(p => p.socket_id === socket.id)
		if (index === -1) {
			return
		}
		if (this.participants[index].lobby == null) {
			this._send_response(socket, 'leave_lobby', true, 'was never in a lobby')
			return
		}

		this._send_response(socket, 'leave_lobby', true, `left lobby ${this.participants[index].lobby}`)

		this._notify_lobby_of_participant(index, { 'lobby_update': {
				'participant_leave': {
					...this.participants[index], 
					socket: undefined, // we don't wanna send socket information directly to clients
				},
			}
		})
	}

	_on_relay_signal = (socket, socket_id, signal) => {
		console.log(`relay signal called by [${socket.id}]`)
		console.log(`relay signal to be sent to [${socket_id}]`)
		let index = this.participants.findIndex(p => p.socket_id === socket.id)
		if (index === -1) {
			return
		}
		console.log(`recipient [${socket_id}] was found from known participants`)

		let partner_index = this.participants.findIndex(p => p.socket_id === socket_id)
		if (partner_index === -1) {
			send_response(socket, 'relay_signal', false, `client with socket id ${socket_id} not connected to server`)
		}
		console.log(`initiator [${socket.id}] was found from known participants`)

		console.log(`emiting relay signal to [${socket_id}]`)
		this.participants[partner_index].socket.emit("recv_signal", { 
			participant: { ...this.participants[index], socket: undefined }, 
			signal: signal
		})
		this._send_response(socket, 'relay_signal', true, `forwarded signal to client with ID ${socket_id}`)
	}

	_get_detailed_lobbies = () => {
		return this.lobbies.map((lobby) => {
			return {
				'lobby_name': lobby,
				'participants': this.participants.filter(pp => pp.lobby === lobby).map(pp => {
					return {
						...pp, 
						socket: undefined, // we don't wanna send socket information directly to clients
					}
				})
			}
		})
	}

	_notify_lobby_of_participant = (participant_index, message_name, data, exclude_participant = false) => {
		this.participants.forEach((p, index) => {
			if (
				(p.lobby === this.participants[participant_index].lobby) && 
				(!exclude_participant || (index === participant_index))
			) {
				p.socket.emit(message_name, data)
			}
		})
	}

	_notify_lobby = (lobby_name, message_name, data) => {
		this.participants.forEach((p, index) => {
			if (p.lobby === lobby_name){
				p.socket.emit(message_name, data)
			}
		})
	}

	_send_response = (socket, request, result, message, data=undefined) => {
		// TODO (swapnil) - maybe collect this into a struct of some sort
		const resp = {
			'request': request,
			'result': result,
			'message': message,
			'data': data
		}
		console.log('response', resp)
		socket.emit('response', resp)	
	} 

}

const vs = new VideoServer()
vs.start()