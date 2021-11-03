import tl = require('azure-pipelines-task-lib/task');
import trm from 'azure-pipelines-task-lib/toolrunner';
import cheerio = require('cheerio');
import { execSync } from 'child_process';
import fs = require('fs')
import { stringify } from 'querystring';

async function run() {



    try {

        
        
        //get the inpute values from the environment 
        const inputString: string | undefined = tl.getInput('fileToScan', true);
        const apiid: string | undefined = tl.getInput('VeracodeAPIID', true);
        const apikey: string | undefined = tl.getInput('VeracodeAPIsecret', true);
        const policyName = tl.getInput('policyName');
        const baseLineFile = tl.getInput('baseLineFile');
        const additionalFlags = tl.getInput('additionalFlags');
        const breakPipeline = tl.getInput('breakPipeline');
        console.log('break pipeline: '+breakPipeline)

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

        if ( typeof policyName !== 'undefined' ){
            //get the policy json file to rate findings
            console.log("Getting the specified Policy from the Veracode platform")
            const policyCommand = 'java -jar '+__dirname+'/pipeline-scan-LATEST/pipeline-scan.jar -vid '+apiid+' -vkey '+apikey+' --request_policy "'+policyName+'"'
            var getPolicyChildProcess = require("child_process");
            const getPolicyOutput = getPolicyChildProcess.execSync(policyCommand).toString();
            console.log(getPolicyOutput)

            const fileNameStringPositionStart = getPolicyOutput.indexOf('file \'');
            const fileNameStringPositionEnd = getPolicyOutput.indexOf('\'.');
            const fileNameString = getPolicyOutput.substring(fileNameStringPositionStart+6,fileNameStringPositionEnd)
            console.log('Stored Veracode Policy file: '+fileNameString)
            const policyFileParam = ' --policy_file '+fileNameString

        }

        if ( typeof baseLineFile !== 'undefined' ){
            //find the specified baselinefile
            const path = baseLineFile

            if (fs.existsSync(path)) {
                console.log('Baseline file '+baseLineFile+' exisits')
                const baseLineFileParam = ' -bf '+baseLineFile
            }
            else {
                console.log('Baseline file "'+baseLineFile+'" is specified as parameter, but does not exisit, will be skipped.')
                const baseLineFileParam = ' '
            }

        }


        //check the additional parameters
        if ( typeof additionalFlags !== 'undefined'){

            //bad parameters
            const badParameters = ['-f','--file','-rp','--request_policy','-vid','--veracode_api_id','-vkey','--veracode_api_key','-bf','--baseline_file','-jo','--json_output','-jf','--json_output_file','-gig','--gl_issu_generation','-gvg','--gl_vulnerability_generation']
            const badParametersLenght = badParameters.length

            //build array from additional parameters
            const additionalFlagsArray = additionalFlags.split(' ')
            const additionalFlagsLength = additionalFlagsArray.length

            let i=0
            while ( i < badParametersLenght ) {
                let j = 0
                while ( j < additionalFlagsLength){
                    if ( additionalFlagsArray[j] == badParameters[i]){
                        //remove bad parameter from additional flags array
                        console.log('Bad parameter "'+badParameters[i]+'" found. This parameter will not work with this plugin and will be skipped.')
                        additionalFlagsArray.splice(j,2)
                    }
                    j++
                }
                i++
            }
            //create new additional flags string
            const newAdditionalFlagsString = additionalFlagsArray.toString()
            const newAdditionalFlags = newAdditionalFlagsString.replace(/,/g, " ")

        }

        //create pipeline scan command string
        var pipelineScanCommandString1 = ''
        var pipelineScanCommandString2 = ''
        var pipelineScanCommandString3 = ''
        if (typeof baseLineFileParam !== 'undefined'){
            pipelineScanCommandString1=baseLineFileParam
        }
        if (typeof policyFileParam !== 'undefined'){
            pipelineScanCommandString2=policyFileParam
        }
        if (typeof newAdditionalFlags !== 'undefined'){
            pipelineScanCommandString3=' '+newAdditionalFlags
        }
        const pipelineScanCommandString = pipelineScanCommandString1+pipelineScanCommandString2+pipelineScanCommandString3
   
      
        // build and run the pipelie scan command
        const pipelineScanCommand = `java -jar `+__dirname+`/pipeline-scan-LATEST/pipeline-scan.jar -vid `+apiid+` -vkey `+apikey+` -f '`+inputString+`' `+pipelineScanCommandString+` -jf pipeline.json -fjf filtered_results.json`;
        console.log("Pipeline command: "+pipelineScanCommand)
        let commandOutput
        try {
            commandOutput = execSync(pipelineScanCommand)
        } catch (ex){
            console.log(ex.stdout.toString())
        }
        


        //create output HTML file

        const outputFileName = __dirname+'/pipeline_results.html';
        var rawdata = fs.readFileSync("filtered_results.json");
        var results = JSON.parse(rawdata);
        var issues = results.findings;
        var numberOfVulns = issues.length


        var header = "Veracode Pipeline Scan found "+numberOfVulns+" Vulnerabilities.<br>"
        var table_start="<table class=\"myTable\"><tr><th>CWE</th><th>CWE Name</th><th>Severity</th><th>File:Linenumber</th></tr>"
        var table_end="</table>"

        var data =""
        var k = 0;
        while (k < numberOfVulns) {
            data+="<tr valign=\"top\"><td>"+results.findings[k].cwe_id+"</td><td>"+results.findings[k].issue_type+"</td><td class=\"Severity-"+results.findings[k].severity+"\">"+results.findings[k].severity+"</td><td>"+results.findings[k].files.source_file.file+":"+results.findings[k].files.source_file.line+"</td></tr><tr valign=\"top\"><td colspan=\"4\"><details><summary>Show details</summary><p>"+results.findings[k].display_text+"</p></details></td></tr>"
            k++
        }


        var fullReportString = header+table_start+data+table_end
        //console.log("generated HTML \n"+fullReportString)

        fs.writeFileSync(outputFileName,fullReportString);

        //const newhtmlPath: string | undefined = tl.getInput('htmlPath', false);
        console.log('##vso[task.addattachment type=replacedhtml;name=content;]' + outputFileName!);


        if ( breakPipeline == 'true' ){
            if ( numberOfVulns > 0 ){
                console.log('Pipeline scan flagged "'+numberOfVulns+'" findings. Pipeline will not continoue.')
                tl.setResult(tl.TaskResult.Failed, 'ERROR: Pipeline scan flagged "'+numberOfVulns+'" findings. Pipeline will not continoue.');
            }
            else {
                console.log('Pipeline scan didn\'t flag any findings. No need to break.')
            }
        }
        else {
            console.log('Pipeline scan flagged "'+numberOfVulns+'" findings. Break pipeline is not set, pipeline will continoue.')
        }

     
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }



}

run();