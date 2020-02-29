const express = require('express');
const router = express.Router();
const {HTTP_STATUS_CODE: {ACCEPTED, FAILURE}} = require('../../constants');
const producerService = require('../../services/message-producer');

router.put('/echoAtTime', async (req, res) => {
	try {
		await producerService.produceMessage(req.body);
		return res.sendStatus(ACCEPTED)
	} catch (err) {
		return res.sendStatus(FAILURE);
	}
});

router.put('/testProduceFutureMessages', (req, res) => {
	producerService.testProduceFutureMessages();
	return res.sendStatus(ACCEPTED);
});

router.put('/testProduceRecoveryMessages', (req, res) => {
	producerService.testProduceRecoveryMessages();
	return res.sendStatus(ACCEPTED);
});

module.exports = router;
