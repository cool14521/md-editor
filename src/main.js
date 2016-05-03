var app = require('app'); 
var BrowserWindow = require('browser-window');  
var ipc = require('ipc');
var dialog = require('dialog');
var fs = require('fs-extra'); // 为了添加一个npm依赖 @ES

require('crash-reporter').start();

var Menu = require('menu');

var file_path = '';

var mainWindow = null;

app.on('window-all-closed', function() {
  app.quit();
});


app.on('ready', function() {
  mainWindow = new BrowserWindow({
  	"width": 1280,
  	"height": 720,
  	"center": true
  });

  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  mainWindow.on('closed', function() {
    mainWindow = null;
  });


  var template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          click: function () {
            doAction('newFile');
          }
        },
        {
          label: 'Open File',
          click: function () {
            doAction('openFile');
          }
        },
        {
          label: 'Save',
          click: function () {
            doAction('saveFile');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'New Window',
          click: function () {
            doAction('newWindow');
          }
        },
        {
          label: 'Close Window',
          click: function () {
            doAction('closeWindow');
          }
        },
        {
          type: 'separator'
        },{
          label: 'Exit',
          click: function () {
            app.exit(0);
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          click: function () {
            doAction('undo');
          }
        },
        {
          label: 'Redo',
          click: function () {
            doAction('redo');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          click: function () {
            doAction('cut');
          }
        },
        {
          label: 'Copy',
          click: function () {
            // document.execCommand('copy')
            doAction('copy');
          }
        },
        {
          label: 'Paste',
          click: function () {
            // document.execCommand('paste');
            doAction('paste');
          }
        },
        {
          label: 'Select All',
          click: function () {
            // document.execCommand('selectAll');
            doAction('selectAll');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          click: function() {
            //BrowserWindow.getFocusedWindow().reload();
          }
        },
        {
          label: 'Toggle DevTools',
          click: function() {
            BrowserWindow.getFocusedWindow().toggleDevTools();
          }
        },
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: function () {
            doAction('openHelpModal')
          }
        }
      ]
    }
  ];

  if (process.platform == 'darwin') {
    var name = app.getName();
    template.unshift({
      label: name,
      submenu: [
        {
          label: 'About ' + name,
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide ' + name,
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function() { app.exit(0); }
        },
      ]
    })
  }

  var menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

ipc.on('md.file.open', function (event, arg) {
  openFile(event, arg);
});

ipc.on('md.file.create', function (event, arg) {
  newFile(event, arg);
});

ipc.on('md.file.save', function (event, arg) {
  saveFile(event, arg);
});

var filters = [
    {
      name: 'Markdown',
      extensions: ['md']
    }
];

var openFile = function (event, arg) {
  var filePath = '';
  if (arg) {
    filePath = arg;
  } else {
    filePath = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
      properties: ['openFile'],
      filters
    });
  }
  if (filePath) {
    if (!(filePath instanceof Array)) {
      filePath = [filePath];
    }
    fs.readFile(filePath[0], function (err, data) {
      if (err) throw err;
      var result = {
        filePath: filePath[0],
        data: data ? data.toString() : ''
      };
      event.sender.send('md.file.read.finish', '', result);
    });
  }
};

var newFile = function (event, arg) {
  var filePath = dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    filters
  });
  if (filePath) {
      var content = arg || '';
      fs.writeFile(filePath, content, function (err, data) {
        if (err) throw err;
        event.sender.send('md.file.create.success', '', filePath);
      });
  }
};

var saveFile = function (event, data) {
  if (!data) return;
  if (data.file_path) {
    var file_path = data.file_path;
    var content = data.content ? data.content : '';
    fs.writeFile(file_path, content, function (err, data) {
      if (err) {
        dialog.showErrorBox('save failed! :(');
      }
    });
  } else {
    newFile(event, data.content);
  }
};

var doAction = function (action) {
  var window = BrowserWindow.getFocusedWindow();
  window.webContents.send('menu.' + action + '.do');
};