const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const RedisMessageQueue = require('./redis-message-queue');
const PORT = process.env.PORT || '3000';
const messageProducerController = require('./controllers/message-producer');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', messageProducerController);

app.listen(PORT, () => {
	global.messageProducer = new RedisMessageQueue();
	console.log(`PROCESS WAITING FOR MESSAGES TO BE PROCESS ON PID ${process.pid} AND POST ${PORT}`);
});
