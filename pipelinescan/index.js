"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var tl = require("azure-pipelines-task-lib/task");
var child_process_1 = require("child_process");
var fs = require("fs");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var inputString, apiid, apikey, policyName, baseLineFile, additionalFlags, breakPipeline, policyCommand, getPolicyChildProcess, getPolicyOutput, fileNameStringPositionStart, fileNameStringPositionEnd, fileNameString, policyFileParam, path, baseLineFileParam, baseLineFileParam, badParameters, badParametersLenght, additionalFlagsArray, additionalFlagsLength, i, j, newAdditionalFlagsString, newAdditionalFlags, pipelineScanCommandString1, pipelineScanCommandString2, pipelineScanCommandString3, pipelineScanCommandString, pipelineScanCommand, commandOutput, outputFileName, rawdata, results, issues, numberOfVulns, header, table_start, table_end, data, k, fullReportString;
        return __generator(this, function (_a) {
            try {
                inputString = tl.getInput('fileToScan', true);
                apiid = tl.getInput('VeracodeAPIID', true);
                apikey = tl.getInput('VeracodeAPIsecret', true);
                policyName = tl.getInput('policyName');
                baseLineFile = tl.getInput('baseLineFile');
                additionalFlags = tl.getInput('additionalFlags');
                breakPipeline = tl.getInput('breakPipeline');
                console.log('break pipeline: ' + breakPipeline);
                //Show debug
                //console.log(inputString+' - '+apiid+' - '+apikey+' - '+policyName+' - '+baseLineFile+' - '+additionalFlags)
                if (apiid == 'bad') {
                    tl.setResult(tl.TaskResult.Failed, 'ERROR: you need to specify the Veracode API ID');
                    return [2 /*return*/];
                }
                if (apikey == 'bad') {
                    tl.setResult(tl.TaskResult.Failed, 'ERROR: you need to specify the Veracode API secret');
                    return [2 /*return*/];
                }
                if (inputString == 'bad') {
                    tl.setResult(tl.TaskResult.Failed, 'ERROR: you need to specify a file to be scanned with the pipeline scan');
                    return [2 /*return*/];
                }
                if (typeof policyName !== 'undefined') {
                    //get the policy json file to rate findings
                    console.log("Getting the specified Policy from the Veracode platform");
                    policyCommand = 'java -jar ' + __dirname + '/pipeline-scan-LATEST/pipeline-scan.jar -vid ' + apiid + ' -vkey ' + apikey + ' --request_policy "' + policyName + '"';
                    getPolicyChildProcess = require("child_process");
                    getPolicyOutput = getPolicyChildProcess.execSync(policyCommand).toString();
                    console.log(getPolicyOutput);
                    fileNameStringPositionStart = getPolicyOutput.indexOf('file \'');
                    fileNameStringPositionEnd = getPolicyOutput.indexOf('\'.');
                    fileNameString = getPolicyOutput.substring(fileNameStringPositionStart + 6, fileNameStringPositionEnd);
                    console.log('Stored Veracode Policy file: ' + fileNameString);
                    policyFileParam = ' --policy_file ' + fileNameString;
                }
                if (typeof baseLineFile !== 'undefined') {
                    path = baseLineFile;
                    if (fs.existsSync(path)) {
                        console.log('Baseline file ' + baseLineFile + ' exisits');
                        baseLineFileParam = ' -bf ' + baseLineFile;
                    }
                    else {
                        console.log('Baseline file "' + baseLineFile + '" is specified as parameter, but does not exisit, will be skipped.');
                        baseLineFileParam = ' ';
                    }
                }
                //check the additional parameters
                if (typeof additionalFlags !== 'undefined') {
                    badParameters = ['-f', '--file', '-rp', '--request_policy', '-vid', '--veracode_api_id', '-vkey', '--veracode_api_key', '-bf', '--baseline_file', '-jo', '--json_output', '-jf', '--json_output_file', '-gig', '--gl_issu_generation', '-gvg', '--gl_vulnerability_generation'];
                    badParametersLenght = badParameters.length;
                    additionalFlagsArray = additionalFlags.split(' ');
                    additionalFlagsLength = additionalFlagsArray.length;
                    i = 0;
                    while (i < badParametersLenght) {
                        j = 0;
                        while (j < additionalFlagsLength) {
                            if (additionalFlagsArray[j] == badParameters[i]) {
                                //remove bad parameter from additional flags array
                                console.log('Bad parameter "' + badParameters[i] + '" found. This parameter will not work with this plugin and will be skipped.');
                                additionalFlagsArray.splice(j, 2);
                            }
                            j++;
                        }
                        i++;
                    }
                    newAdditionalFlagsString = additionalFlagsArray.toString();
                    newAdditionalFlags = newAdditionalFlagsString.replace(/,/g, " ");
                }
                pipelineScanCommandString1 = '';
                pipelineScanCommandString2 = '';
                pipelineScanCommandString3 = '';
                if (typeof baseLineFileParam !== 'undefined') {
                    pipelineScanCommandString1 = baseLineFileParam;
                }
                if (typeof policyFileParam !== 'undefined') {
                    pipelineScanCommandString2 = policyFileParam;
                }
                if (typeof newAdditionalFlags !== 'undefined') {
                    pipelineScanCommandString3 = ' ' + newAdditionalFlags;
                }
                pipelineScanCommandString = pipelineScanCommandString1 + pipelineScanCommandString2 + pipelineScanCommandString3;
                pipelineScanCommand = "java -jar " + __dirname + "/pipeline-scan-LATEST/pipeline-scan.jar -vid " + apiid + " -vkey " + apikey + " -f '" + inputString + "' " + pipelineScanCommandString + " -jf pipeline.json -fjf filtered_results.json";
                console.log("Pipeline command: " + pipelineScanCommand);
                commandOutput = void 0;
                try {
                    commandOutput = child_process_1.execSync(pipelineScanCommand);
                }
                catch (ex) {
                    console.log(ex.stdout.toString());
                }
                outputFileName = __dirname + '/pipeline_results.html';
                rawdata = fs.readFileSync("filtered_results.json");
                results = JSON.parse(rawdata);
                issues = results.findings;
                numberOfVulns = issues.length;
                header = "Veracode Pipeline Scan found " + numberOfVulns + " Vulnerabilities.<br>";
                table_start = "<table class=\"myTable\"><tr><th>CWE</th><th>CWE Name</th><th>Severity</th><th>File:Linenumber</th></tr>";
                table_end = "</table>";
                data = "";
                k = 0;
                while (k < numberOfVulns) {
                    data += "<tr valign=\"top\"><td>" + results.findings[k].cwe_id + "</td><td>" + results.findings[k].issue_type + "</td><td class=\"Severity-" + results.findings[k].severity + "\">" + results.findings[k].severity + "</td><td>" + results.findings[k].files.source_file.file + ":" + results.findings[k].files.source_file.line + "</td></tr><tr valign=\"top\"><td colspan=\"4\"><details><summary>Show details</summary><p>" + results.findings[k].display_text + "</p></details></td></tr>";
                    k++;
                }
                fullReportString = header + table_start + data + table_end;
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
            return [2 /*return*/];
        });
    });
}
run();
