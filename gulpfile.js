const { series, parallel, watch, src, dest } = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const { exec } = require('child_process');
const admin = require('firebase-admin');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const pug = require('gulp-pug');
const del = require('del');

console.log(admin.credential.applicationDefault())

admin.initializeApp({
    databaseURL: 'https://gulp-test.firebaseio.com/',
    credential: admin.credential.applicationDefault()
    // credential: admin.credential.cert(require('/Users/soren/Desktop/robotx-rewrite/secret.json'))
});

let db = admin.database();

function clean() {
    return del([
        'build/*.js',
        'build/*.css'
    ]);
}

async function render() {
    return src('src/pages/**/*.pug')
        .pipe(pug({
            basedir: 'src',
            locals: (await db.ref('/').once('value')).toJSON()
        }))
        .pipe(rename({ extname: '.html' }))
        .pipe(dest('build'));
}

function js() {
    return src('src/assets/*.js') // Bundle and minify all JS at site root
        .pipe(sourcemaps.init())
        .pipe(concat('bundle.js'))
        .pipe(terser())
        .pipe(sourcemaps.write())
        .pipe(dest('build'));
}

function css() {
    return src('src/assets/*.css')
        .pipe(sourcemaps.init())
        .pipe(concat('stylesheet.css'))
        // TODO: Find a minifier that works good
        .pipe(sourcemaps.write())
        .pipe(dest('build'));
}

const build = series(clean, parallel(js, css), render);

function deploy() {
    return exec('npx firebase-tools deploy --only hosting', (err, stdout, stderr) => {
        if (err)
            console.log(err);
        console.log(stdout, stderr);
    });
}

module.exports.render = render;
module.exports.default = build;
module.exports.deploy = deploy;
module.exports.buildAndDeploy = series(build, deploy);
module.exports.watchFiles = series(build, _ => watch('src/**/*', build));