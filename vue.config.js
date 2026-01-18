const path = require("path");
const webpack = require("webpack");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const CompressionWebpackPlugin = require("compression-webpack-plugin");
const productionGzipExtensions = ["js", "css"];
const HTMLMinifier = require("html-minifier");
const apiMocker = require("mocker-api");
const IS_MOCK = process.env.IS_MOCK === "true";
const isProduction = process.env.NODE_ENV === "production";

function resolve(dir) {
    return path.join(__dirname, dir);
}

// 1et target = 'http://192.167.18.13:30000'
let target = "http://192.167.26.248:30000"

module.exports = {

    publicPath: "./",
    productionSourceMap: false,//sourceMap
    assetsDir: "resource",
    outputDir: "./dist",
    devServer: {
        proxy: {
            '/': {
                target: target,
                secure: false,
                changeOrigin: true,
                cookieDomainRewrite: {
                    "*": "localhost"
                }
            }
        },
        before(app) {
            IS_MOCK && apiMocker(app, path.resolve(__dirname, "./mock/index.js"));
        },
    },
    chainWebpack: (config) => {
        config.resolve.alias
            .set("@", resolve("./src"))
            .set("components", resolve("./src/components"))
            .set("assets", resolve("/src/assets"))
            .set("views", resolve("./src/views"))
            .set("locale", resolve("./src/locale"))
            .set("libs", resolve("./src/libs"))
            .set("service", resolve("./src/service"));

        config.optimization.splitChunks({
            cacheGroups: {
                iview: {
                    name: "chunk-iview",
                    test: /[\\/]node_modules[\\/]view-design[\\/]/,
                    chunks: "all",
                    maxInitialRequests: 5,
                    priority: 4,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                pui: {
                    name: "chunk-pui",
                    test: /[\\/]libs[\\/]pui[\\/]/,
                    chunks: "all",
                    maxInitialRequests: 5,
                    priority: 1,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                monacotditor: {
                    name: "monaco-editor",
                    test: /[\\/]node_modules[\\/]monaco-editor[\\/]/,
                    chunks: "all",
                    maxSize: 2000000,
                    maxInitialRequests: 5,
                    priority: 2,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                jspdf: {
                    name: "chunk-jspdf",
                    test: /[\\/]node_modules[\\/]jspdf[\\/]/,
                    chunks: "all",
                    maxInitialRequests: 5,
                    priority: 3,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                views: {
                    name: "chunk-views",
                    test: /[\\/]src[\\/]views[\\/]/,
                    chunks: "all",
                    maxSize: 2000000,
                    maxInitialRequests: 5,
                    priority: 5,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                components: {

                    name: "chunk-components",
                    test: /[\\/]src[\\/]components[\\/]/,
                    chunks: "all",
                    maxSize: 2000000,
                    maxInitialRequests: 5,
                    priority: 6,
                    reuseExistingChunk: true,
                    enforce: true,
                },

                common: {
                    name: "chunk-common",
                    chunks: "initial",
                    minChunks: 2,
                    maxInitialRequests: 5,
                    minSize: 0,
                    priority: -2,
                    reuseExistingChunk: true
                },

                vendors: {
                    name: "chunk-vendors",
                    test: /[\\/]node_modules[\\/]chunk-vendors[\\/]/,
                    chunks: "initial",
                    maxSize: 2000000,
                    maxInitialRequests: 5,
                    priority: -1,
                    reuseExistingChunk: true,
                    enforce: true
                }
            }
        });

        config.plugin("html").tap((args) => {

            args[0].minify = {
                ...args[0].minify,
                collapseBooleanAttributes: true,
                collapseInlineTagWhitespace: true,
                collapseWhitespace: true,
                minifyCSS: true,
                removeAttributeQuotes: false,
                removeComments: true,
                removeEmptyAttributes: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
            };
            args[0].template = HTMLMinifier.minify(args[0].template, args[0].minify)
            return args;
        });

        config.module.rule("eslint").use("eslint-loader").options({
            emitWarning: false, emitError: false
        });
    },
    css: {
        loaderOptions: {

            less: {

                lessOptions: {
                    javascriptEnabled: true,//itrue
                }
            }
        }
    },
    configureWebpack: {
        devtool: "source-map",
        externals: isProduction
            ? {
                vue: "Vue"
            }
            : {},

        plugins: [
            new MonacoWebpackPlugin(),
            new CompressionWebpackPlugin({
                algorithm: "gzip",
                test: new RegExp("\\.(" + productionGzipExtensions.join("|") + ")$"),
                threshold: 10240,
                minRatio: 0.8,
            }),
            new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 15 }),
            new webpack.optimize.MinChunkSizePlugin({
                minChunkSize: 10000
            })
        ],

        module: {
            rules: [{

                test: /\.(js|mjs|jsx|ts|tsx)$/,
                include: /node_modules/,

                type: "javascript/auto"
            }]
        }
    },

    pluginOptions: {
        "style-resources-loader": {
            preProcessor: "less",
            patterns: [

                path.resolve(
                    __dirname,
                    "./src/theme/index.less")
            ]

        }

    }
}