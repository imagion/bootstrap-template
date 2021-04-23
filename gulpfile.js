const { series, parallel, dest, src, watch } = require('gulp');
const autoprefixer   = require('gulp-autoprefixer');
const browserSync    = require('browser-sync').create();
const bssi           = require('browsersync-ssi');
const cleancss       = require('gulp-clean-css');
const del            = require('del');
const imagemin       = require('gulp-imagemin');
const newer          = require('gulp-newer');
const purgecss       = require('gulp-purgecss');
const rename         = require('gulp-rename');
const rsync          = require('gulp-rsync');
// const sass           = require('gulp-sass');
const sass           = require('gulp-dart-sass');
const sassglob       = require('gulp-sass-glob');
const ssi            = require('ssi');
const webpack        = require('webpack-stream');

function browsersync() {
    browserSync.init({
        server: {
            baseDir: 'app/',
            middleware: bssi({ baseDir: 'app/', ext: '.html' })
        },
        ghostMode: { clicks: false },
        notify: false,
        online: true,
        open: false,
        // tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
    })
}

function scripts() {
    return src(['app/js/*.js', '!app/js/*.min.js'])
        .pipe(webpack({
            mode: 'production',
            performance: { hints: false },
            module: {
                rules: [
                    {
                        test: /\.(js)$/,
                        exclude: /(node_modules)/,
                        loader: 'babel-loader',
                        query: {
                            presets: ['@babel/env'],
                            plugins: ['babel-plugin-root-import']
                        }
                    }
                ]
            }
        })).on('error', function handleError() {
            this.emit('end')
        })
        .pipe(rename('app.min.js'))
        .pipe(dest('app/js'))
        .pipe(browserSync.stream())
}

function styles() {
    return src([`app/sass/*.*`, `!app/sass/_*.*`])
        .pipe(eval(`sassglob`)())
        .pipe(eval(sass)())
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
        .pipe(cleancss({ level: { 1: { specialComments: 0 } },/* format: 'beautify' */ }))
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest('app/css'))
        .pipe(browserSync.stream())
}

function images() {
    return src(['app/img/src/**/*'])
        .pipe(newer('app/img/'))
        .pipe(imagemin())
        .pipe(dest('app/img/'))
        .pipe(browserSync.stream())
}

function buildcopy() {
    return src([
        '{app/js,app/css}/*.min.*',
        'app/img/**/*.*', '!app/img/src/**/*',
        'app/fonts/**/*'
    ], { base: 'app/' })
        .pipe(dest('dist'))
}

async function buildhtml() {
    let includes = new ssi('app/', 'dist/', '/**/*.html')
    includes.compile()
    del('dist/parts', { force: true })
}

function purge() {
  return src([`dist/css/*.*`])
    .pipe(purgecss({
      content: [ 'dist/*.html' , 'dist/*.js'],
      // css: [ `app/sass/*.*`, `!app/sass/_*.*` ],
      variables: true,
      keyframes: true,
      safelist: []
    }))
    .pipe(dest('dist/css'))
}

function cleandist() {
    return del('dist/**/*', { force: true })
}

function deploy() {
    return src('dist/')
        .pipe(rsync({
            root: 'dist/',
            hostname: 'username@yousite.com',
            destination: 'yousite/public_html/',
            // clean: true, // Mirror copy with file deletion
            include: [/* '*.htaccess' */], // Included files to deploy,
            exclude: ['**/Thumbs.db', '**/*.DS_Store'],
            recursive: true,
            archive: true,
            silent: false,
            compress: true
        }))
}

function startwatch() {
    watch('app/sass/**/*', { usePolling: true }, styles)
    watch(['app/js/**/*.js', '!app/js/**/*.min.js'], { usePolling: true }, scripts)
    watch('app/images/src/**/*.{jpg,jpeg,png,webp,svg,gif}', { usePolling: true }, images)
    watch('app/**/*.{html,htm,txt,json,md,woff2}', { usePolling: true }).on('change', browserSync.reload);
}

exports.scripts = scripts
exports.styles = styles
exports.images = images
exports.deploy = deploy
exports.assets = parallel(scripts, styles, images)
exports.build = series(cleandist, parallel(scripts, styles, images), buildcopy, buildhtml, purge)
exports.default = series(parallel(scripts, styles, images), parallel(browsersync, startwatch))
