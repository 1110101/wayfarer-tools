const path = require('path')
const WebpackUserscript = require('webpack-userscript')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './opr-tools.user.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'opr-tools.min.user.js'
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
        name: 'OPR-Tools',
        description: 'OPR enhancements',
        homepageURL: 'https://gitlab.com/1110101/opr-tools',
        author: '1110101, https://gitlab.com/1110101/opr-tools/graphs/master',
        match: ['https://opr.ingress.com/',
          'https://opr.ingress.com/',
          'https://opr.ingress.com/?login=true',
          'https://opr.ingress.com/recon',
          'https://opr.ingress.com/help',
          'https://opr.ingress.com/faq',
          'https://opr.ingress.com/guide',
          'https://opr.ingress.com/settings',
          'https://opr.ingress.com/upgrades*'
        ],
        grant: [
          'unsafeWindow',
          'GM_notification',
          'GM_addStyle'
        ],
        downloadURL: 'https://gitlab.com/1110101/opr-tools/raw/master/opr-tools.user.js',
        updateURL: 'https://gitlab.com/1110101/opr-tools/raw/master/opr-tools.user.js',
        supportURL: 'https://gitlab.com/1110101/opr-tools/issues',
      }
    })
  ]
}