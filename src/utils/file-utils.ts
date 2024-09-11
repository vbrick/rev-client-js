
export const mimeTypes = {
    '.7z': 'application/x-7z-compressed',
    '.asf': 'video/x-ms-asf',
    '.avi': 'video/x-msvideo',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.f4v': 'video/x-f4v',
    '.flv': 'video/x-flv',
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.m4a': 'audio/mp4',
    '.m4v': 'video/x-m4v',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.mpg': 'video/mpeg',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.rar': 'application/x-rar-compressed',
    '.srt': 'application/x-subrip',
    '.svg': 'image/svg+xml',
    '.swf': 'application/x-shockwave-flash',
    '.ts': 'video/mp2t',
    '.txt': 'text/plain',
    '.wmv': 'video/x-ms-wmv',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.mks': 'video/x-matroska',
    '.mts': 'model/vnd.mts',
    '.vtt': 'text/vtt',
    '.wma': 'audio/x-ms-wma'
};

export function getMimeForExtension(extension: string = '', defaultType = 'video/mp4') {
    extension = extension.toLowerCase();
    if (extension && (extension in mimeTypes)) {
        return mimeTypes[extension as keyof typeof mimeTypes];
    }
    return defaultType;
}

export function getExtensionForMime(contentType: string, defaultExtension = '.mp4') {
    const match = contentType && Object.entries(mimeTypes)
        .find(([ext, mime]) => contentType.startsWith((mime)));
    return match
        ? match[0]
        : defaultExtension;

}

export function sanitizeUploadOptions(filename = 'upload', contentType = '', defaultContentType?: string) {
    // sanitize content type
    if (contentType === 'application/octet-stream') {
        contentType = '';
    }
    if (/charset/.test(contentType)) {
        contentType = contentType.replace(/;?.*charset.*$/, '');
    }
    let name = filename.replace(/\.[^\.]+$/, '');
    let ext = filename.replace(name, '');
    if (!ext) {
        ext = getExtensionForMime(contentType || defaultContentType || '');
    }

    filename = `${name}${ext}`;

    // extra check for transcription filetype
    if (!contentType || ['.vtt', '.srt'].includes(ext)) {
        contentType = getMimeForExtension(ext, defaultContentType);
    }


    return { filename, contentType };
}

