const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const RedisMessageQueue = require('./redis-message-queue');
const PORT = process.env.PORT || '3003';

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.put('/echoAtTime', async (req, res) => {
	try {
		await global.messageProducer.pushMessage(req.body);
		return res.send('ok');
	} catch (err) {
		return res.sendStatus(400);
	}
});

app.listen(PORT, () => {
	global.messageProducer = new RedisMessageQueue();
	console.log('Server is up ', PORT);
});
