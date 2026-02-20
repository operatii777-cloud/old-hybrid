export const io = {
  to: (room: string) => ({
    emit: (event: string, data: unknown) => {
      const redisKey = `socket:emit:${room}`;
      import('./redisClient').then(({ redis }) => {
        redis.publish(redisKey, JSON.stringify({ event, data }));
      }).catch(console.error);
    }
  })
};
