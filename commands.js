////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// COMMANDS ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////

var queueLimit = 20;

var util = require('./util.js');

var commands = [
    {
        command: "stop",
        aliases: [],
        description: "Stops playlist (will also skip current song!)",
        parameters: [],
        permissions: ['admin'],
        execute: function (message, params, context) {
            message.reply("stopping");
            context.clearQueue(message);
            context.playNextTrack();
            message.delete();
            context.stopped = true;
        }
    },

    {
        command: "resume",
        aliases: [],
        description: "Resumes playlist",
        parameters: [],
        permissions: ['admin'],
        execute: function (message, params, context) {
            message.reply("resuming playlist");
            message.delete();
            context.stopped = false;
        }
    },

    {
        command: "np",
        aliases: ["currentsong", "nowplaying", "songname", "song"],
        description: "Displays the current song",
        parameters: [],
        permissions: [],
        execute: function (message, params, context) {
            message.reply(context.getNowPlaying());
            message.delete();
        }
    },

    {
        command: "ping",
        aliases: [],
        description: "Removes your message to indicate a pong",
        parameters: [],
        permissions: [],
        execute: function (message, params, context) {
            message.delete();
        }
    },

    {
        command: "commands",
        aliases: ["help"],
        description: "Displays this message, duh!",
        parameters: [],
        permissions: [],
        execute: function (message, params, context) {
            var response = "available commands:";

            for (var i = 0; i < commands.length; i++) {
                var c = commands[i];
                response += "\n!" + c.command;

                for (var k = 0; k < c.aliases.length; k++) {
                    response += "/" + c.aliases[k];
                }

                for (var j = 0; j < c.parameters.length; j++) {
                    response += " <" + c.parameters[j] + ">";
                }

                response += ": " + c.description;
            }

            message.reply(response);
            message.delete();
        }
    },

    {
        command: "setnp",
        aliases: [],
        description: "Sets whether the bot will announce the current song or not",
        parameters: ["on/off"],
        permissions: ['admin'],
        execute: function (message, params, context) {
            var response;
            if (params[1].toLowerCase() == "on") {
                response = "will announce song names in chat";
                context.np = true;
            } else if (params[1].toLowerCase() == "off") {
                response = "will no longer announce song names in chat";
                context.np = false;
            } else {
                response = "sorry? Please use only either `on` or `off` as parameter for this command";
            }

            message.reply(response);
            message.delete();
        }
    },

    {
        command: "skip",
        aliases: ["next", "nextsong"],
        description: "Skips the current song",
        parameters: [],
        permissions: ['admin'],
        execute: function (message, params, context) {
            message.reply('skipping current song');
            context.playNextTrack();
            message.delete();
        }
    },

    {
        command: "queue",
        aliases: ["songlist"],
        description: "Displays the queue",
        parameters: [],
        permissions: [],
        execute: function (message, params, context) {
            context.getSongQueue(message);
            message.delete();
        }
    },

    {
        command: "clearqueue",
        aliases: [],
        description: "Removes all songs from the queue",
        parameters: [],
        permissions: ['admin'],
        execute: function (message, params, context) {
            context.clearQueue(message);
            message.delete();
        }
    },

    {
        command: "permissions",
        aliases: [],
        description: "Checks the required role to use a command",
        parameters: ["command name"],
        permissions: [],
        execute: function (message, params, context) {

            var command = searchCommand(params[1]);
            var response;

            if (command) {
                response = "roles that can use command \"" + params[1] + "\": ";
                var permissions = command.permissions;
                if (permissions.length == 0) {
                    response += "(any role)";
                } else {
                    for (var i = 0; i < permissions.length; i++) {
                        response += permissions[i];

                        if (i != permissions.length - 1) {
                            response += ", ";
                        }
                    }
                }
            } else {
                response = "unknown command: \"" + params[1] + "\"";
            }

            message.reply(response);
            message.delete();
        }
    },

    {
        command: "addpermission",
        aliases: [],
        description: "Allows a role to execute a certain command",
        parameters: ["command name", "role name"],
        permissions: ['admin'],
        execute: function (message, params, context) {

            var command = searchCommand(params[1]);

            if (!command) {
                message.reply("unknown command: \"" + params[1] + "\"");
                return;
            }

            var pos = util.inArray(params[2].toLowerCase(), command.permissions);

            if (pos !== false) {
                message.reply("that role can already execute that command");
                return;
            }

            command.permissions.push(params[2].toLowerCase());
            message.reply("users with role " + params[2] + " can now execute command " + params[1]);
            message.delete();
        }
    },

    {
        command: "removepermission",
        aliases: [],
        description: "Revokes a role's permission to execute a certain command",
        parameters: ["command name", "role name"],
        permissions: ['admin'],
        execute: function (message, params, context) {

            var command = searchCommand(params[1]);

            if (!command) {
                message.reply("unknown command: \"" + params[1] + "\"");
                return;
            }

            var pos = util.inArray(params[2].toLowerCase(), command.permissions);

            if (pos === false) {
                message.reply("that role cannot already execute that command");
                return;
            }

            command.permissions.splice(pos, 1);
            message.reply("users with role " + params[2] + " can no longer execute command " + params[1]);

            if (command.permissions.length == 0) {
                message.reply("command " + params[1] + " can now be executed by anyone.");
            }

            message.delete();
        }
    },

    {
        command: "queuelimit",
        aliases: [],
        description: "Displays the current queue limit",
        parameters: [],
        permissions: [],
        execute: function (message, params, context) {
            if (queueLimit != -1) {
                message.reply("crrent queue limit is set to " + queueLimit + " songs.");
            } else {
                message.reply("there is no queue limit currently.");
            }

            message.delete();
        }
    },

    {
        command: "volume",
        aliases: ["setvolume"],
        description: "Sets the output volume of the bot",
        parameters: [],
        permissions: ["admin"],
        execute: function (message, params, context) {
            var currentVolume = context.getVolume();

            if (currentVolume == -1) {
                message.reply('no song to set volume on');
                return;
            }

            if (params.length == 1) {
                message.reply('current volume is ' + currentVolume);
            } else {
                var newVolume = parseFloat(params[1]);

                if (isNaN(newVolume) || newVolume < -1) {
                    message.reply("please, provide a valid number when setting the volume");
                } else {
                    context.setVolume(newVolume);
                    message.reply("volume modified from " + currentVolume + " to " + newVolume);
                }
            }

            message.delete();
        }
    },
    
    {
        command: "setqueuelimit",
        aliases: [],
        description: "Changes the queue limit. Set to -1 for no limit.",
        parameters: ['limit'],
        permissions: ['admin'],
        execute: function (message, params, context) {
            var newLimit = parseInt(params[1]);
            var response;

            if (isNaN(newLimit) || newLimit < -1) {
                response = "please, provide a valid number when setting a queue limit";
            } else {
                queueLimit = newLimit;
                response = (newLimit == -1) ? "queue limit removed" : "new queue limit set to " + newLimit + " songs";
            }

            message.reply(response);
            message.delete();
        }
    }

];

function searchCommand(command) {
    var commandName = command.toLowerCase();

    for (var i = 0; i < commands.length; i++) {
        if (commands[i].command == commandName || util.containsElement(commandName, commands[i].aliases)) {
            return commands[i];
        }
    }

    return false;
}

function setAdminRole(roleName) {
    if (typeof roleName !== 'string') {
        throw new Error('New role name must be String');
    }

    for (var i = 0; i < commands.length; i++) {
        var pos = util.inArray('admin', commands[i].permissions);
        if (pos !== false) {
            commands[i].permissions[pos] = roleName.toLowerCase();
        }
    }
}

var exports = module.exports = {
    searchCommand: searchCommand,
    setAdminRole: setAdminRole,
    getQueueLimit: function() { return queueLimit; }
};
