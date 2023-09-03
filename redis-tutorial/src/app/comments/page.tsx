import React from 'react';
import Link from 'next/link';
import * as redis from 'redis';

const REDIS_USERNAME = process.env.REDIS_USERNAME;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

let redisClient;

const Page = async () => {
    let comments = [];

    try {
        redisClient = redis.createClient({
            url: `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`
        });

        redisClient.connect().then(() => {
            console.info(
                `NextJS Redis client connected..`
            );
        }).catch((error) => {
            console.error(`[ERROR] Couldn't connect to Redis client: ${error}`);
        });

        const commentIds = await redisClient.lRange('comments', 0, 3);

        comments = await Promise.all(
            commentIds.map(async (commentId) => {
                const details: any = await redisClient.hGetAll(`comment_details:${commentId}`);
                const tags = await redisClient.sMembers(`tags:${commentId}`);
    
                return {
                    commentId,
                    details,
                    tags,
                }
            })
        )
    } catch (error) {
        console.log({error});
    }
  return (
    <div className='flex flex-col gap-8'>
        <Link href='/'>HomePage</Link>
        {comments.map((comment) => (
            <div className='flex flex-col gap-2' key={comment.commentId}>
                <h1>{comment.details.author}</h1>
                <p>{comment.details.text}</p>
            </div>
        ))}
    </div>
  )
}

export default Page