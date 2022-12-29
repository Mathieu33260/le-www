// webpack.config.js
const Encore = require("@symfony/webpack-encore");
const { VueLoaderPlugin } = require("vue-loader");
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const isReport = process.env.BUNDLE_REPORT === "true";
const generateLegacy = process.env.LEGACY_BUNDLE === "true";

const fileNamesRule = Encore.isProduction() ? '[name].[contenthash].js' : '[name].js';

/**********************************************************************************************************************/
/*************************************************** BUILD JS *********************************************************/
/**********************************************************************************************************************/
// yarn encore dev --config-name jsConfig
Encore
// the project directory where all compiled assets will be stored
  .setOutputPath("./web/build/")
  // the public path used by the web server to access the previous directory
  .setPublicPath("/build")
  // will create public/build/app.js and public/build/app.css
  // allow legacy applications to use $/jQuery as a global variable
  .enableVersioning(Encore.isProduction()) // Will output app.xxxxxxxx.js
  // enable source maps during development
  .enableSourceMaps(!Encore.isProduction())
  // empty the outputPath dir before each build
  .cleanupOutputBeforeBuild()
  // show OS notifications when builds finish/fail
  .enableBuildNotifications()
  .addPlugin(
    isReport ? new BundleAnalyzerPlugin({ analyzerMode: 'static' }) : () => { },
  )
  // .addEntry('app', './assets/js/app.js')
  .addEntry("app", "./assets/js/bootstrap.js")
  // allow legacy applications to use $/jQuery as a global variable
  .autoProvidejQuery()
  .configureFilenames({
    js: fileNamesRule, // Change versionning method for cached files
  })
  .addLoader({
    test: /\.vue$/,
    loader: "vue-loader",
  })
  .addLoader({
    test: /\.json$/,
    loader: "json-loader",
  })
  .addLoader({
    test: /\.yaml$/,
    loader: "yaml-loader",
  })
  .addLoader({
    test: /\.worker\.js$/,
    loader: "worker-loader",
    options: {
      name: "[name].[contenthash].js",
    },
  })
  /* Overrides babel-loader rules to include .mjs files */
  .configureLoaderRule('js', (loaderRule) => {
    loaderRule.test = /\.(js?|mjs)$/
  })
  // plugins
  .addPlugin(new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /fr/))
  .addPlugin(new webpack.DefinePlugin({
    __BUILD__: JSON.stringify("modern"),
  }))
  .addPlugin(new VueLoaderPlugin())
  .configureBabel(() => ({
    "presets": [
      [
        "@babel/preset-env",
        {
          "modules": false,
          "targets": {
            "browsers": "defaults, not IE > 0",
          },
        },
      ],
    ],
  }), {
    includeNodeModules: ['vue-google-oauth2', 'intersection-observer-polyfill'], // Force compilation by babel
  })
  .addAliases({
    vue: !Encore.isProduction() ? "vue/dist/vue.js" : "vue/dist/vue.min.js"
  })
  .configureSplitChunks((splitChunks) => {
    // change the configuration
    splitChunks.minSize = 50000;
  })
  .disableSingleRuntimeChunk();

const jsConfig = Encore.getWebpackConfig();
jsConfig.name = 'jsConfig';

// Exclude libs that we already include in html (i.e jquery-bootstrap.js)
jsConfig.externals = {
  jquery: 'jQuery',
};

/**********************************************************************************************************************/
/******************************************************* BUILD LEGACY ****************************************************/
/**********************************************************************************************************************/
Encore.reset();
Encore
// the project directory where all compiled assets will be stored
  .setOutputPath("./web/build-legacy")
  // the public path used by the web server to access the previous directory
  .setPublicPath("/build-legacy")
  // will create public/build/app.js and public/build/app.css
  // allow legacy applications to use $/jQuery as a global variable
  .enableVersioning(Encore.isProduction()) // Will output app.xxxxxxxx.js
  // enable source maps during development
  .enableSourceMaps(!Encore.isProduction())
  // empty the outputPath dir before each build
  .cleanupOutputBeforeBuild()
  // show OS notifications when builds finish/fail
  .enableBuildNotifications()
  .addPlugin(
    isReport ? new BundleAnalyzerPlugin({ analyzerMode: 'static' }) : () => {},
  )
  // .addEntry('app', './assets/js/app.js')
  .addEntry("app", "./assets/js/bootstrap.js")
  // allow legacy applications to use $/jQuery as a global variable
  .autoProvidejQuery()
  .configureFilenames({
    js: Encore.isProduction() ? '[name].[contenthash].legacy.js' : '[name].js', // Change versionning method for cached files
  })
  .addLoader({
    test: /\.vue$/,
    loader: "vue-loader",
  })
  .addLoader({
    test: /\.json$/,
    loader: "json-loader",
  })
  .addLoader({
    test: /\.yaml$/,
    loader: "yaml-loader",
  })
  /* Overrides babel-loader rules to include .mjs files */
  .configureLoaderRule('js', (loaderRule) => {
    loaderRule.test = /\.(js?|mjs)$/
  })
  // plugins
  .addPlugin(new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /fr/))
  .addPlugin(new VueLoaderPlugin())
  .addPlugin(new webpack.DefinePlugin({
    __BUILD__: JSON.stringify("legacy"),
  }))
  .configureBabel(() => ({
    "presets": [
      [
        "@babel/preset-env",
        {
          "modules": false,
          "targets": {
            "browsers": "defaults",
          },
          "useBuiltIns": "usage",
          "corejs": 3,
        },
      ],
    ],
    "plugins": ["@babel/plugin-syntax-dynamic-import",
      ["@babel/transform-runtime",
        {
          "regenerator": true,
        },
      ],
    ],
  }), {
    includeNodeModules: ['vue-google-oauth2', 'intersection-observer-polyfill'], // Force compilation by babel
  })
  .addAliases({
    vue: !Encore.isProduction() ? "vue/dist/vue.js" : "vue/dist/vue.min.js"
  })
  .configureSplitChunks((splitChunks) => {
    // change the configuration
    splitChunks.minSize = 50000;
  })
  .disableSingleRuntimeChunk();

