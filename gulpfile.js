const { series, parallel, watch, src, dest } = require('gulp');
const { replace } = require('gulp-inject-string');
const revRewrite = require('gulp-rev-rewrite');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const admin = require('firebase-admin');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const through = require('through2');
const deploy = require('./deploy');
const sass = require('gulp-sass');
const rev = require('gulp-rev');
const pug = require('gulp-pug');
const del = require('del');
const fs = require('fs');

let secret = require('./secret.json');

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
        credential: admin.credential.cert(secret)
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
        .pipe(terser())
        // .pipe(rev())
        .pipe(sourcemaps.write('.'))
        // .pipe(dest('build'))
        // .pipe(rev.manifest('build/rev-manifest.json', { base: process.cwd() + '/build', merge: true }))
        .pipe(dest('build'));
}

function css() {
    return src('src/assets/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('stylesheet.css'))
        .pipe(cleanCSS())
        // .pipe(rev())
        .pipe(sourcemaps.write('.'))
        // .pipe(dest('build'))
        // .pipe(rev.manifest('build/rev-manifest.json', { base: process.cwd() + '/build', merge: true }))
        .pipe(dest('build'));
}

function images() {
    return src('src/assets/images/*')
        .pipe(imagemin())
        .pipe(dest('build'));
}

function rewrite() {
    const manifest = src('build/rev-manifest.json');

    return src('build/**/*.html')
        .pipe(revRewrite({ manifest }))
        .pipe(through.obj((file, enc, cb) => {
            if ((file.isBuffer() || file.isStream()) && file.contents.length == 0) {
                console.log(file.path + ' is empty');
                cb(null, file);
                return;
            }
            cb(null, file);
        }))
        .pipe(dest('build'));
}

const build = parallel(series(clean, parallel(js, css, render)/* , rewrite */), images);

function deploySite(cb) {
    deploy('gulp-test', 'build', false, cb);
}

function watchFiles() {
    return watch('src/**/*', build);
}

function watchDB() {
    let app = admin.initializeApp({
        databaseURL: 'https://gulp-test.firebaseio.com/',
        credential: admin.credential.cert(secret)
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