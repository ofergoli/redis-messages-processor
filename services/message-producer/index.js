module.exports = {
	produceMessage: async message => await global.messageProducer.pushMessage(message),
	testProduceFutureMessages: () => global.messageProducer.createMockFuture(),
	testProduceRecoveryMessages: () => global.messageProducer.createMockRecovery(),
};
