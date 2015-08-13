requirejs.config({
    baseUrl: 'wttlib',
    paths: {
        wtt: '../wtt'
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['wtt/main']);