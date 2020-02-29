const redis = require("redis");
const client = redis.createClient({
	host: process.env.REDIS_URL,
});
const crypto = require('crypto');
const moment = require('moment');
const CronJob = require('cron').CronJob;

const {
	KEY_PATTERN,
	CRON_EVERY_SECOND,
	TIMEZONE,
	SERVER_NOT_AVAILABLE_KEY,
} = require('./constants');

class RedisMessageQueue {

	constructor() {
		this.createProcessMessagesCron();
		this.createRecoveryProcessMessagesCron();
	}

	createMockFuture() {
		const ts = new Date().getTime();
		for(let i = 10 ; i < 15 ; i++){
			var currentTime = ts + (i * 1000);
			for (let i = 0 ; i < 2 ; i++){
				this.pushMessage({ts: currentTime, message: 'FUTURE MOCK ---> process id is:' + process.pid});
			}
		}
	}

	createMockRecovery() {
		const ts = new Date().getTime();
		for(let i = 3 ; i < 10 ; i++){
			var currentTime = ts - i * 1000;
			for (let i = 0 ; i < 2 ; i++){
				this.pushMessage({ts: currentTime, message: 'PAST MOCK ---> process id is:' + process.pid});
			}
		}
	}

	buildRedisKey(ts) {
		const shasum = crypto.createHash('sha1');
		shasum.update(ts);
		return shasum.digest('hex');
	}

	pushMessage({ ts, message }) {
		return new Promise((resolve, reject) => {
			const key = this.buildRedisKey(moment(ts).format(KEY_PATTERN));
			client
				.multi()
				.lpush(key, message)
				.zadd([SERVER_NOT_AVAILABLE_KEY, ts, key])
				.exec(err => {
					if (err) {
						return reject(err);
					}
					return resolve();
				});
		});
	}

	printFutureMessages(messages) {
		for(let message of messages) {
			console.log('FUTURE message:', message);
		}
	}

	printRecoveryMessages(messages) {
		for(let message of messages) {
			console.log('Recovery message:', message);
		}
	}

	processFutureMessages() {
		const key = this.buildRedisKey(moment().format(KEY_PATTERN));
		client.multi()
			.lrange([key, 0 , -1])
			.zrem([SERVER_NOT_AVAILABLE_KEY, key])
			.del(key)
			.exec((err, results) => {
				const messages = results[0];
				if (messages.length > 0) {
					this.printFutureMessages(messages);
				}
			})
	}

	messageRecoveryProcessing() {
		const current = moment().valueOf();
		client.multi()
			.zrevrangebyscore([SERVER_NOT_AVAILABLE_KEY, current, 0])
			.del(SERVER_NOT_AVAILABLE_KEY)
			.exec((err, results) => {
				const pastListsIds = results[0];
				if (pastListsIds.length > 0) {
					const fetchResults = client.multi();
					pastListsIds.forEach(key => {
						fetchResults.lrange(key, 0, -1);
						fetchResults.del(key);
					});
					fetchResults.exec((err, lists) => {
						lists.forEach(list => {
							if (list.length && list.length > 0) {
								this.printRecoveryMessages(list);
							}
						})
					});
				}
			});
	}

	createProcessMessagesCron() {
		var job = new CronJob(CRON_EVERY_SECOND, this.processFutureMessages.bind(this), null, true, TIMEZONE);
		job.start();
	}

	createRecoveryProcessMessagesCron() {
		var job = new CronJob(CRON_EVERY_SECOND, this.messageRecoveryProcessing.bind(this), null, true, TIMEZONE);
		job.start();
	}
}

module.exports = RedisMessageQueue;
