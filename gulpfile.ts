import { series, parallel, watch, src, dest } from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import { exec } from 'child_process';
import terser from 'gulp-terser';
import concat from 'gulp-concat';
import rename from 'gulp-rename';
import pug from 'gulp-pug';
import del from 'del';

function clean() {
    return del([
        'build/*.js',
        'build/*.css'
    ]);
}

export function render() {
    return src('src/pages/**/*.pug')
        .pipe(pug({
            basedir: 'src',
            locals: { date: new Date().toDateString() }
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

let build = series(clean, parallel(js, css), render);

export default build;

export function deploy() {
    return exec('npx firebase-tools deploy --only hosting', (err, stdout, stderr) => {
        if (err)
            console.log(err);
        console.log(stdout, stderr);
    });
}

export let buildAndDeploy = series(build, deploy);

export let watchFiles = series(build, _ => watch('src/**/*', build));