// Explicit Bob defaults keep a workspace parent Browserslist config out of builds.
module.exports = (modules) => ({
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          browsers: [
            '>1%',
            'last 2 chrome versions',
            'last 2 edge versions',
            'last 2 firefox versions',
            'last 2 safari versions',
            'not dead',
            'not ie <= 11',
            'not op_mini all',
            'not android <= 4.4',
            'not samsung <= 4',
          ],
          node: '10',
        },
        useBuiltIns: false,
        modules,
      },
    ],
    require.resolve('@babel/preset-react'),
    require.resolve('@babel/preset-typescript'),
    require.resolve('@babel/preset-flow'),
  ],
  plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
});
