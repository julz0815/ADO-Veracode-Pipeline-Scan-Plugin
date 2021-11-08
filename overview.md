# Azure Devops Extension - Veracode Pipeline Scan
This plugin should make it easier to run the Veracode pipeline scan on Azure DevOps pipelines. The full scan jar is included within the plugin and don't need to be downaloded each time when the pipeline runs.  
In addition it will populate an additional tab on your pipeline run to display results in a more convinient way.  
The plugin will automatically update itself every night if a new version of the piepline scan jar is published.  
  

Please reference the Veracode Help Ceneter for furhter information.  
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
The values you see here are also presets of the plugin and need to be adjust to fit your environment and application architecture.  

### 3. Publish the pipeline scan report on ypur Azure DevOps pipeline summery.
The plugin will automatically create a report on your Azure DevOps pipelie summery page for better review.  

### 4. Things to come in the future  
Future update that are planned include  
- Work itmes generation  
- Report sorting  
- Better visualization of the scan it self
