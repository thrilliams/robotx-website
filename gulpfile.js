const { series, parallel, watch, src, dest } = require('gulp');
const revRewrite = require('gulp-rev-rewrite');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const admin = require('firebase-admin');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const deploy = require('./deploy');
const rev = require('gulp-rev');
const pug = require('gulp-pug');
const del = require('del');

function clean() {
    return del([
        'build/**/*.js',
        'build/**/*.js.map',
        'build/**/*.css',
        'build/**/*.css.map'
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
    return src('src/assets/*.js')
        .pipe(sourcemaps.init())
        .pipe(concat('bundle.js'))
        // .pipe(src(['src/assets/**/*.js', '!src/assets/*.js']))
        .pipe(terser())
        .pipe(rev())
        .pipe(sourcemaps.write('.'))
        .pipe(dest('build'))
        .pipe(rev.manifest('build/rev-manifest.json', { base: process.cwd() + '/build', merge: true }))
        .pipe(dest('build'));
}

function css() {
    return src('src/assets/*.css')
        .pipe(sourcemaps.init())
        .pipe(concat('stylesheet.css'))
        // .pipe(src(['src/assets/**/*.css', '!src/assets/*.css']))
        .pipe(cleanCSS())
        .pipe(rev())
        .pipe(sourcemaps.write('.'))
        .pipe(dest('build'))
        .pipe(rev.manifest('build/rev-manifest.json', { base: process.cwd() + '/build', merge: true }))
        .pipe(dest('build'));
}

function rewrite() {
    const manifest = src('build/rev-manifest.json');

    return src('build/**/*.html')
        .pipe(revRewrite({ manifest }))
        .pipe(dest('build'));
}

const build = series(clean, js, css, render, rewrite);

function deploySite(cb) {
    deploy('gulp-test', 'build', false, cb);
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
module.exports.deploy = deploySite;
module.exports.buildAndDeploy = series(build, deploySite);
module.exports.watchFiles = watchFiles;
module.exports.watchDB = watchDB;
module.exports.watch = parallel(watchDB, watchFiles);