/**
 * This is an example of uploading a video, based on CLI arguments
 */
const { RevClient } = require('..');
// import {RevClient} from '..'

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
/** @type {import('../dist/rev-client').Rev.Options} */
const revConfig = {
    url: getArg('url', 'REV_URL'),
    username: getArg('username', 'REV_USERNAME'),
    password: getArg('password', 'REV_PASSWORD'),
    apiKey: getArg('apikey', 'REV_APIKEY'),
    secret: getArg('secret', 'REV_SECRET'),
    // show debug messages
    logEnabled: true,
    // automatically reconnect rev session
    keepAlive: true
};

/** get items from CLI arguments */
const videoFilepath = getArg('file');
const videoUploader = getArg('uploader') || revConfig.username;
const videoTitle = getArg('title') || 'api upload';

// show help if no configuration values passed
if (getArg('help') || !revConfig.url || !videoFilepath || !videoUploader) {
    console.log(`
Example script of uploading a video to Rev using the API
USAGE: node test-node.js --file <path to video file> --uploader <username> [--title "video title"] --url <rev url> [...credentials]

Connect: Rev URL is required, and either username/password OR apikey/secret must be included

CLI Arg     ENV Variable
--url       REV_URL       URL of Rev Instance
--apikey    REV_APIKEY    Rev user api key
--secret    REV_SECRET    Rev user secret
--username  REV_USERNAME  Rev username
--password  REV_PASSWORD  Rev password

Upload: file and uploader are required

--file      REQUIRED path to video file to upload
--uploader  REQUIRED username of Rev user to associate with video (can be same as --username value)
--title     OPTIONAL title of video (defaults to "api upload")

	`);
    process.exit(0);
}
/** END cli helper logic */

/** MAIN processing logic */

(async () => {
    try {
        // create new instance of library with the url + credentials created above
        const rev = new RevClient(revConfig);
        console.log('Connecting to rev...');
        // login to rev. will throw error on invalid credentials
        await rev.connect();
        console.log('Connected. Uploading video');

        // actually perform the upload of the file specified by 'videoFilepath'
        const videoId = await rev.upload.video(videoFilepath, {
            // this username will be the "owner" of the video. Defaults to current username (if configured)
            uploader: videoUploader,
            title: videoTitle
            /// ...any additional metadata
        });

        console.log(`Finished uploading - video ID = ${videoId}. Now waiting for video to transcode`);

        // sanity check - timeout after one hour
        let timeoutDate = Date.now() + (60 * 1000 * 60);
        // check for status every 30 seconds
        const pollInterval = 30 * 1000;

        let videoStatus;
        while (Date.now() < timeoutDate) {
            // call video status API
            let {
                isProcessing,
                overallProgress = 0,
                status
            } = await rev.video.status(videoId);

            videoStatus = status;

            // processing is initially false, so wait till overallProgress changes to complete
            if ((overallProgress === 1 && !isProcessing) || status === 'ProcessingFailed') {
                // finished, break out of loop
                break;
            }

            // format progress as percent 100.00
            const percentComplete = (overallProgress * 100)
                .toFixed(1)
                .padStart(5, ' ');

            // write current progress
            console.log(`PROCESSING: ${percentComplete}% - ${status}`);

            // sleep 30 seconds before checking again
            await new Promise(done => setTimeout(done, pollInterval));
        }


        console.log(`Processing complete - video status is ${videoStatus}`);

        console.log('Disconnecting from Rev');
        await rev.disconnect();

    } catch (err) {
        console.log('ERROR!', err);
    }
})();
