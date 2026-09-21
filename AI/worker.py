import os
from redis import Redis
from rq import Worker, SimpleWorker, Queue
from config import REDIS_URL

listen = ['default']

conn = Redis.from_url(REDIS_URL)

if __name__ == '__main__':
    # Use SimpleWorker on Windows because os.fork() does not exist
    worker_class = SimpleWorker if os.name == 'nt' else Worker
    worker = worker_class(listen, connection=conn)
    worker.work()
