import { src, dest, series, parallel, watch } from 'gulp'

import autoprefixer     from 'gulp-autoprefixer'
import babel            from 'gulp-babel'
import changed          from 'gulp-changed'
import concat           from 'gulp-concat'
import csso             from 'gulp-csso'
import data             from 'gulp-data'
import gulpif           from 'gulp-if'
import inject           from 'gulp-inject'
import htmlMin          from 'gulp-html-minifier-terser'
import plumber          from 'gulp-plumber'
import prettyHtml       from 'gulp-pretty-html'
import rename           from 'gulp-rename'
import replace          from 'gulp-replace'
import gulpSass         from 'gulp-sass'
import sassGlob         from 'gulp-sass-glob'
import svgMin           from 'gulp-svgmin'
import svgSprite        from 'gulp-svg-sprite'
import twig             from 'gulp-twig'
import uglify           from 'gulp-uglify'

import browserSync      from 'browser-sync'
import { deleteSync }   from 'del'
import * as dartSass    from 'sass'
import fs               from 'fs-extra'
import path             from 'path'
import { rollup }       from 'rollup'
import nodeResolve      from 'rollup-plugin-node-resolve'
import dotenv           from 'rollup-plugin-dotenv'

const sass = gulpSass(dartSass);


const PATHS = {
    BUILD:  './build',
    PUBLIC: './public',
    SRC:    './src'
}

const setEnvProduction = async () => {
    return process.env.NODE_ENV = 'production';
}

const setEnvDevelopment = async () => {
    return process.env.NODE_ENV = 'development';
}

let configJSON = JSON.parse(fs.readFileSync('./config.json'));

const setConfigJSON = (done) => {
    configJSON = JSON.parse(fs.readFileSync('./config.json'));
    done();
}


const copyAssetsFromBuild = async function() {

    const config = configJSON;

    if (!config)
    {
        console.log('No config.json was created to read the settings');
        return false;
    }

    if (!config['assetsCopyPath'])
    {
        console.log('No "assetsCopyPath" key/value found in config.json');
        return false;
    }

    if (!config['assetsCopyPath'].match(/[^\0]+/) || !fs.pathExistsSync(config['assetsCopyPath']))
    {
        console.log('Path to copy assets is not correct or does not exist');
    }

    console.log('Copying assets into ' + config['assetsCopyPath']);
    return src(`${PATHS.BUILD}/assets/**/*.*`).pipe(dest(config['assetsCopyPath']));

}


/*
    ---
    BROWSER SYNC:
    ---
*/

function browserSyncRun(done) {
    browserSync.init({
        server: {
            baseDir: PATHS.PUBLIC,
            index: 'index.html',
        },
        notify: false,
        port: 3000,
        ghostMode: false
    });
    done();
}


function browserSyncReload(done) {
    browserSync.reload();
    done();
}


async function cleanBuild() {
    return deleteSync(PATHS.BUILD);
}

async function cleanPublic() {
    return deleteSync([
        `${PATHS.PUBLIC}/assets/css/dev/`,
        `${PATHS.PUBLIC}/assets/css/libs.css`,
        `${PATHS.PUBLIC}/assets/css/main.css`,
        `${PATHS.PUBLIC}/assets/icons/sprite.svg`,
        `${PATHS.PUBLIC}/assets/js/dev/`,
        `${PATHS.PUBLIC}/assets/js/libs.js`,
        `${PATHS.PUBLIC}/assets/js/main.js`,
        `${PATHS.PUBLIC}/*.html`]);
}

