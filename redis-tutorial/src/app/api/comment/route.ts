import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import * as redis from 'redis';
import { createClient } from "redis";

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

        redisClient.connect().then(() => {
            console.info(
                `NextJS Redis client connected..`
            );
        }).catch((error) => {
            console.error(`[ERROR] Couldn't connect to Redis client: ${error}`);
        });


        const body = await req.json();
        const {text, tags} = body;

        const commentId = nanoid();
        // add comment to list
        await redisClient.rPush('comments', commentId);

        // add tags to comment
        await redisClient.sAdd(`tags:${commentId}`, tags);
        // sets -> holds unique values - no duplicates - always unique

        // retrieve & store the comment details
        const comment = {
            text,
            timestamp: new Date().toString(),
            author: req.cookies.get('userId')?.value,
        }
        Object.entries(comment).forEach(async ([field, value]) => {
            await redisClient.hSet(`comment_details:${commentId}`, field, value);
        })
        

        return new Response('OK');
    } catch (error) {
        console.log({error});
    }
}
