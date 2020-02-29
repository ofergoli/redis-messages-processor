# Moon Active - Redis Message Queue Task - Ofer Golibroda

Summery
----
I made application with nodejs that connect to redis and got the following logic:
1. Process future messages.
2. Process current or past messages. (if all of the node instances went down).

To start the project i add docker-compose.yml to the project and made for example 4 node.js process that once the project start will create 4 process of the project and one redis connected to those processes.

```
  http://localhost:5000
  http://localhost:5001
  http://localhost:5002
  http://localhost:5003
```

In order to start the
```
docker-compose build
docker-compose up
```

To stop
```
docker-compose down
```
 ***

 ### Add Message To Redis


In order to add messages to the queue use one of the following endpoint: (doesn't matter which one)

```
    PUT requset:
     http://localhost:5000/echoAtTime
     http://localhost:5001/echoAtTime
     http://localhost:5002/echoAtTime
     http://localhost:5003/echoAtTime

    body example:
        {
        	"message": "moon active message (:",
        	"ts": 1582980537300
        }
```

 Testing
----
### Future Message Mock Test

Produce messages Test Example:
```
    PUT requset:
     http://localhost:5000/testProduceFutureMessages
```

This endpoint will create 10 seconds from execution 10 messages 2 each second from within
* 10 second from execute 2 messages
* 11 second from execute 2 messages
* 12 second from execute 2 messages
* 13 second from execute 2 messages
* 14 second from execute 2 messages

### Recovery (Current or Past) Message Mock Test

In this case the messages simulate messages from the past or current that didn't proccess yet for example if all the process went down so it will proccess does messages as well.

```
    PUT requset:
     http://localhost:5000/testProduceRecoveryMessages
```

This endpoint will create 5 seconds from execution, 10 messages 2 each second from within
* 5 second from execute 2 messages (messages with current ts - 5000ms)
* 6 second from execute 2 messages (messages with current ts - 6000ms)
* 7 second from execute 2 messages (messages with current ts - 7000ms)
* 8 second from execute 2 messages (messages with current ts - 8000ms)
* 9 second from execute 2 messages (messages with current ts - 9000ms)



***


License
----

Ofer Golibroda