const jsConfigLegacy = Encore.getWebpackConfig();
jsConfigLegacy.name = 'jsConfigLegacy';

// Exclude libs that we already include in html (i.e jquery-bootstrap.js)
jsConfigLegacy.externals = {
  jquery: 'jQuery',
};

/**********************************************************************************************************************/
/******************************************************* BUILD CSS ****************************************************/
/**********************************************************************************************************************/
// yarn encore dev --config-name cssConfig
Encore.reset();
Encore
// the project directory where all compiled assets will be stored
  .setOutputPath("./web/build-css/")
  // the public path used by the web server to access the previous directory
  .setPublicPath("/build-css")
  .enableVersioning(Encore.isProduction()) // Will output app.xxxxxxxx.js
  // enable source maps during development
  .enableSourceMaps(!Encore.isProduction())
  // empty the outputPath dir before each build
  .cleanupOutputBeforeBuild()
  // show OS notifications when builds finish/fail
  .enableBuildNotifications()
  .addPlugin(
    isReport ? new BundleAnalyzerPlugin({ analyzerMode: 'static' }) : () => {},
  )
  .enableLessLoader()
  // Less to css
  .addStyleEntry("styleLight", "./assets/less/styles/StyleLight.less")
  .addStyleEntry("style", "./assets/less/styles/Style.less")
  .addStyleEntry("main", "./assets/less/main.less")
  .addStyleEntry("print", "./assets/less/print.less")
  .addStyleEntry("pages/auctionsList", "./assets/less/pages/AuctionsList.less")
  .addStyleEntry("pages/homepage", "./assets/less/pages/Homepage.less")
  .addStyleEntry("pages/content", "./assets/less/pages/Content.less")
  .addStyleEntry("pages/boutiqueNoel", "./assets/less/pages/boutiqueNoel.less")
  .addStyleEntry("pages/city", "./assets/less/pages/City.less")
  .addStyleEntry("pages/register", "./assets/less/pages/Register.less")
  .addStyleEntry("pages/product", "./assets/less/pages/Product.less")
  .addStyleEntry("pages/faq", "./assets/less/pages/Faq.less")
  .addStyleEntry("pages/bidderProfiles", "./assets/less/pages/bidderProfiles.less")
  .addStyleEntry("pages/giftCard", "./assets/less/pages/GiftCard.less")
  .addStyleEntry("pages/helpCenter", "./assets/less/pages/HelpCenter.less")
  .addStyleEntry("pages/user/profile", "./assets/less/pages/User/Profile.less")
  .addStyleEntry("user/logged", "./assets/less/user/Logged.less")
  .addStyleEntry("user/anonymous", "./assets/less/user/Anonymous.less")
  .addStyleEntry("user", "./assets/less/user.less")
  .addStyleEntry("paiement", "./assets/less/paiement.less")
  .addStyleEntry("hunkemoller", "./assets/less/hunkemoller.less")
  .addStyleEntry("ie", "./assets/less/ie.less")
  .addStyleEntry("solidaire", "./assets/less/solidaire.less")
  .addStyleEntry("themes/enfoires", "./assets/less/themes/enfoires.less")
  .addStyleEntry("themes/clubmed", "./assets/less/themes/clubmed.less")
  .configureFilenames({
    css: Encore.isProduction() ? '[name].[contenthash].css' : '[name].css',
  });

// Get Webpack config from Encore
const cssConfig = Encore.getWebpackConfig();
cssConfig.name = 'cssConfig';


// export the final configuration

let configArray;

if (Encore.isProduction() || generateLegacy) {
  configArray = [jsConfig, cssConfig, jsConfigLegacy];
} else {
  configArray = [jsConfig, cssConfig];
}

module.exports = configArray
