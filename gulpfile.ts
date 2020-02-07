import { series, parallel, watch, src, dest } from 'gulp';
import rename from 'gulp-rename';
import pug from 'gulp-pug';

export function render() {
    return src('src/pages/**/*.pug')
        .pipe(pug({ basedir: 'src', locals: {
            date: new Date().toDateString()
        } }))
        .pipe(rename({ extname: '.html' }))
        .pipe(dest('build'))
}

export function watchFiles() {
    render()
    return watch('src/**/*', render)
}

export default render;