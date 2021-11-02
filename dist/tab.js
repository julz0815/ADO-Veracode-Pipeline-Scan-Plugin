define(["require", "exports", "VSS/Controls", "TFS/DistributedTask/TaskRestClient"], function (require, exports, Controls, DT_Client) {
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
                    //scriptFiles.forEach((item: string) => {
                    //	this.insertScript(taskClient, vsoContext, build, `pub_${item}`, `pub_${item}`);
                    //})
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
    }
    exports.InfoTab = InfoTab;
    InfoTab.enhance(InfoTab, $(".wrapper"), {});
    // Notify the parent frame that the host has been loaded
    VSS.notifyLoadSucceeded();
});