function buildHTML() {

    return src(`${PATHS.PUBLIC}/*.html`)
        .pipe(replace(
            /<!-- Removing everything below is on your own risk -->\s*<!-- inject:css -->[\S\s]*<!-- endinject:css -->\s*<!-- Removing everything above is on your own risk -->/g,
            '<link rel="stylesheet" href="/assets/css/main.min.css">',
        ))
        .pipe(replace(
            /<!-- Removing everything below is on your own risk -->\s*<!-- inject:js -->[\S\s]*<!-- endinject:js -->\s*<!-- Removing everything above is on your own risk -->/g,
            '<script src="/assets/js/main.min.js"></script>',
        ))
        .pipe(gulpif(configJSON['assetsProductionPath'] !== '', replace(
            /(href|src|url)(=?\(?"|'|.{0,3})\/?assets/g,
            `$1$2${configJSON['assetsProductionPath']}/assets`)))
        .pipe(htmlMin({ collapseWhitespace: true, conservativeCollapse: true, removeComments: true }))
        .pipe(prettyHtml({ indent_size: 4, end_with_newline: true }))
        .pipe(dest(PATHS.BUILD))

}

function buildCSS() {

    return src([
        `${PATHS.PUBLIC}/assets/css/libs.css`,
        `${PATHS.PUBLIC}/assets/css/main.css`,
        `!${PATHS.PUBLIC}/assets/css/dev/**/*.css`], { allowEmpty: true })
        .pipe(csso())
        .pipe(concat('main.min.css'))
        .pipe(gulpif(configJSON['assetsProductionPath'] !== '', replace(
            /url\(("|')?.{0,3}\/?assets/gm,
            `url($1${configJSON['assetsProductionPath']}/assets`)))
        .pipe(dest(`${PATHS.BUILD}/assets/css/`))

}

function buildJS() {

    return src([
        `${PATHS.PUBLIC}/assets/js/libs.js`,
        `${PATHS.PUBLIC}/assets/js/main.js`,
        `!${PATHS.PUBLIC}/assets/js/dev/**/*.js`], { allowEmpty: true })
        .pipe(babel())
        .pipe(uglify())
        .pipe(concat('main.min.js'))
        .pipe(dest(`${PATHS.BUILD}/assets/js/`))

}


function buildStatic() {

    return src([
        `${PATHS.PUBLIC}/**/*.*`,
        `${PATHS.PUBLIC}/**/.*`,
        `!${PATHS.PUBLIC}/assets/css/dev/**/*.*`,
        `!${PATHS.PUBLIC}/assets/css/libs.css`,
        `!${PATHS.PUBLIC}/assets/css/main.css`,
        `!${PATHS.PUBLIC}/assets/js/dev/**/*.*`,
        `!${PATHS.PUBLIC}/assets/js/libs.js`,
        `!${PATHS.PUBLIC}/assets/js/main.js`,
        `!${PATHS.PUBLIC}/*.html`])
        .pipe(dest(PATHS.BUILD));

}


let checkChange = true;

function checkChangeOff(done) {
    checkChange = false;
    done();
}

function checkChangeOn(done) {
    checkChange = true;
    done();
}


function htmlPagesCompile() {

    return src(`${PATHS.SRC}/pages/*.twig`)
        .pipe(gulpif(checkChange, changed(PATHS.PUBLIC, { extension: '.html' })))
        .pipe(data((file) => {

            let pageJSON = `${PATHS.SRC}/pages/${path.basename(file.path)}.json`;
            if (fs.pathExistsSync(pageJSON))
            {
                pageJSON = JSON.parse(fs.readFileSync(pageJSON));
                if (pageJSON)
                {
                    return Object.assign(configJSON, pageJSON);
                }
            }

            return configJSON;

        }))
        .pipe(plumber({ handleError(err) { console.error(err); this.emit('end'); } }))
        .pipe(twig({ base: PATHS.SRC }))
        .pipe(dest(PATHS.PUBLIC))

}


function htmlPagesList() {

    return src(`${PATHS.SRC}/index.html`)
        .pipe(plumber({ handleError(err) { console.log(err); this.emit('end'); } }))
        .pipe(inject(
            src([`${PATHS.PUBLIC}/*.html`, `!${PATHS.PUBLIC}/index.html`],
                {
                    read: false
                }),
            {
                    transform: function(filepath) {
                        filepath = filepath.split('/public/').join('');
                        if (filepath.slice(-5) === '.html') {
                            return `<li><a href="${filepath}">${filepath}</a></li>`;
                        }
                        return inject.transform.apply(inject.transform, {});
                    },
                },
        ))
        .pipe(prettyHtml({ indent_size: 4, end_with_newline: true }))
        .pipe(dest(PATHS.PUBLIC));

}


function cssDev() {

    return src(`${PATHS.SRC}/bundles/css/dev/**/*.{css,scss,sass}`)
        .pipe(gulpif('**/*.{scss,sass}', sassGlob()))
        .pipe(gulpif('**/*.{scss,sass}', sass.sync().on('error', sass.logError)))
        .pipe(gulpif('**/*.{scss,sass}', autoprefixer(['last 10 versions', '> 1%', 'IE 11'], { cascade: true })))
        .pipe(dest(`${PATHS.PUBLIC}/assets/css/dev/`))
        .pipe(gulpif(process.env.NODE_ENV === 'development', browserSync.stream()))

}


function cssLibs() {

    return src(`${PATHS.SRC}/bundles/css/libs/**/*.{css,scss,sass}`)
        .pipe(gulpif('**/*.{scss,sass}', sassGlob()))
        .pipe(gulpif('**/*.{scss,sass}', sass.sync().on('error', sass.logError)))
        .pipe(gulpif('**/*.{scss,sass}', autoprefixer(['last 10 versions', '> 1%', 'IE 11'], { cascade: true })))
        .pipe(concat('libs.css'))
        .pipe(dest(`${PATHS.PUBLIC}/assets/css/`))
        .pipe(gulpif(process.env.NODE_ENV === 'development', browserSync.stream()))

}


function cssMain() {

    return src(`${PATHS.SRC}/bundles/css/main.scss`)
        .pipe(sassGlob())
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(autoprefixer(['last 10 versions', '> 1%', 'IE 11'], { cascade: true }))
        .pipe(dest(`${PATHS.PUBLIC}/assets/css/`))
        .pipe(gulpif(process.env.NODE_ENV === 'development', browserSync.stream()))

}

function jsDev() {

    return src(`${PATHS.SRC}/bundles/js/dev/**/*.js`)
        .pipe(dest(`${PATHS.PUBLIC}/assets/js/dev/`))

}

function jsLibs() {

    return src(`${PATHS.SRC}/bundles/js/libs/**/*.js`)
        .pipe(concat('libs.js'))
        .pipe(dest(`${PATHS.PUBLIC}/assets/js/`))

}

function jsMain() {

    return rollup({
            input: `${PATHS.SRC}/bundles/js/main.js`,
            plugins: [nodeResolve(), dotenv()]
        })
        .then(bundle => {
            return bundle.write({
                file: `${PATHS.PUBLIC}/assets/js/main.js`,
                format: 'iife',
                sourcemap: false
            });
        });

}


function bundleIcons() {

    return src(`${PATHS.SRC}/bundles/icons/*.svg`)
        .pipe(plumber({ handleError(err) { console.log(err); this.emit('end'); } }))
        .pipe(svgMin({ fill: false, js2svg: { pretty: true }} ))
        .pipe(replace(/fill="[^"]+"/gm, 'fill="currentColor"'))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({ mode: { symbol: { sprite: '../sprite.svg' } } }))
        .pipe(dest(`${PATHS.PUBLIC}/assets/icons/`));

}


const html          = series(htmlPagesCompile, htmlPagesList);
const bundleCSS     = parallel(cssDev, cssLibs, cssMain);
const bundleJS      = parallel(jsDev, jsLibs, jsMain);

const srcToPublic   = series(cleanPublic, parallel(html, bundleCSS, bundleJS, bundleIcons));


function watchFiles() {

    /* watch components and layouts to recompile pages only */
    watch(`${PATHS.SRC}/{components,layouts}/**/*.twig`, series(checkChangeOff, htmlPagesCompile, checkChangeOn, browserSyncReload));

    /* watch add for pages to update links to all and compile, watch unlink to update links only */
    watch(`${PATHS.SRC}/pages/*.twig`, { events: 'change' }, series(htmlPagesCompile, browserSyncReload));
    watch(`${PATHS.SRC}/pages/*.twig`, { events: 'add' }, series(html, browserSyncReload));
    watch(`${PATHS.SRC}/pages/*.twig`, { events: 'unlink' }, series(htmlPagesList, browserSyncReload));

    /* watch config.json and PAGES.twig.json */
    watch(['./config.json', `${PATHS.SRC}/pages/*.twig.json`], { events: 'all' }, series(setConfigJSON, checkChangeOff, htmlPagesCompile, checkChangeOn, browserSyncReload));

    /* watch scss - browser stream sets inside tasks */
    watch(`${PATHS.SRC}/bundles/css/dev/**/*.{css,scss,sass}`, cssDev);
    watch(`${PATHS.SRC}/bundles/css/libs/**/*.{css,scss,sass}`, cssLibs);
    watch([`${PATHS.SRC}/bundles/css/*.scss`, `${PATHS.SRC}/{components,layouts,pages}/**/*.scss`], cssMain);

    /* watch js */
    watch(`${PATHS.SRC}/bundles/js/dev/**/*.js`, series(jsDev, jsMain, browserSyncReload));
    watch(`${PATHS.SRC}/bundles/js/libs/**/*.js`, series(jsLibs, jsMain, browserSyncReload));
    watch([`${PATHS.SRC}/bundles/js/*.js`, `${PATHS.SRC}/{components,layouts,pages}/**/*.js`], series(jsMain, browserSyncReload));

    /* watch icons – no need to reload browser */
    watch(`${PATHS.SRC}/bundles/icons/*.svg`, series(bundleIcons));

}

export const dev        = series(setEnvDevelopment, srcToPublic, browserSyncRun, watchFiles);
export const build      = series(setEnvProduction, srcToPublic, cleanBuild, parallel(buildHTML, buildCSS, buildJS, buildStatic));
export const copyAssets = copyAssetsFromBuild;
copyAssets.displayName  = 'copy-assets';
