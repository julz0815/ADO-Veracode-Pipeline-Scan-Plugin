define(["require", "exports", "VSS/Controls", "TFS/DistributedTask/TaskRestClient", "../../pipelinescan/scriptFiles"], function (require, exports, Controls, DT_Client, scriptFiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InfoTab = void 0;
    class InfoTab extends Controls.BaseControl {
        constructor() {
            super();
        }
        initialize() {
            super.initialize();
            // Get configuration that's shared between extension and the extension host
            var sharedConfig = VSS.getConfiguration();
            var vsoContext = VSS.getWebContext();
            if (sharedConfig) {
                // register your extension with host through callback
                sharedConfig.onBuildChanged((build) => {
                    this._initBuildInfo(build);
                    const taskClient = DT_Client.getClient();
                    scriptFiles_1.default.forEach((item) => {
                        this.insertScript(taskClient, vsoContext, build, `pub_${item}`, `pub_${item}`);
                    });
                    taskClient.getPlanAttachments(vsoContext.project.id, "build", build.orchestrationPlan.planId, "replacedhtml").then((taskAttachments) => {
                        $.each(taskAttachments, (index, taskAttachment) => {
                            if (taskAttachment._links && taskAttachment._links.self && taskAttachment._links.self.href) {
                                var recId = taskAttachment.recordId;
                                var timelineId = taskAttachment.timelineId;
                                taskClient.getAttachmentContent(vsoContext.project.id, "build", build.orchestrationPlan.planId, timelineId, recId, "replacedhtml", taskAttachment.name).then((attachementContent) => {
                                    var newhtml = this.arrayBufferToString(attachementContent);
                                    document.body.style.overflow = "visible";
                                    document.getElementById("wrapper").innerHTML = newhtml;
                                });
                            }
                        });
                    });
                });
            }
        }
        _initBuildInfo(build) {
        }
        arrayBufferToString(buffer) {
            let newstring = '';
            const arr = new Uint8Array(buffer);
            const len = arr.byteLength;
            for (var i = 0; i < len; i++) {
                newstring += String.fromCharCode(arr[i]);
            }
            return newstring;
        }
        insertScript(taskClient, vsoContext, build, scriptName, scriptElementName) {
            taskClient.getPlanAttachments(vsoContext.project.id, "build", build.orchestrationPlan.planId, scriptName).then((taskAttachments) => {
                $.each(taskAttachments, (index, taskAttachment) => {
                    if (taskAttachment._links && taskAttachment._links.self && taskAttachment._links.self.href) {
                        var recId = taskAttachment.recordId;
                        var timelineId = taskAttachment.timelineId;
                        taskClient.getAttachmentContent(vsoContext.project.id, "build", build.orchestrationPlan.planId, timelineId, recId, scriptName, taskAttachment.name).then((attachmentContent) => {
                            var content = this.arrayBufferToString(attachmentContent);
                            var scriptElement = document.getElementById(scriptElementName);
                            document.body.style.overflow = "visible";
                            if (scriptElement) {
                                var children = document.getElementById(scriptElementName).childNodes;
                                for (let i = 0; i < children.length; i++) {
                                    document.getElementById(scriptElementName).childNodes[i].remove();
                                }
                                var s = document.createElement("script");
                                s.innerHTML = content;
                                s.async = false;
                                document.getElementById(scriptElementName).appendChild(s);
                            }
                        });
                    }
                });
            });
        }
    }
    exports.InfoTab = InfoTab;
    InfoTab.enhance(InfoTab, $(".wrapper"), {});
    // Notify the parent frame that the host has been loaded
    VSS.notifyLoadSucceeded();
});
