"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
const child_process_1 = require("child_process");
const fs = require("fs");
async function run() {
    try {
        //get the inpute values from the environment 
        const inputString = tl.getInput('fileToScan', true);
        const apiid = tl.getInput('VeracodeAPIID', true);
        const apikey = tl.getInput('VeracodeAPIsecret', true);
        const policyName = tl.getInput('policyName');
        const baseLineFile = tl.getInput('baseLineFile');
        const additionalFlags = tl.getInput('additionalFlags');
        const breakPipeline = tl.getInput('breakPipeline');
        //Show debug
        //console.log(inputString+' - '+apiid+' - '+apikey+' - '+policyName+' - '+baseLineFile+' - '+additionalFlags)
        if (apiid == 'bad') {
            tl.setResult(tl.TaskResult.Failed, 'ERROR: you need to specify the Veracode API ID');
            return;
        }
        if (apikey == 'bad') {
            tl.setResult(tl.TaskResult.Failed, 'ERROR: you need to specify the Veracode API secret');
            return;
        }
        if (inputString == 'bad') {
            tl.setResult(tl.TaskResult.Failed, 'ERROR: you need to specify a file to be scanned with the pipeline scan');
            return;
        }
        if (typeof policyName !== 'undefined') {
            //get the policy json file to rate findings
            console.log("Getting the specified Policy from the Veracode platform");
            const policyCommand = 'java -jar ' + __dirname + '/pipeline-scan-LATEST/pipeline-scan.jar -vid ' + apiid + ' -vkey ' + apikey + ' --request_policy "' + policyName + '"';
            var getPolicyChildProcess = require("child_process");
            const getPolicyOutput = getPolicyChildProcess.execSync(policyCommand).toString();
            console.log(getPolicyOutput);
            const fileNameStringPositionStart = getPolicyOutput.indexOf('file \'');
            const fileNameStringPositionEnd = getPolicyOutput.indexOf('\'.');
            const fileNameString = getPolicyOutput.substring(fileNameStringPositionStart + 6, fileNameStringPositionEnd);
            console.log('Stored Veracode Policy file: ' + fileNameString);
            const policyFileParam = ' --policy_file \'' + fileNameString + '\'';
        }
        if (typeof baseLineFile !== 'undefined') {
            //find the specified baselinefile
            const path = baseLineFile;
            if (fs.existsSync(path)) {
                console.log('Baseline file ' + baseLineFile + ' exisits');
                const baseLineFileParam = ' -bf ' + baseLineFile;
            }
            else {
                console.log('Baseline file "' + baseLineFile + '" is specified as parameter, but does not exisit, will be skipped.');
                const baseLineFileParam = ' ';
            }
        }
        //check the additional parameters - still to be implemented - only doing some quotes cleanup
        if (typeof additionalFlags !== 'undefined') {
            //bad parameters
            const badParameters = ['-f', '--file', '-rp', '--request_policy', '-vid', '--veracode_api_id', '-vkey', '--veracode_api_key', '-bf', '--baseline_file', '-jo', '--json_output', '-jf', '--json_output_file', '-gig', '--gl_issu_generation', '-gvg', '--gl_vulnerability_generation'];
            const badParametersLenght = badParameters.length;
            //all parameters
            const allParameters = ['-h', '-v', '-f', '-prof', '-vkey', '-vid', '-fs fail_on_severity', '-fc fail_on_cwe', '-bf', '-t', '-id', '-sd', '-jd', '-so', '-sf', '-jo', '-jf', '-p', '-u', '-r', '-aid', '-ds', '-gig', '-gvg', '-fjf', '-pn', '-pf', '-rp', '-V', '--file', '--request_policy', '--veracode_profile', '--veracode_api_id', '--veracode_api_key', '--fail_on_severity', '--fail_on_cwe', '--baseline_file', '--policy_name', '--policy_file', '--timeout', '--issue_details', '--summary_display', '--json_display', '--verbose', '--summary_output', '--summary_output_file', '--json_output', '--json_output_file', '--filtered_json_output_file', '--gl_issue_generation', '--gl_vulnerability_generation', '--project_name', '--project_url', '--project_ref', '--app_id', '--development_stage', '--help', '--version'];
            const allParametersLength = allParameters.length;
            //replace quotes to single quotes
            var repalcedAdditionalFlags = additionalFlags.replace(/"/g, "'");
            repalcedAdditionalFlags = repalcedAdditionalFlags.replace(/“/g, "'");
            repalcedAdditionalFlags = repalcedAdditionalFlags.replace(/“/g, "'");
            repalcedAdditionalFlags = repalcedAdditionalFlags.replace(/„/g, "'");
            repalcedAdditionalFlags = repalcedAdditionalFlags.replace(/´/g, "'");
            repalcedAdditionalFlags = repalcedAdditionalFlags.replace(/`/g, "'");
            //const splitRegEx = /((^-|^--)[\a-zA-Z\_]+\s(\'[a-zA-Z0-9\/:\._\-\s]+\'))/g
            //const splitRegEx = /((^-|^--)[\a-zA-Z\_]+)/;
            //const splitRegEx = /(-|--)/g;
        }
        //create pipeline scan command string
        var pipelineScanCommandString1 = '';
        var pipelineScanCommandString2 = '';
        var pipelineScanCommandString3 = '';
        if (typeof baseLineFileParam !== 'undefined') {
            pipelineScanCommandString1 = baseLineFileParam;
        }
        if (typeof policyFileParam !== 'undefined') {
            pipelineScanCommandString2 = policyFileParam;
        }
        //if (typeof newAdditionalFlags !== 'undefined'){
        if (typeof additionalFlags !== 'undefined') {
            pipelineScanCommandString3 = ' ' + repalcedAdditionalFlags;
            //to correctly work, bad param checks is disabled for now.
            //pipelineScanCommandString3=' '+newAdditionalFlags
        }
        const pipelineScanCommandString = pipelineScanCommandString1 + pipelineScanCommandString2 + pipelineScanCommandString3;
        // build and run the pipelie scan command
        const pipelineScanCommand = `java -jar ` + __dirname + `/pipeline-scan-LATEST/pipeline-scan.jar -vid ` + apiid + ` -vkey ` + apikey + ` -f '` + inputString + `' ` + pipelineScanCommandString + ` -jf pipeline.json -fjf filtered_results.json`;
        console.log("Pipeline command: " + pipelineScanCommand);
        let commandOutput;
        try {
            commandOutput = child_process_1.execSync(pipelineScanCommand);
        }
        catch (ex) {
            console.log(ex.stdout.toString());
        }
        //create output HTML file
        const outputFileName = __dirname + '/pipeline_results.html';
        var rawdata = fs.readFileSync("filtered_results.json");
        var results = JSON.parse(rawdata);
        var issues = results.findings;
        var numberOfVulns = issues.length;
        var header = "Veracode Pipeline Scan found " + numberOfVulns + " Vulnerabilities.<br>";
        var table_start = "<table class=\"myTable\"><tr><th>CWE</th><th>CWE Name</th><th>Severity&nbsp;</th><th>File:Linenumber</th></tr>";
        var table_end = "</table>";
        var data = "";
        var k = 0;
        while (k < numberOfVulns) {
            data += "<tr valign=\"top\"><td>" + results.findings[k].cwe_id + "</td><td>" + results.findings[k].issue_type + "</td><td class=\"Severity-" + results.findings[k].severity + "\">" + results.findings[k].severity + "</td><td>" + results.findings[k].files.source_file.file + ":" + results.findings[k].files.source_file.line + "</td></tr><tr valign=\"top\"><td colspan=\"4\"><details><summary>Show details</summary><p>" + results.findings[k].display_text + "</p></details></td></tr>";
            k++;
        }
        var fullReportString = header + table_start + data + table_end;
        //console.log("generated HTML \n"+fullReportString)
        fs.writeFileSync(outputFileName, fullReportString);
        //const newhtmlPath: string | undefined = tl.getInput('htmlPath', false);
        console.log('##vso[task.addattachment type=replacedhtml;name=content;]' + outputFileName);
        if (breakPipeline == 'true') {
            if (numberOfVulns > 0) {
                console.log('Pipeline scan flagged "' + numberOfVulns + '" findings. Pipeline will not continoue.');
                tl.setResult(tl.TaskResult.Failed, 'ERROR: Pipeline scan flagged "' + numberOfVulns + '" findings. Pipeline will not continoue.');
            }
            else {
                console.log('Pipeline scan didn\'t flag any findings. No need to break.');
            }
        }
        else {
            console.log('Pipeline scan flagged "' + numberOfVulns + '" findings. Break pipeline is not set, pipeline will continoue.');
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}
run();
