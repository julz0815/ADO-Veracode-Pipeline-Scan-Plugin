"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
const azdev = __importStar(require("azure-devops-node-api"));
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
        const baselineFileGeneration = tl.getInput('baselineFileGeneration');
        const baselineFileStorageProject = tl.getInput('baselineFileStorageProject');
        const baselineFileStorageBranch = tl.getInput('baselineFileStorageBranch');
        const baselineFileNewNameOptions = tl.getInput('baselineFileNewNameOptions');
        const baselineFileNewName = tl.getInput('baselineFileNewName');
        const debug = tl.getInput('debug');
        var getEnvChildProcess = require("child_process");
        const getEnvOutput = getEnvChildProcess.execSync('env').toString();
        //console.log(getEnvOutput)
        //Show debug
        if (debug == 1) {
            console.log(' ');
            console.log('Debug Output Start');
            console.log('===================');
            console.log('File to scan: ' + inputString + ' - API ID: ' + apiid + ' - API Key: ' + apikey + ' - Policy Name: ' + policyName + ' - Baseline file: ' + baseLineFile + ' - Additional Flags: ' + additionalFlags + ' - Break Pipeline: ' + breakPipeline + ' - Debug: ' + debug + ' - baselineFileGeneration: ' + baselineFileGeneration + ' - baselineFileStorageProject:' + baselineFileStorageProject + ' - baselineFileStorageBranch: ' + baselineFileStorageBranch + ' - baselineFileNewNameOptions: ' + baselineFileNewNameOptions + ' - baselineFileNewName: ' + baselineFileNewName);
            console.log('=================');
            console.log('Debug Output End');
            console.log(' ');
        }
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
        var policyFileParam = "";
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
            policyFileParam = ' --policy_file "' + fileNameString + '"';
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
        console.log('Parameter String: ' + pipelineScanCommandString);
        //Show debug
        if (debug == 1) {
            console.log(' ');
            console.log('Debug Output Start');
            console.log('===================');
            console.log('File Path: ' + inputString);
            var findFile2 = await tl.find(inputString);
            console.log(findFile2);
            console.log('=================');
            console.log('Debug Output End');
            console.log(' ');
        }
        // build and run the pipelie scan command
        const pipelineScanCommand = `java -jar ` + __dirname + `/pipeline-scan-LATEST/pipeline-scan.jar -vid ` + apiid + ` -vkey ` + apikey + ` -f "` + inputString + `" ` + pipelineScanCommandString + ` -jf pipeline.json -fjf filtered_results.json`;
        //const pipelineScanCommand = `java -jar ${__dirname}${path.sep}pipeline-scan-LATEST${path.sep}pipeline-scan.jar -vid ${apiid} -vkey ${apikey} -f ${inputString} ${pipelineScanCommandString} -jf pipeline.json -fjf filtered_results.json`;
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
        const severityArray = ['Informational', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
        var header = "Veracode Pipeline Scan found " + numberOfVulns + " Vulnerabilities.<br>";
        var table_start = "<table class=\"myTable\"><tr><th>CWE&nbsp;</th><th>CWE Name</th><th>Severity&nbsp;</th><th>File:Linenumber</th></tr>";
        var table_end = "</table>";
        var data = "";
        var k = 0;
        while (k < numberOfVulns) {
            data += "<tr valign=\"top\"><td>" + results.findings[k].cwe_id + "</td><td>" + results.findings[k].issue_type + "</td><td class=\"Severity-" + results.findings[k].severity + "\">" + severityArray[results.findings[k].severity] + "</td><td>" + results.findings[k].files.source_file.file + ":" + results.findings[k].files.source_file.line + "</td></tr><tr valign=\"top\"><td colspan=\"4\"><details><summary>Show details</summary><p>" + results.findings[k].display_text + "</p></details></td></tr>";
            k++;
        }
        var fullReportString = header + table_start + data + table_end;
        //console.log("generated HTML \n"+fullReportString)
        fs.writeFileSync(outputFileName, fullReportString);
        //const newhtmlPath: string | undefined = tl.getInput('htmlPath', false);
        console.log('##vso[task.addattachment type=replacedhtml;name=content;]' + outputFileName);
        //If baseline file generation is true store the baseline file to specified location
        if (baselineFileGeneration == 'true') {
            //store the baseline file somewhere
            //Show debug
            if (debug == 1) {
                console.log(' ');
                console.log('Debug Output Start');
                console.log('===================');
                console.log('Baseline File Storage Project ' + baselineFileStorageProject);
                console.log('Baseline File Storag Branch ' + baselineFileStorageBranch);
                console.log('Baseline File Name Options ' + baselineFileNewNameOptions);
                console.log('Baseline File Name' + baselineFileNewName);
                console.log('=================');
                console.log('Debug Output End');
                console.log(' ');
            }
            let orgUrl = 'https://dev.azure.com/jtotzek';
            let repostories;
            let token = "ACCESS_TOKEN"; //patToken 
            let project = 'Verademo_YML';
            let repostoryName = 'Verademo_YML';
            let authHandler = azdev.getPersonalAccessTokenHandler(token);
            console.log('AuthHandle: ' + authHandler);
            let connection = new azdev.WebApi(orgUrl, authHandler);
            console.log('Connection: ' + connection);
            let file = __dirname + 'filtered_results.json"';
            let refName = 'refs/heads/development';
            async function runPush(filePath, refName, project, repostoryName) {
                let git = await connection.getGitApi();
                repostories = await git.getRepositories(project);
                console.log('Repositories: ' + repostories);
                let gitrepo = repostories.find(element => element.name === repostoryName);
                console.log('GitRepo: ' + gitrepo);
                /*
                let repostoryId = gitrepo?.id;
                let gitChanges:GitChange[] = [<GitChange>{
                    changeType:1,
                    newContent:<ItemContent>{content:base64str,contentType:0 }, //0-> RawText = 0, Base64Encoded = 1,
                    item:<GitItem>{
                        path:'/testUpdate.png'
                    }
                }];
                if(typeof(repostoryId) ==="string")
                {
                let ref = (await git.getRefs(repostoryId,project)).find(element => element.name === refName)
                let refUpdates:GitRefUpdate[] = [<GitRefUpdate> {
                    name:ref?.name,
                    oldObjectId:ref?.objectId //get ref->object id
                }];

                let gitCommitRef:GitCommitRef[] = [
                    <GitCommitRef>{
                        changes:gitChanges,
                        comment:'Add a file'
                    }
                ]
                let gitPush:GitPush = <GitPush>{
                    commits:gitCommitRef,
                    refUpdates:refUpdates,
                    repository:gitrepo
                };
                console.log(repostoryId)
                await git.createPush(gitPush,repostoryId,project);

                }
                */
            }
            runPush(file, refName, project, repostoryName);
        }
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
