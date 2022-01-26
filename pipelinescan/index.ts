import tl = require('azure-pipelines-task-lib/task');
import trm from 'azure-pipelines-task-lib/toolrunner';
import * as azdev from "azure-devops-node-api";
import * as gitclient from "azure-devops-node-api/GitApi";
import { GitRepository, GitPush, GitCommitRef, GitCommit, GitChange, ItemContent, GitItem, GitRefUpdate } from 'azure-devops-node-api/interfaces/GitInterfaces';
import cheerio = require('cheerio');
import { execSync } from 'child_process';
import { Console } from 'console';
import fs = require('fs')
import { stringify } from 'querystring';
import { GitHttpClient4_1 } from 'TFS/VersionControl/GitRestClient';
import Axios = require('axios');
import { containsControlChars } from 'VSS/Utils/String';


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
        const baselineFileGeneration = tl.getInput('baselineFileGeneration');
        const baselineFileStorageProject = tl.getInput('baselineFileStorageProject');
        const baselineFileStorageBranch = tl.getInput('baselineFileStorageBranch');
        const baselineFileOptions = tl.getInput('baselineFileOptions');
        const baselineFileNewName = tl.getInput('baselineFileNewName');
        const baselineFileStorageReponame = tl.getInput('baselineFileStorageReponame');
        const baselineFileAccessToken = tl.getInput('baselineFileAccessToken');
        const debug = tl.getInput('debug');


        //var getEnvChildProcess = require("child_process");
        //const getEnvOutput = getEnvChildProcess.execSync('env').toString();
        //console.log(getEnvOutput)
       

        //Show debug
        if ( debug == 1){
            console.log(' ')
            console.log('Debug Output Start')
            console.log('===================')
            console.log('File to scan: '+inputString+' - API ID: '+apiid+' - API Key: '+apikey+' - Policy Name: '+policyName+' - Baseline file: '+baseLineFile+' - Additional Flags: '+additionalFlags+' - Break Pipeline: '+breakPipeline+' - Debug: '+debug+' - baselineFileGeneration: '+baselineFileGeneration+' - baselineFileStorageProject:'+baselineFileStorageProject+' - baselineFileStorageBranch: '+baselineFileStorageBranch+' - baselineFileOptions: '+baselineFileOptions+' - baselineFileNewName: '+baselineFileNewName)
            console.log('=================')
            console.log('Debug Output End')
            console.log(' ')
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

        var policyFileParam = ""
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
            policyFileParam = ' --policy_file "'+fileNameString+'"'
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

        if (baselineFileGeneration == 'true') {

            if ( typeof baselineFileStorageProject == 'undefined' || typeof baselineFileStorageBranch == 'undefined' || typeof baselineFileOptions == 'undefined' || typeof baselineFileStorageReponame == 'undefined') {
                tl.setResult(tl.TaskResult.Failed, 'ERROR: Not all required paramters to store the baseline file are defined');
                return;
            }
        }


        //check the additional parameters - still to be implemented - only doing some quotes cleanup
        if ( typeof additionalFlags !== 'undefined'){

            //bad parameters
            const badParameters = ['-f','--file','-rp','--request_policy','-vid','--veracode_api_id','-vkey','--veracode_api_key','-bf','--baseline_file','-jo','--json_output','-jf','--json_output_file','-gig','--gl_issu_generation','-gvg','--gl_vulnerability_generation']
            const badParametersLenght = badParameters.length

            //all parameters
            const allParameters = ['-h','-v','-f','-prof','-vkey','-vid','-fs fail_on_severity','-fc fail_on_cwe','-bf','-t','-id','-sd','-jd','-so','-sf','-jo','-jf','-p','-u','-r','-aid','-ds','-gig','-gvg','-fjf','-pn','-pf','-rp','-V','--file','--request_policy','--veracode_profile','--veracode_api_id','--veracode_api_key','--fail_on_severity','--fail_on_cwe','--baseline_file','--policy_name','--policy_file','--timeout','--issue_details','--summary_display','--json_display','--verbose','--summary_output','--summary_output_file','--json_output','--json_output_file','--filtered_json_output_file','--gl_issue_generation','--gl_vulnerability_generation','--project_name','--project_url','--project_ref','--app_id','--development_stage','--help','--version']
            const allParametersLength = allParameters.length

            //replace quotes to single quotes
            var repalcedAdditionalFlags = additionalFlags.replace(/"/g,"'")
            repalcedAdditionalFlags = repalcedAdditionalFlags.replace(/“/g,"'")
            repalcedAdditionalFlags = repalcedAdditionalFlags.replace(/“/g,"'")
            repalcedAdditionalFlags = repalcedAdditionalFlags.replace(/„/g,"'")
            repalcedAdditionalFlags = repalcedAdditionalFlags.replace(/´/g,"'")
            repalcedAdditionalFlags = repalcedAdditionalFlags.replace(/`/g,"'")
            //const splitRegEx = /((^-|^--)[\a-zA-Z\_]+\s(\'[a-zA-Z0-9\/:\._\-\s]+\'))/g
            //const splitRegEx = /((^-|^--)[\a-zA-Z\_]+)/;
            //const splitRegEx = /(-|--)/g;
 
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
        //if (typeof newAdditionalFlags !== 'undefined'){
        if (typeof additionalFlags !== 'undefined'){
            pipelineScanCommandString3=' '+repalcedAdditionalFlags
            //to correctly work, bad param checks is disabled for now.
            //pipelineScanCommandString3=' '+newAdditionalFlags
        }

        const pipelineScanCommandString = pipelineScanCommandString1+pipelineScanCommandString2+pipelineScanCommandString3
        console.log('Parameter String: '+pipelineScanCommandString)
   

        //Show debug
        if ( debug == 1){
            console.log(' ')
            console.log('Debug Output Start')
            console.log('===================')
            console.log('File Path: '+inputString)
            var findFile2 = await tl.find(inputString);
            console.log(findFile2)
            console.log('=================')
            console.log('Debug Output End')
            console.log(' ')
        }




      
        // build and run the pipelie scan command
        const pipelineScanCommand = `java -jar `+__dirname+`/pipeline-scan-LATEST/pipeline-scan.jar -vid `+apiid+` -vkey `+apikey+` -f "`+inputString+`" `+pipelineScanCommandString+` -jf pipeline.json -fjf filtered_results.json`;
        //const pipelineScanCommand = `java -jar ${__dirname}${path.sep}pipeline-scan-LATEST${path.sep}pipeline-scan.jar -vid ${apiid} -vkey ${apikey} -f ${inputString} ${pipelineScanCommandString} -jf pipeline.json -fjf filtered_results.json`;
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

        const severityArray = ['Informational','Very Low','Low','Medium','High','Very High']

        var header = "Veracode Pipeline Scan found "+numberOfVulns+" Vulnerabilities.<br>"
        var table_start="<table class=\"myTable\"><tr><th>CWE&nbsp;</th><th>CWE Name</th><th>Severity&nbsp;</th><th>File:Linenumber</th></tr>"
        var table_end="</table>"

        var data =""
        var k = 0;
        while (k < numberOfVulns) {
            data+="<tr valign=\"top\"><td>"+results.findings[k].cwe_id+"</td><td>"+results.findings[k].issue_type+"</td><td class=\"Severity-"+results.findings[k].severity+"\">"+severityArray[results.findings[k].severity]+"</td><td>"+results.findings[k].files.source_file.file+":"+results.findings[k].files.source_file.line+"</td></tr><tr valign=\"top\"><td colspan=\"4\"><details><summary>Show details</summary><p>"+results.findings[k].display_text+"</p></details></td></tr>"
            k++
        }


        var fullReportString = header+table_start+data+table_end
        //console.log("generated HTML \n"+fullReportString)

        fs.writeFileSync(outputFileName,fullReportString);

        //const newhtmlPath: string | undefined = tl.getInput('htmlPath', false);
        console.log('##vso[task.addattachment type=replacedhtml;name=content;]' + outputFileName!);

        //If baseline file generation is true store the baseline file to specified location
        if (baselineFileGeneration == 'true') {

            //set the correct filename
            let filename = 'pipeline.json'
            if ( baselineFileOptions == 'filtered' ) {
                filename = 'filtered_results.json'
            }


            let orgUrl:string = tl.getVariable('SYSTEM_TEAMFOUNDATIONSERVERURI')
            let repostories:GitRepository[];            
            let token:string = tl.getVariable('System.AccessToken')
            let project:string = baselineFileStorageProject
            let repostoryName = baselineFileStorageReponame;
            let authHandler = azdev.getPersonalAccessTokenHandler(token);
            let connection = new azdev.WebApi(orgUrl, authHandler);
            let fileContent = fs.readFileSync(filename)
            let file = fileContent.toString();
            let refName:string = baselineFileStorageBranch;

            //Show debug
            if ( debug == 1){
                console.log(' ')
                console.log('Debug Output Start')
                console.log('===================')
                console.log('Baseline File Storage Project: '+baselineFileStorageProject)
                console.log('Baseline File Storag Branch: '+baselineFileStorageBranch)
                console.log('Baseline File Name Options: '+baselineFileOptions)
                console.log('Baseline File Name: '+baselineFileNewName)
                console.log('Org URL: '+orgUrl)
                console.log('AuthHandler: '+JSON.stringify(authHandler))
                console.log('Connection: '+JSON.stringify(connection))
                console.log('File contnent: '+filename)
                console.log('File contnent: '+file)
                console.log('=================')
                console.log('Debug Output End')
                console.log(' ')
            }

            let git:gitclient.IGitApi = await connection.getGitApi();
            repostories = await git.getRepositories(project);
            let gitrepo = repostories.find(element => element.name === repostoryName);
            let repostoryId = gitrepo.id; 
            
            //set filename for storage
            var newBaselineFilename = '/pipeline-baseline-file.json'
            if ( typeof baselineFileNewName != 'undefined '){
                newBaselineFilename = baselineFileNewName
            }
            
            let repos = await git.getRefs(repostoryId,project);
            let ref = repos.find(element => element.name === refName)

            //check if file exists on repo and branch
            const newBranchName = refName.split("/")
            const apiURL = orgUrl+project+'/_apis/git/repositories/'+repostoryId+'/items?scopepath='+newBaselineFilename+'&versionType=Branch&version='+newBranchName[2]+'&$format=json'
            
            const hash = Buffer.from(':'+token).toString("base64");
            const Basic = "Basic " + hash;

            try {
                let fileExists = await Axios.request({
                    method: 'GET',
                    headers:{
                        'Authorization': Basic,
                    },
                    url: apiURL
                });
                var fileExistsResponse=fileExists.data
                var fileFound = fileExists.data.count
            } catch (error) {
                console.log('API check-file call error: '+error);
            }

            var changeTypeValue = 1
            if ( fileFound == '1' ){
                changeTypeValue = 2
            }
            else {
                changeTypeValue = 1
            }

            if ( debug == 1){
                console.log(' ')
                console.log('Debug Output Start')
                console.log('===================')
                console.log('git: '+JSON.stringify(git))
                console.log('repostories: '+JSON.stringify(repostories))
                console.log('gitrepo: '+JSON.stringify(gitrepo))
                console.log('repostoryId: '+repostoryId)
                console.log('repos: '+JSON.stringify(repos))
                console.log('ref: '+JSON.stringify(ref))
                console.log('File Check Response: '+JSON.stringify(fileExistsResponse))
                console.log('fileFound: '+fileFound)
                console.log('=================')
                console.log('Debug Output End')
                console.log(' ')
            }

            let gitChanges:GitChange[] = [<GitChange>{
                changeType:changeTypeValue,
                newContent:<ItemContent>{content:file,contentType:0 }, //0-> RawText = 0, Base64Encoded = 1,
                item:<GitItem>{
                    path:newBaselineFilename
                }
            }];
            if(typeof(repostoryId) ==="string")
            {
                let refUpdates:GitRefUpdate[] = [<GitRefUpdate> {
                    name:ref.name,
                    oldObjectId:ref.objectId //get ref->object id
                }];

                let gitCommitRef:GitCommitRef[] = [
                    <GitCommitRef>{
                        changes:gitChanges,
                        comment:'Veracode Pipeline Scan baseline file commit and push'
                    }
                ]

                let gitPush:GitPush = <GitPush>{
                    commits:gitCommitRef,
                    refUpdates:refUpdates,
                    repository:gitrepo
                };
                try {
                    await git.createPush(gitPush,repostoryId,project);
                }
                catch (error){
                    console.log('CreatePush Error: '+error);
                }
                
                
                //Show debug
                if ( debug == 1){
                    console.log(' ')
                    console.log('Debug Output Start')
                    console.log('===================')
                    console.log('Repository ID: '+repostoryId)
                    console.log('ref: '+JSON.stringify(ref))
                    console.log('refUpdates: '+JSON.stringify(refUpdates))
                    console.log('gitCommitRef: '+JSON.stringify(gitCommitRef))
                    console.log('gitPush: '+JSON.stringify(gitPush))
                    console.log('git: '+JSON.stringify(git))
                    console.log('=================')
                    console.log('Debug Output End')
                    console.log(' ')
                }
            }
        }


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