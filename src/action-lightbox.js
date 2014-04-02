/*global casper:true */
var TestFW = {},
    url = casper.cli.get('url'),
    screenshotPath = casper.cli.get('screenshot-path') || 'screenshots',
    viewport = {
        width: 1280,
        height: 1024
    };

if(!url) {
    casper
        .echo('Usage: casperjs test action-lightbox.js --url=http://example.com')
        .exit(1);
}

if(url.indexOf('http') !== 0) {
    url = 'http://' + url;
}

casper.echo('Using URL: ' + url, 'INFO');

// initialize
casper.start();
casper.viewport(viewport.width, viewport.height);
casper.then(function() {
    casper.test.begin('Lightbox test', function(test) {
        var galSelector = 'a[rel^=pretty]',
            lightBoxSelector = '.pp_pic_holder',
            jsErrors = [];

        function printJsError(err) {
            var errorStrings = [
                'JS Error:    ' + err.msg,
                '  file:     ' + err.trace[0].file,
                '  line:     ' + err.trace[0].line,
                '  function: ' + err.trace[0]['function'],
            ];

            casper.echo(errorStrings.join('\n'), 'ERROR');
        }

        casper.thenOpen(url, function(response) {
            if(!casper.exists(galSelector)) {
                casper.echo('Lightbox gallery not found on this page, exiting the test');
                test.done();
                return;
            }

            casper.on('page.error', function(msg, trace) {
                jsErrors.push({msg: msg, trace: trace});
            });

            casper.echo('Clicking on ' + galSelector);
            casper.click(galSelector);

            casper.then(function() {
                test.assertVisible(lightBoxSelector, 'Lightbox root element must appear');
            });

            casper.then(function() {
                casper.wait(2000);
                casper.then(function() {
                    if(jsErrors.length) {
                        jsErrors.forEach(printJsError);
                    }
                    test.assertFalsy(jsErrors.length, 'There must be no JS errors after invoking lightbox');

                    test.done();
                });
            });
        });
    });
});

casper.run();