import { RevClient } from '../dist/rev-client.js';

let rev;

window.getRev = () => rev;

document.querySelector('#test_upload')
    .addEventListener('click', event => {
        event.preventDefault();
        uploadForm(document.getElementById('upload_form'));
        return false;
    });

/**
 *
 * @param {HTMLInputElement} el
 * @returns {[string, string | boolean | FileList | any]}
 */
function fieldToEntry(el) {
    const value = el.type === 'file'
        ? el.files
        : el.type === 'checkbox'
            ? el.checked
            : el.value;
    return [el.name, value];
}

function createRevInstance() {
    const el = document.getElementById('credentials');
    const revConfig = Object.fromEntries([...el.elements].map(fieldToEntry));
    rev = new RevClient(revConfig);
    return rev;
}

/**
 *
 * @param {HTMLFormElement} form
 */
async function uploadForm(form) {
    if (!rev) {
        console.log('Creating Rev Instance');
        rev = createRevInstance();
    }
    if (!rev.isConnected) {
        console.log('connecting!');
        await rev.connect();
        console.log(`Connected. Session expires: ${rev.sessionExpires.toLocaleTimeString()}`);
    }
    /** @type {any[]} */
    const fields = [...form.elements];
    const {
        file: fileList,
        ...metadata
    } = Object.fromEntries(fields
        .map(fieldToEntry)
    );
    for (let key of ['tags', 'categories', 'categoryIds']) {
        const val = metadata[key]
        if (typeof val === 'string') {
            metadata[key] = val
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
        }
    }
    const [file] = fileList;

    console.log('uploading!');
    const videoId = await rev.upload.video(file, metadata);
    console.log('complete!', videoId);
    window.videoId = videoId;
}
