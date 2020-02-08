const { series, parallel, watch, src, dest } = require('gulp');
const revRewrite = require('gulp-rev-rewrite');
const sourcemaps = require('gulp-sourcemaps');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const rev = require('gulp-rev');
const pug = require('gulp-pug');
const del = require('del');

const { exec } = require('child_process');
const admin = require('firebase-admin');

function clean() {
    return del([
        'build/*.js',
        'build/*.css'
    ]);
}

async function render() {
    let app = admin.initializeApp({
        databaseURL: 'https://gulp-test.firebaseio.com/',
        credential: admin.credential.cert(JSON.parse(Buffer.from(process.env.GCP_SA_KEY, 'base64').toString('ascii')))
    }, Math.random().toString());

    let db = app.database();

    return src('src/pages/**/*.pug')
        .pipe(pug({
            basedir: 'src',
            locals: (await db.ref('/').once('value')).toJSON()
        }))
        .pipe(rename({ extname: '.html' }))
        .pipe(dest('build'))
        .on('end', _ => app.delete());
}

function js() {
    return src('src/assets/*.js') // Bundle and minify all JS at site root
        .pipe(sourcemaps.init())
        .pipe(concat('bundle.js'))
        .pipe(terser())
        .pipe(sourcemaps.write())
        .pipe(rev())
        .pipe(dest('build'))
        .pipe(rev.manifest())
        .pipe(dest('build'));
}

function css() {
    return src('src/assets/*.css')
        .pipe(sourcemaps.init())
        .pipe(concat('stylesheet.css'))
        // TODO: Find a minifier that works good
        .pipe(sourcemaps.write())
        .pipe(rev())
        .pipe(dest('build'))
        .pipe(rev.manifest())
        .pipe(dest('build'));
}

function rewrite() {
    const manifest = src('build/rev-manifest.json')

    return src('build/**/*.html')
        .pipe(revRewrite({ manifest }))
        .pipe(dest('build'));
}

const build = series(clean, parallel(js, css, render), rewrite);

function deploy() {
    return exec('npx firebase-tools deploy --only hosting', (err, stdout, stderr) => {
        if (err)
            console.log(err);
        console.log(stdout, stderr);
    });
}

function watchFiles() {
    return watch('src/**/*', build);
}

function watchDB() {
    let app = admin.initializeApp({
        databaseURL: 'https://gulp-test.firebaseio.com/',
        credential: admin.credential.cert(JSON.parse(Buffer.from(process.env.GCP_SA_KEY, 'base64').toString('ascii')))
    }, Math.random().toString());

    let db = app.database();

    db.ref('/').on('value', build);
}

module.exports.render = render;
module.exports.default = build;
module.exports.deploy = deploy;
module.exports.watchFiles = watchFiles;
module.exports.watchDB = watchDB;
module.exports.watch = parallel(watchDB, watchFiles);