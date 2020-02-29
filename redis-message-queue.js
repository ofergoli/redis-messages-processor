const redis = require("redis");
const client = redis.createClient();
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
		this.createMockFuture();
		this.createMockRecovery();
	}

	createMockFuture() {
		const ts = new Date().getTime();
		for(let i = 8 ; i < 13 ; i++){
			var currentTime = ts + (i * 1000);
			for (let i = 0 ; i < 2 ; i++){
				this.pushMessage({ts: currentTime, message: 'OFER FUTURE MOCK ---> ' + process.pid});
			}
		}
	}

	createMockRecovery() {
		const ts = new Date().getTime();
		for(let i = 3 ; i < 10 ; i++){
			var currentTime = ts - i * 1000;
			for (let i = 0 ; i < 5 ; i++){
				this.pushMessage({ts: currentTime, message: 'OFER PAST MOCK ---> ' + process.pid});
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

	processFutureMessages() {
		const key = this.buildRedisKey(moment().format(KEY_PATTERN));
		client.multi()
			.lrange([key, 0 , -1])
			.zrem([SERVER_NOT_AVAILABLE_KEY, key])
			.del(key)
			.exec((err, results) => {
				const messages = results[0];
				if (messages.length > 0) {
					console.log('*** -----------------------> FUTURE	 messages!', messages);
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
								console.log('*** -----------------------> RECOVER messages!', list);
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
