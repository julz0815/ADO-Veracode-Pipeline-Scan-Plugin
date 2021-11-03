#/bin/bash

cd new_pipeline_scanner

curl -sSO https://downloads.veracode.com/securityscan/pipeline-scan-LATEST.zip
unzip -o pipeline-scan-LATEST.zip

cd ..

version_new=$(java -jar new_pipeline_scanner/pipeline-scan.jar --version)
version_old=$(java -jar pipelinescan/pipeline-scan-LATEST/pipeline-scan.jar --version)

echo "Version New: " $version_new
echo "Version Old: " $version_old

if [ "$version_new" != "$version_old" ]; then
    echo "New version was deployed, an update is required"

    #find the actual plugin version number
    current_plugin_version=$(cat vss-extension.json | grep "version" | cut -d: -f2 | sed 's/"//g' | sed 's/,//g' | cut -d. -f3)
    echo "Current Plugin Version: " $current_plugin_version
    #set new plugin version
    new_plugin_version=$((current_plugin_version +1))
    echo "New Plugin Version " $new_plugin_version

    #patch the file with new version
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Patching ./vss-extension.json"
        sed -i "" "s/\"version\":.*/\"version\": \"0.0.$new_plugin_version\",/g" "./vss-extension.json"
    else
        echo "Patching ./vss-extension.json"
        sed -i "s/\"version\":.*/\"version\": \"0.0.$new_plugin_version\",/g" "./vss-extension.json"
    fi


    #copy pipeline-scan jar to correct folder
    mv new_pipeline_scanner/pipeline-scan.jar pipelinescan/pipeline-scan-LATEST/
    rm -rf new_pipeline_scanner/pipeline-scan-LATEST.zip
    rm -rf new_pipeline_scanner/README.md

    #build the plugin
    cd pipelinescan
    tsc
    cd ..
    npm run build
    copy_file=$(mv ./JulianTotzek-Hallhuber.VeracodePipelineScan-0.0.$new_plugin_version.vsix ./builds)

    # Publish to market place
    tfx extension publish --vsix "builds/JulianTotzek-Hallhuber.VeracodePipelineScan-0.0.$new_plugin_version.vsix" --share-with $1 --token $2

else
    echo "No new version of the pipeline scan found! Checking if plugin should be updated."

    if [[ $3 == "justBuildIt" ]]; then
        echo "Code was updated and the plugin will rebuild"

        #find the actual plugin version number
        current_plugin_version=$(cat vss-extension.json | grep "version" | cut -d: -f2 | sed 's/"//g' | sed 's/,//g' | cut -d. -f3)
        echo "Current Plugin Version: " $current_plugin_version
        #set new plugin version
        new_plugin_version=$((current_plugin_version +1))
        echo "New Plugin Version " $new_plugin_version

        #patch the file with new version
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Patching ./vss-extension.json"
            sed -i "" "s/\"version\":.*/\"version\": \"0.0.$new_plugin_version\",/g" "./vss-extension.json"
        else
            echo "Patching ./vss-extension.json"
            sed -i "s/\"version\":.*/\"version\": \"0.0.$new_plugin_version\",/g" "./vss-extension.json"
        fi

        #build the plugin
        cd pipelinescan
        tsc
        cd ..
        npm run build
        copy_file=$(mv ./JulianTotzek-Hallhuber.VeracodePipelineScan-0.0.$new_plugin_version.vsix ./builds)

        # Publish to market place
        tfx extension publish --vsix "builds/JulianTotzek-Hallhuber.VeracodePipelineScan-0.0.$new_plugin_version.vsix" --share-with $1 --token $2
    else
        echo "No code update done, no plugin update needed"
    fi

    #delete newly downloaded pipeline-scan jar
    mv new_pipeline_scanner/pipeline-scan.jar pipelinescan/pipeline-scan-LATEST/
    rm -rf new_pipeline_scanner/pipeline-scan-LATEST.zip
    rm -rf new_pipeline_scanner/README.md

    exit 1
fi;
