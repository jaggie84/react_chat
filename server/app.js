const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const app = express();
const PORT = process.env.PORT || 3000;
	app.set("port", PORT);

app.use(express.static('build'));

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

const users = [];
const broadcast = (data, ws) => {
	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN && client !== ws ) { 
			client.send(JSON.stringify(data));
		}
	});
};

wss.on('connection', (ws) => {
	let index;
	ws.on('message', (message) => {
		const data = JSON.parse(message);
		switch (data.type) {
			case 'ADD_USER': {
				index = users.length;
				users.push({ name: data.name, id: index + 1});
				ws.send(JSON.stringify({
					type: 'USERS_LIST',
					users
				}));
				broadcast({
					type: 'USERS_LIST',
					users
				}, ws);
				break;
			}
			case 'ADD_MESSAGE':
				broadcast({
					type: 'ADD_MESSAGE',
					message: data.message,
					author: data.author
				}, ws);
				break;
			default:
				break;
		}
	});

	ws.on('close', () => {
		users.splice(index, 1);
		broadcast({
			type: 'USERS_LIST',
			users
		}, ws);
	});
});

app.get('*', function(req, res, next){
	res.sendFile(__dirName + "/build/index.html");
});

server.listen(PORT, function(){
	console.log("\n\n===== listening for requests on port " + PORT + " =====\n\n");
});
