# microServiceBus-rootservices


# Integrating with GitHub
Services and scripts can be created, copied, versioned and managed in the portal in the *Script & Services* section. However, you can also manage your scripts from the GitHub. As you commit or push changes scripts are automatically updated on **microServiceBus.com**

## Setup

### 1. Generate a Personal access token
In order for **microServiceBus.com** to access your repo it needs an *access token*. Navigate to [GitHub Developer settings]( https://github.com/settings/tokens), and click on the *Generate new token* button. Give the token a *Token description* and select the **repo** (top level) scope. You can uncheck *repo:invite* as this is not required.

Make sure to copy the token for the next step.

*The repo scope permissions are required to create a Webhook to notify **microServiceBus.com** of any update, and also to upload the files.*

### 2. Configure your organization
Next navigate to the [Edit Organization]( https://microservicebus.com/organizations/edit) page. In the *GitHub* section, paste the token in the **Personal Access Key** text box. Type the **name** of your repo (E.g *User|Organization/myservices*). Click **Save**.

*Setting the GitHub configuration will create a Webhook for your repo. To evaluate this, navigate to https://github.com/[YOUR REPO]/settings/hooks.*

You can now start creating and updating services and scripts in your GitHub repo ;)

## Using GitHub

### Creating new scripts

**IMPORTANT**
Scripts and services in **microServiceBus.com** has two parts; The code scripts that is versioned and metadata which isn’t. The metadata is things like name, description and icon, but more importantly the individual settings (*General, Static, Security and Dependencies*). 

If you create a service from GitHub, your service will be given “default” settings which you will have to change at a later stage.

#### Add script
Your script js file need to implement three functions used by the node engine. Copy the template below to get started:

```javascript
var timerEvent; // In case you use a timer for fetching data
var self; 
var exports = module.exports = {
    
    // The Start method is called from the Host. This is where you 
    // implement your code to fetch the data and submit the message
    // back to the host.
    Start : function () {
        self = this;
        // Debug command can be used as console.log and 
        // will be vissible in the portal if you enable
        // Debug on the node
        self.Debug('The Start method is called.');

        /*
        self.AddNpmPackage('npmPackage', true, function(err){
            if(!err){
                // This is your startpoint...
                packageVariable = require('npmPackage');
            }
            else{       
                self.ThrowError(null, '00001', 'Unable to install the npmPackage npm package');
                return;     
            }
        });
        */

        // The timer event can be used for creating message on a 
        // scheduled interval. In this case every 10 seconds.
        timerEvent = setInterval(function () {
            // TO DO! 
            // This is where you add code to read a sensor
            // and create a payload message.
            var payload = {
                someRandomValue : Math.random() 
            };

            // Submit payload to the next service
            self.SubmitMessage(payload);
        }, 10000);
    },

    // The Stop method is called from the Host when the Host is 
    // either stopped or has updated integrations. 
    Stop : function () {
        self.Debug('The Stop method is called.');
        // Stop the timerEvent
        clearInterval(timerEvent);
    },    
    
    // The Process method is called from the orchestration engine as it receives 
    // messages from other services. The [messasge] parameter is a JSON 
    // object (the payload) and the [context] parameter is a 
    // value/pair object with parameters provided by the portal.
    Process : function (message, context) {
        // This is where you can manipulate the message
        
        message.state = "It's working";
        
        self.SubmitMessage(payload);

    },    
} 
```

Simply add your files to the repo on your laptop, commit and push:

```
git add *
git commit -m "Added some new scripts"
git push
```
This should give you a notification in the portal, and you should see your new scripts in [List of files](https://microservicebus.com/Files). Remember to update any metadata settings as you require.

### Update scripts
Updating your scripts follow the same process:
```
git add *
git commit -m "Added some new scripts"
git push
```

