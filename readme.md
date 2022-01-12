# 1 - Azure Devops Extension - Veracode Pipeline Scan
This plugin should make it easier to run the Veracode pipeline scan on Azure DevOps pipelines. The full scan jar is included within the plugin and don't need to be downaloded each time when the pipeline runs.  
In addition it will populate an additional tab on your pipeline run to display results in a more convinient way.  
The plugin will automatically update itself every night if a new version of the piepline scan jar is published.  
  

Please reference the Veracode Help Ceneter for further information.  
https://help.veracode.com/r/c_about_pipeline_scan  

The Veracode pipeline scan is desgined as a fast feedback tool for developers and will not exchange the Veracode Sandbox or Policy scan for static analysis

ATTENTION  
---------
This is a community plugin and NOT officially supported by Veracode.
Additional documentation and source code can be found at https://github.com/julz0815/ADO-Veracode-Pipeline-Scan-Plugin

## Usage:

### 1. Install the below extension in your Azure devops org:
The plugin can be found on Microsofts official marketplace.
https://marketplace.visualstudio.com/items?itemName=JulianTotzek-Hallhuber.VeracodePipelineScan



### 2. Run  Pipeline Scan in your azure pipeline.
The mandatory parameters to configure are  
- the Veracode API ID  
- the Veracode API secret key  
- the (binary) package to scan with the Veracode Pipeline scan  
  
All other parameters are optional 
  
Example  
```
- task: VeracodePipelineScan@1  
  inputs:  
    VeracodeAPIID: '$(vid)'  
    VeracodeAPISecret: '$(vkey)'  
    fileToScan: '$(System.DefaultWorkingDirectory)/target/verademo.war'  
```    
The values you see here are also presets of the plugin and need to be adjusted to fit your environment and application architecture.  
![](/images/Standard_Config.png)  

### 3. Publish the pipeline scan report on ypur Azure DevOps pipeline summery.
The plugin will automatically create a report on your Azure DevOps pipelie summery page for better review.  
![](/images/Results_Overview.png)  
  
### 4. Working with Pipeline Scan baseline file  
From version 1.x the plugin supports the generation and storage of a new baseline file.  
There are a few options to be set to work properly.  
  
Once the tickbox "Generate a new Baseline File from scan" you need to set the following options correspondingly.  
- select your project name to store the new baseline file on
- select your repository to store the new basleine file on  
- select the branch to store the new baseline file on  
These 2 pulldowns will autopopulate according the previous selection.  
  
You need to choose which results should be used to create the new baseline file.  
The two options are  
- standard - full results  
- filtered - filtered results  
  
**Standard** will simply use all results found from the pipeline scan.  
**Filtered** will use the filtered results. For example if you want to fail on severity, CWE or simialr. Only these results will be used to generate the new baseline file. This is the default option.    
  
**IMPORTANT NOTE**  
The user that runs the baseline file storage action needs the Git 'GenericContribute' permission to perform this action.  
![](/images/Permissions_Config.png)  
**IMPORTANT NOTE** 
  
Example
```
- task: VeracodePipelineScanFeature@0
  inputs:
    VeracodeAPIID: '$(vid)'
    VeracodeAPIsecret: '$(vkey)'
    fileToScan: '$(System.DefaultWorkingDirectory)/target/verademo.war'
    baselineFileGeneration: true
    baselineFileStorageProject: 'Verademo_YML'
    baselineFileStorageReponame: 'Verademo_YML'
    baselineFileStorageBranch: 'refs/heads/development'
    baselineFileOptions: 'filtered'
```
  
Also make sure you don't run the pipeline again when the baseline file is pushed to your branch. Otherwise you will start to run a loop   
The yml part for that may looks like the following yml example. For the exclude use the filename you specify as your baseline file on the above configuration.    
Example
```
trigger:
  branches:
    include: [development]
  paths:
    exclude: ["pipeline-baseline-file.json"]
```  
![](/images/Baseline_Config.png)  
  
### 5. Things to come in the future  
Future update that are planned include  
- Work itmes generation  
- Report sorting  
- Better visualization of the scan it self

### 6. Autoupdates  
The plugin will update itself running every night. If there is a new pipeline-scan.jar version available it will be bundeled into the plugin, auto update the version and will be auto published on the marketplace.  
The command to run the update  
```
./plugin-update.sh ADO_ORG ADO_TOKEN justBuildIt  
``` 
If the parameter ```justBuildIt``` is used, a new version of the plugin is pushed to the marketplace, regardless if there is a new pipeline-scan.jar version or not.