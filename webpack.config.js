const path = require('path')
const WebpackUserscript = require('webpack-userscript')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './wayfarer-tools.user.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'wayfarer.min.user.js'
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 8,
          keep_classnames: true,
          compress: {
            unsafe: true,
            arguments: true,
            hoist_funs: true,
            passes: 5,
            unused: false
          }
        }
      })
    ]
  },
  plugins: [
    new WebpackUserscript({
      metajs: true,
      renameExt: true,
      pretty: false,
      headers: {
        name: 'Wayfarer-Tools',
        description: 'formerly known as OPR-Tools',
        homepageURL: 'https://gitlab.com/1110101/opr-tools',
        author: '1110101, https://gitlab.com/1110101/opr-tools/graphs/master',
        match: ['https://wayfarer.nianticlabs.com/review',
          'https://wayfarer.nianticlabs.com/profile'
        ],
        grant: [
          'unsafeWindow',
          'GM_notification',
          'GM_addStyle'
        ],
        downloadURL: 'https://gitlab.com/1110101/opr-tools/raw/master/dist/wayfarer-tools.user.js',
        updateURL: 'https://gitlab.com/1110101/opr-tools/raw/master/dist/wayfarer-tools.meta.js',
        supportURL: 'https://gitlab.com/1110101/opr-tools/issues',
      }
    })
  ]
}