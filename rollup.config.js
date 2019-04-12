import { uglify } from 'rollup-plugin-uglify'

export default {
  input: 'src/index.js',
  output: {
    name: 'EasyLazyLoad',
    file: 'dist/index.js',
    format: 'umd'
  },
  plugins: [
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  ],
  treeshake: false
};