import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import * as redis from 'redis';

const REDIS_USERNAME = process.env.REDIS_USERNAME;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

let redisClient;

export const POST = async (req: NextRequest) => {
    try {
        redisClient = redis.createClient({
            url: `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`
        });

        await redisClient.connect().then(() => {
            console.info(
                `NextJS Redis client connected..`
            );
        }).catch((error) => {
            console.error(`[ERROR] Couldn't connect to Redis client: ${error}`);
        });


        const body = await req.json();
        const {text, tags} = body;

        const commentId = nanoid();
        
        const comment = {
            text,
            tags,
            upvotes: 0,
            timestamp: new Date().toString(),
            author: req.cookies.get('userId')?.value,
        }

        // await Promise.all([
        //     redisClient.rPush('comments', commentId),   // add comment to list
        //     redisClient.sAdd(`tags:${commentId}`, tags), // add tags to comment
        //     // sets -> holds unique values - no duplicates - always unique
        //     Object.entries(comment).forEach(async ([field, value]) => {
        //         redisClient.hSet(`comment_details:${commentId}`, field, value);
        //     }), // retrieve & store the comment details
        // ])
        console.log({comment})

        // await redisClient.json.numIncrBy('comment:djKxQ4LIgRCSMBRIC7E8g', '$.upvotes')
        await Promise.all([
            redisClient.rPush('comments', commentId),
            // redisClient.json.SET(`comment:${commentId}`, '$', JSON.stringify(comment))
            // wasn't able to work above
            redisClient.set(`comment:${commentId}`, JSON.stringify(comment))
        ]);

        return new Response('OK');
    } catch (error) {
        console.log({error});
    }
}
