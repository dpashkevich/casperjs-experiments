/*global casper:true */
var TestFW = {},
    url = casper.cli.get('url');

if(!url) {
    casper
        .echo('Usage: casperjs test acceptance.js --url=http://example.com')
        .exit(1);
}

if(url.indexOf('http') !== 0) {
    url = 'http://' + url;
}

casper.log('Using URL: ' + url, 'info');

TestFW.url = url;
TestFW.jsErrors = [];
TestFW.resourceErrors = [];

// capture any js errors
casper.on('page.error', function(msg, trace) {
    this.log('Error:    ' + msg, 'error');
    this.log('file:     ' + trace[0].file, 'error');
    this.log('line:     ' + trace[0].line, 'error');
    this.log('function: ' + trace[0]['function'], 'error');
    TestFW.jsErrors.push(msg);
});

// capture any errors on external resources
casper.on('resource.received', function(resource) {
    if(resource.stage != 'end') { // resource.received gets fired twice: on start and on end of loading
        return;
    }
    var status = resource.status;
    if(status >= 400) {
        casper.log('Resource ' + resource.url + ' failed to load (' + status + ')', 'error');

        TestFW.resourceErrors.push({
            url: resource.url,
            status: resource.status
        });
    }
});

casper.start(url, function(response) {
        // console.log(this.debugHTML('h1'));

    casper.test.begin('HTTP tests', function(test) {
        // TODO also look at charset HTTP header
        test.assertHttpStatus(200);

        test.done();
    });

    casper.test.begin('Doctype', function(test) {
        var isHtml5 = casper.evaluate(function() {
            /**
             * Checks if doctype is HTML5
             * Thanks http://stackoverflow.com/q/13897173/1033615
             * @return {Boolean}
             */
            var isHtml5 = function () {
                    if (document.doctype === null) {
                        return false;
                    }

                    var node = document.doctype,
                        doctypeString =
                            '<!DOCTYPE ' +
                            node.name +
                            (node.publicId ? ' PUBLIC"' + node.publicId + '"' : '') +
                            (!node.publicId && node.systemId ? ' SYSTEM' : '') +
                            (node.systemId ? ' "' + node.systemId + '"' : '') + ">";

                    return doctypeString === '<!DOCTYPE html>';
                };
                return isHtml5();
        });

        test.assert(isHtml5, 'Should be HTML5');
        test.done();
    });

    casper.test.begin('General tests', function(test) {
        test.assertExists('html[lang]', 'html[lang] should be present');

        test.assertExists('link[rel*=icon]', 'Favicon should be present');

        var metaCharset = casper.exists('meta[charset]') && casper.getElementInfo('meta[charset]');
        test.assertTruthy(metaCharset, 'Meta charset should be present');
        if(metaCharset) {
            test.assertEquals(metaCharset.attributes.charset.toLowerCase(), 'utf-8', 'Charset should be UTF-8');
        }

        var title = casper.exists('title') && casper.getElementInfo('title');
        test.assertTruthy(title, 'Title should be present');
        if(title) {
            test.comment('Title: ' + title.html);
            test.assert(title.html.length < 65 && title.html.length > 5, 'Title length should be 5-65 chars');
        }

        var h1 = casper.exists('h1') && casper.getElementInfo('h1');
        test.assertTruthy(title, 'h1 should be present');
        if(h1) {
            test.comment('First h1: ' + h1.html);
            test.assert(title.text.length < 128 && title.html.length > 5, 'h1 length should be 5-128 chars');
        }

        test.done();
    });

    casper.test.begin('Anchors on page', function(test) {
        var anchors = casper.exists('a[href]') && casper.getElementsInfo('a[href]'),
            badAnchors = [];

        anchors && anchors.forEach(function(a) {
            var href = a.attributes.href.trim();
            if(!href || href == "#" || href.indexOf("javascript:") === 0) {
                badAnchors.push(a.tag);
            }
        });
        if(badAnchors.length) {
            test.error('Anchors with empty or invalid href found: ');
            test.comment('\n - ' + badAnchors.join('\n - '));
        }
        test.assertFalsy(badAnchors.length, 'Anchors should have a valid href attribute');
        test.done();
    });

    casper.test.begin('Images', function(test) {
        var badImg = casper.exists('img[alt=""]') && casper.getElementsInfo('img[alt=""]'),
            badImgHtml;

        if(badImg && badImg.length) {
            badImgHtml = badImg.map(function(img) {
                return img.tag;
            });

            test.error('Images with empty alt found: ');
            test.comment('\n - ' + badImgHtml.join('\n - '));
        }

        test.assertFalsy(badImg.length, 'Images should have a non-empty alt attribute');
        test.done();
    });

    // JS errors test: run in the end
    casper.test.begin('JS errors test', function(test) {
        var errorCount = TestFW.jsErrors.length;
        test.assertFalsy(errorCount, 'There should be no JS errors (' + errorCount + ' found)');
        test.done();
    });
    // resource errors test: run in the end
    casper.test.begin('Resource errors test', function(test) {
        var errorCount = TestFW.resourceErrors.length;
        test.assertFalsy(errorCount, 'There should be no resource errors (' + errorCount + ' found)');
        test.done();
    });

});

casper.run();
