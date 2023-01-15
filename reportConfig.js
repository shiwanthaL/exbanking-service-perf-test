const reporter = require('k6-html-reporter');

const options = {
        jsonFile: "YOLOReport/summary.json",
        output: "YOLOReport",
    };

reporter.generateSummaryReport(options);