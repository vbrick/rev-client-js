/**
 * This is an example of uploading a video, based on CLI arguments
 */

import { RevClient } from '../dist/es18/rev-client.mjs'

/**
 * @import {RevClient, RevError, Rev} from '..'
 */

/** ==== initialization logic ==== */

/**
 * CLI Helper functionality
 * @param {string} arg
 * @param {string} [envKey]
 * @returns {any}
 */
function getArg(arg, envKey) {
    const idx = process.argv.indexOf(`--${arg}`);
    if (idx !== -1) {
        // return true if key is a flag (no value after it), otherwise next entry in args list
        const val = process.argv[idx + 1];
        return val && !val.startsWith('--')
            ? val
            : true;
    }
    return envKey
        ? process.env[envKey]
        : undefined;
}

/** get configuration from cli arguments or env variables */
let passedAccessToken = getArg('token', 'REV_TOKEN');

/** @type {Rev.Options} */
const revConfig = {
    url: getArg('url', 'REV_URL'),
    username: getArg('username', 'REV_USERNAME'),
    password: getArg('password', 'REV_PASSWORD'),
    apiKey: getArg('apikey', 'REV_APIKEY'),
    secret: getArg('secret', 'REV_SECRET'),
    jwtToken: getArg('jwt', 'REV_JWT'),
    // allow passing in access token directly
    ...passedAccessToken && {
        session: {
            token: passedAccessToken,
            expiration: new Date(Date.now() + 1000 * 60 * 5)
        }
    },
    // show debug messages
    logEnabled: true,
    // automatically reconnect rev session
    keepAlive: true
};
console.log(revConfig);
// show help if no configuration values passed
if (getArg('help') || !revConfig.url) {
    console.log(`
Example script of uploading a video to Rev using the API
USAGE: node test-node.js --file <path to video file> --uploader <username> [--title "video title"] --url <rev url> [...credentials]

Connect: Rev URL is required, and either username/password OR apikey/secret OR JWT OR token must be included

CLI Arg     ENV Variable
--url       REV_URL       URL of Rev Instance
--apikey    REV_APIKEY    Rev user api key
--secret    REV_SECRET    Rev user secret
--username  REV_USERNAME  Rev username
--password  REV_PASSWORD  Rev password
--jwt       REV_JWT       JWT for authentication
--token     REV_TOKEN     Rev access token

Upload: file and uploader are required if uploading

--file      REQUIRED path to video file to upload
--videoId   OPTIONAL specify video id to replace existing video instead of uploading new one
--uploader  OPTIONAL username of Rev user to associate with video (default is to use current user)
--title     OPTIONAL title of video (defaults to "api upload")

`);
    process.exit(0);
}
/** END cli helper logic */

/** MAIN processing logic */

(async () => {
    try {
        // create new instance of library with the url + credentials created above
        /** @type {RevClient} */
        const rev = new RevClient(revConfig);
        console.log('Connecting to rev...');
        // login to rev. will throw error on invalid credentials
        await rev.connect();

        if (passedAccessToken) {
            console.log('extending session for passed-in token')
        }

        console.log('Connected. Getting context');
        const [accountInfo, user] = await Promise.all([
            // gets accountId and current rev version
            rev.environment.bootstrap(),
            // gets information about current logged in user
            rev.user.details('me')
        ]);
        console.log(`Context:`, {
            ...accountInfo,
            user: {
                userId: user.userId,
                username: user.username,
                name: `${user.firstname} ${user.lastname}`.trim(),
                canUpload: user.permissions.canUpload
            }
        })

        /** get items from CLI arguments */
        const videoFilepath = getArg('file');
        const videoUploader = getArg('uploader') || user.username;
        const videoTitle = getArg('title') || 'api upload';
        let videoId = getArg('videoId') || '';

        if (!videoFilepath) {
            console.log('No file specified. Not uploading video');
            process.exit(0);
        }


        if (videoId) {
            console.log(`Replacing video ${videoId}`);

            try {
                // actually perform the upload of the file specified by 'videoFilepath'
                await rev.upload.replaceVideo(videoId, videoFilepath);

            } catch (error) {

                if (/** @type {RevError} */(error).code === 'NotReadyOrReplacingFailedOrVcFailed') {
                    console.warn('Video is still transcoding - skipping replace of video');
                } else {
                    throw error;
                }
            }
        } else {
            console.log('Uploading video');
            // actually perform the upload of the file specified by 'videoFilepath'
            videoId = await rev.upload.video(videoFilepath, {
                // this username will be the "owner" of the video. Defaults to current username (if configured)
                uploader: videoUploader,
                title: videoTitle,
                /// ...any additional metadata
                tags: ['test-upload']
            });

            console.log(`Finished uploading - video ID = ${videoId}.`);
        }

        console.log(`waiting for video to transcode`);

        const transcodeResult = await rev.video.waitTranscode(videoId, {
            onProgress(response) {
                const {overallProgress, status} = response;
                // format progress as percent 100.00
                const percentComplete = (overallProgress * 100)
                    .toFixed(1)
                    .padStart(5, ' ');

                // write current progress
                console.log(`PROCESSING: ${percentComplete}% - ${status}`);
            },
            pollIntervalSeconds: 30,
            // sanity check - timeout after one hour
            timeoutMinutes: 60
        });

        console.log(`Processing complete - video status is ${transcodeResult.status}`);

        console.log('Disconnecting from Rev');
        await rev.disconnect();
        process.exit(0);
    } catch (err) {
        console.log('ERROR!', err);
        process.exit(1);
    }
})();
