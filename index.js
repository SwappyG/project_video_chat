const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
	res.send('Running');
});

let callers = []

io.on("connection", (socket) => {
	socket.emit("me", socket.id);

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
		callers = callers.filter(cc => cc.id !== socket.id)
	});

	socket.on("callUser", ({ userToCall, signalData, from, name }) => {
		console.log({ userToCall, from, name})
		io.to(userToCall).emit("callUser", { signal: signalData, from, name });
	});

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	});

	console.log(callers.map(ii => ii.id))
	callers.push(socket)

	socket.on("cc_provider_get_socket_ids", (data) => {
		socket.emit("cc_provider_get_socket_ids", {'callers': callers.filter(elem => elem.id !== socket.id).map(e => e.id)})
		console.log("sdfsdf")
	})

	socket.on("cc_provider", ({ id, message }) => {
		console.log(message)
		const caller = callers.find(cc => cc.id === id)
		if (!caller) {
			console.log(`caller was not found ${id}`)
		} else{
			console.log(`got message from caller: ${message}`)
		}
		callers.find(cc => cc.id === id).emit("cc_provider", { id, message })
	})
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));


