const recursive = require('recursive-readdir');
const { google } = require('googleapis');
const progress = require('cli-progress');
const fetch = require('node-fetch');
const crypto = require('crypto');
const zlib = require('zlib');
const fs = require('fs');

let secret = require('./secret.json');

function getAccessToken() {
    return new Promise((resolve, reject) => {
        let jwtClient = new google.auth.JWT(
            secret.client_email,
            null,
            secret.private_key,
            ['https://www.googleapis.com/auth/firebase'],
            null
        );
        jwtClient.authorize((err, tokens) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(tokens.access_token);
        });
    });
}

async function fetchAuth(url, method, body, type) {
    let token = await getAccessToken();
    let options = {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` }
    };

    if (type) options.headers['Content-Type'] = type;
    if (body) options.body = body;
    
    let request = await fetch(url, options);
    if (request.status !== 200) {
        throw Error(await request.text());
    } else {
        return request;
    }
}

async function fetchRest(url, body) {
    let request = await fetchAuth(url, 'POST', JSON.stringify(body));
    return request.json();
}

function createVersion(site, config) {
    // config: https://firebase.google.com/docs/hosting/reference/rest/v1beta1/sites.versions#servingconfig
    return fetchRest(`https://firebasehosting.googleapis.com/v1beta1/sites/${site}/versions`, { config: config });
}

function generateFileHash(path) {
    return new Promise(resolve => {
        let hash = crypto.createHash('sha256');
        let stream = fs.createReadStream(path).pipe(zlib.createGzip());

        stream.on('data', d => hash.update(d));
        stream.on('end', _ => resolve(hash.digest('hex')));
    });
}

function generateHashMap(path) {
    return new Promise((resolve, reject) => {
        recursive(path, (err, files) => {
            if (err) {
                reject(err);
                return;
            }

            let map = {};
            let reverseMap = {};
            for (let e of files) {
                let finalPath = e.slice(e.indexOf('/'))
                map[finalPath] = generateFileHash(e);
                map[finalPath].then(val => {
                    map[finalPath] = val;
                    reverseMap[val] = finalPath;
                });
            }

            Promise.all(Object.values(map)).then(_ => {
                resolve({
                    map: map,
                    reverse: reverseMap
                });
            });
        });
    });
}

function populateVersionFiles(version, hashMap) {
    // version: sites/site-name/versions/version-id
    return fetchRest(`https://firebasehosting.googleapis.com/v1beta1/${version}:populateFiles`, { files: hashMap });
}

async function updateStatus(version, status) {
    // version: sites/site-name/versions/version-id
    let request = await fetchAuth(
        `https://firebasehosting.googleapis.com/v1beta1/${version}?update_mask=status`,
        'PATCH',
        JSON.stringify({ status: status }),
        'application/json'
    );
    return await request.json();
}

async function createRelease(site, version) {
    // version: sites/site-name/versions/version-id
    let request = await fetchAuth(`https://firebasehosting.googleapis.com/v1beta1/sites/${site}/releases?versionName=${version}`, 'POST');
    return await request.json();
}

async function upload(site, path, forced, cb) {
    let { name } = await createVersion(site, {
        headers: [{
            glob: '**',
            headers: {
                'Cache-Control': 'max-age=86400'
            }
        }]
    });
    let maps = await generateHashMap(path);
    let { uploadRequiredHashes, uploadUrl } = await populateVersionFiles(name, maps.map);

    if (forced)
        uploadRequiredHashes = Object.values(maps.map);
    uploadRequiredHashes = uploadRequiredHashes || [];

    let bar = undefined;
    if (uploadRequiredHashes.length > 0) {
        bar = new progress.SingleBar({
            format: 'Upload progress: [{bar}] {percentage}% || {value}/{total} Files',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        }, progress.Presets.legacy);
    
        bar.start(uploadRequiredHashes.length, 0);
    }

    let requests = [];

    uploadRequiredHashes.forEach(e => {
        let request = fetchAuth(
            `${uploadUrl}/${e}`,
            'POST',
            fs.createReadStream('build' + maps.reverse[e]).pipe(zlib.createGzip()),
            'application/octet-stream'
        );

        request.then(_ => {
            if (bar) bar.increment();
        });
        
        requests.push(request);
    });

    await Promise.all(requests);
    if (bar) bar.stop();

    await updateStatus(name, 'FINALIZED');
    await createRelease(site, name);

    console.log(`${bar ? '\n' : ''}Released successfully!\nhttps://${site}.web.app/`);
    if (cb) cb();
}

module.exports = upload;