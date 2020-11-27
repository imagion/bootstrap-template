const { series, parallel, dest, src, watch } = require( 'gulp' );

// CSS plugins
const autoprefixer       = require( 'gulp-autoprefixer' );
const sass               = require( 'gulp-sass' );
const cleancss           = require( 'gulp-clean-css' );
const purgecss           = require( 'gulp-purgecss' );
const postcss            = require( 'gulp-postcss' );
const postcssPresetEnv   = require( 'postcss-preset-env' );
const postcssShort       = require( 'postcss-short' );

//JS plugins
const babel              = require( 'gulp-babel' );
const uglify             = require( 'gulp-uglify' );

// Utility plugins
const browserSync        = require( 'browser-sync' ).create();
const concat             = require( 'gulp-concat' );
const plumber            = require( 'gulp-plumber' );
const imagemin           = require( 'gulp-imagemin' );
const pngquant           = require( 'imagemin-pngquant' );
const mozjpeg            = require( 'imagemin-mozjpeg' );
const webp               = require( 'imagemin-webp' );
const newer              = require( 'gulp-newer' );
const rename             = require( 'gulp-rename' );
const del                = require( 'del' );
const rsync              = require( 'gulp-rsync' );

let fileswatch = 'html,htm,txt,json,md,woff2'; // List of files extensions for watching & hard reload (comma separated)
let imageswatch = 'jpg,jpeg,png,webp,svg'; // List of images extensions for watching & compression (comma separated)
let baseDir = 'app'; // Base dir path without «/» at the end
let online = true; // If «false» - Browsersync will work offline without internet connection

let paths = {
    plugins: {
        src: [
            baseDir + '/vendor/jquery/jquery.min.js',
            // baseDir + '/vendor/modernizr/modernizr-custom.js',
            // baseDir + '/vendor/slick/slick/slick.min.js',
            // baseDir + '/vendor/slick-lightbox/slick-lightbox.min.js',
            // baseDir + '/vendor/aos/dist/aos.js',
        ]
    },
    userscripts: {
        src: [
            baseDir + '/js/app.js',
        ]
    },
    styles: {
        src: baseDir + '/scss/app.scss',
        dest: baseDir + '/css',
    },
    images: {
        src: baseDir + '/img/src/**/*',
        dest: baseDir + '/img/dest',
    },
    deploy: {
        hostname: 'username@yousite.com', // Deploy hostname
        destination: 'yousite/public_html/', // Deploy destination
        include: [ /* '*.htaccess' */], // Included files to deploy
        exclude: [ '**/Thumbs.db', '**/*.DS_Store' ], // Excluded files from deploy
    },
    jsOutputName: 'app.min.js',
    cssOutputName: 'app.min.css',
}

function browsersync() {
    browserSync.init( {
        server: {
            baseDir: baseDir + '/'
        },
        open: false,
        notify: false,
        online: online
    } );
}

function plugins() {
    if ( paths.plugins.src != '' ) {
        return src( paths.plugins.src )
            .pipe( concat( 'plugins.tmp.js' ) )
            .pipe( dest( baseDir + '/js/_tmp' ) )
    } else {
        async function createFile() {
            require( 'fs' ).writeFileSync( baseDir + '/js/_tmp/plugins.tmp.js', '' );
        };
        return createFile();
    }
}

function userscripts() {
    return src( paths.userscripts.src )
        .pipe( babel( {
            presets: [ '@babel/env' ]
        } ) )
        .pipe( concat( 'userscripts.tmp.js' ) )
        .pipe( dest( baseDir + '/js/_tmp' ) )
}

function scripts() {
    return src( [
            baseDir + '/js/_tmp/plugins.tmp.js',
            baseDir + '/js/_tmp/userscripts.tmp.js'
        ] )
        .pipe( plumber() )
        .pipe( concat( paths.jsOutputName ) )
        .pipe( uglify() )
        .pipe( dest( baseDir + '/js' ) )
}

function styles() {
    let plugins = [
        postcssPresetEnv( { stage: 2 } ),
        postcssShort( { skip: 'x' } ),
    ]
    return src( paths.styles.src )
        .pipe( plumber() )
        .pipe( sass( { outputStyle: 'expand' } ).on( 'error', sass.logError ) )
        .pipe( postcss( plugins ) )
        .pipe( concat( paths.cssOutputName ) )
        .pipe( autoprefixer( { grid: 'autoplace' } ) )
        .pipe( purgecss( {
            content: [ baseDir + '/*.html' ],
            css: [ paths.styles.src ],
            variables: true,
            keyframes: true,
        } ) )
        .pipe( cleancss( { level: { 1: { specialComments: 0, } } } ) )
        .pipe( dest( paths.styles.dest ) )
        .pipe( browserSync.stream() )
}

function images() {
    return src( paths.images.src )
        .pipe( newer( paths.images.dest ) )
        .pipe( imagemin( [
            pngquant( { quality: [ 0.5, 0.5 ] } ),
            mozjpeg( {  quality: 60 } )
        ] ) )
        .pipe( dest( paths.images.dest ) )
}
function imgWebp() {
    return src( paths.images.src + '.{jpg,png}' )
        .pipe( imagemin( [
            webp( { quality: 60 } )
        ] ) )
        .pipe( rename( { extname: '.webp' } ) )
        .pipe( dest( paths.images.dest ) )
}

function cleanimg() {
    return del( '' + paths.images.dest + '/**/*', { force: true } )
}

function deploy() {
    return src( baseDir + '/' )
        .pipe( rsync( {
            root: baseDir + '/',
            hostname: paths.deploy.hostname,
            destination: paths.deploy.destination,
            include: paths.deploy.include,
            exclude: paths.deploy.exclude,
            recursive: true,
            archive: true,
            silent: false,
            compress: true
        } ) )
}

function startwatch() {
    watch( baseDir + '/**/scss/**/*', { usePolling: true }, styles );
    watch( baseDir + '/**/*.{' + imageswatch + '}', { usePolling: true }, images );
    watch( baseDir + '/**/*.{' + fileswatch + '}', { usePolling: true } ).on( 'change', browserSync.reload );
    watch( [ baseDir + '/js/**/*.js', '!' + baseDir + '/js/**/*.min.js', '!' + baseDir + '/js/**/*.tmp.js' ], { usePolling: true }, series( plugins, userscripts, scripts ) ).on( 'change', browserSync.reload );
}

exports.browsersync = browsersync;
exports.scripts     = series( plugins, userscripts, scripts );
exports.assets      = series( cleanimg, styles, plugins, userscripts, scripts, images, imgWebp );
exports.styles      = styles;
exports.images      = images;
exports.cleanimg    = cleanimg;
exports.deploy      = deploy;
exports.default     = parallel( plugins, userscripts, scripts, images, imgWebp, styles, parallel( browsersync, startwatch ) );